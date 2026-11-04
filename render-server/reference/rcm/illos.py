"""Reusable illustrated elements (flat, premium, on-brand). All deterministic in t."""
from __future__ import annotations
import math
import cairo
from . import brand as B
from .core import (Frame, src, rgb, rrect, fill_rrect, circle, poly, line, partial_polyline, glow, text,
                   prog, ease, lerp, clamp, out_cubic, out_back, in_out_cubic, in_cubic, rng)

WATER = "#5AB8FF"
STAIN = "#7A5A2E"

# --------------------------------------------------------------------------- weather
def rain(f: Frame, n=200, speed=2400, angle=0.18, length=46, alpha=0.45, seed=3, color="#C8D4FF", region=None):
    """Diagonal rain streaks. region=(x0,y0,x1,y1) to limit."""
    ctx = f.ctx; r = rng(seed)
    x0, y0, x1, y1 = region or (0, 0, f.W, f.H)
    h = y1 - y0 + 200
    ctx.set_line_width(2.4); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for k in range(n):
        bx = r.uniform(x0 - 200, x1); by = r.uniform(0, h); sp = speed * r.uniform(.8, 1.2)
        y = y0 - 100 + (by + f.t * sp) % h
        x = bx + (y - y0) * angle
        L = length * r.uniform(.6, 1.2)
        ctx.move_to(x, y); ctx.line_to(x - L * angle, y - L)
        src(ctx, color, alpha * r.uniform(.4, 1)); ctx.stroke()

def clouds(f: Frame, y=260, alpha=0.55, drift=18, seed=8, color="#1E2748"):
    ctx = f.ctx; r = rng(seed)
    for k in range(14):
        x = r.uniform(-100, f.W + 100) + math.sin(f.t * .3 + k) * drift + f.t * drift
        yy = y + r.uniform(-120, 120); rad = r.uniform(140, 300)
        g = cairo.RadialGradient(x, yy, 0, x, yy, rad)
        c = rgb(color); g.add_color_stop_rgba(0, *c, alpha); g.add_color_stop_rgba(1, *c, 0)
        ctx.set_source(g); ctx.arc(x, yy, rad, 0, 2 * math.pi); ctx.fill()

def lightning(f: Frame, t0, x=760, y0=0, y1=900, seed=5, dur=0.45):
    """Jagged bolt + full-frame flash at t0."""
    u = prog(f.t, t0, t0 + dur)
    if u <= 0 or u >= 1: return
    ctx = f.ctx; r = rng(seed)
    flicker = (1 - u) ** 2 * (0.6 + 0.4 * math.sin(u * 60))
    ctx.set_source_rgba(.85, .9, 1, .55 * flicker); ctx.paint()
    pts = [(x, y0)]; yy = y0; xx = x
    while yy < y1:
        yy += r.uniform(50, 110); xx += r.uniform(-70, 70); pts.append((xx, yy))
    grow = out_cubic(min(1, u * 5))
    partial_polyline(ctx, pts, grow, "#BFD3FF", 26, .35 * flicker)
    partial_polyline(ctx, pts, grow, "#FFFFFF", 8, flicker)

# --------------------------------------------------------------------------- house cross-section
class House:
    """Cross-section of a house. Geometry in px around (cx, eave_y) times scale s.
    Right slope has a 'gap' slot at index GAP for the leak story."""
    SEG = 12
    GAP = 5

    def __init__(self, cx, eave_y, s=1.0):
        self.cx, self.ey, self.s = cx, eave_y, s
        self.apex = (cx, eave_y - 420 * s)
        self.el = (cx - 440 * s, eave_y)
        self.er = (cx + 440 * s, eave_y)
        self.floor = eave_y + 430 * s

    def slope_pt(self, side, p, out=0.0):
        e = self.el if side < 0 else self.er
        x = lerp(e[0], self.apex[0], p); y = lerp(e[1], self.apex[1], p)
        # outward normal
        dx, dy = self.apex[0] - e[0], self.apex[1] - e[1]; L = math.hypot(dx, dy)
        nx, ny = (dy / L, -dx / L) if side < 0 else (-dy / L, dx / L)
        return x + nx * out, y + ny * out

    def gap_pt(self):
        return self.slope_pt(1, (self.GAP + .5) / self.SEG, 0)

    def draw(self, f: Frame, build=1.0, shingles=1.0, gap=True, accent=B.GREY, roof_color="#3A425E",
             new_color=None, walls=1.0, interior=B.NAVY_1):
        ctx, s = f.ctx, self.s
        cx, ey, fl = self.cx, self.ey, self.floor
        a = clamp(build)
        if a <= 0: return
        # interior room + attic
        wx0, wx1 = cx - 390 * s, cx + 390 * s
        ctx.rectangle(wx0, ey, wx1 - wx0, fl - ey); src(ctx, interior, a * walls); ctx.fill()
        poly(ctx, [self.el, self.apex, self.er], B.NAVY_2, a)
        # rafters / truss lines
        for k in range(1, 4):
            p = k / 4
            l = self.slope_pt(-1, p); rr = self.slope_pt(1, p)
            line(ctx, l[0], l[1], l[0], ey, "#1F2850", 5 * s, a)
            line(ctx, rr[0], rr[1], rr[0], ey, "#1F2850", 5 * s, a)
        # insulation (soft wavy)
        ctx.save(); poly(ctx, [self.el, self.apex, self.er]); ctx.clip()
        for row in range(2):
            ctx.move_to(wx0, ey - 14 * s - row * 22 * s)
            for k in range(0, 41):
                x = lerp(wx0, wx1, k / 40)
                ctx.line_to(x, ey - 14 * s - row * 22 * s + math.sin(k * 1.3 + row) * 8 * s)
            src(ctx, "#E59A6A", .35 * a); ctx.set_line_width(14 * s); ctx.stroke()
        ctx.restore()
        # walls + ceiling + floor outline
        dw = out_cubic(a)
        partial_polyline(ctx, [(wx0, ey), (wx0, fl), (wx1, fl), (wx1, ey)], dw, accent, 8 * s, .9)
        line(ctx, wx0, ey, wx1, ey, accent, 6 * s, a * .9)
        # roof deck line
        partial_polyline(ctx, [self.el, self.apex, self.er], dw, accent, 10 * s)
        # shingles along both slopes
        for side in (-1, 1):
            for k in range(self.SEG):
                u = clamp(shingles * self.SEG - k)
                if u <= 0: continue
                if gap and side == 1 and k == self.GAP: continue
                p0 = k / self.SEG; p1 = (k + 1.18) / self.SEG
                a0 = self.slope_pt(side, p0, 10 * s); a1 = self.slope_pt(side, p1, 10 * s)
                b1 = self.slope_pt(side, p1, 34 * s); b0 = self.slope_pt(side, p0, 34 * s)
                e = out_back(u)
                # drop in from above
                dy = (1 - e) * -120 * s
                col = new_color if new_color else roof_color
                pts = [(x, y + dy) for x, y in (a0, a1, b1, b0)]
                poly(ctx, pts, col, min(1, u * 2) * a)
                line(ctx, pts[3][0], pts[3][1], pts[0][0], pts[0][1], "#000000", 4 * s, .35 * min(1, u * 2) * a)
        if gap:
            g0 = self.slope_pt(1, self.GAP / self.SEG, 10 * s); g1 = self.slope_pt(1, (self.GAP + 1) / self.SEG, 10 * s)
            line(ctx, g0[0], g0[1], g1[0], g1[1], "#05060F", 10 * s, a)

def bucket(ctx, x, y, s=1.0, alpha=1.0):
    poly(ctx, [(x - 60 * s, y - 90 * s), (x + 60 * s, y - 90 * s), (x + 46 * s, y), (x - 46 * s, y)], "#2B3560", alpha,
         stroke=B.GREY, width=4 * s)
    ctx.save(); ctx.scale(1, .3)
    ctx.arc(x, (y - 90 * s) / .3, 60 * s, 0, 2 * math.pi); src(ctx, "#11183A", alpha); ctx.fill(); ctx.restore()

def drop(ctx, x, y, r, color=WATER, alpha=1.0):
    ctx.move_to(x, y - r * 1.9)
    ctx.curve_to(x + r * .4, y - r * 1.0, x + r, y - r * .3, x + r, y + r * .1)
    ctx.arc(x, y + r * .1, r, 0, math.pi)
    ctx.curve_to(x - r, y - r * .3, x - r * .4, y - r * 1.0, x, y - r * 1.9)
    src(ctx, color, alpha); ctx.fill()

def splash(ctx, x, y, u, n=7, spread=70, color=WATER, seed=4):
    if u <= 0 or u >= 1: return
    r = rng(seed)
    for k in range(n):
        ang = -math.pi / 2 + r.uniform(-1.1, 1.1); v = spread * r.uniform(.6, 1.2)
        px = x + math.cos(ang) * v * u; py = y + math.sin(ang) * v * u + 160 * u * u
        circle(ctx, px, py, 7 * (1 - u) + 2, color, 1 - u)

def stain(ctx, x, y, u, rx=120, ry=26, seed=2):
    if u <= 0: return
    r = rng(seed)
    for k in range(6):
        ox = r.uniform(-.4, .4) * rx; sc = r.uniform(.5, 1)
        ctx.save(); ctx.translate(x + ox * u, y + 6); ctx.scale(1, ry / rx)
        ctx.arc(0, 0, rx * sc * out_cubic(u), 0, 2 * math.pi); ctx.restore()
        src(ctx, STAIN, .35); ctx.fill()

# --------------------------------------------------------------------------- icons
def icon_panel_crack(ctx, cx, cy, s, color, alpha=1.0):
    fill_rrect(ctx, cx - 50 * s, cy - 60 * s, 100 * s, 120 * s, 8 * s, color, alpha * .25)
    rrect(ctx, cx - 50 * s, cy - 60 * s, 100 * s, 120 * s, 8 * s); src(ctx, color, alpha); ctx.set_line_width(6 * s); ctx.stroke()
    pts = [(cx - 10 * s, cy - 60 * s), (cx + 8 * s, cy - 20 * s), (cx - 12 * s, cy + 8 * s), (cx + 14 * s, cy + 60 * s)]
    partial_polyline(ctx, pts, 1, color, 6 * s, alpha)

def icon_insulation(ctx, cx, cy, s, color, alpha=1.0):
    for k in range(3):
        y = cy - 34 * s + k * 34 * s
        ctx.move_to(cx - 56 * s, y)
        for j in range(1, 15):
            ctx.line_to(cx - 56 * s + j * 8 * s, y + math.sin(j * 1.5) * 10 * s)
        src(ctx, color, alpha); ctx.set_line_width(9 * s); ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.stroke()

def icon_mold(ctx, cx, cy, s, color, alpha=1.0, seed=6):
    r = rng(seed)
    for k in range(16):
        a = r.uniform(0, 2 * math.pi); d = r.uniform(0, 52) * s
        circle(ctx, cx + math.cos(a) * d, cy + math.sin(a) * d, r.uniform(6, 15) * s, color, alpha * r.uniform(.5, 1))

def x_mark(ctx, cx, cy, r, u, color=B.RED):
    if u <= 0: return
    e = out_back(min(1, u * 1.5))
    circle(ctx, cx, cy, r * e, color)
    k = r * .38 * e
    line(ctx, cx - k, cy - k, cx + k, cy + k, B.WHITE, r * .2)
    line(ctx, cx - k, cy + k, cx + k, cy - k, B.WHITE, r * .2)

def clock_ring(ctx, cx, cy, R, u, track="#1A2350", color=B.BLUE, width=34, ticks=48):
    ctx.set_line_width(width); ctx.set_line_cap(cairo.LINE_CAP_BUTT)
    ctx.arc(cx, cy, R, 0, 2 * math.pi); src(ctx, track); ctx.stroke()
    for k in range(ticks):
        a = -math.pi / 2 + k / ticks * 2 * math.pi
        r0, r1 = R + width * .9, R + width * (1.4 if k % 4 == 0 else 1.15)
        on = k / ticks <= u
        line(ctx, cx + math.cos(a) * r0, cy + math.sin(a) * r0, cx + math.cos(a) * r1, cy + math.sin(a) * r1,
             B.WHITE if on else "#2A3466", 4, 1)
    if u > 0:
        ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_width(width)
        ctx.arc(cx, cy, R, -math.pi / 2, -math.pi / 2 + 2 * math.pi * u); src(ctx, color); ctx.stroke()
        a = -math.pi / 2 + 2 * math.pi * u
        glow(ctx, cx + math.cos(a) * R, cy + math.sin(a) * R, width * 2.2, B.BLUE_LT, .9)
