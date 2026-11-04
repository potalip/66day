"""Journey / timeline: "my 66 days so far" — a path of milestones that draws itself, a progress ring, highlights."""
from __future__ import annotations

import math
import re

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example

DECO = {"paper": "dots", "night": "dots", "forest": "rings"}


def parse_milestones(items):
    """['Day 3: First page live', '12 — Bot ships'] -> [(3, 'First page live'), (12, 'Bot ships')]"""
    out = []
    for it in items:
        m = re.match(r"^\s*(?:day|день|д\.?)?\s*(\d{1,3})\s*[:.—–\-|]\s*(.+)$", it, re.I)
        out.append((int(m.group(1)), m.group(2).strip()) if m else (None, it.strip()))
    return out


def day_label(d, lang):
    return (f"ДЕНЬ {d}" if lang == "ru" else f"DAY {d}") if d is not None else ""


def draw_timeline(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    ms = parse_milestones([m for m in fl.get("milestones", []) if m])[:6]
    title = fl.get("title", "")
    n = max(1, len(ms))
    th = 0
    if title:
        ts, tl = fit(title, x1 - x0, 220 * s, f.pick(84, 68, 72) * s, "Black", 34 * s, lh=1.06, max_lines=2)
        kinetic_lines(f, tl, x0, y0 + 10 * s, ts, .05, "Black", align="l", valign="t", lh=1.06)
        th = ts * (.727 + 1.06 * (len(tl) - 1)) + f.pick(90, 60, 70) * s
    span = sc["duration"] - 1.2
    step = min(.7, span / n)
    if f.wide:
        ly = (y0 + th + y1) / 2
        lx0, lx1 = x0 + 40 * s, x1 - 40 * s
        pts = [(lx0 + (lx1 - lx0) * (k / max(1, n - 1) if n > 1 else .5), ly) for k in range(n)]
        u = ease(t, .3, .3 + step * n, linear)
        line(ctx, lx0, ly, lx1, ly, P.line, 8 * s)
        line(ctx, lx0, ly, lerp(lx0, lx1, u), ly, P.accent, 8 * s)
        for k, ((d, txt), (px, py)) in enumerate(zip(ms, pts)):
            a = ease(t, .3 + step * k, .6 + step * k)
            last = k == n - 1
            r = (26 if not last else 34) * s * out_back(min(1, a * 1.2))
            if last and a > 0: glow(ctx, px, py, 120 * s, P.accent2, .35 * a)
            circle(ctx, px, py, r, P.accent2 if last else P.accent, a)
            up = k % 2 == 0
            cw = (lx1 - lx0) / max(1, n - 1) * 1.6 if n > 1 else 600 * s
            cw = min(cw, 460 * s)
            text(ctx, day_label(d, f.lang), px, py + (-90 if up else 80) * s, 28 * s, "Bold", P.muted, a, tracking=.1)
            ls, ll = fit(txt, cw, 130 * s, 44 * s, "Bold", 20 * s, lh=1.15, max_lines=2)
            block = ls * (.727 + 1.15 * (len(ll) - 1))
            yy = py - 130 * s - block if up else py + 120 * s
            paragraph(ctx, ll, px, yy, ls, "Bold", P.fg, a, lh=1.15)
    else:
        top, bottom = y0 + th + 20 * s, y1 - f.pick(150, 70, 0) * s
        lx = x0 + 40 * s
        gap = (bottom - top) / max(1, n - 1) if n > 1 else 0
        gap = min(gap, f.pick(300, 160, 0) * s)
        top += ((bottom - top) - gap * (n - 1)) / 2 if n > 1 else (bottom - top) / 2
        pts = [(lx, top + k * gap) for k in range(n)]
        u = ease(t, .3, .3 + step * n, linear)
        if n > 1:
            line(ctx, lx, pts[0][1], lx, pts[-1][1], P.line, 8 * s)
            line(ctx, lx, pts[0][1], lx, lerp(pts[0][1], pts[-1][1], u), P.accent, 8 * s)
        tw = x1 - lx - 80 * s
        for k, ((d, txt), (px, py)) in enumerate(zip(ms, pts)):
            a = ease(t, .3 + step * k, .6 + step * k)
            last = k == n - 1
            r = (24 if not last else 32) * s * out_back(min(1, a * 1.2))
            if last and a > 0: glow(ctx, px, py, 110 * s, P.accent2, .35 * a)
            circle(ctx, px, py, r, P.accent2 if last else P.accent, a)
            dx = (1 - a) * 40 * s
            text(ctx, day_label(d, f.lang), lx + 70 * s + dx, py - 30 * s, f.pick(30, 26, 0) * s, "Bold", P.muted, a, "lm", tracking=.1)
            ls, ll = fit(txt, tw, gap * .6 if gap else 160 * s, f.pick(60, 40, 0) * s, "Bold", 20 * s, lh=1.15, max_lines=2)
            paragraph(ctx, ll, lx + 70 * s + dx, py + 6 * s, ls, "Bold", P.fg if not last else P.fg, a, align="l", lh=1.15)
    handle_tag(f, bc.g.get("handle"), 1) if not title else None


def draw_progress(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index, lift=(f.cx, f.cy))
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    total = int(bc.g.get("total") or 66)
    day = max(0, min(total, int(fl.get("day") or 0)))
    R = f.pick(320, 250, 250) * s
    cx = f.cx - (360 * s if f.wide else 0)
    cy = f.cy - (f.pick(140, 50, 0) * s if not f.wide else 0)
    u = ease(t, .2, 1.8, in_out_cubic)
    ring(ctx, cx, cy, R, P.line, 34 * s, 1, ease(t, 0, .3))
    ring(ctx, cx, cy, R, P.accent, 34 * s, day / total * u)
    # 66 ticks
    for k in range(total):
        ang = -math.pi / 2 + 2 * math.pi * (k + .5) / total
        on = k < day * u
        circle(ctx, cx + (R - 60 * s) * math.cos(ang), cy + (R - 60 * s) * math.sin(ang), 5 * s,
               P.accent2 if k == day - 1 and on else P.accent if on else P.line, ease(t, 0, .4))
    v = round(day * ease(t, .2, 1.8, out_expo))
    text(ctx, str(v), cx, cy - 20 * s, f.pick(190, 150, 150) * s, "Black", P.fg, ease(t, .1, .4))
    text(ctx, (f"из {total} дней" if f.lang == "ru" else f"of {total} days"), cx, cy + 100 * s, 40 * s, "SemiBold", P.muted,
         ease(t, .4, .8))
    lab = fl.get("label", "")
    if lab:
        if f.wide:
            tx = cx + R + 120 * s
            ls, ll = fit(lab, x1 - tx, 420 * s, 84 * s, "Black", 32 * s, lh=1.06, max_lines=4)
            kinetic_lines(f, ll, tx, f.cy, ls, 1.2, "Black", align="l", lh=1.06)
        else:
            ls, ll = fit(lab, x1 - x0, 240 * s, f.pick(76, 60, 0) * s, "Black", 30 * s, lh=1.06, max_lines=3)
            kinetic_lines(f, ll, f.cx, cy + R + 90 * s, ls, 1.2, "Black", valign="t", lh=1.06)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_highlight(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0)
    fl = sc["fields"]
    day = int(fl.get("day") or 1)
    ru = f.lang == "ru"
    label = fl.get("label") or ("ВЕХА" if ru else "MILESTONE")
    big = f.pick(300, 230, 260) * s
    top = f.cy - f.pick(420, 300, 280) * s
    pill(f, label.upper(), f.cx, top, 30 * s, alpha=ease(t, 0, .3), bgc=P.accent2, fg=P.bg if P.dark else "#FFFFFF")
    u = ease(t, .1, .7, out_back)
    text(ctx, (f"День {day}" if ru else f"Day {day}"), f.cx, top + 90 * s + big * .4, big, "Black", P.accent, ease(t, .1, .3),
         scale=lerp(.8, 1, u), max_w=W)
    y = top + 140 * s + big * .8
    ts, tl = fit(fl.get("title", ""), W, 260 * s, f.pick(76, 62, 64) * s, "ExtraBold", 30 * s, lh=1.1, max_lines=3)
    th = paragraph(ctx, tl, f.cx, y, ts, "ExtraBold", P.fg, lh=1.1, reveal=.6, t=t)
    if fl.get("text"):
        bs, bl = fit(fl["text"], W * .9, 220 * s, f.pick(44, 38, 40) * s, "Medium", 22 * s, lh=1.35, max_lines=3)
        paragraph(ctx, bl, f.cx, y + th + 50 * s, bs, "Medium", P.muted, lh=1.35, reveal=1.0, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


TIMELINE = SceneKind("timeline", L("Timeline", "Таймлайн"), [
    Field("title", "text", L("Title", "Заголовок"), max_len=50),
    Field("milestones", "list", L("Milestones, one per line: “Day 3: First page live”", "Вехи, по строке: «День 3: Первая страница»"),
          min_items=2, max_items=6, max_len=60),
], (6.0, 3.5, 10.0), draw=draw_timeline, hint="3-6 real milestones in order, each 'Day N: what happened' (2-6 words).",
    sfx=lambda sc, bc: [(.3 + k * min(.7, (sc["duration"] - 1.2) / max(1, len(sc["fields"].get("milestones", [])))), "pop", {"gain": -16})
                        for k in range(len(sc["fields"].get("milestones", [])))])

PROGRESS = SceneKind("progress", L("Progress ring", "Кольцо прогресса"), [
    Field("day", "number", L("Days done", "Пройдено дней"), min=0, max=366, default=12),
    Field("label", "text", L("Line next to it", "Подпись"), max_len=60),
], (4.0, 2.5, 7.0), draw=draw_progress, hint="How far the creator is (real number).",
    sfx=lambda sc, bc: [(.2, "riser", {"gain": -20, "dur": 1.5}), (1.8, "ding", {"gain": -16})])

HIGHLIGHT = SceneKind("highlight", L("Milestone highlight", "Главная веха"), [
    Field("day", "number", L("Day", "День"), min=1, max=366, default=1),
    Field("label", "text", L("Label (default: Milestone)", "Метка (по умолчанию «Веха»)"), max_len=24),
    Field("title", "text", L("What happened", "Что случилось"), required=True, max_len=60),
    Field("text", "textarea", L("One line about it", "Пара слов"), max_len=120),
], (4.0, 2.5, 7.0), draw=draw_highlight, hint="The proudest moment: day number + what happened.",
    sfx=lambda sc, bc: [(.1, "impact", {"gain": -16})])

TEMPLATE = Template(
    id="journey",
    name=L("My 66-day journey", "Мой путь 66 дней"),
    description=L("A timeline of milestones that draws itself, a progress ring and your proudest moment.",
                  "Таймлайн вех, кольцо прогресса и главный момент пути."),
    category="course",
    styles=["paper", "night", "forest"],
    fields=[Field("total", "number", L("Journey length (days)", "Длина пути (дней)"), min=7, max=366, default=66), handle_field()],
    scene_kinds=[intro_kind(), TIMELINE, PROGRESS, HIGHLIGHT, outro_kind()],
    min_scenes=1, max_scenes=8, music="uplift", transition="wipe",
    ai_notes="Build-in-public recap of the creator's journey. Use only milestones and numbers from the brief.",
    examples={
        "en": example("journey", "en", "My first 30 days of building with AI", [
            ("intro", 2.8, "Thirty days ago I'd never written code. Here's the journey.",
             {"kicker": "Build in public", "title": "30 days of building with AI"}),
            ("timeline", 6.0, "Day one, a page. Day five, a form. Day twelve, my first bot. Day twenty-one, real users. Day thirty, a paid gig.",
             {"title": "How it went", "milestones": ["Day 1: First page live", "Day 5: A working form", "Day 12: My first bot",
                                                      "Day 21: 50 real users", "Day 30: First paid gig"]}),
            ("progress", 4.0, "Thirty days down. Thirty-six to go.", {"day": 30, "label": "Halfway there."}),
            ("highlight", 4.0, "The best moment: a stranger paid me for a bot I built.",
             {"day": 30, "title": "Someone paid for my bot", "text": "Built in a weekend with an AI agent."}),
            ("outro", 3.2, "Follow along to day sixty-six.", {"title": "See you on day 66.", "cta": "Follow the journey"}),
        ], fields={"total": 66, "handle": "@flowleaf66"}, style="paper"),
        "ru": example("journey", "ru", "Мои первые 30 дней с ИИ", [
            ("intro", 2.8, "Тридцать дней назад я ни разу не писал код. Вот как это было.",
             {"kicker": "Строю публично", "title": "30 дней создаю с ИИ"}),
            ("timeline", 6.0, "День первый — страница. Пятый — форма. Двенадцатый — первый бот. Двадцать первый — живые люди. Тридцатый — первый заказ.",
             {"title": "Как это было", "milestones": ["День 1: Первая страница", "День 5: Рабочая форма", "День 12: Мой первый бот",
                                                       "День 21: 50 живых людей", "День 30: Первый заказ"]}),
            ("progress", 4.0, "Тридцать дней позади. Впереди тридцать шесть.", {"day": 30, "label": "Почти половина."}),
            ("highlight", 4.0, "Лучший момент: незнакомый человек заплатил за моего бота.",
             {"day": 30, "title": "За моего бота заплатили", "text": "Собрал за выходные с ИИ-агентом."}),
            ("outro", 3.2, "Следи за путём до шестьдесят шестого дня.", {"title": "Увидимся на 66-м дне.", "cta": "Следить за путём"}),
        ], fields={"total": 66, "handle": "@flowleaf66"}, style="paper"),
    },
)
