# ABT Overtime Planner

A Flask app for planning weekly rehearsal calls and estimating overtime.

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`.

## Public Deployment

The app is public by default. Set `APP_PASSWORD` only if you want to require login.

Recommended environment variables:

```text
SECRET_KEY=<a long random value>
APP_PASSWORD=<optional password>
```

The app supports hosts that use a `Procfile` and `PORT`, such as Render, Railway, or Heroku-style deployments.

## Render

Use either the dashboard fields below or Render's blueprint flow with `render.yaml`.

```text
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```
