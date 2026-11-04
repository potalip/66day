"""Build a video from videos/<id>.py.

    python -m rcm.build storm_spot                 # full render + audio + preview + contact sheet
    python -m rcm.build storm_spot --stills 1.2,6,14   # PNG stills at global times (check layout first!)
    python -m rcm.build storm_spot --scene 3       # re-render one scene, then re-assemble
    python -m rcm.build storm_spot --audio-only    # new mix onto existing picture (e.g. after adding ElevenLabs key)
    python -m rcm.build --all                      # every video in videos/

A video module defines:
    ID, TITLE, FORMATS (["9x16"] / ["9x16","16x9"])
    SCENES = [(name, seconds, draw_fn), ...]   draw_fn(f) per frame, f.t is scene-local
    AUDIO  = {"vo": [(t0, t1, text)], "sfx": [(t, name, {...})], "music": {"mood":..., "prompt":...}}
    CAPTIONS = True   (burn VO lines as subtitles; default True)
"""
from __future__ import annotations
import argparse, importlib, json, os, shutil, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image, ImageDraw

from . import brand as B, core as C, audio as A

OUT = B.ROOT / "out"

def load(vid):
    sys.path.insert(0, str(B.ROOT))
    return importlib.import_module(f"videos.{vid}")

def offsets(mod):
    o, acc = [], 0.0
    for _, d, _ in mod.SCENES: o.append(acc); acc += d
    return o, acc

def make_post(mod, t_off):
    vo = mod.AUDIO.get("vo", []) if getattr(mod, "CAPTIONS", True) else []
    def post(f):
        g = getattr(mod, "POST", None)
        if g: g(f, t_off)
        gt = f.t + t_off
        for cue in vo:
            a, b, line = cue[:3]
            if len(cue) > 3 and cue[3] is False: continue  # caption off for this line (e.g. end card)
            if a - .2 <= gt <= b + .2:
                local = C.Frame(f.ctx, f.W, f.H, gt, f.dur, f.i, f.fmt)
                C.caption(local, line, a, b)
        if getattr(mod, "GRAIN", True): C.grain(f, .22)
        C.vignette(f, .35)
    return post

def _render_one(args):
    vid, idx, fmt, crf = args
    mod = load(vid)
    offs, _ = offsets(mod)
    name, dur, fn = mod.SCENES[idx]
    out = OUT / vid / fmt / "scenes" / f"{idx:02d}_{name}.mp4"
    t0 = time.time()
    C.render_scene(fn, dur, out, fmt, crf=crf, frame0=round(offs[idx] * B.FPS), post=make_post(mod, offs[idx]))
    return f"  scene {idx:02d} {name:<14} {dur:5.2f}s  {time.time() - t0:5.1f}s"

def stills(vid, times, fmt):
    mod = load(vid); offs, total = offsets(mod)
    d = OUT / vid / fmt / "stills"; d.mkdir(parents=True, exist_ok=True)
    paths = []
    for gt in times:
        k = max(i for i, o in enumerate(offs) if o <= gt + 1e-6)
        name, dur, fn = mod.SCENES[k]
        p = d / f"t{gt:06.2f}_{name}.png"
        C.still(fn, gt - offs[k], dur, p, fmt, post=make_post(mod, offs[k]))
        paths.append(p)
    sheet = tile(paths, d / "stills_sheet.png", [f"{t:.2f}s" for t in times])
    print(sheet); return sheet

def tile(paths, out, labels, cols=None, thumb_w=360):
    ims = [Image.open(p).convert("RGB") for p in paths]
    w0, h0 = ims[0].size; th = int(thumb_w * h0 / w0)
    cols = cols or min(len(ims), 6 if h0 > w0 else 4)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (th + 28)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for k, (im, lb) in enumerate(zip(ims, labels)):
        x, y = (k % cols) * thumb_w, (k // cols) * (th + 28)
        sheet.paste(im.resize((thumb_w, th), Image.LANCZOS), (x, y + 28))
        d.text((x + 8, y + 6), lb, fill=(230, 230, 230), font=C.font("SemiBold", 18))
    sheet.save(out); return out

def assemble(vid, fmt):
    mod = load(vid); _, total = offsets(mod)
    d = OUT / vid / fmt
    lst = d / "concat.txt"
    files = [d / "scenes" / f"{i:02d}_{n}.mp4" for i, (n, _, _) in enumerate(mod.SCENES)]
    lst.write_text("".join(f"file '{f.as_posix()}'\n" for f in files))
    silent = d / "picture.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", silent], check=True)
    return silent, total

def mix_and_mux(vid, fmt, total):
    mod = load(vid)
    d = OUT / vid / fmt
    raw, used = A.build_mix(mod.AUDIO, total, d / "audio")
    final = OUT / vid / f"{vid}_{fmt}.mp4"
    tmp = final.with_name(final.stem + ".tmp.mp4")
    # two-pass loudnorm so the master really lands on the target LUFS
    p1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af",
                         f"loudnorm=I={B.LUFS}:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"],
                        capture_output=True, text=True)
    m = json.loads(p1.stderr[p1.stderr.rindex("{"):p1.stderr.rindex("}") + 1])
    ln = (f"loudnorm=I={B.LUFS}:TP=-1.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", d / "picture.mp4", "-i", raw,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-af", f"{ln},aresample=48000,alimiter=limit=0.79:level=disabled",
                    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, final)
    prev = OUT / vid / f"{vid}_{fmt}_preview.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", final, "-c:v", "libx264", "-preset", "veryfast",
                    "-crf", "26", "-vf", "scale=iw*2/3:-2", "-c:a", "aac", "-b:a", "96k",
                    "-movflags", "+faststart", prev], check=True)
    return final, prev, used

def contact(vid, fmt, total, n=12):
    final = OUT / vid / f"{vid}_{fmt}.mp4"
    d = OUT / vid / fmt / "contact"; d.mkdir(parents=True, exist_ok=True)
    times = [total * (k + .5) / n for k in range(n)]
    paths = []
    for k, t in enumerate(times):
        p = d / f"c{k:02d}.png"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", final, "-frames:v", "1", p], check=True)
        paths.append(p)
    return tile(paths, OUT / vid / f"{vid}_{fmt}_contact.png", [f"{t:.1f}s" for t in times])

def build(vid, fmts=None, scene=None, audio_only=False, crf=18, workers=None):
    mod = load(vid)
    fmts = fmts or getattr(mod, "FORMATS", ["9x16"])
    workers = workers or max(1, os.cpu_count() or 1)
    report = {}
    for fmt in fmts:
        t0 = time.time()
        if not audio_only:
            idxs = [scene] if scene is not None else list(range(len(mod.SCENES)))
            print(f"[{vid} {fmt}] rendering {len(idxs)} scene(s) on {workers} worker(s)")
            with ProcessPoolExecutor(workers) as ex:
                for line in ex.map(_render_one, [(vid, i, fmt, crf) for i in idxs]): print(line)
        _, total = assemble(vid, fmt)
        final, prev, used = mix_and_mux(vid, fmt, total)
        sheet = contact(vid, fmt, total)
        report[fmt] = dict(final=str(final), preview=str(prev), contact=str(sheet), seconds=round(total, 2),
                           eleven=used, build_s=round(time.time() - t0))
        print(json.dumps(report[fmt], indent=1))
    return report

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("vid", nargs="?")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--fmt", action="append")
    ap.add_argument("--scene", type=int)
    ap.add_argument("--stills")
    ap.add_argument("--audio-only", action="store_true")
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--workers", type=int)
    a = ap.parse_args()
    if a.stills:
        for fmt in (a.fmt or getattr(load(a.vid), "FORMATS", ["9x16"])):
            stills(a.vid, [float(x) for x in a.stills.split(",")], fmt)
        return
    vids = sorted(p.stem for p in (B.ROOT / "videos").glob("*.py") if not p.stem.startswith("_")) if a.all else [a.vid]
    for v in vids:
        build(v, a.fmt, a.scene, a.audio_only, a.crf, a.workers)

if __name__ == "__main__":
    main()
