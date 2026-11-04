"""Template declarations + storyboard validation.

A *storyboard* is the JSON the Studio (or Claude) fills and the render server renders:

    {
      "template": "explainer", "style": "paper", "format": "9x16", "lang": "en",
      "title": "How to ship with an AI agent",
      "fields": {"handle": "@me"},                # template-level fields
      "scenes": [
        {"kind": "intro", "duration": 3.2, "voiceover": "spoken line (also the caption)",
         "fields": {"title": "...", "subtitle": "..."}},
        ...
      ],
      "music": "calm",            # calm | uplift | drive | focus | none
      "voiceover": true,          # ElevenLabs if the server has a key; otherwise captions only
      "captions": true,
      "transition": "wipe"        # wipe | fade | cut
    }

Each template declares its fields and scene kinds with the small Field vocabulary below. The same declarations are
exported as JSON (`python -m flowleaf_render.cli catalog`) so the web Studio and Claude use exactly one contract.
"""
from __future__ import annotations

import copy
import re
from dataclasses import dataclass, field
from typing import Any, Callable

from .core import FORMATS
from .styles import STYLES, STYLE_NAMES

FIELD_TYPES = ("text", "textarea", "list", "code", "number", "select", "lines", "image")
MUSIC = ("calm", "uplift", "drive", "focus", "none")
TRANSITIONS = ("wipe", "fade", "cut")
LANGS = ("en", "ru")


@dataclass
class Field:
    key: str
    type: str
    label: dict
    required: bool = False
    max_len: int = 120
    max_items: int = 6
    min_items: int = 0
    options: list = field(default_factory=list)   # for select: [{"value":..., "label": {en, ru}}]
    min: float | None = None
    max: float | None = None
    max_lines: int = 16
    help: dict | None = None
    default: Any = None

    def to_json(self):
        d = {"key": self.key, "type": self.type, "label": self.label, "required": self.required}
        if self.type in ("text", "textarea", "list", "code"): d["maxLen"] = self.max_len
        if self.type == "list": d.update(maxItems=self.max_items, minItems=self.min_items)
        if self.type == "select": d["options"] = self.options
        if self.type == "number": d.update(min=self.min, max=self.max)
        if self.type == "code": d["maxLines"] = self.max_lines
        if self.help: d["help"] = self.help
        if self.default is not None: d["default"] = self.default
        return d


@dataclass
class SceneKind:
    kind: str
    label: dict
    fields: list[Field]
    duration: tuple[float, float, float]      # default, min, max (seconds)
    draw: Callable | None = None              # draw(f, scene, ctx: BuildCtx)
    sfx: Callable | None = None               # sfx(scene, ctx) -> [(t_local, name, opts)]
    hint: str = ""                            # guidance for Claude

    def to_json(self):
        return {"kind": self.kind, "label": self.label, "fields": [f.to_json() for f in self.fields],
                "duration": {"default": self.duration[0], "min": self.duration[1], "max": self.duration[2]},
                "hint": self.hint}


@dataclass
class Template:
    id: str
    name: dict
    description: dict
    category: str
    styles: list[str]
    fields: list[Field]
    scene_kinds: list[SceneKind]
    examples: dict                      # {"en": storyboard, "ru": storyboard}
    min_scenes: int = 2
    max_scenes: int = 10
    music: str = "calm"
    transition: str = "wipe"
    ai_notes: str = ""
    first_kinds: tuple = ()             # kinds allowed as the first scene (empty = any)

    def kind(self, k) -> SceneKind | None:
        return next((s for s in self.scene_kinds if s.kind == k), None)

    def to_json(self):
        return {
            "id": self.id, "name": self.name, "description": self.description, "category": self.category,
            "styles": [{"id": s, "name": STYLE_NAMES[s], "palette": STYLES[s].to_json()} for s in self.styles],
            "formats": list(FORMATS), "fields": [f.to_json() for f in self.fields],
            "sceneKinds": [k.to_json() for k in self.scene_kinds],
            "minScenes": self.min_scenes, "maxScenes": self.max_scenes,
            "defaults": {"style": self.styles[0], "music": self.music, "transition": self.transition},
            "aiNotes": self.ai_notes,
            "examples": self.examples,
        }


# --------------------------------------------------------------------------- validation
class StoryboardError(ValueError):
    def __init__(self, errors):
        super().__init__("; ".join(f"{e['path']}: {e['message']}" for e in errors[:6]))
        self.errors = errors


def _norm_text(v, f: Field, path, errs, multiline=False):
    if v is None: v = ""
    if isinstance(v, (int, float)) and not isinstance(v, bool): v = str(v)
    if not isinstance(v, str):
        errs.append({"path": path, "code": "type", "message": "expected text"}); return ""
    v = v.replace("\r\n", "\n").replace("\t", "    " if f.type == "code" else " ")
    if not multiline: v = re.sub(r"\s+", " ", v)
    v = v.strip("\n") if f.type == "code" else v.strip()
    if len(v) > f.max_len:
        errs.append({"path": path, "code": "too_long", "message": f"max {f.max_len} characters", "soft": True})
        v = v[: f.max_len].rstrip()
    if f.required and not v:
        errs.append({"path": path, "code": "required", "message": "required"})
    return v


def parse_lines(spec: str) -> list[int]:
    """'2, 4-6' -> [2, 4, 5, 6]"""
    out = []
    for part in re.split(r"[,\s]+", str(spec or "").strip()):
        if not part: continue
        m = re.fullmatch(r"(\d+)(?:-(\d+))?", part)
        if not m: continue
        a = int(m.group(1)); b = int(m.group(2) or a)
        out.extend(range(min(a, b), min(max(a, b), min(a, b) + 60) + 1))
    return sorted(set(x for x in out if 0 < x < 200))


def normalize_field(f: Field, v, path, errs):
    if f.type in ("text", "textarea"):
        return _norm_text(v, f, path, errs, multiline=f.type == "textarea")
    if f.type == "code":
        v = _norm_text(v, f, path, errs, multiline=True)
        lines = v.split("\n")
        if len(lines) > f.max_lines:
            errs.append({"path": path, "code": "too_long", "message": f"max {f.max_lines} lines", "soft": True})
            v = "\n".join(lines[: f.max_lines])
        return v
    if f.type == "image":
        v = (v or "").strip() if isinstance(v, str) else ""
        if v and not re.match(r"^https?://", v):
            errs.append({"path": path, "code": "url", "message": "image must be an http(s) URL", "soft": True}); v = ""
        if len(v) > 2000: v = ""
        if f.required and not v: errs.append({"path": path, "code": "required", "message": "required"})
        return v
    if f.type == "lines":
        return ", ".join(str(x) for x in parse_lines(v if isinstance(v, str) else ",".join(map(str, v or []))))
    if f.type == "number":
        if v in (None, "") and not f.required: return f.default if f.default is not None else 0
        try:
            x = float(str(v).replace(",", ".").replace(" ", "").replace(" ", ""))
        except ValueError:
            errs.append({"path": path, "code": "type", "message": "expected a number"}); return f.default or 0
        if f.min is not None and x < f.min: x = f.min
        if f.max is not None and x > f.max: x = f.max
        return int(x) if x.is_integer() else x
    if f.type == "select":
        vals = [o["value"] for o in f.options]
        if v in vals: return v
        if v not in (None, ""):
            errs.append({"path": path, "code": "option", "message": f"one of {vals}", "soft": True})
        return f.default if f.default is not None else vals[0]
    if f.type == "list":
        if isinstance(v, str): v = [x for x in v.split("\n")]
        if not isinstance(v, list):
            errs.append({"path": path, "code": "type", "message": "expected a list"}); return []
        item = Field(f.key, "text", f.label, max_len=f.max_len)
        out = [normalize_field(item, x, f"{path}[{i}]", errs) for i, x in enumerate(v)]
        out = [x for x in out if x]
        if len(out) > f.max_items:
            errs.append({"path": path, "code": "too_many", "message": f"max {f.max_items} items", "soft": True})
            out = out[: f.max_items]
        if len(out) < f.min_items:
            errs.append({"path": path, "code": "too_few", "message": f"at least {f.min_items} items"})
        return out
    raise ValueError(f"unknown field type {f.type}")


def validate(sb: dict, templates: dict[str, Template], strict=True) -> tuple[dict, list[dict]]:
    """Normalise a storyboard against its template. Returns (clean, errors). Soft errors (truncation, unknown
    option) are fixed in `clean`; hard errors mean it can't render. strict=True raises on hard errors."""
    errs: list[dict] = []
    if not isinstance(sb, dict):
        raise StoryboardError([{"path": "", "code": "type", "message": "storyboard must be an object"}])
    tid = sb.get("template")
    T = templates.get(tid)
    if not T:
        raise StoryboardError([{"path": "template", "code": "unknown", "message": f"unknown template {tid!r}"}])
    out: dict[str, Any] = {"template": T.id}
    out["style"] = sb.get("style") if sb.get("style") in T.styles else T.styles[0]
    if sb.get("style") not in (None, out["style"]):
        errs.append({"path": "style", "code": "option", "message": f"one of {T.styles}", "soft": True})
    out["format"] = sb.get("format") if sb.get("format") in FORMATS else "9x16"
    if sb.get("format") not in (None, out["format"]):
        errs.append({"path": "format", "code": "option", "message": f"one of {list(FORMATS)}", "soft": True})
    out["lang"] = sb.get("lang") if sb.get("lang") in LANGS else "en"
    out["title"] = _norm_text(sb.get("title", ""), Field("title", "text", {}, max_len=120), "title", errs)
    out["music"] = sb.get("music") if sb.get("music") in MUSIC else T.music
    out["transition"] = sb.get("transition") if sb.get("transition") in TRANSITIONS else T.transition
    out["voiceover"] = bool(sb.get("voiceover", True))
    out["captions"] = bool(sb.get("captions", True))
    gf = sb.get("fields") or {}
    if not isinstance(gf, dict): gf = {}; errs.append({"path": "fields", "code": "type", "message": "expected object"})
    out["fields"] = {f.key: normalize_field(f, gf.get(f.key, f.default), f"fields.{f.key}", errs) for f in T.fields}
    scenes = sb.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        errs.append({"path": "scenes", "code": "required", "message": "at least one scene"}); scenes = []
    if len(scenes) > T.max_scenes:
        errs.append({"path": "scenes", "code": "too_many", "message": f"max {T.max_scenes} scenes", "soft": True})
        scenes = scenes[: T.max_scenes]
    if 0 < len(scenes) < T.min_scenes:
        errs.append({"path": "scenes", "code": "too_few", "message": f"at least {T.min_scenes} scenes"})
    clean = []
    for i, sc in enumerate(scenes):
        p = f"scenes[{i}]"
        if not isinstance(sc, dict):
            errs.append({"path": p, "code": "type", "message": "scene must be an object"}); continue
        K = T.kind(sc.get("kind"))
        if not K:
            errs.append({"path": f"{p}.kind", "code": "unknown",
                         "message": f"unknown scene kind {sc.get('kind')!r}; one of {[k.kind for k in T.scene_kinds]}"})
            continue
        d0, dmin, dmax = K.duration
        try: dur = float(sc.get("duration", d0))
        except (TypeError, ValueError): dur = d0
        dur = round(min(dmax, max(dmin, dur)), 2)
        vo = _norm_text(sc.get("voiceover", ""), Field("voiceover", "textarea", {}, max_len=260), f"{p}.voiceover", errs)
        sf = sc.get("fields") or {}
        if not isinstance(sf, dict): sf = {}
        fields = {f.key: normalize_field(f, sf.get(f.key, f.default), f"{p}.fields.{f.key}", errs) for f in K.fields}
        clean.append({"kind": K.kind, "duration": dur, "voiceover": vo, "fields": fields})
    out["scenes"] = clean
    hard = [e for e in errs if not e.get("soft")]
    if strict and hard: raise StoryboardError(hard)
    return out, errs


def total_duration(sb: dict) -> float:
    return round(sum(s["duration"] for s in sb["scenes"]), 2)


def L(en: str, ru: str) -> dict:
    return {"en": en, "ru": ru}


def example(T_id, lang, title, scenes, fields=None, style=None, fmt="9x16", music=None, **kw):
    """Helper for declaring example storyboards inside template modules."""
    sb = {"template": T_id, "style": style, "format": fmt, "lang": lang, "title": title,
          "fields": fields or {}, "scenes": [
              {"kind": k, "duration": d, "voiceover": vo, "fields": fl} for (k, d, vo, fl) in scenes]}
    if music: sb["music"] = music
    sb.update(kw)
    return {k: v for k, v in sb.items() if v is not None}


def deep(x): return copy.deepcopy(x)
