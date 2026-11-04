"""Command line.

    python -m flowleaf_render.cli catalog --out ../worker/lib/studio/catalog.generated.json
    python -m flowleaf_render.cli stills kinetic-quote --lang ru --style paper --fmt 16x9
    python -m flowleaf_render.cli render explainer --fmt 1x1 [--draft]
    python -m flowleaf_render.cli render path/to/storyboard.json
    python -m flowleaf_render.cli samples            # stills sheet for every template x style x format
    python -m flowleaf_render.cli previews --out DIR # small preview thumbnails for the Studio gallery
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from . import engine
from .schema import deep
from .templates import TEMPLATES, catalog

OUT = Path(__file__).resolve().parent.parent / "data" / "out"


def storyboard_for(name, lang="en", style=None, fmt=None):
    if name.endswith(".json"):
        sb = json.loads(Path(name).read_text())
    else:
        sb = deep(TEMPLATES[name].examples[lang])
    if style: sb["style"] = style
    if fmt: sb["format"] = fmt
    return sb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["catalog", "stills", "render", "samples", "previews"])
    ap.add_argument("name", nargs="?")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--style")
    ap.add_argument("--fmt")
    ap.add_argument("--draft", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--only")
    a = ap.parse_args()

    if a.cmd == "catalog":
        js = json.dumps(catalog(), ensure_ascii=False, indent=1)
        if a.out: Path(a.out).write_text(js + "\n"); print("wrote", a.out)
        else: print(js)
        return
    if a.cmd == "stills":
        sb = storyboard_for(a.name, a.lang, a.style, a.fmt)
        d = OUT / "stills" / f"{sb['template']}_{sb.get('style')}_{sb.get('format', '9x16')}_{a.lang}"
        print(engine.stills(sb, d, quality="draft" if a.draft else "final"))
        return
    if a.cmd == "render":
        sb = storyboard_for(a.name, a.lang, a.style, a.fmt)
        d = OUT / "renders" / f"{sb['template']}_{sb.get('style')}_{sb.get('format', '9x16')}_{a.lang}"
        t0 = time.time()
        meta = engine.render(sb, d, quality="draft" if a.draft else "final")
        print(json.dumps({k: meta[k] for k in ("video", "contact", "duration", "render_seconds")}, indent=1),
              f"{time.time() - t0:.1f}s")
        return
    if a.cmd == "samples":
        sheets = []
        for tid, T in TEMPLATES.items():
            if a.only and tid != a.only: continue
            for fmt in (["9x16", "1x1", "16x9"] if not a.fmt else [a.fmt]):
                for lang in ["en", "ru"]:
                    style = T.styles[(["9x16", "1x1", "16x9"].index(fmt) + (lang == "ru")) % len(T.styles)]
                    sb = storyboard_for(tid, lang, a.style or style, fmt)
                    d = OUT / "samples" / f"{tid}_{fmt}_{lang}"
                    sheets.append(engine.stills(sb, d, per_scene=(.55, .97), quality="draft"))
                    print(sheets[-1])
        return
    if a.cmd == "previews":
        from . import core as C
        from .styles import STYLES
        from .schema import validate
        out = Path(a.out or OUT / "previews"); out.mkdir(parents=True, exist_ok=True)
        for tid, T in TEMPLATES.items():
            for style in T.styles:
                sb, _ = validate(storyboard_for(tid, "en", style, "1x1"), TEMPLATES)
                sb["captions"] = False
                scenes = engine.build_scenes(sb)
                idx = 1 if len(scenes) > 2 else 0
                name, dur, draw = scenes[idx]
                p = out / f"{tid}--{style}.png"
                C.still(draw, dur * .8 if dur * .8 < dur - .45 else dur - .5, dur, p, 540, 540, "1x1", STYLES[style], "en")
                from PIL import Image
                Image.open(p).convert("RGB").resize((360, 360), Image.LANCZOS).save(p.with_suffix(".jpg"), quality=78)
                p.unlink()
                print(p.with_suffix(".jpg"))


if __name__ == "__main__":
    main()
