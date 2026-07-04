# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Does

**ABT Overtime Planner** is a web-based scheduling tool for American Ballet Theatre to plan weekly rehearsal calls and estimate overtime compensation. Key capabilities: interactive timeline planner (week/day/3-day/workweek/month views), real-time OT pay calculation with union-rule tiers, calendar sync via public iCal/ICS URL (Google, Outlook, iCloud), local file import/export, PDF/CSV export, and PWA offline support.

## Commands

```bash
# Run locally (Flask dev server, http://localhost:5000)
python app.py

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies (Playwright for tests)
npm install

# Run E2E tests
npx playwright test tests/calendar-import.spec.js

# Run a single test by title
npx playwright test --grep "test name here"

# Run in headed mode (see the browser)
npx playwright test --headed

# Run the Python OT-engine unit tests (pip install -r requirements-dev.txt first)
python -m pytest tests/test_overtime.py

# Production server
gunicorn -c gunicorn.conf.py app:app
```

No linting is configured. No build step — frontend is plain HTML/CSS/JS served directly by Flask.

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `SECRET_KEY` | Flask session signing (backs the optional `APP_PASSWORD` login — **should be set in production**; if unset, a random ephemeral key is generated per boot, so logins reset on restart) | random per-boot key (dev constant in debug) |
| `APP_PASSWORD` | Optional login gate | (none = open) |
| `PORT` | Server port | 5000 |
| `FLASK_DEBUG` | Enable debug mode | off |
| `WEB_CONCURRENCY` | Gunicorn workers | 2 |

## Architecture

### Backend (`app.py`, `analyzer.py`, `overtime_rules.py`)

Flask serves the SPA and exposes a small REST API:

- `POST /simulate` — core overtime calculation. Accepts schedule blocks, runs `analyzer.py:simulate_schedule()` against rules from `static/overtime-rules.json`, returns `{pay, type, hours}`.
- `GET /gcal/ics-pull` — calendar sync: fetches a public iCal/ICS URL server-side (host allow-list: Google/Outlook/iCloud), parses the ICS, returns events. This is the only calendar path (Google OAuth was removed).
- `GET|POST /login`, `GET /logout` — optional password gate.

`overtime_rules.py` loads `static/overtime-rules.json` with `@lru_cache`. `analyzer.py` implements the calculation algorithm (continuous span rules, daily tier thresholds, exceptions).

### Frontend (`static/planner-app.js`, `static/planner-ui.js`)

Vanilla JS, no framework. Two large modules:

- **`planner-app.js`** — state (`weekData`, `monthEvents`), timeline rendering for all views, drag-and-drop, undo/redo stack, localStorage persistence, calendar sync call handlers.
- **`planner-ui.js`** — device detection (phone/tablet/desktop, touch vs mouse), menu/toolbar building, settings panel, dialogs, workspace layout (rail + agenda panes), responsive switching.

Client-side overtime rules live in `static/overtime-rules.js` as a fallback (used offline; authoritative copy is the JSON file read by the backend).

### Data Flow

1. User edits a time block → `planner-app.js` POSTs to `/simulate` → `analyzer.py` returns OT calculation → earnings summary updates.
2. Calendar iCal: user pastes a public iCal URL (with an opt-in auto-sync toggle) → `/gcal/ics-pull` fetches + parses → matching events merged into local state.
3. State is auto-saved to `localStorage`; exportable as `.abt-planner.json`.

### Templates

`templates/index.html` is the single source of truth (Flask serves it; the Pages export copies it). The repo-root `index.html` is a generated mirror used by the static export and the Playwright tests — **do not hand-edit it**.

After changing HTML or any CSS/JS, run `python scripts/cache_bust.py`. It content-hashes the `static/*.css|js?v=` query strings and rewrites the mirror, so you never hand-bump `?v=` and the two files can't drift. The deploy-pages workflow runs it too. On the Flask side, the static route sends an ETag + `Cache-Control: no-cache`, so a stale `?v=` can never serve an old asset.

### Deployment

- **Render/Railway/Heroku**: `Procfile` runs Gunicorn.
- **GitHub Pages**: `.github/workflows/deploy-pages.yml` builds a static export (no backend features).
