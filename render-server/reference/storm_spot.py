"""V01 — Storm / 48hr Emergency spot. 9:16, ~22s. Brief: briefs/01_storm_spot.md"""
import math
from rcm import brand as B
from rcm.core import *
from rcm.illos import *

ID = "storm_spot"
TITLE = "Rain Season: Is Your Roof Ready?"
FORMATS = ["9x16"]
WIPE = 0.45  # seconds each side of a shingle-wipe cut

# ---------------------------------------------------------------- 1. hook: storm + headline
def s_hook(f):
    ctx, t = f.ctx, f.t
    bg(f, c0="#03040E", c1="#121A3A", lift=(f.cx, 300))
    clouds(f, y=250, alpha=.7)
    clouds(f, y=420, alpha=.45, seed=11, color="#252F55")
    rain(f, n=240, alpha=.5)
    lightning(f, .55, x=820, y1=1100)
    lightning(f, 2.05, x=260, y1=800, seed=9, dur=.35)
    dx, dy = shake(t, .58, .45, 26)
    ctx.save(); ctx.translate(dx, dy)
    pill(ctx, "BAY AREA RAIN SEASON", f.cx, 640, 34, fg=B.NAVY_0, bgc=B.AMBER, alpha=ease(t, .15, .45))
    kinetic_words(ctx, ["IS", "YOUR", "ROOF"], f.cx, 820, 128, t, .5, stagger=.09)
    s = out_back(prog(t, 1.05, 1.5), 2.4)
    if s > 0:
        text(ctx, "READY?", f.cx, 990, 220, "Black", B.AMBER, min(1, s * 2), scale=lerp(1.6, 1, s))
    ctx.restore()
    wipe_shingles(f, lerp(0, .5, prog(t, f.dur - WIPE, f.dur)), B.AMBER, alt="#1A2244")

# ---------------------------------------------------------------- 2. the leak travels
H2 = House(540, 960, 1.0)
def s_leak(f):
    ctx, t = f.ctx, f.t
    bg(f)
    rain(f, n=90, alpha=.35, region=(0, 300, f.W, 900))
    H2.draw(f, build=ease(t, 0, .7), shingles=1.0)
    text(ctx, "IT STARTS SMALL", f.cx, 330, 84, "Black", B.WHITE, ease(t, .1, .5), scale=lerp(.9, 1, ease(t, .1, .5, out_back)))
    gx, gy = H2.gap_pt()
    # highlight ring on the missing shingle
    hu = prog(t, .7, 1.2)
    if hu > 0:
        r = lerp(140, 70, out_cubic(hu)) + 6 * math.sin(t * 8)
        ctx.arc(gx, gy, r, 0, 2 * math.pi); src(ctx, B.AMBER, min(1, hu * 2)); ctx.set_line_width(7); ctx.stroke()
        a = ease(t, 1.0, 1.3)
        lx, ly = gx + 60, gy - 210
        line(ctx, gx + 40, gy - 50, lx, ly + 30, B.AMBER, 4, a)
        pill(ctx, "1 missing shingle", lx + 30, ly, 30, fg=B.NAVY_0, bgc=B.AMBER, alpha=a)
    # drops funnel into the gap
    for k in range(4):
        u = prog(t, 1.0 + k * .22, 1.35 + k * .22)
        if 0 < u < 1: drop(ctx, gx - 20 + k * 8, lerp(gy - 300, gy, in_cubic(u)), 11)
    # water path through attic to ceiling
    path = [(gx, gy + 20), (gx - 14, gy + 70), (gx + 10, gy + 120), (gx - 6, H2.ey - 6)]
    partial_polyline(ctx, path, ease(t, 1.4, 2.2, in_out_cubic), WATER, 12, .95)
    stain(ctx, gx, H2.ey, ease(t, 2.0, 3.0), rx=130)
    # repeated drips into a bucket
    bx, by = gx, H2.floor - 6
    bucket(ctx, bx, by, 1.0, ease(t, 2.2, 2.5))
    for k, t0 in enumerate((2.45, 3.05, 3.55)):
        u = prog(t, t0, t0 + .42)
        if 0 < u < 1: drop(ctx, bx, lerp(H2.ey + 20, by - 90, in_cubic(u)), 12)
        splash(ctx, bx, by - 92, prog(t, t0 + .42, t0 + .85), seed=k)
    wipe_shingles(f, lerp(.5, 1, prog(t, 0, WIPE)), B.AMBER, alt="#1A2244")

# ---------------------------------------------------------------- 3. damage spreads
def s_damage(f):
    ctx, t = f.ctx, f.t
    bg(f, c1="#2A1020", lift=(f.cx, 900))
    glow(ctx, f.cx, 950, 900, B.RED, .10 + .06 * pulse(t, .8))
    kinetic_words(ctx, ["THEN", "IT", "SPREADS"], f.cx, 380, 104, t, .05, stagger=.08, colors=[None, None, B.AMBER])
    items = [("Drywall", icon_panel_crack), ("Insulation", icon_insulation), ("Mold", icon_mold)]
    for k, (label, icon) in enumerate(items):
        t0 = .45 + k * .45
        u = prog(t, t0, t0 + .5)
        if u <= 0: continue
        side = -1 if k % 2 == 0 else 1
        x = f.cx + side * (1 - out_back(u, 1.4)) * 900
        y = 640 + k * 250
        dx, dy = shake(t, t0 + .45, .25, 10, seed=k)
        x += dx; y += dy
        shadow_rrect(ctx, x - 400, y - 95, 800, 190, 36, alpha=.45)
        fill_rrect(ctx, x - 400, y - 95, 800, 190, 36, B.NAVY_2)
        icon(ctx, x - 270, y, 1.0, B.AMBER)
        text(ctx, label, x - 160, y, 76, "ExtraBold", B.WHITE, anchor="lm")
        x_mark(ctx, x + 300, y, 50, prog(t, t0 + .45, t0 + .8))
    wipe_shingles(f, lerp(0, .5, prog(t, f.dur - WIPE, f.dur)), B.BLUE)

# ---------------------------------------------------------------- 4. 48hr response
def s_response(f):
    ctx, t = f.ctx, f.t
    bg(f, c1="#0B1E66", lift=(f.cx, 820))
    hit = 1.55
    dx, dy = shake(t, hit, .35, 18)
    ctx.save(); ctx.translate(dx, dy)
    pop = 1 + .08 * (1 - ease(t, hit, hit + .4)) * (t >= hit)
    ctx.save(); ctx.translate(f.cx, 820); ctx.scale(pop, pop)
    clock_ring(ctx, 0, 0, 290, ease(t, .25, hit, in_out_cubic))
    v = lerp(0, 48, ease(t, .25, hit, out_cubic))
    text(ctx, f"{v:.0f}", 0, -10, 250, "Black", B.WHITE)
    text(ctx, "HOURS", 0, 130, 50, "ExtraBold", B.BLUE_LT, tracking=.12)
    ctx.restore()
    if t > hit: glow(ctx, f.cx, 820, 520, B.BLUE, .45 * (1 - ease(t, hit, hit + .8)))
    ctx.restore()
    kinetic_words(ctx, ["EMERGENCY", "RESPONSE"], f.cx, 1260, 78, t, hit + .05, stagger=.1)
    text(ctx, "Across 60+ Bay Area cities", f.cx, 1360, 46, "SemiBold", B.GREY, ease(t, hit + .4, hit + .8))
    wipe_shingles(f, lerp(.5, 1, prog(t, 0, WIPE)), B.BLUE)

# ---------------------------------------------------------------- 5. fixed right
H5 = House(540, 960, .78)
def s_fix(f):
    ctx, t = f.ctx, f.t
    bg(f, c1="#0B1A55")
    lay = ease(t, .15, 1.9, linear)
    H5.draw(f, build=1, shingles=lay, gap=False, new_color=B.BLUE, accent=B.BLUE_LT, roof_color=B.BLUE)
    kinetic_words(ctx, ["DONE", "ONCE."], f.cx, 300, 112, t, .1, stagger=.1)
    kinetic_words(ctx, ["DONE", "RIGHT."], f.cx, 430, 112, t, .35, stagger=.1, colors=[None, B.BLUE_LT])
    checkmark(ctx, f.cx, 850, 64, prog(t, 1.9, 2.4))
    pill(ctx, "LICENSED & INSURED", f.cx - 190, 1395, 30, bgc=B.NAVY_2, alpha=ease(t, 1.9, 2.2))
    pill(ctx, "BBB ACCREDITED", f.cx + 220, 1395, 30, bgc=B.NAVY_2, alpha=ease(t, 2.1, 2.4))

# ---------------------------------------------------------------- 6. end card
def s_end(f):
    bg(f)
    rain(f, n=60, alpha=.15)
    end_card(f, .1, headline="Storm Damage?", cta="Get Emergency Help", sub="48hr Emergency · Free Estimates")

SCENES = [
    ("hook", 3.0, s_hook),
    ("leak", 4.2, s_leak),
    ("damage", 3.6, s_damage),
    ("response", 3.8, s_response),
    ("fix", 3.6, s_fix),
    ("end", 4.2, s_end),
]
# scene starts: 0, 3.0, 7.2, 10.8, 14.6, 18.2 -> total 22.4

AUDIO = {
    "vo": [
        (0.25, 2.9, "Rainy season is here. Is your roof ready?"),
        (3.3, 7.0, "It only takes one missing shingle for water to get in."),
        (7.4, 10.6, "Then it spreads. Drywall, insulation, even mold."),
        (11.0, 14.4, "RoofCraft offers forty-eight hour emergency response across the Bay Area."),
        (14.8, 18.0, "Licensed, insured, BBB accredited. Done once. Done right."),
        (18.5, 22.0, "Storm damage? Call RoofCraft today.", False),
    ],
    "sfx": [
        (0.0, "rain", {"gain": -14, "dur": 7.2}),
        (0.5, "thunder", {"gain": -3}),
        (2.0, "thunder", {"gain": -9}),
        (1.05, "impact", {"gain": -6}),
        (2.6, "whoosh", {"gain": -8}),
        (4.0, "pop", {"gain": -10}),
        (5.7, "drip", {"gain": -6}), (6.3, "drip", {"gain": -7}), (6.8, "drip", {"gain": -8}),
        (6.8, "whoosh", {"gain": -8}),
        (7.7, "stamp", {"gain": -8}), (8.15, "stamp", {"gain": -8}), (8.6, "stamp", {"gain": -8}),
        (10.4, "whoosh", {"gain": -7}),
        (11.0, "riser", {"gain": -12, "dur": 1.3}),
        (12.35, "impact", {"gain": -4}),
        *[(14.75 + k * .145, "hammer", {"gain": -14}) for k in range(12)],
        (16.6, "ding", {"gain": -9}),
        (18.4, "whoosh", {"gain": -9}),
        (19.4, "pop", {"gain": -8}),
    ],
    "music": {"mood": "tense", "gain": -11,
              "prompt": "dark tense cinematic underscore turning hopeful and confident halfway, modern trailer drums, no vocals, 22 seconds"},
}
