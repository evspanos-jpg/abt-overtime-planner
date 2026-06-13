import os
from flask import Flask, jsonify, redirect, render_template, request, send_from_directory, session, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

PASSWORD = os.environ.get("APP_PASSWORD", "").strip()


def password_required():
    return bool(PASSWORD)


def is_logged_in():
    return not password_required() or session.get("logged_in")


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
    return send_from_directory("static", "manifest.webmanifest", mimetype="application/manifest+json")


@app.route("/service-worker.js")
def service_worker():
    return send_from_directory("static", "service-worker.js", mimetype="application/javascript")


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

    total_hours = sum(b["duration"] for b in schedule)
    ot = max(0, min(total_hours, 8) - 6)
    dbl = max(0, total_hours - 8)
    pay = ot * 65 + dbl * 90

    return jsonify({
        "pay": round(pay, 2),
        "type": "Overtime" if pay > 0 else ""
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=port, debug=debug)
