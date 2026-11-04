"""Template registry. Add a module here and it shows up in the catalog, the Studio and the AI planner."""
from __future__ import annotations

from importlib import import_module

from ..schema import Template

MODULES = ["kinetic_quote", "explainer", "listicle", "numbers", "code_walkthrough", "before_after", "day_recap", "quiz", "footage", "compare", "journey", "post_card", "split"]

TEMPLATES: dict[str, Template] = {}
for _m in MODULES:
    _t = import_module(f"{__name__}.{_m}").TEMPLATE
    TEMPLATES[_t.id] = _t


def get(tid: str) -> Template:
    return TEMPLATES[tid]


def catalog() -> dict:
    return {"version": 1, "templates": [t.to_json() for t in TEMPLATES.values()]}
