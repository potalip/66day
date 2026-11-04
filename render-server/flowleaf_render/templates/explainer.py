"""Animated explainer: intro -> numbered steps (icon, title, body) -> outro."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..icons import draw_icon, icon_options
from ..schema import Field, SceneKind, Template, L, example

DECO = {"paper": "dots", "sunrise": "leaves", "night": "dots"}


def step_progress(f: Frame, k, n, y, w, t):
    """Segmented progress bar: k (0-based) of n steps; the current segment fills in."""
    ctx, s, P = f.ctx, f.s, f.P
    gap = 14 * s
    sw = (w - gap * (n - 1)) / n
    x = f.cx - w / 2
    for j in range(n):
        u = 1 if j < k else ease(t, .1, .7, out_cubic) if j == k else 0
        progress_bar(f, x + j * (sw + gap), y, sw, 10 * s, u)


def draw_step(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W = x1 - x0
    fl = sc["fields"]
    n, k = bc.count, bc.nth
    label = (f"ШАГ {k + 1} ИЗ {n}" if f.lang == "ru" else f"STEP {k + 1} OF {n}")
    bar_w = min(W, f.pick(W, W * .5, 900 * s))
    step_progress(f, k, n, y0 + (10 if f.vertical else 0) * s, bar_w, t)
    text(ctx, label, f.cx, y0 + 70 * s, 28 * s, "Bold", P.muted, ease(t, 0, .4), tracking=.14)

    a_card = ease(t, .05, .55)
    rise = (1 - ease(t, .05, .65, out_back)) * 80 * s
    title_size0 = f.pick(92, 76, 96) * s
    body_size0 = f.pick(50, 42, 50) * s
    icon_r = f.pick(120, 90, 140) * s
    top_area = y0 + f.pick(130, 120, 120) * s
    area_h = y1 - top_area
    if f.wide:
        cw = min(W, 1560 * s); cx0 = f.cx - cw / 2
        pad = 90 * s
        tx = cx0 + pad + 2 * icon_r + 90 * s; tw = cx0 + cw - pad - tx
        tsize, tl = fit(fl["title"], tw, area_h * .4, title_size0, "ExtraBold", 36 * s, lh=1.1, max_lines=3)
        th = tsize * (.727 + 1.1 * (len(tl) - 1))
        bsize, bl = fit(fl.get("body", ""), tw, area_h * .4, body_size0, "Medium", 26 * s, lh=1.35, max_lines=5) \
            if fl.get("body") else (body_size0, [])
        bh = bsize * (.727 + 1.35 * (len(bl) - 1)) if bl else 0
        content = max(2 * icon_r, th + (50 * s + bh if bl else 0))
        ch = content + 2 * pad
        cy0 = top_area + (area_h - ch) / 2 + rise
        card(f, cx0, cy0, cw, ch, alpha=a_card)
        ix, iy = cx0 + pad + icon_r, cy0 + ch / 2
        ty = iy - (th + (50 * s + bh if bl else 0)) / 2
        align, tx_anchor = "l", tx
    else:
        cw = W; cx0 = x0
        pad = f.pick(80, 60, 0) * s
        tw = cw - 2 * 70 * s
        tsize, tl = fit(fl["title"], tw, area_h * .3, title_size0, "ExtraBold", 36 * s, lh=1.1, max_lines=3)
        th = tsize * (.727 + 1.1 * (len(tl) - 1))
        body_max = area_h - 2 * pad - 2 * icon_r - 70 * s - th - 50 * s
        bsize, bl = fit(fl.get("body", ""), tw, body_max, body_size0, "Medium", 26 * s, lh=1.35,
                        max_lines=6) if fl.get("body") else (body_size0, [])
        bh = bsize * (.727 + 1.35 * (len(bl) - 1)) if bl else 0
        ch = 2 * pad + 2 * icon_r + 70 * s + th + (50 * s + bh if bl else 0)
        cy0 = top_area + (area_h - ch) / 2 + rise
        card(f, cx0, cy0, cw, ch, alpha=a_card)
        ix, iy = f.cx, cy0 + pad + icon_r
        ty = iy + icon_r + 70 * s
        align, tx_anchor = "m", f.cx
    # icon badge
    iu = prog(t, .25, .75)
    if iu > 0:
        e = out_back(iu, 2.2)
        circle(ctx, ix, iy, icon_r * e, P.accent, .14 if not P.dark else .2)
        ring(ctx, ix, iy, icon_r * e, P.accent, 4 * s, ease(t, .3, 1.1, out_cubic), 1)
        draw_icon(ctx, fl.get("icon", "idea"), ix, iy, icon_r * 1.0, P.accent, min(1, iu * 2), width=1.8, scale=e)
        # step number chip
        nx, ny = ix + icon_r * .78, iy - icon_r * .78
        circle(ctx, nx, ny, 38 * s * e, P.accent2)
        text(ctx, str(k + 1), nx, ny, 38 * s * e, "Black", P.on_accent if not P.dark else P.bg, min(1, iu * 2))
    paragraph(ctx, tl, tx_anchor, ty, tsize, "ExtraBold", P.fg, align=align, lh=1.1, reveal=.45, t=t, stagger=.08)
    if bl:
        paragraph(ctx, bl, tx_anchor, ty + th + 50 * s, bsize, "Medium", P.muted, align=align, lh=1.35,
                  reveal=.75, t=t, stagger=.07)
    handle_tag(f, bc.g.get("handle"), 1)


STEP = SceneKind("step", L("Step", "Шаг"), [
    Field("icon", "select", L("Icon", "Иконка"), options=icon_options(), default="idea"),
    Field("title", "text", L("Step title", "Название шага"), required=True, max_len=60),
    Field("body", "textarea", L("Explanation", "Пояснение"), max_len=160),
], (4.2, 2.5, 8.0), draw=draw_step, hint="One action per step. Title = imperative, 2-6 words. Body = 1-2 short sentences.",
    sfx=lambda sc, bc: [(.3, "pop", {"gain": -12})])

TEMPLATE = Template(
    id="explainer",
    name=L("Step-by-step explainer", "Пошаговый explainer"),
    description=L("Animated how-to: numbered steps with icons and a progress bar.",
                  "Анимированная инструкция: шаги с иконками и прогресс-баром."),
    category="explainer",
    styles=["paper", "sunrise", "night"],
    fields=[handle_field()],
    scene_kinds=[intro_kind(), STEP, outro_kind()],
    min_scenes=2, max_scenes=9, music="calm", transition="wipe",
    ai_notes="Teach one process in 3-5 steps. Intro states the outcome; each step is one action with a fitting icon; "
             "outro gives a next action.",
    examples={
        "en": example("explainer", "en", "Ship your first app with an AI agent", [
            ("intro", 3.2, "Here's how to ship your first app with an AI coding agent, in four steps.",
             {"kicker": "4 steps", "title": "Ship your first app with an AI agent",
              "subtitle": "No coding background needed."}),
            ("step", 4.2, "First, describe the problem in one sentence. Who is it for, and what does it fix?",
             {"icon": "idea", "title": "Describe the problem",
              "body": "One sentence: who it's for and what it fixes."}),
            ("step", 4.2, "Ask the agent for a plan before any code. Read it and push back.",
             {"icon": "chat", "title": "Ask for a plan first",
              "body": "Read the plan, push back, then let it write code."}),
            ("step", 4.2, "Run it, click everything, and paste errors straight back to the agent.",
             {"icon": "code", "title": "Run it and break it", "body": "Paste every error back to the agent."}),
            ("step", 4.2, "Deploy it and send the link to one real person today.",
             {"icon": "rocket", "title": "Ship it today", "body": "Deploy and send the link to one real person."}),
            ("outro", 3.4, "Follow for day two.", {"title": "Your turn.", "subtitle": "Share your link in the comments.",
                                                    "cta": "Follow for Day 2"}),
        ], fields={"handle": "@flowleaf66"}, style="paper"),
        "ru": example("explainer", "ru", "Первое приложение с ИИ-агентом", [
            ("intro", 3.2, "Как выпустить первое приложение с ИИ-агентом — за четыре шага.",
             {"kicker": "4 шага", "title": "Первое приложение с ИИ-агентом",
              "subtitle": "Опыт в программировании не нужен."}),
            ("step", 4.2, "Сначала опиши проблему одним предложением. Для кого это и что это решает?",
             {"icon": "idea", "title": "Опиши проблему", "body": "Одно предложение: для кого и что решает."}),
            ("step", 4.2, "Попроси у агента план, а не код. Прочитай и поспорь.",
             {"icon": "chat", "title": "Сначала — план", "body": "Прочитай план, поспорь — и только потом код."}),
            ("step", 4.2, "Запусти, потыкай всё подряд и отправляй ошибки обратно агенту.",
             {"icon": "code", "title": "Запусти и сломай", "body": "Каждую ошибку — обратно агенту."}),
            ("step", 4.2, "Задеплой и отправь ссылку одному живому человеку сегодня.",
             {"icon": "rocket", "title": "Выпусти сегодня", "body": "Задеплой и отправь ссылку живому человеку."}),
            ("outro", 3.4, "Подпишись — завтра день второй.",
             {"title": "Твоя очередь.", "subtitle": "Кидай ссылку в комментарии.", "cta": "Подписаться"}),
        ], fields={"handle": "@flowleaf66"}, style="paper"),
    },
)
