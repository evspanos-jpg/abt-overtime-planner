import hashlib
import hmac
import mimetypes
import os
import secrets
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import requests as http_requests
from flask import Flask, Response, abort, jsonify, redirect, render_template, request, session, url_for

from analyzer import DAILY_NO_OVERTIME_LIMIT, simulate_schedule

app = Flask(__name__, static_folder=None)

# SECRET_KEY signs the session cookie, which backs the optional APP_PASSWORD
# login. With a known/guessable key that session can be forged (bypassing the
# gate), so a real value must be set in production.
_FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
_SECRET_KEY = os.environ.get("SECRET_KEY")
if not _SECRET_KEY:
    if _FLASK_DEBUG:
        # Stable key for local dev so sessions survive reloads.
        _SECRET_KEY = "dev-secret-key-change-me"
    else:
        # No key configured in production: mint a strong random one so the session
        # can't be forged with a publicly-known key. Logins won't survive a
        # restart — preferable to a forgeable auth gate. Set SECRET_KEY to persist.
        _SECRET_KEY = secrets.token_hex(32)
        app.logger.critical(
            "SECRET_KEY is not set: generated a random ephemeral key. Any "
            "APP_PASSWORD login will reset on every restart. Set the SECRET_KEY "
            "environment variable to a long random value to persist it."
        )
app.secret_key = _SECRET_KEY
app.permanent_session_lifetime = timedelta(days=365)
# Session-cookie hardening + a request-body cap (defence-in-depth).
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=not _FLASK_DEBUG,  # HTTPS-only in prod; off for local http dev
    MAX_CONTENT_LENGTH=2 * 1024 * 1024,      # 2 MB cap on request bodies
)
STATIC_DIR = Path(app.root_path) / "static"

PASSWORD = os.environ.get("APP_PASSWORD", "").strip()


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
# Hooks
# ---------------------------------------------------------------------------

@app.after_request
def set_security_and_cache_headers(response):
    # Defence-in-depth headers on every response. No CSP is set: the UI relies on
    # inline event handlers, so a script-src policy would break it without a
    # refactor — the XSS sinks are fixed at the source instead.
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
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
        if hmac.compare_digest(request.form.get("password", ""), PASSWORD):
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


@app.route("/privacy")
def privacy():
    # Public (no login gate) so users can always reach it.
    return render_template("privacy.html")


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
# Calendar sync (iCal URL — fetched and parsed server-side)
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


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=_FLASK_DEBUG)
