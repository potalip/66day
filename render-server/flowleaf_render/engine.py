"""Render pipeline: storyboard -> scenes (parallel) -> concat -> audio mix -> mux -> thumbnail + contact sheet.

Mirrors the reference engine's architecture (scene list, parallel scene render, loudness-normalised mix,
contact-sheet QA) but is driven by validated storyboard JSON instead of hand-written video modules.
"""
from __future__ import annotations

import json
import multiprocessing
import os
import re
import subprocess
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw

from . import assets
from . import audio as A
from . import core as C
from .common import BuildCtx, finish
from .schema import validate
from .styles import STYLES
from .templates import TEMPLATES

TRANS = 0.4  # seconds each side of a wipe


def size_for(fmt: str, quality: str = "final") -> tuple[int, int]:
    W, H = C.FORMATS[fmt]
    if quality == "draft": W, H = W // 2, H // 2
    return W, H


def offsets(sb):
    o, acc = [], 0.0
    for sc in sb["scenes"]: o.append(acc); acc += sc["duration"]
    return o, acc


def caption_cues(text: str, dur: float, lead=.2, tail=.25):
    """Split a voiceover line into readable caption chunks timed across the scene (by character length)."""
    text = (text or "").strip()
    if not text: return []
    parts = [p.strip() for p in re.split(r"(?<=[.!?…])\s+", text) if p.strip()]
    chunks = []
    for p in parts:
        words = p.split()
        while len(words) > 9:
            cut = 7 if len(words) > 11 else len(words) // 2
            chunks.append(" ".join(words[:cut])); words = words[cut:]
        if words: chunks.append(" ".join(words))
    span = max(.5, dur - lead - tail)
    total = sum(len(c) + 8 for c in chunks)
    t, out = lead, []
    for c in chunks:
        d = span * (len(c) + 8) / total
        out.append((t, t + d, c)); t += d
    return out


def build_scenes(sb: dict) -> list[tuple[str, float, Callable]]:
    """Validated storyboard -> [(name, seconds, draw(f))], with transitions, captions and finish applied."""
    T = TEMPLATES[sb["template"]]
    scenes = sb["scenes"]
    n = len(scenes)
    kinds = [s["kind"] for s in scenes]
    out = []
    for i, sc in enumerate(scenes):
        K = T.kind(sc["kind"])
        bc = BuildCtx(sb, i, kinds[:i].count(sc["kind"]), kinds.count(sc["kind"]), n)
        trans = sb["transition"]
        cues = caption_cues(sc["voiceover"], sc["duration"]) if sb["captions"] else []

        def draw(f, K=K, sc=sc, bc=bc, i=i, cues=cues, trans=trans):
            K.draw(f, sc, bc)
            finish(f)
            for a, b, line in cues:
                if a - .2 <= f.t <= b + .2: C.caption(f, line, a, b)
            if trans == "wipe":
                if i > 0: C.wipe(f, C.lerp(.5, 1, C.prog(f.t, 0, TRANS)), direction=1 if i % 2 else -1)
                if i < n - 1: C.wipe(f, C.lerp(0, .5, C.prog(f.t, f.dur - TRANS, f.dur)), direction=-1 if i % 2 else 1)
            elif trans == "fade":
                if i > 0: C.fade_black(f, 1 - C.prog(f.t, 0, .3))
                if i < n - 1: C.fade_black(f, C.prog(f.t, f.dur - .3, f.dur))
            if i == n - 1: C.fade_black(f, C.prog(f.t, f.dur - .35, f.dur))
            if i == 0: C.fade_black(f, 1 - C.prog(f.t, 0, .2))
        out.append((f"{i:02d}_{sc['kind']}", sc["duration"], draw))
    return out


def audio_spec(sb: dict) -> dict:
    T = TEMPLATES[sb["template"]]
    offs, total = offsets(sb)
    vo, sfx = [], []
    kinds = [s["kind"] for s in sb["scenes"]]
    for i, (sc, o) in enumerate(zip(sb["scenes"], offs)):
        if sb["voiceover"] and sc["voiceover"]:
            vo.append((o + .25, o + sc["duration"] - .15, sc["voiceover"]))
        if i > 0 and sb["transition"] == "wipe": sfx.append((o - .3, "whoosh", {"gain": -13}))
        K = T.kind(sc["kind"])
        if K.sfx:
            bc = BuildCtx(sb, i, kinds[:i].count(sc["kind"]), kinds.count(sc["kind"]), len(kinds))
            for t, name, opt in K.sfx(sc, bc):
                if t < sc["duration"]: sfx.append((o + t, name, opt))
    # the creator's own footage: keep its sound under the scenes that show it (music ducks under it)
    clips = []
    src = (sb.get("_assets") or {}).get(sb["fields"].get("video") or "")
    if src and sb["fields"].get("keep_audio", "on") != "off":
        for sc, o in zip(sb["scenes"], offs):
            if "start" in sc["fields"]:
                clips.append((o, src, float(sc["fields"].get("start") or 0), sc["duration"], -2))
    music = None if sb["music"] == "none" else {"mood": sb["music"], "gain": -10 if (vo or clips) else -7}
    return {"vo": vo, "sfx": sfx, "music": music, "clips": clips, "voice": sb.get("voice") or None}


def fit_to_voiceover(sb: dict, log=print) -> dict:
    """With ElevenLabs available, stretch scenes so each spoken line fits (TTS is cached, so this is free later)."""
    if not (sb["voiceover"] and A.have_eleven()): return sb
    for sc in sb["scenes"]:
        if not sc["voiceover"]: continue
        try:
            x = A.voiceover(sc["voiceover"], voice=sb.get("voice") or None)
        except Exception as e:  # noqa: BLE001
            log(f"  [vo] ElevenLabs failed: {e} -> captions only"); return sb
        if x is not None:
            need = len(x) / A.SR + .55
            if need > sc["duration"]: sc["duration"] = round(min(need, sc["duration"] + 6), 2)
    return sb


# --------------------------------------------------------------------------- per-process scene render
def _render_one(args):
    sb, idx, fmt, W, H, out, crf, frame0 = args
    name, dur, draw = build_scenes(sb)[idx]
    t0 = time.time()
    C.render_scene(draw, dur, Path(out), W, H, fmt, STYLES[sb["style"]], sb["lang"], crf=crf, frame0=frame0)
    return idx, name, dur, time.time() - t0


def tile(paths, out, labels, cols=None, thumb_w=300):
    ims = [Image.open(p).convert("RGB") for p in paths]
    w0, h0 = ims[0].size; th = int(thumb_w * h0 / w0)
    cols = cols or min(len(ims), 6 if h0 > w0 else 4)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (th + 28)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for k, (im, lb) in enumerate(zip(ims, labels)):
        x, y = (k % cols) * thumb_w, (k // cols) * (th + 28)
        sheet.paste(im.resize((thumb_w, th), Image.LANCZOS), (x, y + 28))
        d.text((x + 8, y + 5), lb, fill=(230, 230, 230), font=C.font("SemiBold", 17))
    sheet.save(out); return Path(out)


def _ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *map(str, args)], check=True)


def render(storyboard: dict, outdir: Path, quality="final", workers=None, progress: Callable | None = None,
           log=print) -> dict:
    """Render a storyboard. Returns paths + metadata. progress(fraction 0..1, stage)."""
    t_start = time.time()
    prog = progress or (lambda u, stage: None)
    sb, warnings = validate(storyboard, TEMPLATES, strict=True)
    sb = assets.resolve(sb, TEMPLATES, log)
    outdir = Path(outdir); (outdir / "scenes").mkdir(parents=True, exist_ok=True)
    prog(.02, "voiceover")
    sb = fit_to_voiceover(sb, log)
    fmt = sb["format"]; W, H = size_for(fmt, quality)
    offs, total = offsets(sb)
    crf = 20 if quality == "final" else 27
    workers = workers or int(os.environ.get("FLR_WORKERS", 0)) or max(1, os.cpu_count() or 1)
    jobs = [(sb, i, fmt, W, H, str(outdir / "scenes" / f"{i:02d}.mp4"), crf, round(offs[i] * C.FPS))
            for i in range(len(sb["scenes"]))]
    # longest scenes first for better packing
    jobs.sort(key=lambda j: -sb["scenes"][j[1]]["duration"])
    prog(.05, "scenes")
    done = 0.0
    if workers == 1:
        for j in jobs:
            _, name, dur, secs = _render_one(j); done += dur
            prog(.05 + .75 * done / total, "scenes")
    else:
        with ProcessPoolExecutor(min(workers, len(jobs)), mp_context=multiprocessing.get_context("forkserver")) as ex:
            for _, name, dur, secs in ex.map(_render_one, jobs):
                done += dur; log(f"  scene {name:<16} {dur:5.2f}s in {secs:5.1f}s")
                prog(.05 + .75 * done / total, "scenes")
    prog(.82, "assemble")
    lst = outdir / "concat.txt"
    lst.write_text("".join(f"file '{(outdir / 'scenes' / f'{i:02d}.mp4').as_posix()}'\n" for i in range(len(sb["scenes"]))))
    picture = outdir / "picture.mp4"
    _ff("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", picture)
    prog(.86, "audio")
    raw, used = A.build_mix(audio_spec(sb), total, outdir / "audio")
    p1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af",
                         f"loudnorm=I={A.LUFS}:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"],
                        capture_output=True, text=True)
    final = outdir / "video.mp4"
    try:
        m = json.loads(p1.stderr[p1.stderr.rindex("{"):p1.stderr.rindex("}") + 1])
        ln = (f"loudnorm=I={A.LUFS}:TP=-1.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        if "inf" in ln: raise ValueError("silent")
    except (ValueError, KeyError):
        ln = "anull"
    _ff("-i", picture, "-i", raw, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
        "-af", f"{ln},aresample=48000,alimiter=limit=0.89:level=disabled",
        "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", final)
    prog(.94, "thumbnails")
    thumb = outdir / "thumbnail.jpg"
    # thumbnail: a frame ~60% into the first scene (title fully on screen), scaled to 540 wide
    t_thumb = min(sb["scenes"][0]["duration"] * .75, total - .1)
    _ff("-ss", f"{t_thumb:.2f}", "-i", final, "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "3", thumb)
    contact = contact_sheet(final, total, outdir)
    meta = {"video": str(final), "thumbnail": str(thumb), "contact": str(contact), "duration": round(total, 2),
            "width": W, "height": H, "fps": C.FPS, "format": fmt, "quality": quality, "voiceover": used and sb["voiceover"],
            "scenes": [{"kind": s["kind"], "start": round(o, 2), "duration": s["duration"]} for s, o in zip(sb["scenes"], offs)],
            "warnings": warnings, "render_seconds": round(time.time() - t_start, 1)}
    (outdir / "result.json").write_text(json.dumps(meta, indent=1))
    for p in (picture, lst): p.unlink(missing_ok=True)
    prog(1.0, "done")
    return meta


def contact_sheet(video: Path, total: float, outdir: Path, n=12):
    d = outdir / "contact"; d.mkdir(exist_ok=True)
    times = [total * (k + .5) / n for k in range(n)]
    paths = []
    for k, t in enumerate(times):
        p = d / f"c{k:02d}.png"
        _ff("-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-vf", "scale=480:-2", p)
        paths.append(p)
    out = tile(paths, outdir / "contact.png", [f"{t:.1f}s" for t in times])
    for p in paths: p.unlink(missing_ok=True)
    d.rmdir()
    return out


def stills(storyboard: dict, outdir: Path, per_scene=(.35, .97), quality="final"):
    """Fast layout check without encoding: PNG frames at fractions of each scene + a sheet."""
    sb, _ = validate(storyboard, TEMPLATES, strict=True)
    sb = assets.resolve(sb, TEMPLATES)
    fmt = sb["format"]; W, H = size_for(fmt, quality)
    outdir = Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    paths, labels = [], []
    for i, (name, dur, draw) in enumerate(build_scenes(sb)):
        for u in per_scene:
            t = dur * u if u < .9 else max(0, dur - TRANS - .05)
            p = outdir / f"{name}_{u:.2f}.png"
            C.still(draw, t, dur, p, W, H, fmt, STYLES[sb["style"]], sb["lang"])
            paths.append(p); labels.append(f"{name} {t:.1f}s")
    return tile(paths, outdir / "sheet.png", labels, cols=min(len(paths), 6 if H > W else 4))
