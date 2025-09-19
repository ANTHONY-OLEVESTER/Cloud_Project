import sys

sys.path.append("backend")
from app.main import app

if not getattr(app, "title", None):
    raise SystemExit("app instance missing title")
print("ok")
