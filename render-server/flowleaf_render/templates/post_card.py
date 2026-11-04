"""Post / quote card: a neutral social-post card (avatar, name, handle) whose text types in, reactions count up,
plus a thread variant. Deliberately unbranded so it works for any network."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..icons import draw_icon
from ..schema import Field, SceneKind, Template, L, example

DECO = {"paper": "dots", "night": "dots", "ink": "none", "sunrise": "leaves"}


def initials(name):
    parts = [p for p in str(name or "?").split() if p]
    return ("".join(p[0] for p in parts[:2]) or "?").upper()


def compact(n, lang):
    n = float(n or 0)
    if n >= 1_000_000: v, suf = n / 1_000_000, ("млн" if lang == "ru" else "M")
    elif n >= 10_000: v, suf = n / 1000, ("тыс." if lang == "ru" else "K")
    else: return counter_text(round(n), 0, "", "", lang)
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    return (s.replace(".", ",") + " " + suf) if lang == "ru" else s + suf


def post_block(f: Frame, x, y, w, name, handle, when, body, t, t0, size, metrics=None, alpha=1.0, words_per_s=9.0, verified=False):
    """Draw one post card at (x, y) of width w; returns its height. Text reveals word by word from t0."""
    ctx, s, P = f.ctx, f.s, f.P
    pad = 54 * s
    av = 92 * s
    bs, bl = fit(body, w - 2 * pad, 900 * s, size, "Medium", 22 * s, lh=1.35, max_lines=9)
    bh = bs * (.727 + 1.35 * (len(bl) - 1))
    mh = 70 * s if metrics else 0
    h = pad + av + 40 * s + bh + (50 * s + mh if metrics else 0) + pad
    if alpha <= 0: return h
    card(f, x, y, w, h, 40 * s, alpha=alpha)
    # header
    circle(ctx, x + pad + av / 2, y + pad + av / 2, av / 2, P.accent, alpha)
    text(ctx, initials(name), x + pad + av / 2, y + pad + av / 2, av * .38, "Bold", P.on_accent, alpha)
    nx = x + pad + av + 26 * s
    nw = text(ctx, name, nx, y + pad + av * .3, 40 * s, "Bold", P.fg, alpha, "lm", max_w=w - 2 * pad - av - 120 * s)[0]
    if verified:
        circle(ctx, nx + nw + 26 * s, y + pad + av * .3, 16 * s, P.accent, alpha)
        partial_polyline(ctx, [(nx + nw + 18 * s, y + pad + av * .3), (nx + nw + 24 * s, y + pad + av * .3 + 6 * s),
                               (nx + nw + 34 * s, y + pad + av * .3 - 6 * s)], 1, P.on_accent, 4 * s, alpha)
    sub = " · ".join(v for v in (handle, when) if v)
    text(ctx, sub, nx, y + pad + av * .74, 32 * s, "Medium", P.muted, alpha, "lm", max_w=w - 2 * pad - av)
    # body: reveal word by word
    words_total = sum(len(l.split()) for l in bl) or 1
    shown = int((t - t0) * words_per_s) if t >= t0 else 0
    by = y + pad + av + 40 * s
    k = 0
    for li, ln in enumerate(bl):
        ws = ln.split(" ")
        vis = ws[: max(0, min(len(ws), shown - k))]
        k += len(ws)
        if vis:
            text(ctx, " ".join(vis), x + pad, by + li * bs * 1.35, bs, "Medium", P.fg, alpha, "lt")
    if metrics:
        my = by + bh + 50 * s + mh / 2
        line(ctx, x + pad, my - mh / 2 - 10 * s, x + w - pad, my - mh / 2 - 10 * s, P.line, max(1, 2 * s), alpha)
        t_done = t0 + words_total / words_per_s
        icons = [("chat", metrics[0]), ("repeat", metrics[1]), ("heart", metrics[2])]
        cw = (w - 2 * pad) / 3
        for j, (ic, val) in enumerate(icons):
            u = ease(t, t_done + .1 + j * .15, t_done + 1.3 + j * .15, out_expo)
            cx = x + pad + j * cw
            liked = ic == "heart" and u > .9
            col = P.accent2 if liked else P.muted
            pop = 1 + .25 * (1 - abs(1 - 2 * prog(t, t_done + 1.1, t_done + 1.5))) * liked
            draw_icon(ctx, ic, cx + 20 * s, my, 40 * s, col, alpha, 2.2, pop)
            text(ctx, compact(float(val or 0) * u, f.lang), cx + 56 * s, my, 32 * s, "SemiBold", col, alpha, "lm")
    return h


def draw_post(f: Frame, sc, bc: BuildCtx):
    t, s, P = f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    g = bc.g
    w = min(x1 - x0 + (40 * s if f.vertical else 0), (1300 if f.wide else 1100) * s)
    x = f.cx - w / 2
    size = f.pick(60, 46, 54) * s
    name, handle = fl.get("name") or g.get("name") or "", fl.get("handle") or g.get("handle") or ""
    metrics = (fl.get("replies"), fl.get("reposts"), fl.get("likes"))
    h = post_block(f, x, 0, w, name, handle, fl.get("when", ""), fl.get("text", ""), t, .5, size, metrics, alpha=0)
    y = f.cy - h / 2 - (40 * s if f.vertical else 0)
    u = ease(t, 0, .6, out_back)
    post_block(f, x, y + (1 - u) * 120 * s, w, name, handle, fl.get("when", ""), fl.get("text", ""), t, .5, size, metrics,
               alpha=ease(t, 0, .3), verified=g.get("verified") == "yes")


def draw_thread(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    g = bc.g
    posts = [p for p in fl.get("posts", []) if p][:3]
    w = min(x1 - x0 + (40 * s if f.vertical else 0), (1300 if f.wide else 1100) * s)
    x = f.cx - w / 2
    size = f.pick(44, 34, 36) * s
    name, handle = g.get("name") or "", g.get("handle") or ""
    hs = [post_block(f, x, 0, w, name, handle, "", p, 0, 0, size, None, alpha=0) for p in posts]
    gap = 40 * s
    total = sum(hs) + gap * (len(hs) - 1)
    scale = min(1.0, (y1 - y0) / total) if total else 1
    y = f.cy - total * scale / 2
    per = max(1.0, (sc["duration"] - 1) / max(1, len(posts)))
    for k, (p, h) in enumerate(zip(posts, hs)):
        t0 = .2 + k * per
        a = ease(t, t0, t0 + .4)
        ctx.save(); ctx.translate(f.cx, y); ctx.scale(scale, scale); ctx.translate(-f.cx, -y)
        if k > 0 and a > 0:
            line(ctx, x + 54 * s + 46 * s, y - gap, x + 54 * s + 46 * s, y + 10 * s, P.line, 6 * s, a)
        post_block(f, x, y + (1 - a) * 60 * s, w, name, handle, f"{k + 1}/{len(posts)}", p, t, t0 + .3, size, None, alpha=a,
                   words_per_s=11, verified=g.get("verified") == "yes")
        ctx.restore()
        y += (h + gap) * scale


POST = SceneKind("post", L("Post card", "Карточка поста"), [
    Field("text", "textarea", L("Post text", "Текст поста"), required=True, max_len=280),
    Field("name", "text", L("Name (default: video name)", "Имя (по умолчанию — из видео)"), max_len=40),
    Field("handle", "text", L("Handle", "Ник"), max_len=32),
    Field("when", "text", L("Time label (e.g. 2h)", "Время (например, 2 ч)"), max_len=16),
    Field("replies", "number", L("Replies", "Ответы"), min=0, max=1e9, default=0),
    Field("reposts", "number", L("Reposts", "Репосты"), min=0, max=1e9, default=0),
    Field("likes", "number", L("Likes", "Лайки"), min=0, max=1e9, default=0),
], (6.0, 3.0, 12.0), draw=draw_post,
    hint="A post the creator actually wrote (or a real, attributed quote). Keep numbers honest or zero.",
    sfx=lambda sc, bc: [(.5, "type", {"gain": -18, "dur": min(2.5, len(str(sc['fields'].get('text', '')).split()) / 9)})])

THREAD = SceneKind("thread", L("Thread", "Тред"), [
    Field("posts", "list", L("Posts in the thread (2-3, one per line)", "Посты треда (2-3, по строке)"), min_items=2, max_items=3, max_len=200),
], (7.0, 4.0, 14.0), draw=draw_thread, hint="2-3 short posts that continue one thought.")

TEMPLATE = Template(
    id="post-card",
    name=L("Post & quote card", "Карточка поста"),
    description=L("Turn your best post or a thread into a video: the text types in, reactions count up.",
                  "Преврати свой пост или тред в видео: текст набирается, реакции растут."),
    category="typography",
    styles=["paper", "night", "ink", "sunrise"],
    fields=[
        Field("name", "text", L("Display name", "Имя"), max_len=40, default="FlowLeaf 66"),
        handle_field(),
        Field("verified", "select", L("Check mark next to the name", "Галочка у имени"), options=[
            {"value": "no", "label": L("No", "Нет")}, {"value": "yes", "label": L("Yes", "Да")}], default="no"),
    ],
    scene_kinds=[intro_kind(), POST, THREAD, outro_kind()],
    min_scenes=1, max_scenes=6, music="calm", transition="fade",
    ai_notes="Use the creator's own words from the brief as the post text; tighten, don't invent. Reaction counts only "
             "if given in the brief, otherwise 0.",
    examples={
        "en": example("post-card", "en", "Day 30 post", [
            ("post", 6.0, "Thirty days ago I'd never written a line of code. Today I shipped my fifth app.",
             {"text": "30 days ago I had never written a line of code.\n\nToday I shipped my 5th app — built with an AI agent, one hour a day.",
              "when": "2h", "replies": 48, "reposts": 120, "likes": 2400}),
            ("thread", 7.0, "Three things that made it work.",
             {"posts": ["What worked: one focused hour, every single day. No zero days.",
                        "Ask the agent for a plan before any code. Read it. Push back.",
                        "Ship something small daily. Tiny deploys add up to a portfolio."]}),
            ("outro", 3.2, "Follow along.", {"title": "Day 31 tomorrow.", "cta": "Follow the 66"}),
        ], fields={"name": "Alex Rivera", "handle": "@alexbuilds", "verified": "no"}, style="paper"),
        "ru": example("post-card", "ru", "Пост на 30-й день", [
            ("post", 6.0, "Тридцать дней назад я не написал ни строчки кода. Сегодня выпустил пятое приложение.",
             {"text": "30 дней назад я не написал ни строчки кода.\n\nСегодня выпустил пятое приложение — с ИИ-агентом, по часу в день.",
              "when": "2 ч", "replies": 48, "reposts": 120, "likes": 2400}),
            ("thread", 7.0, "Три вещи, которые сработали.",
             {"posts": ["Что сработало: один час фокуса каждый день. Без пропусков.",
                        "Сначала просить у агента план. Читать. Спорить.",
                        "Выпускать что-то маленькое каждый день. Мелкие релизы складываются в портфолио."]}),
            ("outro", 3.2, "Подписывайся.", {"title": "Завтра — день 31.", "cta": "Следить за 66"}),
        ], fields={"name": "Алекс Миронов", "handle": "@alex_builds", "verified": "no"}, style="paper"),
    },
)
