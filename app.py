import hashlib
import json
import mimetypes
import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import requests as http_requests
from flask import Flask, Response, abort, jsonify, redirect, render_template, request, session, url_for
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from analyzer import DAILY_NO_OVERTIME_LIMIT, simulate_schedule

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
app.permanent_session_lifetime = timedelta(days=365)
STATIC_DIR = Path(app.root_path) / "static"

PASSWORD = os.environ.get("APP_PASSWORD", "").strip()

GCAL_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
]


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def password_required():
    return bool(PASSWORD)


def is_logged_in():
    return not password_required() or session.get("logged_in")


# ---------------------------------------------------------------------------
# Static file helper
# ---------------------------------------------------------------------------

def safe_static_response(filename, mimetype=None):
    target = (STATIC_DIR / filename).resolve()
    static_root = STATIC_DIR.resolve()
    if not str(target).startswith(str(static_root)) or not target.is_file():
        abort(404)

    try:
        data = target.read_bytes()
    except OSError as error:
        app.logger.warning("Could not read static file %s: %s", target, error)
        abort(404)

    content_type = mimetype or mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    response = Response(data, mimetype=content_type)
    # Tag every asset with a content hash and require revalidation. Browsers then
    # get a cheap 304 when nothing changed and a fresh 200 the moment a file
    # changes — so a stale (un-bumped) ?v= query can never serve an old asset.
    response.set_etag(hashlib.sha256(data).hexdigest())
    response.cache_control.no_cache = True
    return response.make_conditional(request)


# ---------------------------------------------------------------------------
# Google Calendar helpers
# ---------------------------------------------------------------------------

def _gcal_client_config():
    """Return OAuth client config dict from file, env vars, or built-in fallback."""
    secret_path = Path(app.root_path) / "client_secret.json"
    if secret_path.exists():
        try:
            return json.loads(secret_path.read_text())
        except Exception:
            pass
    redirect_uri = os.environ.get(
        "GCAL_REDIRECT_URI",
        "https://abt-overtime-planner.onrender.com/gcal/callback",
    )
    # Read from env vars or fall back to the registered credentials for this app.
    # These identify the application itself (not user data); user tokens are
    # stored separately in signed session cookies.
    _id = os.environ.get("GCAL_CLIENT_ID") or (
        "643970572989-6ad8i5rrm4tsk1d93sc"
        "7dj75lr48ljki.apps.googleusercontent.com"
    )
    _secret = os.environ.get("GCAL_CLIENT_SECRET") or "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"
    return {
        "web": {
            "client_id": _id,
            "client_secret": _secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }


def _gcal_redirect_uri():
    config = _gcal_client_config()
    if config:
        uris = config["web"].get("redirect_uris", [])
        if uris:
            return uris[0]
    return os.environ.get(
        "GCAL_REDIRECT_URI",
        "https://abt-overtime-planner.onrender.com/gcal/callback",
    )


def _gcal_credentials():
    """Return refreshed Credentials or None if not connected."""
    data = session.get("gcal_credentials")
    if not data or not data.get("refresh_token"):
        return None
    config = _gcal_client_config()
    if not config:
        return None
    web = config["web"]
    creds = Credentials(
        token=data.get("token"),
        refresh_token=data["refresh_token"],
        token_uri=web["token_uri"],
        client_id=web["client_id"],
        client_secret=web["client_secret"],
        scopes=GCAL_SCOPES,
    )
    if data.get("expiry"):
        from datetime import datetime
        try:
            creds.expiry = datetime.fromisoformat(data["expiry"])
        except (ValueError, TypeError):
            pass
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            session["gcal_credentials"] = {
                **data,
                "token": creds.token,
                "expiry": creds.expiry.isoformat() if creds.expiry else None,
            }
        except Exception as exc:
            app.logger.warning("GCal token refresh failed: %s", exc)
            session.pop("gcal_credentials", None)
            return None
    return creds


# ---------------------------------------------------------------------------
# Hooks
# ---------------------------------------------------------------------------

@app.after_request
def disable_html_caching(response):
    if response.mimetype in {
        "text/html",
        "application/javascript",
        "application/manifest+json",
        "text/css",
        "application/json",
    }:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/login", methods=["GET", "POST"])
def login():
    if not password_required():
        return redirect(url_for("index"))
    if request.method == "POST":
        if request.form.get("password") == PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("index"))
        return render_template("login.html", error="Wrong password")
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ---------------------------------------------------------------------------
# Main app route
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    if not is_logged_in():
        return redirect(url_for("login"))
    return render_template("index.html")


# ---------------------------------------------------------------------------
# Static routes
# ---------------------------------------------------------------------------

@app.route("/manifest.webmanifest")
def webmanifest():
    return safe_static_response("manifest.webmanifest", "application/manifest+json")


@app.route("/service-worker.js")
def service_worker():
    return safe_static_response("service-worker.js", "application/javascript")


@app.route("/static/<path:filename>", endpoint="static")
def static_files(filename):
    return safe_static_response(filename)


# ---------------------------------------------------------------------------
# OT simulator
# ---------------------------------------------------------------------------

@app.route("/simulate", methods=["POST"])
def simulate():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    data = request.json or {}
    schedule = data.get("schedule", [])
    total_worked_hours = sum(
        float(block.get("duration", block.get("dur", 0)) or 0) for block in schedule
    )
    if total_worked_hours <= DAILY_NO_OVERTIME_LIMIT:
        return jsonify({"pay": 0, "type": ""})
    result = simulate_schedule(schedule)
    return jsonify({"pay": result["pay"], "type": result["type"] if result["pay"] > 0 else ""})


# ---------------------------------------------------------------------------
# Google Calendar OAuth
# ---------------------------------------------------------------------------

@app.route("/gcal/connect")
def gcal_connect():
    if not is_logged_in():
        abort(403)
    config = _gcal_client_config()
    if not config:
        return redirect(url_for("index") + "?gcal_error=not_configured")
    flow = Flow.from_client_config(config, scopes=GCAL_SCOPES, redirect_uri=_gcal_redirect_uri())
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    session["gcal_state"] = state
    return redirect(auth_url)


@app.route("/gcal/callback")
def gcal_callback():
    if not is_logged_in():
        return redirect(url_for("index"))
    state = session.pop("gcal_state", None)
    config = _gcal_client_config()
    if not config or not state:
        return redirect(url_for("index"))
    try:
        flow = Flow.from_client_config(
            config,
            scopes=GCAL_SCOPES,
            state=state,
            redirect_uri=_gcal_redirect_uri(),
        )
        # Render terminates TLS at the edge; the callback URL may arrive as http
        callback_url = request.url.replace("http://", "https://", 1)
        flow.fetch_token(authorization_response=callback_url)
        creds = flow.credentials
        # Fetch user email via userinfo endpoint
        email = ""
        try:
            resp = http_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {creds.token}"},
                timeout=5,
            )
            if resp.ok:
                email = resp.json().get("email", "")
        except Exception:
            pass
        session["gcal_credentials"] = {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "expiry": creds.expiry.isoformat() if creds.expiry else None,
            "email": email,
        }
        session.permanent = True
    except Exception as exc:
        app.logger.error("GCal callback error: %s", exc)
    return redirect(url_for("index"))


@app.route("/gcal/status")
def gcal_status():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    if not _gcal_client_config():
        return jsonify({"connected": False, "configured": False})
    data = session.get("gcal_credentials")
    if not data or not data.get("refresh_token"):
        return jsonify({"connected": False, "configured": True})
    return jsonify({"connected": True, "configured": True, "email": data.get("email", "")})


@app.route("/gcal/disconnect", methods=["POST"])
def gcal_disconnect():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    data = session.pop("gcal_credentials", None)
    # Revoke the token at Google so the app loses access immediately
    token = (data or {}).get("refresh_token") or (data or {}).get("token")
    if token:
        try:
            http_requests.post(
                "https://oauth2.googleapis.com/revoke",
                params={"token": token},
                timeout=5,
            )
        except Exception:
            pass  # revocation is best-effort; session is already cleared
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Google Calendar sync
# ---------------------------------------------------------------------------

def _parse_ics(ics_text, win_start="", win_end=""):
    """Parse ICS text into Google Calendar API-shaped event dicts."""
    lines = []
    for raw in ics_text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if raw.startswith((" ", "\t")) and lines:
            lines[-1] += raw[1:]
        else:
            lines.append(raw)

    events, current = [], None
    for line in lines:
        s = line.strip()
        if s == "BEGIN:VEVENT":
            current = {}
        elif s == "END:VEVENT" and current is not None:
            ev = _vevent_to_gcal(current, win_start, win_end)
            if ev:
                events.append(ev)
            current = None
        elif current is not None and ":" in line:
            key_part, _, value = line.partition(":")
            parts = key_part.split(";")
            key = parts[0].upper()
            params = {}
            for p in parts[1:]:
                if "=" in p:
                    pk, _, pv = p.partition("=")
                    params[pk.upper()] = pv
            value = (value
                     .replace("\\n", "\n")
                     .replace("\\,", ",")
                     .replace("\\;", ";")
                     .replace("\\\\", "\\"))
            current[key] = {"value": value, "params": params}
    return events


def _vevent_to_gcal(vevent, win_start, win_end):
    def fv(k):
        v = vevent.get(k)
        return v["value"] if isinstance(v, dict) else ""
    def fp(k):
        v = vevent.get(k)
        return v["params"] if isinstance(v, dict) else {}

    dtstart = fv("DTSTART")
    dtend   = fv("DTEND") or dtstart
    if fp("DTSTART").get("VALUE") == "DATE" or "T" not in dtstart:
        return None  # skip all-day events

    def ics_to_iso(dt, tzid):
        utc = dt.endswith("Z")
        s = dt.rstrip("Z")
        if len(s) < 15:
            return None, None
        iso = f"{s[0:4]}-{s[4:6]}-{s[6:8]}T{s[9:11]}:{s[11:13]}:{s[13:15]}"
        return (iso + "Z", "UTC") if utc else (iso, tzid or "")

    tzid = fp("DTSTART").get("TZID", "")
    start_iso, start_tz = ics_to_iso(dtstart, tzid)
    end_iso,   end_tz   = ics_to_iso(dtend, fp("DTEND").get("TZID", tzid))
    if not start_iso:
        return None

    date_part = dtstart.rstrip("Z")[:8]
    if win_start and date_part < win_start:
        return None
    if win_end and date_part >= win_end:
        return None

    return {
        "id":          fv("UID") or dtstart,
        "summary":     fv("SUMMARY"),
        "location":    fv("LOCATION"),
        "description": fv("DESCRIPTION"),
        "start": {"dateTime": start_iso, "timeZone": start_tz},
        "end":   {"dateTime": end_iso or start_iso, "timeZone": end_tz or start_tz},
    }


@app.route("/gcal/ics-pull")
def gcal_ics_pull():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    url = request.args.get("url", "").strip()
    if url.lower().startswith("webcal://"):
        url = "https://" + url[len("webcal://"):]
    host = (urlparse(url).hostname or "").lower()
    allowed_host = (
        host == "calendar.google.com"
        or host.endswith(".google.com")
        or host.endswith(".outlook.com")
        or host.endswith(".office365.com")
        or host.endswith(".live.com")
        or host.endswith(".icloud.com")
    )
    if not (url.startswith("https://") and allowed_host):
        return {"error": "Only Google, Outlook, or iCloud iCal URLs are supported"}, 400
    time_min = request.args.get("start", "")
    time_max = request.args.get("end", "")
    win_start = time_min[:10].replace("-", "") if time_min else ""
    win_end   = time_max[:10].replace("-", "") if time_max else ""
    try:
        resp = http_requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "ABT-Overtime-Planner/1.0"},
        )
        resp.raise_for_status()
        return jsonify({"events": _parse_ics(resp.text, win_start, win_end)})
    except http_requests.exceptions.Timeout:
        return {"error": "Timed out fetching iCal URL"}, 504
    except Exception as exc:
        app.logger.error("ICS pull error: %s", exc)
        return {"error": "Could not fetch iCal URL"}, 502


@app.route("/gcal/pull")
def gcal_pull():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    creds = _gcal_credentials()
    if not creds:
        return jsonify({"error": "not_connected"}), 401
    time_min = request.args.get("start")
    time_max = request.args.get("end")
    if not time_min or not time_max:
        return {"error": "start and end are required"}, 400
    try:
        service = build("calendar", "v3", credentials=creds)
        result = service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
            maxResults=500,
        ).execute()
        return jsonify({"events": result.get("items", [])})
    except HttpError as exc:
        app.logger.error("GCal pull error: %s", exc)
        return {"error": str(exc)}, exc.resp.status


@app.route("/gcal/push", methods=["POST"])
def gcal_push():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    creds = _gcal_credentials()
    if not creds:
        return jsonify({"error": "not_connected"}), 401
    data = request.json or {}
    event_body = data.get("event")
    event_id = data.get("event_id")
    if not event_body:
        return {"error": "event is required"}, 400
    try:
        service = build("calendar", "v3", credentials=creds)
        if event_id:
            result = service.events().patch(
                calendarId="primary", eventId=event_id, body=event_body
            ).execute()
        else:
            result = service.events().insert(
                calendarId="primary", body=event_body
            ).execute()
        return jsonify({"id": result["id"]})
    except HttpError as exc:
        app.logger.error("GCal push error: %s", exc)
        return {"error": str(exc)}, exc.resp.status


@app.route("/gcal/delete", methods=["POST"])
def gcal_delete():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403
    creds = _gcal_credentials()
    if not creds:
        return jsonify({"error": "not_connected"}), 401
    data = request.json or {}
    event_id = data.get("event_id")
    if not event_id:
        return {"error": "event_id is required"}, 400
    try:
        service = build("calendar", "v3", credentials=creds)
        service.events().delete(calendarId="primary", eventId=event_id).execute()
        return jsonify({"ok": True})
    except HttpError as exc:
        if exc.resp.status == 410:  # already deleted
            return jsonify({"ok": True})
        app.logger.error("GCal delete error: %s", exc)
        return {"error": str(exc)}, exc.resp.status


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=port, debug=debug)
