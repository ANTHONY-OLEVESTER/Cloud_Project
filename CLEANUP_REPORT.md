# Cleanup Report

## Overview
- Consolidated backend sources under `backend/app` and purged duplicate root modules.
- Normalised imports to the `app.*` namespace via `scripts/fix_imports.py` and refreshed configuration/CORS handling.
- Reworked the React client to match the expected layout (single `styles.css`, updated routing, API client guard rails).
- Added automation utilities: `scripts/fix_imports.py` and `scripts/validate_repo.py`.

## Files moved or removed
- Removed duplicate Python modules at repo root: `auth.py`, `config.py`, `crud.py`, `database.py`, `deps.py`, `models.py`, `schemas.py`, `security.py`, `seed.py`.
- Removed obsolete frontend assets: `frontend/public/index.html` (relocated to `frontend/index.html`), `frontend/src/pages/PoliciesPage.jsx`, `frontend/src/components/AuthLayout.jsx`, `frontend/src/components/ProviderSummary.jsx`, `frontend/src/components/StatCard.jsx`, root `styles.css`.
- Renamed auth flow to `frontend/src/pages/SignupPage.jsx` (from `RegisterPage.jsx`) and rewired references.

## Key backend updates
- `backend/app/config.py`: new settings model with `cors_origins`, JWT placeholders, and `.env` support.
- `backend/app/database.py`, `backend/app/deps.py`: restored session helpers with `app.*` imports.
- `backend/app/main.py`: CORS now reads `settings.cors_origins`; routers registered under both `/` and `/api` prefixes.
- `backend/app/routers/__init__.py`: simplified package exports to avoid relative imports.
- Requirements now pin `python-jose[cryptography]==3.3.0`.

## Key frontend updates
- `frontend/index.html` relocated from `public/` and Vite structure aligned.
- `frontend/src/services/apiClient.js`: base URL defaults to `http://localhost:8000/api`, injects `Authorization` when token present, and normalises URL building.
- `frontend/src/services/hooks.js`: rebuilt after import rewrite; paths now relative to `/api` prefix and exposes `useSignup` hook.
- `frontend/src/pages/*`: `DashboardPage.jsx` now contains local UI helpers, `LoginPage.jsx`/`SignupPage.jsx` provide their own auth wrappers, navigation trimmed in `MainLayout.jsx`.
- `frontend/src/styles.css`: consolidated styling definitions for layouts, cards, forms, and auth screens.

## Import rewrites (top files)
- `backend/app/main.py`
- `backend/app/crud.py`
- `backend/app/routers/accounts.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/dashboard.py`
- `backend/app/routers/policies.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/deps.py`
- `backend/app/database.py`

## Validation
- `python -m compileall backend` (pass)
- `.venv\Scripts\python.exe scripts\import_smoke.py` -> `ok`
- `python scripts\validate_repo.py` -> `Repository structure looks clean`

## Generated artifacts
- `scripts/fix_imports.py` - deterministic import normaliser.
- `scripts/validate_repo.py` - structural guard rails used above.
- `TREE_AFTER.md` - current repository tree snapshot.




