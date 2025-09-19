from __future__ import annotations

import argparse
import os
import re
from typing import Iterable

TARGET_MODULES = {
    "auth",
    "config",
    "crud",
    "database",
    "deps",
    "models",
    "schemas",
    "security",
    "seed",
}

RELATIVE_PATTERN = re.compile(r"^(?P<indent>\s*)from\s+(?P<dots>\.+)(?P<module>[A-Za-z0-9_\.]*)\s+import\s+(?P<names>.+?)(?P<comment>\s+#.*)?$")
FROM_PATTERN = re.compile(r"^(?P<indent>\s*)from\s+(?P<module>[A-Za-z0-9_\.]+)\s+import\s+(?P<names>.+?)(?P<comment>\s+#.*)?$")
IMPORT_PATTERN = re.compile(r"^(?P<indent>\s*)import\s+(?P<body>.+?)(?P<comment>\s+#.*)?$")


def iter_python_files(root: str) -> Iterable[str]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in {".venv", "node_modules", "__pycache__"}]
        for name in filenames:
            if name.endswith(".py"):
                yield os.path.join(dirpath, name)


def rewrite_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as handle:
        original = handle.read()
    lines = original.splitlines()
    changed = False
    rewritten: list[str] = []

    for line in lines:
        new_line = line

        rel_match = RELATIVE_PATTERN.match(line)
        if rel_match:
            module = rel_match.group("module")
            names = rel_match.group("names")
            indent = rel_match.group("indent")
            comment = rel_match.group("comment") or ""
            target_module = module.strip(".")
            if target_module:
                new_line = f"{indent}from app.{target_module} import {names}{comment}"
            else:
                new_line = f"{indent}from app import {names}{comment}"
            changed = True
        else:
            from_match = FROM_PATTERN.match(line)
            if from_match:
                module = from_match.group("module")
                comment = from_match.group("comment") or ""
                if module in TARGET_MODULES or module.startswith("."):
                    if module in TARGET_MODULES:
                        new_module = f"app.{module}"
                    elif module.startswith("."):
                        new_module = f"app.{module.lstrip('.')}"
                    else:
                        new_module = module
                    names = from_match.group("names")
                    indent = from_match.group("indent")
                    new_line = f"{indent}from {new_module} import {names}{comment}"
                    changed = True
            else:
                import_match = IMPORT_PATTERN.match(line)
                if import_match:
                    indent = import_match.group("indent")
                    body = import_match.group("body")
                    comment = import_match.group("comment") or ""
                    parts = [part.strip() for part in body.split(",")]
                    new_parts: list[str] = []
                    local_change = False
                    for part in parts:
                        if not part:
                            continue
                        if " as " in part:
                            module_name, alias = [piece.strip() for piece in part.split(" as ", 1)]
                        else:
                            module_name, alias = part, None
                        if module_name in TARGET_MODULES:
                            alias_text = alias if alias else module_name
                            new_parts.append(f"app.{module_name} as {alias_text}")
                            local_change = True
                        else:
                            new_parts.append(part)
                    if local_change:
                        new_line = f"{indent}import {', '.join(new_parts)}{comment}"
                        changed = True
        rewritten.append(new_line)

    if changed:
        with open(path, "w", encoding="utf-8", newline="\n") as handle:
            handle.write("\n".join(rewritten) + "\n")
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description="Rewrite backend imports to use app.* namespace")
    parser.add_argument("paths", nargs="*", default=["backend"], help="Paths to scan")
    args = parser.parse_args()

    any_changes = False
    for root in args.paths:
        for path in iter_python_files(root):
            if rewrite_file(path):
                any_changes = True
    if any_changes:
        print("Imports rewritten")
    else:
        print("No import changes needed")


if __name__ == "__main__":
    main()
