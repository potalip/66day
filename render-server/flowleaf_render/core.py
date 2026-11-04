"""Motion toolkit: cairo drawing + Pillow text + ffmpeg piping.

Generalised from the reference engine (render-server/reference/rcm/core.py). No brand is baked in: every colour
comes from a Palette, and every size is expressed in *design units* (`f.s` = px per unit, 1 unit = 1px at 1080 on
the short side), so the same scene code renders 9:16, 1:1, 16:9 and half-resolution drafts.

Every scene is a function `draw(f)` called once per frame, where `f` is a Frame:
    f.ctx  cairo context (already painted black)   f.W, f.H  canvas px     f.s  px per design unit
    f.t    seconds since scene start                f.dur     scene dur     f.i  global frame index
    f.fmt  "9x16" | "1x1" | "16x9"                  f.P       Palette       f.lang  "en" | "ru"
Never use linear motion: wrap progress in an ease.
"""
from __future__ import annotations

import functools
import math
import os
import random
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

import cairo
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"

FORMATS = {"9x16": (1080, 1920), "1x1": (1080, 1080), "16x9": (1920, 1080)}
FPS = 30

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

def ease(t, a, b, fn=out_cubic): return fn(prog(t, a, b))

def inout(t, a_in, b_in, a_out, b_out, fn_in=out_cubic, fn_out=in_cubic):
    """1 while held, eased in then out."""
    return fn_in(prog(t, a_in, b_in)) * (1 - fn_out(prog(t, a_out, b_out)))

def pulse(t, period=1.2, lo=0.0, hi=1.0):
    return lo + (hi - lo) * (0.5 - 0.5 * math.cos(2 * math.pi * t / period))

# --------------------------------------------------------------------------- colour
@functools.lru_cache(None)
def rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def mixc(a: str, b: str, u: float) -> str:
    ra, rb = rgb(a), rgb(b)
    return "#" + "".join(f"{round(lerp(x, y, u) * 255):02x}" for x, y in zip(ra, rb))

def luminance(h: str) -> float:
    def ch(c): return c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb(h))
    return .2126 * r + .7152 * g + .0722 * b

def contrast(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + .05) / (lb + .05)

def src(ctx, color, alpha=1.0):
    c = rgb(color) if isinstance(color, str) else color
    ctx.set_source_rgba(c[0], c[1], c[2], alpha)

@dataclass(frozen=True)
class Palette:
    """A visual style. Every template draws only with these roles."""
    id: str
    bg: str          # base background
    bg2: str         # radial lift / second background tone
    surface: str     # cards, panels
    fg: str          # main text
    muted: str       # secondary text
    accent: str      # primary highlight
    accent2: str     # secondary highlight (rewards, numbers)
    on_accent: str   # text drawn on top of accent fills
    line: str        # hairlines, borders
    dark: bool = False
    grain: float = 0.0       # film-grain alpha (0 = none)
    vignette: float = 0.0
    code_bg: str = ""        # code panels (falls back to surface)
    syntax: tuple = ()       # (keyword, string, number, comment, function) colours for code

    def to_json(self):
        return {k: v for k, v in self.__dict__.items()}

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
    P: Palette
    lang: str = "en"
    data: dict = field(default_factory=dict)

    @property
    def s(self): return min(self.W, self.H) / 1080          # px per design unit
    @property
    def vertical(self): return self.H > self.W * 1.2
    @property
    def wide(self): return self.W > self.H * 1.2
    @property
    def square(self): return not self.vertical and not self.wide
    @property
    def cx(self): return self.W / 2
    @property
    def cy(self): return self.H / 2
    @property
    def u(self): return clamp(self.t / self.dur) if self.dur else 1.0
    @property
    def uw(self): return self.W / self.s    # canvas width in design units
    @property
    def uh(self): return self.H / self.s
    def pick(self, vertical, square, wide):
        return vertical if self.vertical else wide if self.wide else square
    def measure(self, w):
        """Comfortable line length: on 16:9 don't let text run the full width."""
        return min(w, 1280 * self.s) if self.wide else w
    def safe(self):
        """Safe box (x0, y0, x1, y1) in px: keeps text clear of Reels/TikTok/Shorts UI on 9:16."""
        s = self.s
        if self.vertical: return (90 * s, 230 * s, self.W - 90 * s, self.H - 330 * s)
        if self.wide: return (130 * s, 90 * s, self.W - 130 * s, self.H - 140 * s)
        return (90 * s, 90 * s, self.W - 90 * s, self.H - 150 * s)

# --------------------------------------------------------------------------- backgrounds & finish
def bg(f: Frame, lift=None, c0=None, c1=None, radius=None, strength=1.0):
    ctx = f.ctx
    c0 = c0 or f.P.bg; c1 = c1 or f.P.bg2
    src(ctx, c0); ctx.paint()
    lx, ly = lift if lift else (f.W * .5, f.H * .38)
    r = radius or max(f.W, f.H) * .8
    g = cairo.RadialGradient(lx, ly, 0, lx, ly, r)
    g.add_color_stop_rgba(0, *rgb(c1), strength)
    g.add_color_stop_rgba(1, *rgb(c1), 0)
    ctx.set_source(g); ctx.paint()

def dot_grid(f: Frame, gap=54, r=2.2, color=None, alpha=.35, drift=0.0):
    ctx, s = f.ctx, f.s
    g = gap * s; off = (f.t * drift * s) % g
    src(ctx, color or f.P.line, alpha)
    y = -g + off
    while y < f.H + g:
        x = -g + off * .5
        while x < f.W + g:
            ctx.arc(x, y, r * s, 0, 2 * math.pi); ctx.new_sub_path(); x += g
        y += g
    ctx.fill()

def vignette(f: Frame, strength=0.4):
    if strength <= 0: return
    ctx = f.ctx
    r = math.hypot(f.W, f.H) / 2
    g = cairo.RadialGradient(f.cx, f.cy, r * .5, f.cx, f.cy, r)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, strength)
    ctx.set_source(g); ctx.paint()

@functools.lru_cache(4)
def _grain_tiles(w, h, n=6, amt=18):
    rng = np.random.default_rng(7)
    tiles = []
    for _ in range(n):
        noise = rng.normal(0, amt, (h, w)).clip(-60, 60)
        stride = cairo.ImageSurface.format_stride_for_width(cairo.FORMAT_ARGB32, w)
        a = np.zeros((h, stride // 4, 4), np.uint8)
        alpha = np.abs(noise).astype(np.uint8)
        v = np.where(noise > 0, 255, 0).astype(np.uint16)
        pre = (v * alpha // 255).astype(np.uint8)
        for c in range(3): a[:, :w, c] = pre
        a[:, :w, 3] = alpha
        tiles.append(cairo.ImageSurface.create_for_data(memoryview(a), cairo.FORMAT_ARGB32, w, h, stride))
    return tiles

def grain(f: Frame, alpha=0.3):
    if alpha <= 0: return
    tiles = _grain_tiles(max(1, f.W // 2), max(1, f.H // 2))
    ctx = f.ctx
    ctx.save(); ctx.scale(2, 2)
    ctx.set_source_surface(tiles[f.i % len(tiles)], 0, 0)
    ctx.get_source().set_filter(cairo.FILTER_FAST)
    ctx.paint_with_alpha(alpha); ctx.restore()

# --------------------------------------------------------------------------- shapes
def rrect(ctx, x, y, w, h, r):
    r = max(0, min(r, w / 2, h / 2))
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    ctx.close_path()

def fill_rrect(ctx, x, y, w, h, r, color, alpha=1.0):
    if alpha <= 0 or w <= 0 or h <= 0: return
    rrect(ctx, x, y, w, h, r); src(ctx, color, alpha); ctx.fill()

def stroke_rrect(ctx, x, y, w, h, r, color, width=2, alpha=1.0):
    if alpha <= 0: return
    rrect(ctx, x, y, w, h, r); src(ctx, color, alpha); ctx.set_line_width(width); ctx.stroke()

def circle(ctx, x, y, r, color, alpha=1.0):
    if alpha <= 0 or r <= 0: return
    ctx.new_sub_path(); ctx.arc(x, y, r, 0, 2 * math.pi); src(ctx, color, alpha); ctx.fill()

def ring(ctx, x, y, r, color, width, u=1.0, alpha=1.0, start=-math.pi / 2):
    if u <= 0 or alpha <= 0: return
    ctx.new_sub_path(); ctx.arc(x, y, r, start, start + 2 * math.pi * clamp(u))
    src(ctx, color, alpha); ctx.set_line_width(width); ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.stroke()

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
    if alpha <= 0: return
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
            k = (target - acc) / L if L else 1
            ctx.line_to(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); break
        ctx.line_to(*b); acc += L
    src(ctx, color, alpha); ctx.set_line_width(width)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.stroke()

def glow(ctx, x, y, r, color, alpha=0.6):
    if alpha <= 0 or r <= 0: return
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    c = rgb(color)
    g.add_color_stop_rgba(0, *c, alpha); g.add_color_stop_rgba(1, *c, 0)
    ctx.set_source(g); ctx.new_sub_path(); ctx.arc(x, y, r, 0, 2 * math.pi); ctx.fill()

def shadow(ctx, x, y, w, h, r, blur=40, alpha=0.25, dy=16):
    """Soft drop shadow faked with stacked translucent rounded rects."""
    if alpha <= 0: return
    steps = 7
    for k in range(steps):
        e = blur * (1 - k / steps)
        rrect(ctx, x - e / 2, y - e / 2 + dy, w + e, h + e, r + e / 2)
        ctx.set_source_rgba(0, 0, 0, alpha / steps); ctx.fill()

def card(f: Frame, x, y, w, h, r=None, alpha=1.0, color=None, border=True, lift=True):
    """The house card: surface fill, 1px line border, soft shadow on light palettes."""
    s = f.s; r = r if r is not None else 36 * s
    if lift: shadow(f.ctx, x, y, w, h, r, 40 * s, (.16 if not f.P.dark else .35) * alpha, 14 * s)
    fill_rrect(f.ctx, x, y, w, h, r, color or f.P.surface, alpha)
    if border: stroke_rrect(f.ctx, x + .5, y + .5, w - 1, h - 1, r, f.P.line, max(1, 2 * s), alpha)

def leaf(ctx, cx, cy, size, color, alpha=1.0, rot=-0.6, vein=None):
    """A simple leaf mark (two arcs), used as the FlowLeaf motif. size = length in px."""
    if alpha <= 0 or size <= 0: return
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot)
    L, Wd = size / 2, size * .3
    ctx.move_to(-L, 0)
    ctx.curve_to(-L * .4, -Wd * 1.25, L * .5, -Wd * 1.1, L, 0)
    ctx.curve_to(L * .5, Wd * 1.1, -L * .4, Wd * 1.25, -L, 0)
    ctx.close_path(); src(ctx, color, alpha); ctx.fill()
    if vein:
        ctx.move_to(-L * .85, 0); ctx.line_to(L * .7, 0)
        src(ctx, vein, alpha * .8); ctx.set_line_width(max(1, size * .035)); ctx.stroke()
    ctx.restore()

def quote_mark(ctx, cx, cy, size, color, alpha=1.0):
    """A drawn opening quote mark (two round heads with tails), language-neutral."""
    if alpha <= 0: return
    r = size * .2
    for dx in (-size * .27, size * .27):
        x, y = cx + dx, cy + r * .6
        ctx.new_sub_path(); ctx.arc(x, y, r, 0, 2 * math.pi)
        ctx.move_to(x - r, y)
        ctx.curve_to(x - r, y - r * 1.9, x + r * .2, y - r * 2.7, x + r * 1.15, y - r * 2.9)
        ctx.line_to(x + r * 1.2, y - r * 2.35)
        ctx.curve_to(x + r * .3, y - r * 2.0, x - r * .1, y - r * 1.2, x + r * .2, y - r * .9)
        ctx.close_path()
    src(ctx, color, alpha); ctx.fill()

def checkmark(ctx, cx, cy, r, u, color, tick):
    """Circle pops in, then the tick draws on (u 0..1)."""
    if u <= 0: return
    circle(ctx, cx, cy, r * out_back(min(1, u * 2)), color)
    v = clamp(u * 2 - 1)
    pts = [(cx - r * .42, cy + r * .02), (cx - r * .1, cy + r * .33), (cx + r * .45, cy - r * .28)]
    partial_polyline(ctx, pts, out_cubic(v), tick, r * .2)

def cross(ctx, cx, cy, r, u, color, tick):
    if u <= 0: return
    circle(ctx, cx, cy, r * out_back(min(1, u * 2)), color)
    v = clamp(u * 2 - 1); k = r * .32
    partial_polyline(ctx, [(cx - k, cy - k), (cx + k, cy + k)], out_cubic(min(1, v * 2)), tick, r * .18)
    partial_polyline(ctx, [(cx + k, cy - k), (cx - k, cy + k)], out_cubic(clamp(v * 2 - 1)), tick, r * .18)

# --------------------------------------------------------------------------- text (Pillow -> cairo)
FAMILIES = {
    "sans": {"Black": "Inter-Black.otf", "ExtraBold": "Inter-ExtraBold.otf", "Bold": "Inter-Bold.otf",
             "SemiBold": "Inter-SemiBold.otf", "Medium": "Inter-Medium.otf", "Regular": "Inter-Regular.otf"},
    "mono": {"Black": "JetBrainsMono-ExtraBold.ttf", "ExtraBold": "JetBrainsMono-ExtraBold.ttf",
             "Bold": "JetBrainsMono-Bold.ttf", "SemiBold": "JetBrainsMono-Bold.ttf",
             "Medium": "JetBrainsMono-Medium.ttf", "Regular": "JetBrainsMono-Regular.ttf"},
}
CAP = {"sans": .727, "mono": .73}

@functools.lru_cache(128)
def font(weight: str, size: int, family="sans"):
    return ImageFont.truetype(str(FONTS / FAMILIES[family][weight]), max(4, size))

def _pil_to_surface(im: Image.Image) -> cairo.ImageSurface:
    a = np.asarray(im.convert("RGBA")).astype(np.uint16)
    al = a[..., 3:4]
    pre = (a[..., :3] * al // 255).astype(np.uint8)
    h, w = a.shape[:2]
    stride = cairo.ImageSurface.format_stride_for_width(cairo.FORMAT_ARGB32, w)
    out = np.zeros((h, stride // 4, 4), np.uint8)
    out[:, :w, 0] = pre[..., 2]; out[:, :w, 1] = pre[..., 1]; out[:, :w, 2] = pre[..., 0]; out[:, :w, 3] = a[..., 3]
    return cairo.ImageSurface.create_for_data(memoryview(out), cairo.FORMAT_ARGB32, w, h, stride)

@functools.lru_cache(4096)
def _text_surface(s: str, size: int, weight: str, color: str, tracking: float, family: str):
    fnt = font(weight, size, family)
    if tracking:
        widths = [fnt.getlength(ch) + tracking * size for ch in s]
        w = int(sum(widths) - tracking * size) + 6
    else:
        w = int(fnt.getlength(s)) + 6
    asc, desc = fnt.getmetrics()
    h = asc + desc + 6
    im = Image.new("RGBA", (max(w, 1), h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    fill = tuple(int(c * 255) for c in rgb(color)) + (255,)
    if tracking:
        x = 3
        for ch, cw in zip(s, widths):
            d.text((x, 3), ch, font=fnt, fill=fill); x += cw
    else:
        d.text((3, 3), s, font=fnt, fill=fill)
    return _pil_to_surface(im), w, h, asc

@functools.lru_cache(8192)
def text_width(s, size, weight="Bold", tracking=0.0, family="sans"):
    fnt = font(weight, int(size), family)
    if tracking: return sum(fnt.getlength(ch) for ch in s) + tracking * size * (len(s) - 1)
    return fnt.getlength(s)

def text(ctx, s, x, y, size, weight="Bold", color="#FFFFFF", alpha=1.0, anchor="mm",
         scale=1.0, rot=0.0, tracking=0.0, max_w=None, family="sans"):
    """Draw one line of text. anchor: horizontal l/m/r + vertical t/m/b (m = cap-height middle).
    Returns (w, h) in px. max_w shrinks the font to fit."""
    if not s or alpha <= 0: return (0, 0)
    size = int(round(size))
    if max_w:
        w0 = text_width(s, size, weight, tracking, family)
        if w0 > max_w: size = max(6, int(size * max_w / w0))
    surf, w, h, asc = _text_surface(s, size, weight, color, round(tracking, 3), family)
    ax = {"l": 3, "m": w / 2, "r": w - 3}[anchor[0]]
    cap = size * CAP[family]
    ay = {"t": asc - cap + 3, "m": asc - cap / 2 + 3, "b": asc + 3, "s": asc + 3}[anchor[1]]
    ctx.save(); ctx.translate(x, y)
    if rot: ctx.rotate(rot)
    if scale != 1: ctx.scale(scale, scale)
    ctx.set_source_surface(surf, -ax, -ay)
    ctx.paint_with_alpha(clamp(alpha)); ctx.restore()
    return (w * scale, h * scale)

def wrap(s, size, weight, max_w, family="sans", tracking=0.0):
    """Greedy word wrap. Respects explicit newlines. Words longer than max_w are hard-split."""
    out = []
    for para in str(s).split("\n"):
        words, cur = para.split(), ""
        for wd in words:
            while text_width(wd, size, weight, tracking, family) > max_w and len(wd) > 1:
                k = len(wd)
                while k > 1 and text_width(wd[:k] + "-", size, weight, tracking, family) > max_w: k -= 1
                if cur: out.append(cur); cur = ""
                out.append(wd[:k] + "-"); wd = wd[k:]
            trial = (cur + " " + wd).strip()
            if not cur or text_width(trial, size, weight, tracking, family) <= max_w: cur = trial
            else: out.append(cur); cur = wd
        out.append(cur)
    while out and not out[-1]: out.pop()
    return out or [""]

def fit(s, max_w, max_h, size, weight="Bold", min_size=18, lh=1.15, family="sans", max_lines=None, tracking=0.0):
    """Largest font size <= size where `s` wraps into the box. Returns (size, lines)."""
    size = int(size)
    while True:
        lines = wrap(s, size, weight, max_w, family, tracking)
        h = size * (CAP[family] + (len(lines) - 1) * lh)
        if (h <= max_h and (not max_lines or len(lines) <= max_lines)) or size <= min_size:
            if max_lines and len(lines) > max_lines:
                lines = lines[:max_lines]
                last = lines[-1]
                while last and text_width(last + "…", size, weight, tracking, family) > max_w: last = last[:-1]
                lines[-1] = last.rstrip() + "…"
            return size, lines
        size = max(min_size, int(size * .93))

def paragraph(ctx, lines, x, y, size, weight="Bold", color="#FFFFFF", alpha=1.0, align="m", lh=1.15,
              valign="t", family="sans", reveal=None, t=0.0, stagger=.08, dur=.45, rise=30, colors=None,
              highlight=(), hcolor=None):
    """Draw pre-wrapped lines. y is the cap-top of the first line (valign t) or the block middle (valign m).
    reveal=start-time animates line by line (rise + fade). Returns block height in px."""
    n = len(lines)
    block = size * (CAP[family] + (n - 1) * lh)
    y0 = y if valign == "t" else y - block / 2 if valign == "m" else y - block
    for k, ln in enumerate(lines):
        a, dy = alpha, 0
        if reveal is not None:
            u = prog(t, reveal + k * stagger, reveal + k * stagger + dur)
            a *= out_cubic(u); dy = (1 - out_cubic(u)) * rise
        c = colors[k] if colors and k < len(colors) and colors[k] else color
        yy = y0 + k * size * lh + dy
        words = ln.split(" ")
        keys = ["".join(ch for ch in w.lower() if ch.isalnum()) for w in words]
        if highlight and any(kk in highlight for kk in keys):
            gap = text_width(" ", size, weight, 0, family)
            ws = [text_width(w, size, weight, 0, family) for w in words]
            total = sum(ws) + gap * (len(ws) - 1)
            xx = {"l": x, "m": x - total / 2, "r": x - total}[align]
            for w, ww, kk in zip(words, ws, keys):
                text(ctx, w, xx, yy, size, weight, hcolor if kk in highlight else c, a, "lt", family=family)
                xx += ww + gap
        else:
            text(ctx, ln, x, yy, size, weight, c, a, align + "t", family=family)
    return block

def kinetic_lines(f: Frame, lines, x, y, size, start, weight="Black", color=None, align="m", lh=1.08,
                  stagger=.07, dur=.5, rise=None, highlight=(), hcolor=None, valign="m", family="sans"):
    """Words pop in one by one (rise + scale overshoot) across pre-wrapped lines. `highlight` = set of
    lower-cased words drawn in hcolor. Returns block height."""
    ctx, t = f.ctx, f.t
    color = color or f.P.fg; hcolor = hcolor or f.P.accent
    rise = rise if rise is not None else size * .45
    n = len(lines)
    block = size * (CAP[family] + (n - 1) * lh)
    y0 = y if valign == "t" else y - block / 2
    k = 0
    gap = text_width(" ", size, weight, 0, family)
    for li, ln in enumerate(lines):
        words = ln.split(" ")
        widths = [text_width(w, size, weight, 0, family) for w in words]
        total = sum(widths) + gap * (len(words) - 1)
        x0 = {"l": x, "m": x - total / 2, "r": x - total}[align]
        cyl = y0 + li * size * lh + size * CAP[family] / 2
        for wd, ww in zip(words, widths):
            u = prog(t, start + k * stagger, start + k * stagger + dur)
            k += 1
            if u > 0:
                e = out_back(u); a = out_cubic(min(1, u * 1.6))
                key = "".join(ch for ch in wd.lower() if ch.isalnum())
                c = hcolor if key and key in highlight else color
                text(ctx, wd, x0 + ww / 2, cyl + (1 - e) * rise, size, weight, c, a, "mm",
                     scale=lerp(.75, 1, e), family=family)
            x0 += ww + gap
    return block

def counter_text(value, decimals=0, prefix="", suffix="", lang="en"):
    s = f"{value:,.{decimals}f}"
    if lang == "ru": s = s.replace(",", " ").replace(".", ",")
    return f"{prefix}{s}{suffix}"

# --------------------------------------------------------------------------- components
def pill(f: Frame, label, cx, cy, size, fg=None, bgc=None, alpha=1.0, weight="Bold", pad=.8, anchor="m", outline=False):
    ctx = f.ctx
    w = text_width(label, size, weight)
    pw, ph = w + size * pad * 2, size * 2.0
    x = {"l": cx, "m": cx - pw / 2, "r": cx - pw}[anchor]
    if outline:
        stroke_rrect(ctx, x, cy - ph / 2, pw, ph, ph / 2, bgc or f.P.accent, max(1, size * .08), alpha)
    else:
        fill_rrect(ctx, x, cy - ph / 2, pw, ph, ph / 2, bgc or f.P.accent, alpha)
    text(ctx, label, x + pw / 2, cy, size, weight, fg or (bgc and f.P.fg) or f.P.on_accent, alpha)
    return pw, ph

def button(f: Frame, label, cx, cy, t_in, size, max_w=None):
    """CTA button: pops in with overshoot at t_in, then breathes gently."""
    ctx, t = f.ctx, f.t
    u = prog(t, t_in, t_in + .5)
    if u <= 0: return
    s = out_back(u, 2.0) * (1 + .025 * pulse(t - t_in, 1.4) * (u >= 1))
    if max_w:
        w0 = text_width(label, size, "Bold")
        if w0 + size * 2.2 > max_w: size = size * (max_w - size * 2.2) / w0 if max_w > size * 3 else size * .6
    w = text_width(label, size, "Bold")
    bw, bh = (w + size * 2.2) * s, size * 2.5 * s
    a = min(1, u * 2)
    glow(ctx, cx, cy, bw * .7, f.P.accent, .18 * u)
    fill_rrect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, bh / 2, f.P.accent, a)
    text(ctx, label, cx, cy, size, "Bold", f.P.on_accent, a, scale=s)

def progress_bar(f: Frame, x, y, w, h, u, color=None, track=None, alpha=1.0):
    fill_rrect(f.ctx, x, y, w, h, h / 2, track or f.P.line, alpha)
    if u > 0: fill_rrect(f.ctx, x, y, max(h, w * clamp(u)), h, h / 2, color or f.P.accent, alpha)

def handle_tag(f: Frame, handle, alpha=1.0):
    """Small creator handle in a corner (inside the safe area)."""
    if not handle: return
    x0, y0, x1, y1 = f.safe()
    s = f.s
    leaf(f.ctx, x0 + 16 * s, y0 - 40 * s if f.vertical else y0 + 4 * s, 34 * s, f.P.accent, alpha)
    text(f.ctx, handle, x0 + 44 * s, y0 - 40 * s if f.vertical else y0 + 4 * s, 30 * s, "SemiBold", f.P.muted, alpha, "lm",
         max_w=(x1 - x0) * .6)

def caption(f: Frame, s, t_in, t_out):
    """Burned-in subtitle chip for sound-off viewing (local frame time vs t_in/t_out)."""
    a = inout(f.t, t_in, t_in + .15, t_out - .15, t_out)
    if a <= 0 or not s: return
    ctx, sc = f.ctx, f.s
    size = (40 if f.vertical else 34) * sc
    x0, y0, x1, y1 = f.safe()
    y = (y1 + 40 * sc) if f.vertical else f.H - 64 * sc
    lines = wrap(s, size, "SemiBold", (x1 - x0) * .92)[:3]
    lh = size * 1.32
    for k, ln in enumerate(lines):
        w = text_width(ln, size, "SemiBold")
        yy = y + (k - (len(lines) - 1)) * lh
        fill_rrect(ctx, f.cx - w / 2 - size * .5, yy - lh / 2, w + size, lh, size * .32, "#000000", .66 * a)
        text(ctx, ln, f.cx, yy, size, "SemiBold", "#FFFFFF", a)

# --------------------------------------------------------------------------- transitions
def wipe(f: Frame, u, color=None, alt=None, bars=7, direction=1):
    """House transition: staggered rounded bars sweep across, covering the frame at u=.5, then sweep off.
    Outgoing scene: u 0 -> .5 over its last ~0.4s. Incoming scene: u .5 -> 1 over its first ~0.4s."""
    if u <= 0 or u >= 1: return
    ctx, W, H = f.ctx, f.W, f.H
    color = color or f.P.accent; alt = alt or f.P.accent2
    vertical = f.vertical
    n = bars
    span = (H if vertical else W) / n
    long = W if vertical else H
    for r in range(n):
        d = (r if direction > 0 else n - 1 - r) / n * .2
        p_in = in_out_cubic(prog(u, d, d + .3))
        p_out = in_out_cubic(prog(u, .5 + d, .5 + d + .3))
        a0, a1 = (long + span) * p_out - span, (long + span) * p_in
        if a1 <= a0: continue
        rad = span * .5
        c = color if r % 2 == 0 else alt
        if vertical: rrect(ctx, a0 - rad, r * span - 1, a1 - a0 + rad, span + 2, rad)
        else: rrect(ctx, r * span - 1, a0 - rad, span + 2, a1 - a0 + rad, rad)
        src(ctx, c); ctx.fill()

def fade_black(f: Frame, u, color=None):
    if u <= 0: return
    src(f.ctx, color or f.P.bg, clamp(u)); f.ctx.paint()

# --------------------------------------------------------------------------- render
def rng(seed): return random.Random(seed)

def _blank(ctx):
    ctx.set_operator(cairo.OPERATOR_SOURCE); ctx.set_source_rgba(0, 0, 0, 1); ctx.paint()
    ctx.set_operator(cairo.OPERATOR_OVER)

def render_scene(draw, dur, out: Path, W, H, fmt, palette, lang="en", fps=FPS, crf=20, frame0=0, post=None,
                 preset="veryfast"):
    """Render one scene to its own mp4 (written to .tmp.mp4, renamed on success)."""
    n = max(1, round(dur * fps))
    out = Path(out); out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_name(out.stem + ".tmp.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-r", str(fps), "-movflags", "+faststart", str(tmp)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    try:
        for k in range(n):
            ctx = cairo.Context(surf); _blank(ctx)
            f = Frame(ctx, W, H, k / fps, dur, frame0 + k, fmt, palette, lang)
            draw(f)
            if post: post(f)
            surf.flush()
            p.stdin.write(bytes(surf.get_data()))
    finally:
        p.stdin.close()
    if p.wait() != 0: raise RuntimeError(f"ffmpeg failed for {out}")
    os.replace(tmp, out)
    return out

def still(draw, t, dur, path, W, H, fmt, palette, lang="en", post=None, frame_i=None):
    """Render one frame to PNG."""
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf); _blank(ctx)
    f = Frame(ctx, W, H, t, dur, frame_i if frame_i is not None else int(t * FPS), fmt, palette, lang)
    draw(f)
    if post: post(f)
    surf.write_to_png(str(path)); return path
