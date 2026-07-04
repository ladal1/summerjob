from __future__ import annotations

from typing import Any


def parse_pg_array(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        s = value.strip()
        if s.startswith("{") and s.endswith("}"):
            inner = s[1:-1]
            return inner.split(",") if inner else []
        return [s]
    return []
