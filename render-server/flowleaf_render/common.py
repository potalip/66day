"""Shared scene parts for templates: build context, backdrops, intro + outro scene kinds, common fields."""
from __future__ import annotations

import math
from dataclasses import dataclass

from .core import *  # noqa: F401,F403 (toolkit)
from .core import Frame
from .schema import Field, SceneKind, L


@dataclass
class BuildCtx:
    sb: dict              # validated storyboard
    index: int            # scene index
    nth: int              # index among scenes of the same kind
    count: int            # how many scenes of this kind
    total: int            # total scenes

    @property
    def g(self): return self.sb["fields"]
    @property
    def lang(self): return self.sb["lang"]
    def is_last(self): return self.index == self.total - 1


def backdrop(f: Frame, deco="dots", seed=0, lift=None):
    """Background used by every template. deco: dots | rings | leaves | none."""
    P = f.P
    bg(f, lift=lift)
    s = f.s
    if deco == "dots":
        dot_grid(f, gap=56, r=2.4, alpha=.55 if not P.dark else .35, drift=6)
    elif deco == "rings":
        ctx = f.ctx
        cx, cy = f.W * .92, f.H * .1
        for k in range(6):
            r = (220 + k * 120 + (f.t * 18) % 120) * s
            ring(ctx, cx, cy, r, P.line, 2.2 * s, 1, .55 * (1 - k / 6))
    elif deco == "leaves":
        r_ = rng(seed + 3)
        for k in range(5):
            x = r_.uniform(0, f.W); y = r_.uniform(0, f.H)
            sz = r_.uniform(160, 360) * s
            rot = r_.uniform(-1.2, .4) + math.sin(f.t * .4 + k) * .05
            leaf(f.ctx, x, y + math.sin(f.t * .6 + k) * 10 * s, sz, P.line, .5, rot)


def finish(f: Frame):
    grain(f, f.P.grain)
    vignette(f, f.P.vignette)


def headline_size(f: Frame, base=1.0):
    return f.pick(118, 104, 112) * f.s * base


# --------------------------------------------------------------------------- shared fields
def handle_field():
    return Field("handle", "text", L("Your handle (shown in the corner)", "Твой ник (в углу кадра)"), max_len=32,
                 help=L("e.g. @yourname — leave empty to hide", "например @tvoy_nik — оставь пустым, чтобы скрыть"))


INTRO_FIELDS = [
    Field("kicker", "text", L("Kicker (small label above)", "Надзаголовок"), max_len=32),
    Field("title", "text", L("Title", "Заголовок"), required=True, max_len=70),
    Field("subtitle", "text", L("Subtitle", "Подзаголовок"), max_len=110),
]

OUTRO_FIELDS = [
    Field("title", "text", L("Closing line", "Финальная фраза"), required=True, max_len=60),
    Field("subtitle", "text", L("Small text under it", "Текст под ней"), max_len=90),
    Field("cta", "text", L("Button text", "Текст кнопки"), max_len=28),
]


def draw_intro(f: Frame, sc, bc: BuildCtx, deco="dots", align="m"):
    """Kicker pill + kinetic headline + subtitle. align m (centre) or l (left)."""
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, deco, seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    w = x1 - x0
    fl = sc["fields"]
    w = f.measure(w)
    size, lines = fit(fl["title"], w, (y1 - y0) * .5, headline_size(f), "Black", 40 * s, lh=1.06, max_lines=5)
    block = size * (.727 + (len(lines) - 1) * 1.06)
    sub_size = f.pick(44, 40, 38) * s
    sub_lines = wrap(fl.get("subtitle", ""), sub_size, "Medium", w * .92)[:3] if fl.get("subtitle") else []
    sub_h = sub_size * (1 + 1.3 * (len(sub_lines) - 1)) if sub_lines else 0
    kick_h = 80 * s if fl.get("kicker") else 0
    total = kick_h + block + (60 * s + sub_h if sub_lines else 0)
    top = (y0 + y1) / 2 - total / 2 - 20 * s
    cx = f.cx if align == "m" else x0
    if fl.get("kicker"):
        a = ease(t, .05, .4)
        pill(f, fl["kicker"].upper(), cx, top + 20 * s, 30 * s, alpha=a, anchor=align, weight="Bold")
    kinetic_lines(f, lines, cx, top + kick_h, size, .25, "Black", align=align, valign="t", lh=1.06, stagger=.06)
    if sub_lines:
        paragraph(ctx, sub_lines, cx, top + kick_h + block + 60 * s, sub_size, "Medium", P.muted, align=align,
                  lh=1.3, reveal=.25 + .06 * len(fl["title"].split()) + .2, t=t)
    handle_tag(f, bc.g.get("handle"), ease(t, .3, .8))


def draw_outro(f: Frame, sc, bc: BuildCtx, deco="dots"):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, deco, seed=bc.index, lift=(f.cx, f.cy))
    x0, y0, x1, y1 = f.safe()
    w = x1 - x0
    fl = sc["fields"]
    # leaf mark grows
    lu = ease(t, 0, .7, out_back)
    lcy = f.cy - f.pick(330, 270, 230) * s
    glow(ctx, f.cx, lcy, 160 * s * lu, P.accent, .25)
    leaf(ctx, f.cx, lcy, 130 * s * lu, P.accent, ease(t, 0, .3), rot=-.7, vein=P.bg)
    size, lines = fit(fl["title"], w, f.pick(330, 240, 220) * s, f.pick(104, 92, 92) * s, "Black", 40 * s, lh=1.06,
                      max_lines=4)
    ty = lcy + 130 * s
    block = kinetic_lines(f, lines, f.cx, ty, size, .35, "Black", valign="t", stagger=.06)
    y = ty + block + 56 * s
    if fl.get("subtitle"):
        ss = f.pick(42, 38, 36) * s
        sl = wrap(fl["subtitle"], ss, "Medium", w * .9)[:2]
        y += paragraph(ctx, sl, f.cx, y, ss, "Medium", P.muted, lh=1.3, reveal=.8, t=t) + 70 * s
    else:
        y += 20 * s
    if fl.get("cta"):
        bs = f.pick(40, 36, 34) * s
        button(f, fl["cta"], f.cx, y + bs * 1.25, 1.05, bs, max_w=w)
        y += bs * 2.6 + 40 * s
    h = bc.g.get("handle")
    if h:
        text(ctx, h, f.cx, y + 30 * s, 34 * s, "SemiBold", P.muted, ease(t, 1.3, 1.7), max_w=w)


def intro_kind(hint="Hook the viewer in under 3 seconds: a short, concrete promise.", deco="dots", align="m",
               duration=(3.2, 2.0, 6.0)):
    return SceneKind("intro", L("Intro", "Начало"), INTRO_FIELDS, duration,
                     draw=lambda f, sc, bc: draw_intro(f, sc, bc, deco, align), hint=hint,
                     sfx=lambda sc, bc: [(.25, "pop", {"gain": -14})])


def outro_kind(hint="Closing line + call to action (follow, try it, comment).", deco="dots",
               duration=(3.4, 2.4, 6.0)):
    return SceneKind("outro", L("Outro", "Финал"), OUTRO_FIELDS, duration,
                     draw=lambda f, sc, bc: draw_outro(f, sc, bc, deco), hint=hint,
                     sfx=lambda sc, bc: [(1.05, "ding", {"gain": -14})])
