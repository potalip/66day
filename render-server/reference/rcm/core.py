"""Motion toolkit: cairo drawing (anti-aliased, fast) + Pillow text + ffmpeg piping.

Every scene is a function `draw(f)` called once per frame, where `f` is a Frame:
    f.ctx  cairo context (already cleared)      f.W, f.H  canvas size
    f.t    seconds since scene start             f.dur     scene duration
    f.i    global frame index (for grain)        f.fmt     "9x16" | "16x9" | ...
Draw with the helpers below. Never use linear motion: wrap progress in an ease.
"""
from __future__ import annotations
import math, os, random, subprocess, functools
from dataclasses import dataclass
from pathlib import Path

import cairo
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from . import brand as B

# --------------------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def lerp(a, b, u): return a + (b - a) * u
def prog(t, a, b): return clamp((t - a) / (b - a)) if b != a else float(t >= a)

def linear(u): return u
def in_cubic(u): return u ** 3
def out_cubic(u): return 1 - (1 - u) ** 3
def in_out_cubic(u): return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
def out_quint(u): return 1 - (1 - u) ** 5
def out_expo(u): return 1.0 if u >= 1 else 1 - 2 ** (-10 * u)
def in_expo(u): return 0.0 if u <= 0 else 2 ** (10 * u - 10)
def in_out_expo(u):
    if u <= 0: return 0.0
    if u >= 1: return 1.0
    return 2 ** (20 * u - 10) / 2 if u < .5 else (2 - 2 ** (-20 * u + 10)) / 2
def out_back(u, s=1.70158): u -= 1; return 1 + (s + 1) * u ** 3 + s * u ** 2
def out_elastic(u):
    if u in (0, 1): return u
    return 2 ** (-10 * u) * math.sin((u * 10 - .75) * (2 * math.pi / 3)) + 1

def ease(t, a, b, fn=out_cubic):
    """Eased progress of t through [a,b]."""
    return fn(prog(t, a, b))

def inout(t, a_in, b_in, a_out, b_out, fn_in=out_cubic, fn_out=in_cubic):
    """1 while held, eased in then out. Handy for alpha of an element with a life span."""
    return fn_in(prog(t, a_in, b_in)) * (1 - fn_out(prog(t, a_out, b_out)))

def shake(t, t0, dur=0.35, amp=24, seed=1):
    """Screen-shake offset (dx,dy) decaying after an impact at t0."""
    u = prog(t, t0, t0 + dur)
    if u <= 0 or u >= 1: return 0.0, 0.0
    k = (1 - u) ** 2 * amp
    return (k * math.sin(t * 91 + seed), k * math.cos(t * 73 + seed * 2))

def pulse(t, period=1.2, lo=0.0, hi=1.0):
    return lo + (hi - lo) * (0.5 - 0.5 * math.cos(2 * math.pi * t / period))

# --------------------------------------------------------------------------- color
@functools.lru_cache(None)
def rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def mixc(a: str, b: str, u: float):
    ra, rb = rgb(a), rgb(b)
    return tuple(lerp(x, y, u) for x, y in zip(ra, rb))

def src(ctx, color, alpha=1.0):
    c = rgb(color) if isinstance(color, str) else color
    ctx.set_source_rgba(c[0], c[1], c[2], alpha)

# --------------------------------------------------------------------------- frame
@dataclass
class Frame:
    ctx: cairo.Context
    W: int
    H: int
    t: float
    dur: float
    i: int
    fmt: str
    @property
    def vertical(self): return self.H > self.W
    @property
    def cx(self): return self.W / 2
    @property
    def cy(self): return self.H / 2
    @property
    def u(self):  # 0..1 through the scene
        return clamp(self.t / self.dur)

# --------------------------------------------------------------------------- backgrounds & finish
def bg(f: Frame, lift=None, c0=B.NAVY_0, c1=B.NAVY_1, radius=None):
    ctx = f.ctx
    src(ctx, c0); ctx.paint()
    lx, ly = lift if lift else (f.W * .5, f.H * .42)
    r = radius or max(f.W, f.H) * .75
    g = cairo.RadialGradient(lx, ly, 0, lx, ly, r)
    g.add_color_stop_rgba(0, *rgb(c1), 1)
    g.add_color_stop_rgba(1, *rgb(c1), 0)
    ctx.set_source(g); ctx.paint()

def vignette(f: Frame, strength=0.55):
    ctx = f.ctx
    r = math.hypot(f.W, f.H) / 2
    g = cairo.RadialGradient(f.cx, f.cy, r * .45, f.cx, f.cy, r)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, strength)
    ctx.set_source(g); ctx.paint()

@functools.lru_cache(8)
def _grain_tiles(w, h, n=6, amt=18):
    rng = np.random.default_rng(7)
    tiles = []
    for _ in range(n):
        noise = rng.normal(0, amt, (h, w)).clip(-60, 60)
        a = np.zeros((h, w, 4), np.uint8)
        light = noise > 0
        a[..., 3] = np.abs(noise).astype(np.uint8)
        v = np.where(light, 255, 0).astype(np.uint8)
        # premultiplied BGRA
        for c in range(3): a[..., c] = (v.astype(np.uint16) * a[..., 3] // 255).astype(np.uint8)
        s = cairo.ImageSurface.create_for_data(memoryview(a.copy()), cairo.FORMAT_ARGB32, w, h)
        tiles.append(s)
    return tiles

def grain(f: Frame, alpha=0.35):
    """Animated film grain (cheap: 6 pre-baked half-res tiles, scaled)."""
    tiles = _grain_tiles(f.W // 2, f.H // 2)
    ctx = f.ctx
    ctx.save(); ctx.scale(2, 2)
    ctx.set_source_surface(tiles[f.i % len(tiles)], 0, 0)
    ctx.get_source().set_filter(cairo.FILTER_FAST)
    ctx.paint_with_alpha(alpha); ctx.restore()

# --------------------------------------------------------------------------- shapes
def rrect(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    ctx.close_path()

def fill_rrect(ctx, x, y, w, h, r, color, alpha=1.0):
    rrect(ctx, x, y, w, h, r); src(ctx, color, alpha); ctx.fill()

def circle(ctx, x, y, r, color, alpha=1.0):
    ctx.arc(x, y, max(r, 0), 0, 2 * math.pi); src(ctx, color, alpha); ctx.fill()

def poly(ctx, pts, color=None, alpha=1.0, stroke=None, width=4, close=True):
    ctx.move_to(*pts[0])
    for p in pts[1:]: ctx.line_to(*p)
    if close: ctx.close_path()
    if color:
        src(ctx, color, alpha)
        ctx.fill_preserve() if stroke else ctx.fill()
    if stroke:
        src(ctx, stroke, alpha); ctx.set_line_width(width); ctx.stroke()

def line(ctx, x0, y0, x1, y1, color, width=4, alpha=1.0, cap=cairo.LINE_CAP_ROUND):
    ctx.move_to(x0, y0); ctx.line_to(x1, y1)
    src(ctx, color, alpha); ctx.set_line_width(width); ctx.set_line_cap(cap); ctx.stroke()

def partial_polyline(ctx, pts, u, color, width=8, alpha=1.0):
    """Draw a polyline 'drawing on' from 0..u of its length."""
    segs = [math.dist(a, b) for a, b in zip(pts, pts[1:])]
    total = sum(segs); target = total * clamp(u)
    if target <= 0: return
    ctx.move_to(*pts[0]); acc = 0
    for (a, b), L in zip(zip(pts, pts[1:]), segs):
        if acc + L >= target:
            k = (target - acc) / L
            ctx.line_to(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); break
        ctx.line_to(*b); acc += L
    src(ctx, color, alpha); ctx.set_line_width(width)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.stroke()

def glow(ctx, x, y, r, color, alpha=0.6):
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    c = rgb(color)
    g.add_color_stop_rgba(0, *c, alpha); g.add_color_stop_rgba(1, *c, 0)
    ctx.set_source(g); ctx.arc(x, y, r, 0, 2 * math.pi); ctx.fill()

def shadow_rrect(ctx, x, y, w, h, r, blur=40, alpha=0.5, dy=18):
    """Soft drop shadow faked with stacked translucent rects."""
    steps = 8
    for k in range(steps):
        e = blur * (1 - k / steps)
        rrect(ctx, x - e / 2, y - e / 2 + dy, w + e, h + e, r + e / 2)
        ctx.set_source_rgba(0, 0, 0, alpha / steps); ctx.fill()

# --------------------------------------------------------------------------- text (Pillow -> cairo)
WEIGHTS = {"Black": "Inter-Black.otf", "ExtraBold": "Inter-ExtraBold.otf", "Bold": "Inter-Bold.otf",
           "SemiBold": "Inter-SemiBold.otf", "Medium": "Inter-Medium.otf", "Regular": "Inter-Regular.otf"}

@functools.lru_cache(64)
def font(weight: str, size: int):
    return ImageFont.truetype(str(B.FONTS / WEIGHTS[weight]), size)

def _pil_to_surface(im: Image.Image) -> cairo.ImageSurface:
    a = np.asarray(im.convert("RGBA")).astype(np.uint16)
    al = a[..., 3:4]
    pre = (a[..., :3] * al // 255).astype(np.uint8)
    out = np.empty(a.shape, np.uint8)
    out[..., 0] = pre[..., 2]; out[..., 1] = pre[..., 1]; out[..., 2] = pre[..., 0]; out[..., 3] = a[..., 3]
    h, w = out.shape[:2]
    stride = cairo.ImageSurface.format_stride_for_width(cairo.FORMAT_ARGB32, w)
    if stride != w * 4:
        pad = np.zeros((h, stride // 4, 4), np.uint8); pad[:, :w] = out; out = pad
    return cairo.ImageSurface.create_for_data(memoryview(np.ascontiguousarray(out)), cairo.FORMAT_ARGB32, w, h, stride)

@functools.lru_cache(2048)
def _text_surface(s: str, size: int, weight: str, color: str, tracking: float):
    fnt = font(weight, size)
    if tracking:
        widths = [fnt.getlength(ch) + tracking * size for ch in s]
        w = int(sum(widths) - tracking * size) + 4
    else:
        w = int(fnt.getlength(s)) + 4
    asc, desc = fnt.getmetrics()
    h = asc + desc + 4
    im = Image.new("RGBA", (max(w, 1), h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    fill = tuple(int(c * 255) for c in rgb(color)) + (255,)
    if tracking:
        x = 2
        for ch, cw in zip(s, widths):
            d.text((x, 2), ch, font=fnt, fill=fill); x += cw
    else:
        d.text((2, 2), s, font=fnt, fill=fill)
    return _pil_to_surface(im), w, h, asc

def text_size(s, size, weight="Black", tracking=0.0):
    _, w, h, _ = _text_surface(s, int(size), weight, "#FFFFFF", tracking)
    return w, h

def text(ctx, s, x, y, size, weight="Black", color=B.WHITE, alpha=1.0, anchor="mm",
         scale=1.0, rot=0.0, tracking=0.0, max_w=None):
    """Draw text. anchor: 2 chars, horizontal l/m/r + vertical t/m/b (m = cap-height middle).
    Returns (w, h) in px. max_w shrinks the font to fit."""
    if not s or alpha <= 0: return (0, 0)
    size = int(size)
    if max_w:
        w0, _ = text_size(s, size, weight, tracking)
        if w0 > max_w: size = max(8, int(size * max_w / w0))
    surf, w, h, asc = _text_surface(s, size, weight, color, tracking)
    ax = {"l": 0, "m": w / 2, "r": w}[anchor[0]]
    cap = size * 0.727  # Inter cap height
    ay = {"t": asc - cap + 2, "m": asc - cap / 2 + 2, "b": asc + 2, "s": asc + 2}[anchor[1]]
    ctx.save(); ctx.translate(x, y)
    if rot: ctx.rotate(rot)
    if scale != 1: ctx.scale(scale, scale)
    ctx.set_source_surface(surf, -ax, -ay)
    ctx.paint_with_alpha(clamp(alpha)); ctx.restore()
    return (w * scale, h * scale)

def wrap(s, size, weight, max_w):
    words, lines, cur = s.split(), [], ""
    for wd in words:
        trial = (cur + " " + wd).strip()
        if text_size(trial, size, weight)[0] <= max_w or not cur: cur = trial
        else: lines.append(cur); cur = wd
    if cur: lines.append(cur)
    return lines

def kinetic_words(ctx, words, x, y, size, t, start, stagger=0.08, dur=0.45, weight="Black",
                  color=B.WHITE, anchor="mm", rise=60, colors=None, gap=0.28):
    """Words pop in one by one (rise + scale overshoot) on a single line. Returns line width."""
    widths = [text_size(w, size, weight)[0] for w in words]
    sp = size * gap
    total = sum(widths) + sp * (len(words) - 1)
    x0 = {"l": x, "m": x - total / 2, "r": x - total}[anchor[0]]
    for k, (wd, ww) in enumerate(zip(words, widths)):
        u = prog(t, start + k * stagger, start + k * stagger + dur)
        if u <= 0: x0 += ww + sp; continue
        e = out_back(u); a = out_cubic(min(1, u * 1.6))
        c = (colors[k] if colors else None) or color
        text(ctx, wd, x0 + ww / 2, y + (1 - e) * rise, size, weight, c, a, "m" + anchor[1], scale=lerp(.7, 1, e))
        x0 += ww + sp
    return total

def counter(ctx, value_from, value_to, t, a, b, x, y, size, fmt="{:.0f}", fn=out_expo, **kw):
    v = lerp(value_from, value_to, fn(prog(t, a, b)))
    return text(ctx, fmt.format(v), x, y, size, **kw)

# --------------------------------------------------------------------------- images
@functools.lru_cache(64)
def _img(path: str, w: int, h: int, mode: str):
    im = Image.open(path).convert("RGBA")
    if mode == "cover":
        sw, sh = im.size; k = max(w / sw, h / sh)
        im = im.resize((max(1, round(sw * k)), max(1, round(sh * k))), Image.LANCZOS)
        L = (im.width - w) // 2; T = (im.height - h) // 2
        im = im.crop((L, T, L + w, T + h))
    else:
        im = im.resize((w, h), Image.LANCZOS)
    return _pil_to_surface(im)

def image(ctx, path, x, y, w, h, alpha=1.0, zoom=1.0, pan=(0, 0), radius=0, mode="cover"):
    """Cover-fit an image into the box; zoom/pan for Ken Burns. Pre-scaled by 1.15 so zoom is crisp."""
    pre = 1.15
    surf = _img(str(path), int(w * pre), int(h * pre), mode)
    ctx.save()
    if radius: rrect(ctx, x, y, w, h, radius); ctx.clip()
    else: ctx.rectangle(x, y, w, h); ctx.clip()
    ctx.translate(x + w / 2 + pan[0], y + h / 2 + pan[1])
    k = zoom / pre * pre  # surface already pre-scaled
    ctx.scale(zoom / pre, zoom / pre)
    ctx.set_source_surface(surf, -w * pre / 2, -h * pre / 2)
    ctx.get_source().set_filter(cairo.FILTER_GOOD)
    ctx.paint_with_alpha(alpha); ctx.restore()

def logo(ctx, cx, cy, width, alpha=1.0, white=True):
    p = B.LOGO_WHITE if white else B.LOGO_COLOR
    h = width * 329 / 900
    surf = _img(str(p), int(width), int(h), "fit")
    ctx.set_source_surface(surf, cx - width / 2, cy - h / 2); ctx.paint_with_alpha(alpha)
    return h

# --------------------------------------------------------------------------- reusable components
def pill(ctx, label, cx, cy, size=34, fg=B.WHITE, bgc=B.BLUE, alpha=1.0, weight="ExtraBold", pad=0.9):
    w, _ = text_size(label, size, weight)
    pw, ph = w + size * pad * 2, size * 2.0
    fill_rrect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, ph / 2, bgc, alpha)
    text(ctx, label, cx, cy, size, weight, fg, alpha)
    return pw, ph

def cta_button(f: Frame, label, cx, cy, t_in, size=46, glow_on=True):
    """Pops in with overshoot at t_in, then breathes."""
    ctx, t = f.ctx, f.t
    u = prog(t, t_in, t_in + .5)
    if u <= 0: return
    s = out_back(u, 2.2) * (1 + .03 * pulse(t - t_in, 1.1) * (u >= 1))
    w, _ = text_size(label, size, "ExtraBold")
    bw, bh = (w + size * 2.2) * s, size * 2.4 * s
    if glow_on: glow(ctx, cx, cy, bw * .75, B.BLUE, .35 * u)
    fill_rrect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, bh / 2, B.BLUE, min(1, u * 2))
    text(ctx, label, cx, cy, size, "ExtraBold", B.WHITE, min(1, u * 2), scale=s)

def checkmark(ctx, cx, cy, r, u, color=B.GREEN, width=None):
    """Circle fills, then the tick draws on (u 0..1)."""
    if u <= 0: return
    circle(ctx, cx, cy, r * out_back(min(1, u * 2)), color)
    v = clamp(u * 2 - 1)
    pts = [(cx - r * .45, cy + r * .02), (cx - r * .1, cy + r * .35), (cx + r * .48, cy - r * .3)]
    partial_polyline(ctx, pts, out_cubic(v), B.WHITE, width or r * .22)

def stars(ctx, cx, cy, size, n=5, fill_u=1.0, color=B.AMBER, gap=1.15):
    def star(x, y, R):
        pts = []
        for k in range(10):
            ang = -math.pi / 2 + k * math.pi / 5
            rr = R if k % 2 == 0 else R * .45
            pts.append((x + rr * math.cos(ang), y + rr * math.sin(ang)))
        return pts
    x0 = cx - (n - 1) * size * gap / 2
    for k in range(n):
        u = clamp(fill_u * n - k)
        if u <= 0: continue
        s = out_back(u)
        poly(ctx, star(x0 + k * size * gap, cy, size / 2 * s), color)

def shingle_row(ctx, x, y, w, tab_w, tab_h, color, offset=0.0, alpha=1.0, gap=4, shade=0.25):
    """A row of 3-tab-style shingle tabs."""
    n = int(w / tab_w) + 2
    for k in range(-1, n):
        tx = x + k * tab_w + offset
        if tx > x + w or tx + tab_w < x: continue
        fill_rrect(ctx, tx + gap / 2, y, tab_w - gap, tab_h, 3, color, alpha)
        ctx.rectangle(tx + gap / 2, y + tab_h * .78, tab_w - gap, tab_h * .22)
        ctx.set_source_rgba(0, 0, 0, shade * alpha); ctx.fill()

def wipe_shingles(f: Frame, u, color=B.BLUE, rows=12, direction=1, alt=B.NAVY_2):
    """Signature RoofCraft transition: staggered shingle rows sweep across, fully covering the frame at u=0.5,
    then sweep off. Scene A tail: u 0->0.5 over its last ~0.45s. Scene B head: u 0.5->1 over its first ~0.45s."""
    if u <= 0 or u >= 1: return
    ctx, W = f.ctx, f.W
    rh = f.H / rows
    tab = rh * .9
    for r in range(rows):
        d = (r if direction > 0 else rows - 1 - r) / rows * .22
        p_in = in_out_cubic(prog(u, d, d + .28))          # done by 0.5
        p_out = in_out_cubic(prog(u, .5 + d, .5 + d + .28))  # done by 1.0
        x0, x1 = (W + tab) * p_out - tab, (W + tab) * p_in
        if x1 <= x0: continue
        y = r * rh
        rad = min(rh * .5, 40)
        rrect(ctx, x0 - rad, y - 1, x1 - x0 + rad, rh + 2, rad)  # rounded leading edge, like a shingle tab
        src(ctx, color if r % 2 == 0 else alt); ctx.fill()

def end_card(f: Frame, t0, headline="Free Roof Inspection", cta="Book Your Free Inspection", sub=None):
    """Standard RoofCraft end card. Starts at local time t0 (needs ~2.4s)."""
    ctx, t, W, H = f.ctx, f.t, f.W, f.H
    v = f.vertical
    a = ease(t, t0, t0 + .5)
    logo_w = W * (.72 if v else .34)
    ly = H * (.30 if v else .26)
    s = lerp(.85, 1, ease(t, t0, t0 + .7, out_back))
    ctx.save(); ctx.translate(f.cx, ly); ctx.scale(s, s)
    logo(ctx, 0, 0, logo_w, a); ctx.restore()
    # sheen sweep over the logo
    sh = prog(t, t0 + .5, t0 + 1.2)
    if 0 < sh < 1:
        ctx.save(); rrect(ctx, f.cx - logo_w / 2, ly - logo_w * .2, logo_w, logo_w * .4, 0); ctx.clip()
        x = lerp(f.cx - logo_w, f.cx + logo_w, in_out_cubic(sh))
        g = cairo.LinearGradient(x - 120, 0, x + 120, 0)
        g.add_color_stop_rgba(0, 1, 1, 1, 0); g.add_color_stop_rgba(.5, 1, 1, 1, .35); g.add_color_stop_rgba(1, 1, 1, 1, 0)
        ctx.set_source(g); ctx.paint(); ctx.restore()
    text(ctx, B.TAGLINE_SHORT, f.cx, ly + logo_w * .27, W * (.052 if v else .026), "SemiBold", B.GREY,
         ease(t, t0 + .4, t0 + .9))
    hy = H * (.52 if v else .55)
    kinetic_words(ctx, headline.split(), f.cx, hy, W * (.085 if v else .045), t, t0 + .6, stagger=.07)
    if sub:
        text(ctx, sub, f.cx, hy + W * (.09 if v else .05), W * (.042 if v else .022), "Medium", B.GREY,
             ease(t, t0 + .9, t0 + 1.3))
    cta_button(f, cta, f.cx, H * (.68 if v else .74), t0 + 1.1, size=W * (.042 if v else .022))
    fa = ease(t, t0 + 1.4, t0 + 1.9)
    text(ctx, f"{B.PHONE}  ·  {B.SITE}", f.cx, H * (.76 if v else .86), W * (.04 if v else .02), "SemiBold", B.WHITE, fa)

def caption(f: Frame, s, t_in, t_out, y=None, size=None):
    """Burned-in subtitle chip for sound-off viewing."""
    a = inout(f.t, t_in, t_in + .15, t_out - .15, t_out)
    if a <= 0: return
    ctx = f.ctx
    size = size or f.W * (.046 if f.vertical else .026)
    y = y or f.H * (.79 if f.vertical else .88)
    lines = wrap(s, size, "Bold", f.W * .78)
    lh = size * 1.3
    for k, ln in enumerate(lines):
        w, _ = text_size(ln, size, "Bold")
        yy = y + (k - (len(lines) - 1) / 2) * lh
        fill_rrect(ctx, f.cx - w / 2 - size * .45, yy - lh / 2, w + size * .9, lh, size * .3, "#000000", .62 * a)
        text(ctx, ln, f.cx, yy, size, "Bold", B.WHITE, a)

# --------------------------------------------------------------------------- render
def rng(seed): return random.Random(seed)

def render_scene(draw, dur, out: Path, fmt="9x16", fps=B.FPS, crf=18, frame0=0, post=None):
    """Render one scene to its own mp4 (written to a .tmp.mp4 then renamed on success)."""
    W, H = B.FORMATS[fmt]
    n = round(dur * fps)
    out = Path(out); out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_name(out.stem + ".tmp.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-r", str(fps), "-movflags", "+faststart", str(tmp)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    for k in range(n):
        ctx = cairo.Context(surf)
        ctx.set_operator(cairo.OPERATOR_SOURCE); ctx.set_source_rgba(0, 0, 0, 1); ctx.paint()
        ctx.set_operator(cairo.OPERATOR_OVER)
        f = Frame(ctx, W, H, k / fps, dur, frame0 + k, fmt)
        draw(f)
        if post: post(f)
        surf.flush()
        p.stdin.write(bytes(surf.get_data()))
    p.stdin.close()
    if p.wait() != 0: raise RuntimeError(f"ffmpeg failed for {out}")
    os.replace(tmp, out)
    return out

def still(draw, t, dur, path, fmt="9x16", post=None):
    """Render a single frame to PNG (for checking layouts before a full render)."""
    W, H = B.FORMATS[fmt]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf); ctx.set_source_rgb(0, 0, 0); ctx.paint()
    f = Frame(ctx, W, H, t, dur, int(t * B.FPS), fmt)
    draw(f)
    if post: post(f)
    surf.write_to_png(str(path)); return path
