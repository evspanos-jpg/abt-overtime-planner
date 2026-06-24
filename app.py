import mimetypes
import os
from pathlib import Path
from analyzer import DAILY_NO_OVERTIME_LIMIT, simulate_schedule
from flask import Flask, Response, abort, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
STATIC_DIR = Path(app.root_path) / "static"

PASSWORD = os.environ.get("APP_PASSWORD", "").strip()


def password_required():
    return bool(PASSWORD)


def is_logged_in():
    return not password_required() or session.get("logged_in")


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
    return Response(data, mimetype=content_type)


@app.after_request
def disable_html_caching(response):
    if response.mimetype in {"text/html", "application/javascript", "application/manifest+json", "text/css", "application/json"}:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


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


@app.route("/")
def index():
    if not is_logged_in():
        return redirect(url_for("login"))
    return render_template("index.html")


@app.route("/manifest.webmanifest")
def webmanifest():
    return safe_static_response("manifest.webmanifest", "application/manifest+json")


@app.route("/service-worker.js")
def service_worker():
    return safe_static_response("service-worker.js", "application/javascript")


@app.route("/static/<path:filename>", endpoint="static")
def static_files(filename):
    return safe_static_response(filename)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/simulate", methods=["POST"])
def simulate():
    if not is_logged_in():
        return {"error": "Unauthorized"}, 403

    data = request.json or {}
    schedule = data.get("schedule", [])
    total_worked_hours = sum(float(block.get("duration", block.get("dur", 0)) or 0) for block in schedule)

    if total_worked_hours <= DAILY_NO_OVERTIME_LIMIT:
        return jsonify({
            "pay": 0,
            "type": ""
        })

    result = simulate_schedule(schedule)

    return jsonify({
        "pay": result["pay"],
        "type": result["type"] if result["pay"] > 0 else ""
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=port, debug=debug)
