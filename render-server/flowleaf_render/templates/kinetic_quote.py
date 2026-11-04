"""Kinetic typography: hook / statement / quote. Big words that pop in, emphasis in the accent colour."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, headline_size, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example

DECO = {"paper": "dots", "night": "dots", "forest": "rings", "ink": "none"}


def _emph(s):
    return {"".join(ch for ch in w.lower() if ch.isalnum()) for w in str(s or "").replace(",", " ").split()}


def draw_hook(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    w = f.measure(x1 - x0)
    fl = sc["fields"]
    size, lines = fit(fl["text"], w, (y1 - y0) * .62, headline_size(f, 1.25), "Black", 44 * s, lh=1.04, max_lines=6)
    block = size * (.727 + (len(lines) - 1) * 1.04)
    kick = fl.get("kicker")
    top = f.cy - block / 2 - (50 * s if kick else 0)
    if kick:
        pill(f, kick.upper(), f.cx, top - 80 * s, 30 * s, alpha=ease(t, .0, .35))
    nwords = len(fl["text"].split())
    kinetic_lines(f, lines, f.cx, top, size, .15, "Black", valign="t", lh=1.04, stagger=min(.09, 1.4 / max(1, nwords)),
                  highlight=_emph(fl.get("emphasis")))
    # underline sweep under the block
    u = ease(t, .4 + min(1.4, .09 * nwords), .9 + min(1.4, .09 * nwords), out_expo)
    if u > 0:
        lw = min(w * .5, 360 * s)
        fill_rrect(ctx, f.cx - lw / 2, top + block + 50 * s, lw * u, 14 * s, 7 * s, P.accent)
    handle_tag(f, bc.g.get("handle"), ease(t, .3, .8))


def draw_statement(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    w = f.measure((x1 - x0) - 70 * s)
    x0 = f.cx - (w + 70 * s) / 2 if f.wide else x0
    fl = sc["fields"]
    size, lines = fit(fl["text"], w, (y1 - y0) * .62, f.pick(96, 80, 88) * s, "ExtraBold", 36 * s, lh=1.16, max_lines=8)
    block = size * (.727 + (len(lines) - 1) * 1.16)
    top = f.cy - block / 2
    # accent bar grows on the left
    bu = ease(t, 0, .5, out_cubic)
    fill_rrect(ctx, x0, top - 10 * s, 14 * s, (block + 20 * s) * bu, 7 * s, P.accent)
    paragraph(ctx, lines, x0 + 70 * s, top, size, "ExtraBold", P.fg, align="l", lh=1.16, reveal=.2, t=t,
              stagger=.12, dur=.55, rise=40 * s, highlight=_emph(fl.get("emphasis")), hcolor=P.highlight)
    if fl.get("label"):
        text(ctx, fl["label"].upper(), x0 + 70 * s, top - 70 * s, 28 * s, "Bold", P.muted, ease(t, .1, .5), "lm",
             tracking=.12, max_w=w)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_quote(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    w = f.measure(x1 - x0)
    fl = sc["fields"]
    q = fl["quote"].strip().strip('"«»“”')
    size, lines = fit(q, w * .94, (y1 - y0) * .55, f.pick(76, 66, 72) * s, "Bold", 34 * s, lh=1.22, max_lines=8)
    block = size * (.727 + (len(lines) - 1) * 1.22)
    top = f.cy - block / 2 - 30 * s
    # giant quote mark
    qa = ease(t, 0, .5)
    quote_mark(ctx, f.cx, top - 110 * s, 120 * s * lerp(1.3, 1, ease(t, 0, .6, out_back)), P.accent, qa)
    # line-by-line reveal with a soft wipe feel
    paragraph(ctx, lines, f.cx, top, size, "Bold", P.fg, lh=1.22, reveal=.35, t=t, stagger=.14, dur=.6, rise=26 * s)
    if fl.get("author"):
        ta = .35 + .14 * len(lines) + .3
        a = ease(t, ta, ta + .4)
        ay = top + block + 110 * s
        lw = 60 * s * ease(t, ta, ta + .5, out_expo)
        fill_rrect(ctx, f.cx - lw / 2, ay - 52 * s, lw, 6 * s, 3 * s, P.accent, a)
        text(ctx, fl["author"], f.cx, ay, 38 * s, "SemiBold", P.muted, a, max_w=w)
    handle_tag(f, bc.g.get("handle"), 1)


HOOK = SceneKind("hook", L("Hook", "Хук"), [
    Field("kicker", "text", L("Small label", "Метка"), max_len=28),
    Field("text", "textarea", L("Big words", "Крупный текст"), required=True, max_len=90),
    Field("emphasis", "text", L("Words to highlight (comma-separated)", "Слова для акцента (через запятую)"),
          max_len=60),
], (3.0, 1.8, 6.0), draw=draw_hook, hint="One punchy sentence, 3-10 words. Put 1-2 key words in emphasis.",
    sfx=lambda sc, bc: [(.15, "whoosh", {"gain": -12})])

STATEMENT = SceneKind("statement", L("Statement", "Утверждение"), [
    Field("label", "text", L("Small label", "Метка"), max_len=28),
    Field("text", "textarea", L("Text", "Текст"), required=True, max_len=160),
    Field("emphasis", "text", L("Words to highlight", "Слова для акцента"), max_len=60),
], (3.6, 2.0, 7.0), draw=draw_statement, hint="One idea in 1-3 short lines (max ~25 words).")

QUOTE = SceneKind("quote", L("Quote", "Цитата"), [
    Field("quote", "textarea", L("Quote", "Цитата"), required=True, max_len=180),
    Field("author", "text", L("Author", "Автор"), max_len=48),
], (4.4, 2.5, 8.0), draw=draw_quote, hint="A real, correctly attributed quote, or the creator's own line (author = handle).")

TEMPLATE = Template(
    id="kinetic-quote",
    name=L("Kinetic hook & quote", "Кинетический текст"),
    description=L("Big bold words that pop in on beat. Hooks, statements and quotes for shorts.",
                  "Крупные слова, которые появляются в ритм. Хуки, тезисы и цитаты для коротких видео."),
    category="typography",
    styles=["night", "paper", "forest", "ink"],
    fields=[handle_field()],
    scene_kinds=[HOOK, STATEMENT, QUOTE, outro_kind()],
    min_scenes=1, max_scenes=8, music="drive", transition="wipe",
    ai_notes="Short-form typographic video. Every scene is text-only, so keep lines short and rhythmic. "
             "Start with a hook, then 1-4 statements or a quote, end with an outro.",
    examples={
        "en": example("kinetic-quote", "en", "Habits beat motivation", [
            ("hook", 2.8, "Motivation gets you started. Habits keep you going.",
             {"kicker": "Day 1 of 66", "text": "Motivation fades. Habits ship.", "emphasis": "habits, ship"}),
            ("statement", 3.6, "Most people quit learning to code in the first two weeks.",
             {"label": "The problem", "text": "Most beginners quit in the first two weeks.", "emphasis": "two weeks"}),
            ("statement", 3.6, "So don't rely on willpower. Show up for one focused hour, every day.",
             {"label": "The fix", "text": "Don't rely on willpower. Show up for one focused hour. Every day.",
              "emphasis": "every day"}),
            ("quote", 4.4, "We are what we repeatedly do.",
             {"quote": "We are what we repeatedly do.", "author": "Will Durant, on Aristotle"}),
            ("outro", 3.4, "Sixty-six days. Let's build the habit together.",
             {"title": "66 days. One habit.", "subtitle": "Building with AI, every day.", "cta": "Start Day 1"}),
        ], fields={"handle": "@flowleaf66"}, style="night"),
        "ru": example("kinetic-quote", "ru", "Привычка сильнее мотивации", [
            ("hook", 2.8, "Мотивация помогает начать. Привычка — не бросить.",
             {"kicker": "День 1 из 66", "text": "Мотивация кончится. Привычка — останется.",
              "emphasis": "привычка, останется"}),
            ("statement", 3.6, "Большинство бросает учиться программировать в первые две недели.",
             {"label": "Проблема", "text": "Большинство новичков сдаются в первые две недели.",
              "emphasis": "две недели"}),
            ("statement", 3.6, "Поэтому не надейся на силу воли. Просто приходи на один час. Каждый день.",
             {"label": "Решение", "text": "Не надейся на силу воли. Один час фокуса. Каждый день.",
              "emphasis": "каждый день"}),
            ("quote", 4.4, "Мы — то, что мы делаем постоянно.",
             {"quote": "Мы — то, что мы делаем постоянно.", "author": "Уилл Дюрант об Аристотеле"}),
            ("outro", 3.4, "Шестьдесят шесть дней. Давай вместе.",
             {"title": "66 дней. Одна привычка.", "subtitle": "Создаём с ИИ — каждый день.", "cta": "Начать день 1"}),
        ], fields={"handle": "@flowleaf66"}, style="night"),
    },
)
