"""AI tool comparison: A vs B — a versus card, criteria with racing score bars, and a verdict."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..icons import draw_icon
from ..schema import Field, SceneKind, Template, L, example

DECO = {"night": "dots", "paper": "dots", "forest": "rings"}


def colors(P):
    """Side A = accent, side B = accent2."""
    return P.accent, P.accent2


def names(bc: BuildCtx):
    return bc.g.get("a_name") or "A", bc.g.get("b_name") or "B"


def draw_versus(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W, H = x1 - x0, y1 - y0
    fl = sc["fields"]
    a, b = names(bc)
    ca, cb = colors(P)
    tags = [fl.get("a_tag", ""), fl.get("b_tag", "")]
    gap = 120 * s
    if f.vertical:
        cw, ch = W, (H - gap) / 2 - 20 * s
        boxes = [(x0, y0 + 20 * s, cw, ch), (x0, y0 + 20 * s + ch + gap, cw, ch)]
        vs = (f.cx, y0 + 20 * s + ch + gap / 2)
    else:
        cw, ch = (W - gap) / 2, min(H, 620 * s)
        boxes = [(x0, f.cy - ch / 2, cw, ch), (x0 + cw + gap, f.cy - ch / 2, cw, ch)]
        vs = (f.cx, f.cy)
    for k, ((x, y, w, h), name, tag, col) in enumerate(zip(boxes, (a, b), tags, (ca, cb))):
        u = ease(t, .1 + k * .25, .7 + k * .25, out_back)
        if u <= 0: continue
        d = (1 - u) * (-1 if k == 0 else 1) * 300 * s
        dx, dy = (0, d) if f.vertical else (d, 0)
        card(f, x + dx, y + dy, w, h, 40 * s, alpha=min(1, u))
        fill_rrect(ctx, x + dx, y + dy, w, 18 * s, 9 * s, col, min(1, u))
        ns, nl = fit(name, w * .82, h * .4, f.pick(110, 84, 96) * s, "Black", 36 * s, lh=1.0, max_lines=2)
        nh = ns * (.727 + (len(nl) - 1))
        ts, tl = fit(tag, w * .8, h * .3, f.pick(40, 34, 36) * s, "Medium", 20 * s, lh=1.3, max_lines=3) if tag else (0, [])
        th = ts * (.727 + 1.3 * (len(tl) - 1)) if tl else 0
        cy0 = y + dy + h / 2 - (nh + (40 * s + th if tl else 0)) / 2
        paragraph(ctx, nl, x + dx + w / 2, cy0, ns, "Black", P.fg, min(1, u), lh=1.0)
        if tl: paragraph(ctx, tl, x + dx + w / 2, cy0 + nh + 40 * s, ts, "Medium", P.muted, ease(t, .6 + k * .25, 1 + k * .25), lh=1.3)
    vu = ease(t, .7, 1.1, out_back)
    if vu > 0:
        circle(ctx, vs[0], vs[1], 78 * s * vu, P.fg)
        text(ctx, "VS", vs[0], vs[1], 54 * s * vu, "Black", P.bg, min(1, vu * 2))
    handle_tag(f, bc.g.get("handle"), 1) if not f.vertical else None


def draw_criterion(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W = min(x1 - x0, 1400 * s)
    bx = f.cx - W / 2
    fl = sc["fields"]
    a, b = names(bc)
    ca, cb = colors(P)
    sa, sb_ = float(fl.get("a_score") or 0), float(fl.get("b_score") or 0)
    label = fl.get("label", "")
    ru = f.lang == "ru"
    ls, ll = fit(label, W, 260 * s, f.pick(96, 80, 88) * s, "Black", 36 * s, lh=1.05, max_lines=2)
    lh_ = ls * (.727 + 1.05 * (len(ll) - 1))
    row_h = f.pick(300, 200, 220) * s
    total = 90 * s + lh_ + f.pick(110, 70, 80) * s + 2 * row_h
    y0 = y0 + max(0, (y1 - y0 - total) / 2 - 30 * s)
    text(ctx, (f"КРИТЕРИЙ {bc.nth + 1}" if ru else f"ROUND {bc.nth + 1}"), bx, y0 + 30 * s, 30 * s, "Bold", P.muted,
         ease(t, 0, .3), "lm", tracking=.12)
    kinetic_lines(f, ll, bx, y0 + 90 * s, ls, .1, "Black", align="l", valign="t", lh=1.05)
    top = y0 + 90 * s + lh_ + f.pick(110, 70, 80) * s
    rows = [(a, sa, fl.get("a_note", ""), ca), (b, sb_, fl.get("b_note", ""), cb)]
    win = 0 if sa > sb_ else 1 if sb_ > sa else -1
    for k, (name, sc_, note, col) in enumerate(rows):
        y = top + k * row_h
        a_ = ease(t, .4 + k * .2, .7 + k * .2)
        u = ease(t, .6 + k * .2, 1.8 + k * .2, out_expo)
        ns = f.pick(48, 40, 44) * s
        text(ctx, name, bx, y, ns, "ExtraBold", P.fg, a_, "lm", max_w=W * .6)
        text(ctx, counter_text(sc_ * u, 1 if not float(sc_).is_integer() else 0, "", "/10", f.lang), bx + W, y, ns, "Black",
             col if k == win else P.fg, a_, "rm")
        bh = f.pick(40, 30, 32) * s
        by = y + ns * .9
        fill_rrect(ctx, bx, by, W, bh, bh / 2, P.line, a_)
        fill_rrect(ctx, bx, by, max(bh, W * min(1, sc_ / 10) * u), bh, bh / 2, col, a_)
        if k == win and u > .95:
            draw_icon(ctx, "star", bx + W * min(1, sc_ / 10) - bh * .5, by + bh / 2, bh * .7, P.on_accent if col == P.accent else P.bg, ease(t, 1.8, 2.1), 2.4)
        if note:
            nts, ntl = fit(note, W, row_h * .3, f.pick(38, 30, 32) * s, "Medium", 18 * s, lh=1.25, max_lines=2)
            paragraph(ctx, ntl, bx, by + bh + 34 * s, nts, "Medium", P.muted, ease(t, 1.2 + k * .2, 1.6 + k * .2), align="l", lh=1.25)
    handle_tag(f, bc.g.get("handle"), 1) if f.vertical else None


def draw_verdict(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index, lift=(f.cx, f.cy * .8))
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0)
    fl = sc["fields"]
    a, b = names(bc)
    ca, cb = colors(P)
    w = fl.get("winner", "a")
    ru = f.lang == "ru"
    name = a if w == "a" else b if w == "b" else (f"{a} = {b}")
    col = ca if w == "a" else cb if w == "b" else P.fg
    label = fl.get("label") or (("НИЧЬЯ" if ru else "IT'S A TIE") if w == "tie" else ("ПОБЕДИТЕЛЬ" if ru else "WINNER"))
    R = f.pick(150, 110, 120) * s
    top = f.cy - f.pick(380, 280, 280) * s
    u = ease(t, .05, .6, out_back)
    glow(ctx, f.cx, top + R, R * 2.2, col, .3 * u)
    circle(ctx, f.cx, top + R, R * u, col)
    draw_icon(ctx, "star", f.cx, top + R, R * 1.1 * u, P.bg if P.dark else "#FFFFFF", min(1, u * 2), 2.4)
    text(ctx, label, f.cx, top + 2 * R + 80 * s, 32 * s, "Bold", P.muted, ease(t, .3, .6), tracking=.14)
    ns, nl = fit(name, W, 260 * s, f.pick(130, 110, 120) * s, "Black", 40 * s, lh=1.0, max_lines=2)
    kinetic_lines(f, nl, f.cx, top + 2 * R + 140 * s, ns, .45, "Black", color=P.fg, valign="t", lh=1.0)
    nh = ns * (.727 + (len(nl) - 1))
    if fl.get("reason"):
        rs, rl = fit(fl["reason"], W * .92, 260 * s, f.pick(48, 40, 42) * s, "Medium", 24 * s, lh=1.35, max_lines=4)
        paragraph(ctx, rl, f.cx, top + 2 * R + 200 * s + nh, rs, "Medium", P.muted, lh=1.35, reveal=.9, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


VERSUS = SceneKind("versus", L("Versus card", "Карточка «против»"), [
    Field("a_tag", "text", L("A: one-line description", "A: описание в одну строку"), max_len=60),
    Field("b_tag", "text", L("B: one-line description", "B: описание в одну строку"), max_len=60),
], (3.4, 2.2, 6.0), draw=draw_versus, hint="Introduce both tools in one line each.",
    sfx=lambda sc, bc: [(.1, "whoosh", {"gain": -12}), (.35, "whoosh", {"gain": -12}), (.8, "impact", {"gain": -16})])

CRITERION = SceneKind("criterion", L("Criterion", "Критерий"), [
    Field("label", "text", L("What you compare", "Что сравниваем"), required=True, max_len=50),
    Field("a_score", "number", L("A score (0-10)", "Оценка A (0-10)"), min=0, max=10, default=7),
    Field("a_note", "text", L("A: why", "A: почему"), max_len=80),
    Field("b_score", "number", L("B score (0-10)", "Оценка B (0-10)"), min=0, max=10, default=7),
    Field("b_note", "text", L("B: why", "B: почему"), max_len=80),
], (4.6, 3.0, 8.0), draw=draw_criterion,
    hint="One criterion per scene (speed, price, quality of code...). Honest scores 0-10 from the creator's own tests.",
    sfx=lambda sc, bc: [(.6, "riser", {"gain": -20, "dur": 1.2}), (1.8, "ding", {"gain": -16})])

VERDICT = SceneKind("verdict", L("Verdict", "Вердикт"), [
    Field("winner", "select", L("Winner", "Победитель"), options=[
        {"value": "a", "label": L("A", "A")}, {"value": "b", "label": L("B", "B")}, {"value": "tie", "label": L("Tie", "Ничья")}],
        default="a"),
    Field("label", "text", L("Label (default: Winner)", "Метка (по умолчанию «Победитель»)"), max_len=30),
    Field("reason", "textarea", L("Why", "Почему"), max_len=140),
], (4.0, 2.5, 7.0), draw=draw_verdict, hint="Name the winner for a specific use case and say why in one sentence.",
    sfx=lambda sc, bc: [(.1, "impact", {"gain": -14}), (.5, "cash", {"gain": -16})])

TEMPLATE = Template(
    id="compare",
    name=L("AI tool comparison", "Сравнение ИИ-инструментов"),
    description=L("A vs B: a versus card, score bars per criterion and a clear verdict.",
                  "A против B: карточка «против», оценки по критериям и честный вердикт."),
    category="comparison",
    styles=["night", "paper", "forest"],
    fields=[
        Field("a_name", "text", L("Tool A", "Инструмент A"), required=True, max_len=30, default="Tool A"),
        Field("b_name", "text", L("Tool B", "Инструмент B"), required=True, max_len=30, default="Tool B"),
        handle_field(),
    ],
    scene_kinds=[intro_kind(hint="Frame the question: which one should a beginner use for X?"), VERSUS, CRITERION, VERDICT, outro_kind()],
    min_scenes=2, max_scenes=10, music="drive", transition="wipe",
    ai_notes="Compare two real tools or approaches for ONE concrete job. 2-4 criteria. Only use scores the creator "
             "gives in the brief or from their own test; never present invented benchmarks as facts.",
    examples={
        "en": example("compare", "en", "Chat assistant vs coding agent for your first app", [
            ("intro", 2.8, "Chat assistant or coding agent: which should you use for your first app?",
             {"kicker": "Versus", "title": "Which one for your first app?"}),
            ("versus", 3.4, "On the left, a chat assistant. On the right, a coding agent that edits your files.",
             {"a_tag": "You copy code back and forth", "b_tag": "It edits your project directly"}),
            ("criterion", 4.6, "Speed to a working page: the agent wins easily.",
             {"label": "Speed to a working page", "a_score": 5, "a_note": "Lots of copy-paste", "b_score": 9, "b_note": "Runs and fixes itself"}),
            ("criterion", 4.6, "Learning what's going on: the chat is a better teacher.",
             {"label": "Learning what's happening", "a_score": 8, "a_note": "You see every line", "b_score": 6, "b_note": "Ask it to explain"}),
            ("verdict", 4.0, "For shipping your first app: the coding agent. Ask it to explain as it goes.",
             {"winner": "b", "label": "For shipping", "reason": "Use the agent, and make it explain every change."}),
            ("outro", 3.2, "Which do you use? Comment below.", {"title": "Which do you use?", "cta": "Follow for more"}),
        ], fields={"a_name": "Chat assistant", "b_name": "Coding agent", "handle": "@flowleaf66"}, style="night"),
        "ru": example("compare", "ru", "Чат или агент для первого приложения", [
            ("intro", 2.8, "Чат-ассистент или агент для кода: что выбрать для первого приложения?",
             {"kicker": "Сравнение", "title": "Что выбрать для первого приложения?"}),
            ("versus", 3.4, "Слева — чат-ассистент. Справа — агент, который сам правит файлы.",
             {"a_tag": "Копируешь код туда-обратно", "b_tag": "Сам правит твой проект"}),
            ("criterion", 4.6, "Скорость до работающей страницы: агент выигрывает с запасом.",
             {"label": "Скорость до рабочей страницы", "a_score": 5, "a_note": "Много копипаста", "b_score": 9, "b_note": "Сам запускает и чинит"}),
            ("criterion", 4.6, "Понимание происходящего: чат учит лучше.",
             {"label": "Понимание, что происходит", "a_score": 8, "a_note": "Видишь каждую строку", "b_score": 6, "b_note": "Проси объяснять"}),
            ("verdict", 4.0, "Чтобы выпустить первое приложение — агент. Только проси объяснять каждый шаг.",
             {"winner": "b", "label": "Для релиза", "reason": "Бери агента — и пусть объясняет каждое изменение."}),
            ("outro", 3.2, "А ты чем пользуешься? Пиши в комментариях.", {"title": "А ты чем пользуешься?", "cta": "Подписаться"}),
        ], fields={"a_name": "Чат-ассистент", "b_name": "Агент для кода", "handle": "@flowleaf66"}, style="night"),
    },
)
