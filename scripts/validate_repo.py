from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
EXPECTED_FRONTEND_PAGES = {
    "AccountsPage.jsx",
    "DashboardPage.jsx",
    "LoginPage.jsx",
    "SettingsPage.jsx",
    "SignupPage.jsx",
}
EXPECTED_ROUTER_FILES = {
    "__init__.py",
    "auth.py",
    "accounts.py",
    "policies.py",
    "dashboard.py",
}
REQUIRED_REQUIREMENTS = {
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy",
    "pydantic",
    "passlib[bcrypt]",
    "python-jose[cryptography]",
    "python-dotenv",
}
FORBIDDEN_ROOT_MODULES = {
    "auth.py",
    "config.py",
    "crud.py",
    "database.py",
    "deps.py",
    "models.py",
    "schemas.py",
    "security.py",
    "seed.py",
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def ensure_backend_structure(problems: list[str]) -> None:
    routers_dir = REPO_ROOT / "backend" / "app" / "routers"
    existing = {p.name for p in routers_dir.glob("*.py")}
    missing = EXPECTED_ROUTER_FILES - existing
    extra = existing - EXPECTED_ROUTER_FILES
    if missing:
        problems.append(f"Missing router modules: {sorted(missing)}")
    if extra:
        problems.append(f"Unexpected router modules: {sorted(extra)}")

    for module in FORBIDDEN_ROOT_MODULES:
        if (REPO_ROOT / module).exists():
            problems.append(f"Forbidden root module present: {module}")

    main_text = read_text(REPO_ROOT / "backend" / "app" / "main.py")
    if "allow_origins=settings.cors_origins" not in main_text:
        problems.append("backend/app/main.py must use settings.cors_origins for CORS")

    config_text = read_text(REPO_ROOT / "backend" / "app" / "config.py")
    if "cors_origins" not in config_text:
        problems.append("backend/app/config.py missing cors_origins configuration")


def ensure_requirements(problems: list[str]) -> None:
    req_path = REPO_ROOT / "backend" / "requirements.txt"
    packages = {
        line.split("==")[0].strip()
        for line in read_text(req_path).splitlines()
        if line and not line.startswith("#")
    }
    missing = REQUIRED_REQUIREMENTS - packages
    if missing:
        problems.append(f"backend/requirements.txt missing packages: {sorted(missing)}")


def ensure_frontend_layout(problems: list[str]) -> None:
    src_dir = REPO_ROOT / "frontend" / "src"
    pages_dir = src_dir / "pages"
    pages = {p.name for p in pages_dir.glob("*.jsx")}
    missing = EXPECTED_FRONTEND_PAGES - pages
    extra = pages - EXPECTED_FRONTEND_PAGES
    if missing:
        problems.append(f"Missing frontend pages: {sorted(missing)}")
    if extra:
        problems.append(f"Unexpected frontend pages: {sorted(extra)}")

    styles_path = src_dir / "styles.css"
    if not styles_path.exists():
        problems.append("frontend/src/styles.css missing")

    other_styles = [p for p in REPO_ROOT.rglob("styles.css") if p != styles_path]
    if other_styles:
        problems.append(f"Unexpected styles.css copies: {[str(p.relative_to(REPO_ROOT)) for p in other_styles]}")

    main_text = read_text(src_dir / "main.jsx")
    if "./styles.css" not in main_text:
        problems.append("frontend/src/main.jsx must import ./styles.css")

    api_client = read_text(src_dir / "services" / "apiClient.js")
    if "http://localhost:8000/api" not in api_client:
        problems.append("apiClient.js missing http://localhost:8000/api base URL")
    if "Authorization" not in api_client:
        problems.append("apiClient.js missing Authorization header injection")


def ensure_import_style(problems: list[str]) -> None:
    backend_dir = REPO_ROOT / "backend" / "app"
    pattern = re.compile(r"^\s*(from|import)\s+\.\.?", re.MULTILINE)
    for path in backend_dir.rglob("*.py"):
        text = read_text(path)
        if pattern.search(text):
            problems.append(f"Relative import detected in {path.relative_to(REPO_ROOT)}")


def main() -> None:
    problems: list[str] = []
    ensure_backend_structure(problems)
    ensure_requirements(problems)
    ensure_frontend_layout(problems)
    ensure_import_style(problems)

    if problems:
        print(json.dumps(problems, indent=2))
        sys.exit(1)
    print("Repository structure looks clean")


if __name__ == "__main__":
    main()
