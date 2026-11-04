"""Quiz short: a question with 2-4 options, a countdown, then the answer lights up with a one-line explanation."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example

DECO = {"sunrise": "leaves", "night": "dots", "forest": "rings"}
LETTERS = "ABCD"


def draw_question(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    W = f.measure(x1 - x0) if not f.wide else min(x1 - x0, 1500 * s)
    bx = f.cx - W / 2
    opts = [o for o in fl.get("options", []) if o][:4]
    ans = max(1, min(len(opts), int(fl.get("answer") or 1))) - 1 if opts else 0
    dur = sc["duration"]
    think = float(fl.get("think") or 3)
    reveal = min(dur - 1.2, .9 + think)          # when the answer shows
    ru = f.lang == "ru"
    # header: question number + countdown ring
    n_label = (f"ВОПРОС {bc.nth + 1}" if ru else f"QUESTION {bc.nth + 1}") + (f" / {bc.count}" if bc.count > 1 else "")
    text(ctx, n_label, bx, y0 + 30 * s, 30 * s, "Bold", P.muted, ease(t, 0, .4), "lm", tracking=.12)
    rr = 46 * s; rcx, rcy = bx + W - rr, y0 + 30 * s
    left = max(0, reveal - t)
    if t < reveal + .3:
        a = ease(t, .1, .4) * (1 - prog(t, reveal, reveal + .3))
        ring(ctx, rcx, rcy, rr, P.line, 8 * s, 1, a)
        ring(ctx, rcx, rcy, rr, P.accent2, 8 * s, left / max(.1, reveal - .9) if t > .9 else 1, a)
        text(ctx, str(int(left + .999)), rcx, rcy, 40 * s, "Black", P.fg, a)
    # question
    q = fl.get("question", "")
    qs, ql = fit(q, W, (y1 - y0) * .3, f.pick(80, 64, 72) * s, "ExtraBold", 32 * s, lh=1.12, max_lines=4)
    qh = qs * (.727 + 1.12 * (len(ql) - 1))
    qy = y0 + 120 * s
    paragraph(ctx, ql, bx, qy, qs, "ExtraBold", P.fg, align="l", lh=1.12, reveal=.15, t=t, stagger=.08)
    # options
    expl = fl.get("explanation", "")
    top = qy + qh + f.pick(80, 50, 60) * s
    bottom = y1 - (f.pick(220, 130, 120) * s if expl else 0)
    n = max(1, len(opts))
    gap = f.pick(30, 20, 24) * s
    oh = min(f.pick(170, 110, 120) * s, (bottom - top - gap * (n - 1)) / n)
    ru_ = reveal
    top += max(0, (bottom - top - n * oh - (n - 1) * gap) * .35)
    for k, o in enumerate(opts):
        y = top + k * (oh + gap)
        u = ease(t, .5 + k * .12, .9 + k * .12, out_back)
        if u <= 0: continue
        rv = ease(t, ru_, ru_ + .35)
        good = k == ans
        dim = 1 - .55 * rv * (not good)
        dx = (1 - u) * 60 * s
        fill = mixc(P.surface, P.accent, .18 * rv) if good else P.surface
        card(f, bx + dx, y, W, oh, oh * .3, alpha=min(1, u) * dim, color=fill)
        if good and rv > 0:
            stroke_rrect(ctx, bx + dx + 2, y + 2, W - 4, oh - 4, oh * .3, P.accent, 5 * s, rv)
        cr = oh * .3
        cx = bx + dx + oh * .5
        circle(ctx, cx, y + oh / 2, cr, P.accent if good and rv > .5 else P.line, min(1, u) * dim)
        if good and rv > .5:
            checkmark(ctx, cx, y + oh / 2, cr, ease(t, ru_ + .1, ru_ + .5), P.accent, P.on_accent)
        else:
            text(ctx, LETTERS[k], cx, y + oh / 2, cr * 1.05, "Black", P.fg if not good or rv <= .5 else P.on_accent, min(1, u) * dim)
        tw = W - oh * 1.2 - 40 * s
        os_, ol = fit(o, tw, oh * .8, min(f.pick(46, 38, 40) * s, oh * .36), "SemiBold", 18 * s, lh=1.15, max_lines=2)
        paragraph(ctx, ol, bx + dx + oh * 1.0, y + oh / 2, os_, "SemiBold", P.fg, min(1, u) * dim, align="l", lh=1.15, valign="m")
    if expl:
        ea = ease(t, ru_ + .45, ru_ + .85)
        es, el = fit(expl, W, f.pick(180, 110, 100) * s, f.pick(42, 34, 36) * s, "Medium", 20 * s, lh=1.3, max_lines=3)
        paragraph(ctx, el, bx, bottom + 50 * s, es, "Medium", P.muted, ea, align="l", lh=1.3)
    handle_tag(f, bc.g.get("handle"), 1) if f.vertical else None


QUESTION = SceneKind("question", L("Question", "Вопрос"), [
    Field("question", "textarea", L("Question", "Вопрос"), required=True, max_len=120),
    Field("options", "list", L("Answer options (2-4, one per line)", "Варианты ответа (2-4, по строке)"),
          min_items=2, max_items=4, max_len=60),
    Field("answer", "number", L("Correct option (1-4)", "Правильный вариант (1-4)"), min=1, max=4, default=1),
    Field("think", "number", L("Seconds to think", "Секунд на размышление"), min=1, max=8, default=3),
    Field("explanation", "textarea", L("Why (shown after the reveal)", "Почему (после ответа)"), max_len=130),
], (7.0, 4.0, 12.0), draw=draw_question,
    hint="One clear question, 3 short options, exactly one correct (answer = its number). Explanation = one sentence.",
    sfx=lambda sc, bc: [(.5, "pop", {"gain": -14})] + [(.9 + k, "tick", {"gain": -10})
                         for k in range(int(sc["fields"].get("think") or 3))]
    + [(min(sc["duration"] - 1.2, .9 + float(sc["fields"].get("think") or 3)), "ding", {"gain": -10})])

TEMPLATE = Template(
    id="quiz",
    name=L("Quiz short", "Квиз"),
    description=L("Ask a question, count down, reveal the answer. Great for engagement and revision.",
                  "Вопрос, обратный отсчёт и ответ. Отлично вовлекает и помогает повторить материал."),
    category="education",
    styles=["sunrise", "night", "forest"],
    fields=[handle_field()],
    scene_kinds=[intro_kind(hint="Tease the quiz: e.g. 'Only 1 in 3 gets this right'."), QUESTION, outro_kind()],
    min_scenes=1, max_scenes=8, music="uplift", transition="wipe",
    ai_notes="1-4 questions that test one concept from the brief. Options short and plausible; exactly one correct. "
             "Narration reads the question, then (after the think time) states the answer.",
    examples={
        "en": example("quiz", "en", "Quick quiz: AI coding agents", [
            ("intro", 2.8, "Quick quiz. Only one in three beginners gets this right.",
             {"kicker": "Quiz", "title": "Can you spot the right move?", "subtitle": "2 questions · 3 seconds each"}),
            ("question", 7.0, "Your agent's code throws an error. What's the best first move? ... Paste the full error back to the agent.",
             {"question": "Your agent's code throws an error. Best first move?",
              "options": ["Start over from scratch", "Paste the full error back to the agent", "Ignore it and keep going"],
              "answer": 2, "think": 3, "explanation": "The error message is the agent's best clue. Give it all of it."}),
            ("question", 7.0, "What should you ask for before any code? ... A plan.",
             {"question": "What should you ask the agent for before any code?",
              "options": ["A plan", "A logo", "A longer prompt"], "answer": 1, "think": 3,
              "explanation": "Read the plan, push back, then let it build."}),
            ("outro", 3.2, "How many did you get? Tell me in the comments.",
             {"title": "2 out of 2?", "subtitle": "Tell me in the comments.", "cta": "Follow for more"}),
        ], fields={"handle": "@flowleaf66"}, style="sunrise"),
        "ru": example("quiz", "ru", "Квиз: ИИ-агенты для кода", [
            ("intro", 2.8, "Быстрый квиз. Правильно отвечает только каждый третий новичок.",
             {"kicker": "Квиз", "title": "Угадаешь правильный ход?", "subtitle": "2 вопроса · по 3 секунды"}),
            ("question", 7.0, "Код агента падает с ошибкой. Что делать первым делом? ... Скопировать ошибку целиком агенту.",
             {"question": "Код от агента падает с ошибкой. Первый шаг?",
              "options": ["Начать всё заново", "Отдать агенту ошибку целиком", "Не обращать внимания"],
              "answer": 2, "think": 3, "explanation": "Текст ошибки — лучшая подсказка для агента. Дай его полностью."}),
            ("question", 7.0, "Что попросить у агента до того, как он начнёт писать код? ... План.",
             {"question": "Что попросить у агента до любого кода?",
              "options": ["План", "Логотип", "Промпт подлиннее"], "answer": 1, "think": 3,
              "explanation": "Прочитай план, поспорь — и только потом пусть пишет."}),
            ("outro", 3.2, "Сколько правильных? Пиши в комментариях.",
             {"title": "Два из двух?", "subtitle": "Пиши в комментариях.", "cta": "Подписаться"}),
        ], fields={"handle": "@flowleaf66"}, style="sunrise"),
    },
)
