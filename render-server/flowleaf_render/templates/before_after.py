"""Before / after showcase: side-by-side comparison, a swipe reveal, and feature highlights."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..icons import draw_icon, icon_options
from ..schema import Field, SceneKind, Template, L, example
from ._screen import screen_kind

DECO = {"paper": "dots", "night": "dots", "sunrise": "leaves"}


def _points_block(f: Frame, x, y, w, h, title, points, good, t0, alpha):
    """Card with a title and a list of points marked with crosses (before) or checks (after)."""
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    pad = 50 * s
    ts = f.pick(52, 44, 48) * s
    n = max(1, len(points))
    row = min((h - pad * 2 - ts * 1.8) / n, f.pick(190, 140, 160) * s)
    ps = min(f.pick(54, 42, 48) * s, row * .42)
    if good:
        card(f, x, y, w, h, alpha=alpha)
        stroke_rrect(ctx, x + 1, y + 1, w - 2, h - 2, 36 * s, P.accent, 4 * s, alpha)
    else:
        card(f, x, y, w, h, alpha=alpha * .9, color=mixc(P.surface, P.bg, .5), lift=False)
    tag = title.upper()
    pill(f, tag, x + pad, y + pad + ts * .3, ts * .55, alpha=alpha, anchor="l",
         bgc=P.accent if good else P.muted, fg=P.on_accent if good else P.bg)
    yy = y + pad + ts * 1.6
    for k, ptxt in enumerate(points):
        u = prog(t, t0 + .2 + k * .18, t0 + .7 + k * .18)
        cy = yy + row * k + row / 2
        r = ps * .62
        if good: checkmark(ctx, x + pad + r, cy, r, u, P.accent, P.on_accent)
        else: cross(ctx, x + pad + r, cy, r, u, P.muted, P.bg)
        tw = w - pad * 2 - r * 2 - 30 * s
        sz, lines = fit(ptxt, tw, row * .9, ps, "SemiBold" if good else "Medium", 18 * s, lh=1.2, max_lines=2)
        paragraph(ctx, lines, x + pad + r * 2 + 30 * s, cy, sz, "SemiBold" if good else "Medium",
                  P.fg if good else P.muted, alpha * out_cubic(u), align="l", lh=1.2, valign="m")


def draw_compare(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    y0 += 60 * s
    W, H = x1 - x0, y1 - y0
    bp, ap = fl.get("before_points", []), fl.get("after_points", [])
    gap = 70 * s
    if f.vertical:
        ch = (H - gap) / 2
        boxes = [(x0, y0, W, ch), (x0, y0 + ch + gap, W, ch)]
        arrow = (f.cx, y0 + ch + gap / 2, True)
    else:
        cw = (W - gap) / 2
        boxes = [(x0, y0, cw, H), (x0 + cw + gap, y0, cw, H)]
        arrow = (x0 + cw + gap / 2, y0 + H / 2, False)
    a1 = ease(t, 0, .4)
    dx = (1 - ease(t, 0, .5, out_cubic)) * 50 * s
    bx, by, bw, bh = boxes[0]
    _points_block(f, bx - dx, by, bw, bh, fl.get("before_title") or ("До" if f.lang == "ru" else "Before"), bp, False,
                  .1, a1)
    t2 = .5 + .18 * len(bp)
    a2 = ease(t, t2, t2 + .4)
    if a2 > 0:
        bx, by, bw, bh = boxes[1]
        rise = (1 - ease(t, t2, t2 + .6, out_back)) * 70 * s
        _points_block(f, bx, by + rise, bw, bh, fl.get("after_title") or ("После" if f.lang == "ru" else "After"), ap,
                      True, t2 + .1, a2)
    ax, ay, vert = arrow
    au = ease(t, t2 - .2, t2 + .2, out_back)
    if au > 0:
        circle(ctx, ax, ay, 44 * s * au, P.accent)
        k = 16 * s * au
        if vert: poly(ctx, [(ax - k, ay - k * .4), (ax + k, ay - k * .4), (ax, ay + k * .8)], P.on_accent)
        else: poly(ctx, [(ax - k * .4, ay - k), (ax - k * .4, ay + k), (ax + k * .8, ay)], P.on_accent)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_swipe(f: Frame, sc, bc: BuildCtx):
    """Full-frame 'before' statement, then an accent bar sweeps across and reveals the 'after' statement."""
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    fl = sc["fields"]
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0)
    u = ease(t, sc["duration"] * .38, sc["duration"] * .38 + .7, in_out_cubic)
    edge = lerp(-60 * s, f.W + 60 * s, u)

    def side(label, msg, fg, bgc, strike, lift_c):
        bg(f, c0=bgc, c1=lift_c)
        sz, lines = fit(msg, W, (y1 - y0) * .5, f.pick(100, 86, 96) * s, "Black", 36 * s, lh=1.06, max_lines=5)
        block = sz * (.727 + 1.06 * (len(lines) - 1))
        top = f.cy - block / 2
        text(ctx, label.upper(), f.cx, top - 90 * s, 32 * s, "Bold", fg, .7, tracking=.14)
        paragraph(ctx, lines, f.cx, top, sz, "Black", fg, lh=1.06)
        if strike:
            for k, ln in enumerate(lines):
                lw = text_width(ln, sz, "Black")
                yy = top + k * sz * 1.06 + sz * .38
                su = ease(t, .6 + k * .15, 1.0 + k * .15, out_cubic)
                line(ctx, f.cx - lw / 2, yy, f.cx - lw / 2 + lw * su, yy, P.accent2, 8 * s, .9)
    # before (full frame)
    side(fl.get("before_label") or ("Было" if f.lang == "ru" else "Before"), fl.get("before", ""), P.muted,
         mixc(P.bg, "#000000" if P.dark else "#808080", .12), True, P.bg)
    if u > 0:
        ctx.save(); ctx.rectangle(0, 0, edge, f.H); ctx.clip()
        side(fl.get("after_label") or ("Стало" if f.lang == "ru" else "After"), fl.get("after", ""), P.fg,
             P.bg, False, P.bg2)
        ctx.restore()
        if u < 1:
            fill_rrect(ctx, edge - 10 * s, 0, 20 * s, f.H, 0, P.accent)
            circle(ctx, edge, f.cy, 46 * s, P.accent)
            poly(ctx, [(edge - 8 * s, f.cy - 16 * s), (edge - 8 * s, f.cy + 16 * s), (edge + 14 * s, f.cy)], P.on_accent)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_feature(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index, lift=(f.cx, f.cy * .8))
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0)
    fl = sc["fields"]
    R = f.pick(150, 110, 120) * s
    ts, tl = fit(fl["title"], W, (y1 - y0) * .3, f.pick(96, 80, 88) * s, "Black", 36 * s, lh=1.06, max_lines=3)
    th = ts * (.727 + 1.06 * (len(tl) - 1))
    bs, bl = fit(fl.get("body", ""), W * .9, (y1 - y0) * .25, f.pick(48, 40, 44) * s, "Medium", 24 * s, lh=1.35,
                 max_lines=4) if fl.get("body") else (0, [])
    bh = bs * (.727 + 1.35 * (len(bl) - 1)) if bl else 0
    total = 2 * R + 80 * s + th + (50 * s + bh if bl else 0)
    top = f.cy - total / 2
    iu = prog(t, .05, .6)
    e = out_back(iu, 2)
    if iu > 0:
        glow(ctx, f.cx, top + R, R * 1.8, P.accent, .22 * iu)
        circle(ctx, f.cx, top + R, R * e, P.accent)
        draw_icon(ctx, fl.get("icon", "star"), f.cx, top + R, R * 1.05, P.on_accent, min(1, iu * 2), 2, e)
    y = top + 2 * R + 80 * s
    kinetic_lines(f, tl, f.cx, y, ts, .35, "Black", valign="t", lh=1.06, stagger=.06)
    if bl: paragraph(ctx, bl, f.cx, y + th + 50 * s, bs, "Medium", P.muted, lh=1.35, reveal=.8, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


COMPARE = SceneKind("compare", L("Side by side", "Рядом"), [
    Field("before_title", "text", L("Before: label", "До: подпись"), max_len=24),
    Field("before_points", "list", L("Before: points (one per line)", "До: пункты (по одному в строке)"),
          max_items=4, min_items=1, max_len=60),
    Field("after_title", "text", L("After: label", "После: подпись"), max_len=24),
    Field("after_points", "list", L("After: points (one per line)", "После: пункты (по одному в строке)"),
          max_items=4, min_items=1, max_len=60),
], (5.5, 3.5, 9.0), draw=draw_compare, hint="2-4 short, parallel points per side (same order, same length).",
    sfx=lambda sc, bc: [(.5 + .18 * len(sc["fields"].get("before_points", [])), "whoosh", {"gain": -14})])

SWIPE = SceneKind("swipe", L("Swipe reveal", "Шторка «было/стало»"), [
    Field("before_label", "text", L("Before label", "Подпись «было»"), max_len=20),
    Field("before", "textarea", L("Before", "Было"), required=True, max_len=80),
    Field("after_label", "text", L("After label", "Подпись «стало»"), max_len=20),
    Field("after", "textarea", L("After", "Стало"), required=True, max_len=80),
], (4.4, 3.0, 7.0), draw=draw_swipe, hint="Two punchy contrasting statements, 2-7 words each.",
    sfx=lambda sc, bc: [(sc["duration"] * .38, "whoosh", {"gain": -10})])

FEATURE = SceneKind("feature", L("Feature", "Фича"), [
    Field("icon", "select", L("Icon", "Иконка"), options=icon_options(), default="star"),
    Field("title", "text", L("Feature", "Фича"), required=True, max_len=50),
    Field("body", "textarea", L("Description", "Описание"), max_len=130),
], (3.8, 2.5, 7.0), draw=draw_feature, hint="One benefit per scene; title = the benefit, body = how.",
    sfx=lambda sc, bc: [(.1, "pop", {"gain": -12})])

SCREEN = screen_kind(hint="Show the finished product: a screenshot in a phone or browser frame.")

TEMPLATE = Template(
    id="before-after",
    name=L("Before / after showcase", "До / после"),
    description=L("Show a transformation or a product: side-by-side, swipe reveal, feature highlights.",
                  "Покажи трансформацию или продукт: сравнение, шторка «было/стало», фичи."),
    category="showcase",
    styles=["paper", "night", "sunrise"],
    fields=[handle_field()],
    scene_kinds=[intro_kind(), SWIPE, COMPARE, SCREEN, FEATURE, outro_kind()],
    min_scenes=2, max_scenes=10, music="uplift", transition="wipe",
    ai_notes="Transformation story: intro, a swipe reveal or side-by-side comparison, 1-3 feature scenes, outro. "
             "Points on both sides should mirror each other.",
    examples={
        "en": example("before-after", "en", "My habit tracker: before and after AI", [
            ("intro", 3.0, "I rebuilt my habit tracker with an AI agent. Here's the difference.",
             {"kicker": "Project", "title": "My habit tracker, rebuilt with AI"}),
            ("swipe", 4.4, "From a messy spreadsheet to an app I actually open.",
             {"before": "A spreadsheet I forgot about", "after": "An app I open every morning"}),
            ("compare", 5.5, "Before: manual, slow, no reminders. After: one tap, instant, and it nudges me.",
             {"before_title": "Before", "before_points": ["Manual entries", "No reminders", "Charts by hand"],
              "after_title": "After", "after_points": ["One-tap check-in", "Morning nudge", "Live streak chart"]}),
            ("screen", 4.5, "Here's the morning check-in screen.",
             {"device": "phone", "title": "One tap a day", "caption": "The whole app is one screen."}),
            ("feature", 3.8, "The best part: it took one weekend.",
             {"icon": "clock", "title": "Built in one weekend", "body": "Planned with Claude, shipped on Sunday night."}),
            ("outro", 3.4, "Want the prompt I used?", {"title": "Want my prompt?", "cta": "Comment “prompt”"}),
        ], fields={"handle": "@flowleaf66"}, style="paper"),
        "ru": example("before-after", "ru", "Трекер привычек: до и после ИИ", [
            ("intro", 3.0, "Я пересобрал свой трекер привычек с ИИ-агентом. Вот разница.",
             {"kicker": "Проект", "title": "Трекер привычек, пересобранный с ИИ"}),
            ("swipe", 4.4, "Из забытой таблицы — в приложение, которое я реально открываю.",
             {"before": "Таблица, про которую я забыл", "after": "Приложение, которое я открываю каждое утро"}),
            ("compare", 5.5, "Было: вручную, медленно, без напоминаний. Стало: одно касание, и оно само напоминает.",
             {"before_title": "Было", "before_points": ["Ручной ввод", "Нет напоминаний", "Графики руками"],
              "after_title": "Стало", "after_points": ["Отметка в одно касание", "Утреннее напоминание",
                                                       "Живой график серии"]}),
            ("screen", 4.5, "Вот экран утренней отметки.",
             {"device": "phone", "title": "Одно касание в день", "caption": "Всё приложение — один экран."}),
            ("feature", 3.8, "Самое приятное: всё заняло одни выходные.",
             {"icon": "clock", "title": "Готово за выходные", "body": "План — с Claude, релиз — в воскресенье вечером."}),
            ("outro", 3.4, "Хочешь мой промпт?", {"title": "Нужен мой промпт?", "cta": "Напиши «промпт»"}),
        ], fields={"handle": "@flowleaf66"}, style="paper"),
    },
)
