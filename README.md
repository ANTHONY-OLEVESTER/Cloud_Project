# Cloud Guard MVP

A full-stack prototype for a multi-cloud cybersecurity posture platform. The backend is a FastAPI service with a SQLite database, and the frontend is a React (Vite) single-page app styled for a modern security dashboard. Demo data is seeded automatically so you can explore the experience right away.

## Project structure

```
00_Cloud_Project/
|-- backend/            # FastAPI application, SQLAlchemy models, seed data
|   |-- app/
|   |   |-- routers/    # Auth, accounts, policies, dashboard endpoints
|   |   |-- crud.py     # Database helpers and dashboard aggregations
|   |   |-- models.py   # ORM models and enums
|   |   |-- schemas.py  # Pydantic response/request models
|   |   `-- main.py     # FastAPI app wiring and seed bootstrap
|   `-- requirements.txt
`-- frontend/           # Vite + React SPA for the cybersecurity UI
    |-- src/
    |   |-- pages/      # Dashboard, accounts, policies, settings, auth
    |   |-- components/
    |   `-- services/   # React Query hooks + API client
    `-- package.json
```

## Backend setup

Prerequisites: Python 3.11+, pip

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate    # Windows
# source .venv/bin/activate # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Environment variables (`.env` or shell):

- `DATABASE_URL` - defaults to `sqlite:///./cloud_guard.db`
- `DEMO_SEED` - set to `false` to skip the sample dataset

When the app starts it migrates the tables and, if `DEMO_SEED=true`, loads:

- Admin user: `admin@cloudguard.dev` / `changeme123`
- Three cloud accounts spanning AWS, Azure, GCP
- Four example policies and recent compliance evaluations

Key endpoints (all JSON):

- `POST /auth/register`, `POST /auth/login`
- `GET/POST/PATCH/DELETE /accounts`
- `GET/POST /policies`, `GET /policies/evaluations`
- `GET /dashboard/summary`
- `GET /health`

## Frontend setup

Prerequisites: Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

By default the React app calls `http://localhost:8000`. To point at a different backend, create `frontend/.env` with:

```
VITE_API_URL=http://your-backend-host:8000
```

The development server proxies API calls and the UI uses React Query for data fetching, so edits hot-reload instantly. Pages included:

- Login & Sign-up flows for onboarding security teams
- Dashboard with summary metrics and provider breakdowns
- Account connection workflow to link AWS/Azure/GCP organizations
- Policy catalogue with compliance status per account
- Settings panel for notification and automation switches

## Notes & next steps

- Authentication is intentionally lightweight (no JWT/session handling). Layer in proper OAuth or SSO flows before production use.
- Replace the naive password fallback in `security.py` with managed secrets + bcrypt/Argon2 when deploying.
- For persistent environments, swap SQLite for PostgreSQL and manage schema migrations (e.g., with Alembic).
- The React UI focuses on layout and data wiring; bring in a component library or design system tokens to match your branding.
- Add automated tests (pytest for backend, Vitest/RTL for frontend) once the toolchain can install dev dependencies.
