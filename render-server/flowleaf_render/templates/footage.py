"""Talking points over your own footage: an uploaded clip (phone video or screen recording) with animated headline,
lower-third points and captions. 'Full' = full-bleed; 'framed' = the clip sits in a rounded frame (best for
horizontal screen recordings in a vertical video)."""
from __future__ import annotations

import math

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, outro_kind
from ..core import Frame
from ..icons import draw_icon
from ..schema import Field, SceneKind, Template, L, example


def _clip(bc: BuildCtx):
    url = bc.g.get("video") or ""
    return (bc.sb.get("_assets") or {}).get(url) if url else None


def _placeholder(f: Frame, x, y, w, h, r, label):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    fill_rrect(ctx, x, y, w, h, r, mixc(P.bg, P.accent, .25))
    ctx.save(); rrect(ctx, x, y, w, h, r); ctx.clip()
    for k in range(5):
        cx = x + w * (.2 + .6 * (0.5 + 0.5 * math.sin(t * .5 + k * 1.7)))
        cy = y + h * (.2 + .6 * (0.5 + 0.5 * math.cos(t * .4 + k * 2.1)))
        glow(ctx, cx, cy, max(w, h) * .45, P.accent if k % 2 else P.accent2, .35)
    ctx.restore()
    circle(ctx, x + w / 2, y + h / 2 - 30 * s, 70 * s, "#FFFFFF", .9)
    draw_icon(ctx, "play", x + w / 2, y + h / 2 - 30 * s, 70 * s, P.accent, 1, 2.2)
    text(ctx, label, x + w / 2, y + h / 2 + 90 * s, 34 * s, "SemiBold", "#FFFFFF", .9, max_w=w * .8)


def footage(f: Frame, bc: BuildCtx, start, x, y, w, h, r=0, dim=0.0, zoom=1.0):
    clip = _clip(bc)
    ok = clip and video_frame(f.ctx, clip, x, y, w, h, float(start or 0), f.t, 1.0, r, zoom)
    if not ok:
        _placeholder(f, x, y, w, h, r, "Твоё видео здесь" if f.lang == "ru" else "Your clip here")
    if dim > 0:
        fill_rrect(f.ctx, x, y, w, h, r, "#000000", dim)


def shade(f: Frame, y0, y1, alpha=.75, up=False):
    """Vertical gradient to black so white text reads over any footage."""
    import cairo
    g = cairo.LinearGradient(0, y0, 0, y1)
    g.add_color_stop_rgba(0, 0, 0, 0, alpha if up else 0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0 if up else alpha)
    f.ctx.set_source(g); f.ctx.rectangle(0, y0, f.W, y1 - y0); f.ctx.fill()


def draw_title(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    fl = sc["fields"]
    footage(f, bc, fl.get("start"), 0, 0, f.W, f.H, 0, dim=.55, zoom=lerp(1.08, 1.0, ease(t, 0, sc["duration"], linear)))
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0)
    size, lines = fit(fl["title"], W, (y1 - y0) * .5, f.pick(118, 100, 108) * s, "Black", 40 * s, lh=1.05, max_lines=4)
    block = size * (.727 + 1.05 * (len(lines) - 1))
    top = f.cy - block / 2
    if fl.get("kicker"):
        pill(f, fl["kicker"].upper(), f.cx, top - 80 * s, 30 * s, alpha=ease(t, 0, .35))
    kinetic_lines(f, lines, f.cx, top, size, .2, "Black", color="#FFFFFF", hcolor=P.accent2, valign="t", lh=1.05)
    handle_tag(f, bc.g.get("handle"), ease(t, .3, .7))


def draw_clip(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    fl = sc["fields"]
    x0, y0, x1, y1 = f.safe()
    W = x1 - x0
    layout = fl.get("layout", "full")
    head = fl.get("headline", "")
    pts = [p for p in fl.get("points", []) if p][:3]
    if layout == "framed":
        backdrop(f, "dots", seed=bc.index)
        if f.wide:
            fw = W * .62; fh = min(fw * 9 / 16, (y1 - y0)); fx = x1 - fw; fy = f.cy - fh / 2
        else:
            fw = W + (60 * s if f.vertical else 0); fh = fw * 9 / 16; fx = f.cx - fw / 2
            fy = y0 + (f.pick(260, 190, 0) * s if head else 40 * s)
        u = ease(t, 0, .6, out_back)
        card(f, fx - 10 * s, fy - 10 * s + (1 - u) * 60 * s, fw + 20 * s, fh + 20 * s, 34 * s, alpha=ease(t, 0, .3))
        footage(f, bc, fl.get("start"), fx, fy + (1 - u) * 60 * s, fw, fh, 26 * s)
        tc, tx, tw = P.fg, (x0 if f.wide else f.cx), (fx - x0 - 80 * s if f.wide else W)
        align = "l" if f.wide else "m"
        if head:
            hs, hl = fit(head, tw, 220 * s, f.pick(76, 60, 72) * s, "Black", 32 * s, lh=1.06, max_lines=3)
            hy = (f.cy - 200 * s) if f.wide else y0 + (0 if f.vertical else 50 * s)
            kinetic_lines(f, hl, tx, hy, hs, .2, "Black", color=tc, align=align, valign="t", lh=1.06)
        py = (f.cy + 20 * s) if f.wide else fy + fh + 70 * s
        for k, ptxt in enumerate(pts):
            a = ease(t, .7 + k * .6, 1.1 + k * .6)
            ps, pl = fit(ptxt, tw - 90 * s, 120 * s, f.pick(46, 38, 40) * s, "SemiBold", 22 * s, lh=1.2, max_lines=2)
            ph = ps * (.727 + 1.2 * (len(pl) - 1))
            bx = tx if f.wide else x0
            circle(ctx, bx + 24 * s, py + ph / 2, 22 * s, P.accent, a)
            text(ctx, str(k + 1), bx + 24 * s, py + ph / 2, 24 * s, "Black", P.on_accent, a)
            paragraph(ctx, pl, bx + 70 * s, py + (1 - a) * 20 * s, ps, "SemiBold", P.fg, a, align="l", lh=1.2)
            py += ph + 46 * s
    else:
        footage(f, bc, fl.get("start"), 0, 0, f.W, f.H, 0, zoom=lerp(1.0, 1.05, ease(t, 0, sc["duration"], linear)))
        if head: shade(f, 0, f.H * .4, .7, up=True)
        if pts: shade(f, f.H * .45, f.H, .8)
        if head:
            hs, hl = fit(head, W, 260 * s, f.pick(84, 68, 76) * s, "Black", 32 * s, lh=1.06, max_lines=3)
            kinetic_lines(f, hl, x0, y0 + 10 * s, hs, .15, "Black", color="#FFFFFF", hcolor=P.accent2, align="l", valign="t", lh=1.06)
        # lower-third chips, stacked from the bottom of the safe area upwards
        ps0 = f.pick(44, 36, 38) * s
        laid = []
        for k, ptxt in enumerate(pts):
            ps, pl = fit(ptxt, W * .86 - 60 * s, 120 * s, ps0, "Bold", 22 * s, lh=1.2, max_lines=2)
            laid.append((ps, pl, ps * (.727 + 1.2 * (len(pl) - 1)) + 44 * s))
        y = y1 - sum(h for _, _, h in laid) - 24 * s * max(0, len(laid) - 1)
        for k, (ps, pl, h) in enumerate(laid):
            a = ease(t, .5 + k * .7, .9 + k * .7)
            dx = (1 - ease(t, .5 + k * .7, 1.0 + k * .7, out_back)) * -80 * s
            wmax = max(text_width(l, ps, "Bold") for l in pl)
            fill_rrect(ctx, x0 + dx, y, wmax + 60 * s + 16 * s, h, 18 * s, P.accent, a)
            paragraph(ctx, pl, x0 + 38 * s + dx, y + 22 * s, ps, "Bold", P.on_accent, a, align="l", lh=1.2)
            y += h + 24 * s
    handle_tag(f, bc.g.get("handle"), 1) if layout == "framed" else None


START = Field("start", "number", L("Start at (seconds into your clip)", "Начало (секунда твоего видео)"), min=0, max=3600, default=0)

TITLE = SceneKind("title", L("Title over clip", "Заголовок на видео"), [
    Field("kicker", "text", L("Small label", "Метка"), max_len=28),
    Field("title", "text", L("Title", "Заголовок"), required=True, max_len=70),
    START,
], (3.0, 1.8, 6.0), draw=draw_title, hint="Hook line shown over your dimmed footage.",
    sfx=lambda sc, bc: [(.2, "whoosh", {"gain": -14})])

CLIP = SceneKind("clip", L("Clip with points", "Видео с тезисами"), [
    Field("headline", "text", L("Headline", "Заголовок"), max_len=60),
    Field("points", "list", L("Points (appear one by one)", "Тезисы (появляются по очереди)"), max_items=3, max_len=70),
    Field("layout", "select", L("Layout", "Раскладка"), options=[
        {"value": "full", "label": L("Full screen", "На весь экран")},
        {"value": "framed", "label": L("Framed (screen recordings)", "В рамке (запись экрана)")}], default="full"),
    START,
], (5.0, 2.0, 15.0), draw=draw_clip,
    hint="Each scene plays your clip from `start`. 1-3 short points that pop in as lower thirds.",
    sfx=lambda sc, bc: [(.5 + k * .7, "pop", {"gain": -16}) for k in range(len(sc["fields"].get("points", [])))])

TEMPLATE = Template(
    id="footage",
    name=L("Talking points over your clip", "Тезисы поверх твоего видео"),
    description=L("Upload a phone video or a screen recording; add a hook, headlines and points that pop in.",
                  "Загрузи видео с телефона или запись экрана — добавь хук, заголовки и тезисы."),
    category="footage",
    styles=["night", "forest", "sunrise"],
    fields=[
        Field("video", "video", L("Your clip (MP4, MOV or WebM)", "Твоё видео (MP4, MOV или WebM)"),
              help=L("Up to 100 MB. Each scene plays it from its own start second.",
                     "До 100 МБ. Каждая сцена играет его со своей секунды.")),
        Field("keep_audio", "select", L("Clip sound", "Звук видео"), options=[
            {"value": "on", "label": L("Keep the clip's sound", "Оставить звук видео")},
            {"value": "off", "label": L("Mute the clip", "Без звука видео")}], default="on"),
        handle_field(),
    ],
    scene_kinds=[TITLE, CLIP, outro_kind()],
    min_scenes=1, max_scenes=10, music="calm", transition="cut",
    ai_notes="The creator uploads their own clip; you only write the overlay text. Title scene = hook; clip scenes = "
             "1 headline + up to 3 points each, timed to different `start` seconds of the clip (spread them out).",
    examples={
        "en": example("footage", "en", "What I built today", [
            ("title", 2.6, "Here's what I built today, in thirty seconds.", {"kicker": "Day 12", "title": "What I built today", "start": 0}),
            ("clip", 5.0, "A habit tracker that lives in Telegram.",
             {"headline": "A habit tracker in Telegram", "points": ["Built with an AI agent", "No servers to manage"], "layout": "framed", "start": 3}),
            ("clip", 5.0, "And it pings me every morning so I don't forget.",
             {"headline": "", "points": ["Morning reminder at 8:00", "One tap to check in"], "layout": "full", "start": 9}),
            ("outro", 3.2, "Follow along, day thirteen tomorrow.", {"title": "Day 13 tomorrow.", "cta": "Follow the 66"}),
        ], fields={"video": "", "keep_audio": "on", "handle": "@flowleaf66"}, style="night"),
        "ru": example("footage", "ru", "Что я сделал сегодня", [
            ("title", 2.6, "Вот что я сделал сегодня — за тридцать секунд.", {"kicker": "День 12", "title": "Что я сделал сегодня", "start": 0}),
            ("clip", 5.0, "Трекер привычек прямо в Telegram.",
             {"headline": "Трекер привычек в Telegram", "points": ["Собран с ИИ-агентом", "Без своих серверов"], "layout": "framed", "start": 3}),
            ("clip", 5.0, "И каждое утро он напоминает о себе.",
             {"headline": "", "points": ["Напоминание в 8:00", "Отметка в одно касание"], "layout": "full", "start": 9}),
            ("outro", 3.2, "Подписывайся — завтра день тринадцатый.", {"title": "Завтра — день 13.", "cta": "Следить за 66"}),
        ], fields={"video": "", "keep_audio": "on", "handle": "@flowleaf66"}, style="night"),
    },
)
