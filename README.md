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
PORT=<set by platform>
WEB_CONCURRENCY=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120
```

The app supports hosts that use a `Procfile` and `PORT`, such as Render, Railway, or Heroku-style deployments.

## Render

Use either the dashboard fields below or Render's blueprint flow with `render.yaml`.

```text
Build Command: pip install -r requirements.txt
Start Command: gunicorn -c gunicorn.conf.py app:app
```

Required environment variables:

```text
SECRET_KEY=<a long random value>
APP_PASSWORD=<optional password>
```

`render.yaml` now includes a Python version plus default Gunicorn worker, thread, and timeout settings.

## Railway

This repo now includes `railway.json` and a `Procfile`, so Railway can deploy it without custom code changes.

```text
Start Command: gunicorn -c gunicorn.conf.py app:app
```

Set these variables in Railway:

```text
SECRET_KEY=<a long random value>
APP_PASSWORD=<optional password>
```

## Deployment Notes

- `gunicorn.conf.py` binds Gunicorn to `0.0.0.0:$PORT`, which both Render and Railway expect.
- `APP_PASSWORD` is optional. Leave it unset for a public planner.
- The app serves Flask templates and the `/simulate` API, so deploy it as a Python web service, not a static site.
