"""Top-N listicle: intro -> ranked items (big rank number + card) -> outro. Countdown or count-up."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example

DECO = {"forest": "rings", "sunrise": "leaves", "night": "dots"}


def rank_of(bc: BuildCtx):
    return bc.count - bc.nth if bc.g.get("order", "countdown") == "countdown" else bc.nth + 1


def rank_chips(f: Frame, bc: BuildCtx, cx, y, t):
    """Row of small rank chips; the current one is filled."""
    ctx, s, P = f.ctx, f.s, f.P
    n = bc.count
    ranks = [(n - j if bc.g.get("order", "countdown") == "countdown" else j + 1) for j in range(n)]
    r = 26 * s; gap = 18 * s
    total = n * 2 * r + (n - 1) * gap
    x = cx - total / 2 + r
    for j, rk in enumerate(ranks):
        cur = j == bc.nth
        done = j < bc.nth
        a = ease(t, .05 + j * .04, .35 + j * .04)
        if cur:
            u = ease(t, .2, .6, out_back)
            circle(ctx, x, y, r * lerp(.8, 1.15, u), P.accent, a)
            text(ctx, str(rk), x, y, 24 * s, "Black", P.on_accent, a)
        else:
            circle(ctx, x, y, r, P.surface if not done else P.line, a)
            ring(ctx, x, y, r, P.line, 2 * s, 1, a)
            text(ctx, str(rk), x, y, 22 * s, "Bold", P.muted, a)
        x += 2 * r + gap


def draw_item(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W = x1 - x0
    fl = sc["fields"]
    rank = rank_of(bc)
    topic = bc.g.get("topic", "")
    if topic:
        text(ctx, topic.upper(), f.cx, y0 + 10 * s, 28 * s, "Bold", P.muted, ease(t, 0, .4), tracking=.12, max_w=W * .9)
    rank_chips(f, bc, f.cx, y0 + 80 * s, t)
    top = y0 + 150 * s
    num = f"#{rank}"
    slide = (1 - ease(t, .05, .6, out_expo)) * W * .6
    if f.wide:
        nsize = 400 * s
        nx = x0 + 300 * s + slide
        ny = (top + y1) / 2
        text(ctx, num, nx, ny, nsize, "Black", P.accent, ease(t, .05, .3), "mm")
        cx0 = x0 + 620 * s; cw = x1 - cx0
        pad = 70 * s; tw = cw - 2 * pad
        ts, tl = fit(fl["title"], tw, (y1 - top) * .4, 92 * s, "ExtraBold", 34 * s, lh=1.08, max_lines=3)
        th = ts * (.727 + 1.08 * (len(tl) - 1))
        ns, nl = fit(fl.get("note", ""), tw, (y1 - top) * .35, 48 * s, "Medium", 24 * s, lh=1.35, max_lines=4) \
            if fl.get("note") else (0, [])
        nh = ns * (.727 + 1.35 * (len(nl) - 1)) if nl else 0
        ch = 2 * pad + th + (44 * s + nh if nl else 0)
        cy0 = ny - ch / 2 + (1 - ease(t, .25, .75, out_back)) * 60 * s
        card(f, cx0, cy0, cw, ch, alpha=ease(t, .25, .6))
        align, tx = "l", cx0 + pad
    else:
        nsize = f.pick(330, 230, 0) * s
        ny = top + nsize * .45
        cw = W; cx0 = x0
        pad = 64 * s; tw = cw - 2 * pad
        ctop = ny + nsize * .5 + 40 * s
        avail = y1 - ctop
        ts, tl = fit(fl["title"], tw, avail * .45, f.pick(88, 72, 0) * s, "ExtraBold", 34 * s, lh=1.08, max_lines=3)
        th = ts * (.727 + 1.08 * (len(tl) - 1))
        ns, nl = fit(fl.get("note", ""), tw, avail - th - 2 * pad - 44 * s, f.pick(48, 40, 0) * s, "Medium", 24 * s,
                     lh=1.35, max_lines=5) if fl.get("note") else (0, [])
        nh = ns * (.727 + 1.35 * (len(nl) - 1)) if nl else 0
        ch = 2 * pad + th + (44 * s + nh if nl else 0)
        dy = max(0, (y1 - (ctop + ch)) / 2 - 40 * s)
        ny += dy
        text(ctx, num, f.cx + slide, ny, nsize, "Black", P.accent, ease(t, .05, .3), "mm")
        cy0 = ctop + dy + (1 - ease(t, .25, .75, out_back)) * 60 * s
        card(f, cx0, cy0, cw, ch, alpha=ease(t, .25, .6))
        align, tx = "m", f.cx
    paragraph(ctx, tl, tx, cy0 + pad, ts, "ExtraBold", P.fg, align=align, lh=1.08, reveal=.45, t=t)
    if nl:
        paragraph(ctx, nl, tx, cy0 + pad + th + 44 * s, ns, "Medium", P.muted, align=align, lh=1.35, reveal=.7, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


ITEM = SceneKind("item", L("List item", "Пункт"), [
    Field("title", "text", L("Item", "Пункт"), required=True, max_len=60),
    Field("note", "textarea", L("Why it's on the list", "Почему он в списке"), max_len=150),
], (3.8, 2.2, 7.0), draw=draw_item, hint="Item title 1-5 words; note = one concrete reason or tip.",
    sfx=lambda sc, bc: [(.08, "whoosh", {"gain": -16}), (.35, "pop", {"gain": -12})])

TEMPLATE = Template(
    id="listicle",
    name=L("Top-N list", "Топ-N список"),
    description=L("Ranked countdown with big numbers. Tools, tips, mistakes, ideas.",
                  "Рейтинг с крупными номерами: инструменты, советы, ошибки, идеи."),
    category="list",
    styles=["forest", "sunrise", "night"],
    fields=[
        Field("topic", "text", L("List topic (small header on every item)", "Тема списка (мелко над пунктами)"),
              max_len=40),
        Field("order", "select", L("Order", "Порядок"), options=[
            {"value": "countdown", "label": L("Countdown (5 → 1)", "Обратный отсчёт (5 → 1)")},
            {"value": "countup", "label": L("Count up (1 → 5)", "По порядку (1 → 5)")}], default="countdown"),
        handle_field(),
    ],
    scene_kinds=[intro_kind(), ITEM, outro_kind()],
    min_scenes=2, max_scenes=12, music="uplift", transition="wipe",
    ai_notes="3-7 items. In countdown order the best item comes last. Keep item titles short and specific "
             "(real tool names, concrete habits).",
    examples={
        "en": example("listicle", "en", "5 habits of people who actually ship", [
            ("intro", 3.0, "Five habits of people who actually ship.",
             {"kicker": "Top 5", "title": "Habits of people who actually ship"}),
            ("item", 3.6, "Five: they write the README first.",
             {"title": "Write the README first", "note": "If you can't explain it in 3 lines, you can't build it."}),
            ("item", 3.6, "Four: they commit every small win.",
             {"title": "Commit every small win", "note": "Small commits make every mistake cheap to undo."}),
            ("item", 3.6, "Three: they ask the AI to explain before it edits.",
             {"title": "Ask \"why\" before \"do\"", "note": "Make the agent explain its plan before it edits code."}),
            ("item", 3.6, "Two: they show unfinished work.",
             {"title": "Show unfinished work", "note": "Feedback on day 3 beats applause on day 30."}),
            ("item", 3.8, "And number one: they ship something every single day.",
             {"title": "Ship something daily", "note": "A tiny deploy a day compounds into a portfolio."}),
            ("outro", 3.4, "Which one are you starting today?",
             {"title": "Pick one. Start today.", "cta": "Save this list"}),
        ], fields={"topic": "Habits that ship", "order": "countdown", "handle": "@flowleaf66"}, style="forest"),
        "ru": example("listicle", "ru", "5 привычек тех, кто доводит до релиза", [
            ("intro", 3.0, "Пять привычек людей, которые реально доводят проекты до релиза.",
             {"kicker": "Топ-5", "title": "Привычки тех, кто доводит до релиза"}),
            ("item", 3.6, "Пятое: сначала пишут README.",
             {"title": "Сначала README", "note": "Не можешь объяснить в трёх строках — не сможешь и сделать."}),
            ("item", 3.6, "Четвёртое: коммитят каждую маленькую победу.",
             {"title": "Коммит на каждую победу", "note": "Маленькие коммиты — дешёвые ошибки."}),
            ("item", 3.6, "Третье: просят ИИ объяснить, прежде чем править.",
             {"title": "Сначала «почему»", "note": "Пусть агент объяснит план, прежде чем трогать код."}),
            ("item", 3.6, "Второе: показывают недоделанное.",
             {"title": "Показывают черновики", "note": "Отзыв на третий день ценнее лайков на тридцатый."}),
            ("item", 3.8, "И первое: выпускают что-то каждый день.",
             {"title": "Релиз каждый день", "note": "Маленький деплой в день складывается в портфолио."}),
            ("outro", 3.4, "С какой начнёшь сегодня?",
             {"title": "Выбери одну. Начни сегодня.", "cta": "Сохрани список"}),
        ], fields={"topic": "Привычки для релиза", "order": "countdown", "handle": "@flowleaf66"}, style="forest"),
    },
)
