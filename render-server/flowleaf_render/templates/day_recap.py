"""Course 'Day N' recap card: 66-cell progress grid, what got done, XP + streak, and tomorrow's teaser."""
from __future__ import annotations

import math

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, outro_kind
from ..core import Frame
from ..icons import draw_icon
from ..schema import Field, SceneKind, Template, L, example

DAYS = 66


def grid66(f: Frame, x, y, w, day, t, t0=.2, cols=11):
    """11x6 grid of day cells; completed fill in sequence, today pulses in gold. Returns height."""
    ctx, s, P = f.ctx, f.s, f.P
    rows = math.ceil(DAYS / cols)
    gap = w * .018
    cs = (w - gap * (cols - 1)) / cols
    span = min(1.2, .02 * day + .3)
    for k in range(DAYS):
        cx = x + (k % cols) * (cs + gap); cy = y + (k // cols) * (cs + gap)
        d = k + 1
        if d < day:
            u = ease(t, t0 + span * k / max(1, day), t0 + span * k / max(1, day) + .25)
            fill_rrect(ctx, cx, cy, cs, cs, cs * .28, P.line, 1)
            if u > 0:
                k2 = cs * (1 - u) / 2
                fill_rrect(ctx, cx + k2, cy + k2, cs - 2 * k2, cs - 2 * k2, cs * .28, P.accent, 1)
        elif d == day:
            u = ease(t, t0 + span, t0 + span + .4, out_back)
            fill_rrect(ctx, cx, cy, cs, cs, cs * .28, P.line, 1)
            if u > 0:
                glow(ctx, cx + cs / 2, cy + cs / 2, cs * 1.4, P.accent2, .35 * pulse(t, 1.4, .5, 1))
                k2 = cs * (1 - u) / 2
                fill_rrect(ctx, cx + k2, cy + k2, cs - 2 * k2, cs - 2 * k2, cs * .28, P.accent2, 1)
        else:
            stroke_rrect(ctx, cx + 1, cy + 1, cs - 2, cs - 2, cs * .28, P.line, max(1, 2 * s), 1)
    return rows * cs + (rows - 1) * gap


def stat_chip(f: Frame, x, y, w, h, icon, value_txt, label, color, a):
    ctx, s, P = f.ctx, f.s, f.P
    card(f, x, y, w, h, 28 * s, alpha=a)
    r = h * .28
    circle(ctx, x + h * .5, y + h / 2, r, color, .16 * a)
    draw_icon(ctx, icon, x + h * .5, y + h / 2, r * 1.15, color, a, 2.2)
    text(ctx, value_txt, x + h * .95, y + h * .4, h * .3, "Black", P.fg, a, "lm", max_w=w - h * 1.1)
    text(ctx, label, x + h * .95, y + h * .72, h * .16, "SemiBold", P.muted, a, "lm", max_w=w - h * 1.1)


def draw_recap(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, "dots", seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    day = int(fl.get("day") or bc.g.get("day") or 1)
    ru = f.lang == "ru"
    track = bc.g.get("track", "")
    track_lbl = {"apps": ("Apps", "Приложения"), "video": ("Video", "Видео")}.get(track)
    W = x1 - x0
    # header
    a0 = ease(t, 0, .4)
    hdr = f"ДЕНЬ {day} ИЗ {DAYS}" if ru else f"DAY {day} OF {DAYS}"
    pill(f, hdr, x0 if not f.wide else x0, y0 + 20 * s, 30 * s, alpha=a0, anchor="l")
    if track_lbl:
        pill(f, (track_lbl[1] if ru else track_lbl[0]).upper(), x1, y0 + 20 * s, 26 * s, alpha=a0, anchor="r",
             outline=True, fg=P.accent)
    pct = f"{round(day / DAYS * 100)}%"
    if not f.vertical:
        gw = (W - 100 * s) * (.42 if f.wide else .46)
        gy = y0 + 120 * s
        gh = grid66(f, x0, gy, gw, day, t)
        text(ctx, pct, x0, gy + gh + 90 * s, f.pick(72, 64, 72) * s, "Black", P.accent, ease(t, .8, 1.2), "lm")
        text(ctx, ("пути пройдено" if ru else "of the path done"), x0, gy + gh + 160 * s, 32 * s, "SemiBold", P.muted,
             ease(t, .9, 1.3), "lm", max_w=gw)
        rx = x0 + gw + 100 * s; rw = x1 - rx; ry = gy
    else:
        gw = W if f.vertical else W * .46
        gy = y0 + 110 * s
        gh = grid66(f, x0, gy, gw, day, t)
        if f.square:
            text(ctx, pct, x1, gy + gh * .4, 96 * s, "Black", P.accent, ease(t, .8, 1.2), "rm")
            text(ctx, ("пути пройдено" if ru else "of the path"), x1, gy + gh * .4 + 80 * s, 30 * s, "SemiBold",
                 P.muted, ease(t, .9, 1.3), "rm")
        rx = x0; rw = W; ry = gy + gh + f.pick(90, 60, 0) * s
    # title + done list
    ts, tl = fit(fl.get("title", ""), rw, f.pick(220, 130, 200) * s, f.pick(76, 58, 66) * s, "ExtraBold", 30 * s,
                 lh=1.08, max_lines=3)
    th = paragraph(ctx, tl, rx, ry, ts, "ExtraBold", P.fg, align="l", lh=1.08, reveal=.6, t=t)
    done = fl.get("done", [])[:4]
    chips_h = f.pick(150, 120, 140) * s
    list_top = ry + th + f.pick(60, 30, 50) * s
    list_bot = y1 - chips_h - 40 * s
    row = min(f.pick(120, 80, 84) * s, (list_bot - list_top) / max(1, len(done)))
    for k, item in enumerate(done):
        u = prog(t, 1.0 + k * .25, 1.5 + k * .25)
        cy = list_top + row * k + row / 2
        r = row * .26
        checkmark(ctx, rx + r, cy, r, u, P.accent, P.on_accent)
        sz, ln = fit(item, rw - r * 2 - 30 * s, row * .8, row * .36, "SemiBold", 16 * s, lh=1.15, max_lines=2)
        paragraph(ctx, ln, rx + r * 2 + 26 * s, cy, sz, "SemiBold", P.fg, out_cubic(u), align="l", lh=1.15, valign="m")
    # stat chips: XP (gold) + streak
    ca = ease(t, 1.6, 2.0)
    if not f.vertical: rx, rw = x0, W
    cw = (rw - 30 * s) / 2
    cy0 = y1 - chips_h
    xp = int(fl.get("xp") or 0)
    xv = lerp(0, xp, ease(t, 1.7, 2.6, out_expo))
    stat_chip(f, rx, cy0, cw, chips_h, "star", f"+{counter_text(xv, 0, '', '', f.lang)} XP",
              "опыта за день" if ru else "earned today", P.accent2, ca)
    streak = int(fl.get("streak") or 0)
    days_word = ("дн." if ru else "days") if streak != 1 else ("день" if ru else "day")
    stat_chip(f, rx + cw + 30 * s, cy0, cw, chips_h, "bolt", f"{streak} {days_word}",
              "серия без пропусков" if ru else "streak", P.accent2, ease(t, 1.8, 2.2))
    handle_tag(f, bc.g.get("handle"), 1) if not f.vertical else None


def draw_next(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, "leaves", seed=bc.index, lift=(f.cx, f.cy))
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0)
    fl = sc["fields"]
    ru = f.lang == "ru"
    day = int(bc.g.get("day") or 1)
    lbl = fl.get("label") or (f"ЗАВТРА · ДЕНЬ {min(DAYS, day + 1)}" if ru else f"TOMORROW · DAY {min(DAYS, day + 1)}")
    ts, tl = fit(fl["title"], W, (y1 - y0) * .35, f.pick(104, 88, 96) * s, "Black", 36 * s, lh=1.06, max_lines=4)
    th = ts * (.727 + 1.06 * (len(tl) - 1))
    bs, bl = fit(fl.get("text", ""), W * .9, (y1 - y0) * .2, f.pick(46, 40, 42) * s, "Medium", 24 * s, lh=1.35,
                 max_lines=3) if fl.get("text") else (0, [])
    bh = bs * (.727 + 1.35 * (len(bl) - 1)) if bl else 0
    total = 110 * s + th + (60 * s + bh if bl else 0)
    top = f.cy - total / 2
    pill(f, lbl, f.cx, top + 20 * s, 30 * s, alpha=ease(t, 0, .4), bgc=P.accent2, fg=P.bg if P.dark else "#FFFFFF")
    kinetic_lines(f, tl, f.cx, top + 110 * s, ts, .25, "Black", valign="t", lh=1.06)
    if bl: paragraph(ctx, bl, f.cx, top + 110 * s + th + 60 * s, bs, "Medium", P.muted, lh=1.35, reveal=.8, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


RECAP = SceneKind("recap", L("Day recap card", "Итог дня"), [
    Field("day", "number", L("Day (1-66)", "День (1-66)"), min=1, max=66, default=1),
    Field("title", "text", L("What today was about", "О чём был день"), required=True, max_len=60),
    Field("done", "list", L("Done today (one per line)", "Сделано сегодня (по строке)"), max_items=4, max_len=50),
    Field("xp", "number", L("XP earned", "Заработано XP"), min=0, max=10000, default=0),
    Field("streak", "number", L("Streak (days)", "Серия (дней)"), min=0, max=999, default=0),
], (6.0, 4.0, 10.0), draw=draw_recap, hint="Use the student's real day number, tasks, XP and streak.",
    sfx=lambda sc, bc: [(.2, "riser", {"gain": -20, "dur": 1.0}), (1.0, "pop", {"gain": -14}),
                        (1.7, "cash", {"gain": -16})])

NEXT = SceneKind("next", L("Tomorrow teaser", "Анонс завтра"), [
    Field("label", "text", L("Label (default: Tomorrow · Day N+1)", "Метка (по умолчанию: Завтра · день N+1)"), max_len=30),
    Field("title", "text", L("Tomorrow's topic", "Тема завтра"), required=True, max_len=60),
    Field("text", "textarea", L("One line about it", "Пара слов о нём"), max_len=110),
], (3.6, 2.5, 6.0), draw=draw_next, hint="Tease the next day's topic in a few words.")

TEMPLATE = Template(
    id="day-recap",
    name=L("Day N recap", "Итог дня N"),
    description=L("Your 66-day progress card: what you shipped today, XP, streak, and tomorrow's teaser.",
                  "Карточка прогресса 66 дней: что сделал сегодня, XP, серия и анонс завтра."),
    category="course",
    styles=["paper", "night", "forest"],
    fields=[
        Field("day", "number", L("Day (1-66)", "День (1-66)"), min=1, max=66, default=1),
        Field("track", "select", L("Track", "Трек"), options=[
            {"value": "apps", "label": L("Apps", "Приложения")}, {"value": "video", "label": L("Video", "Видео")}],
              default="apps"),
        handle_field(),
    ],
    scene_kinds=[RECAP, NEXT, outro_kind(hint="Invite people to follow the 66-day journey.")],
    min_scenes=1, max_scenes=4, music="uplift", transition="wipe",
    ai_notes="A daily build-in-public post: one recap scene with the real numbers, an optional tomorrow teaser and "
             "an optional outro. Keep the day number consistent in fields.day and the recap scene.",
    examples={
        "en": example("day-recap", "en", "Day 12 recap", [
            ("recap", 6.0, "Day twelve done. I connected my first API and shipped a weather bot.",
             {"day": 12, "title": "First API, first bot", "xp": 140, "streak": 12,
              "done": ["Called a weather API", "Built a Telegram bot", "Deployed it", "Wrote 3 lines of notes"]}),
            ("next", 3.6, "Tomorrow: giving the bot a memory.",
             {"title": "Giving the bot a memory", "text": "Databases, but the friendly kind."}),
            ("outro", 3.4, "Follow along, fifty-four days to go.",
             {"title": "54 days to go.", "cta": "Follow the 66"}),
        ], fields={"day": 12, "track": "apps", "handle": "@flowleaf66"}, style="paper"),
        "ru": example("day-recap", "ru", "Итог дня 12", [
            ("recap", 6.0, "День двенадцатый готов. Подключил первый API и запустил бота погоды.",
             {"day": 12, "title": "Первый API, первый бот", "xp": 140, "streak": 12,
              "done": ["Вызвал API погоды", "Собрал бота в Telegram", "Задеплоил", "Записал три мысли"]}),
            ("next", 3.6, "Завтра — даём боту память.",
             {"title": "Даём боту память", "text": "Базы данных, но дружелюбные."}),
            ("outro", 3.4, "Подписывайся, осталось пятьдесят четыре дня.",
             {"title": "Ещё 54 дня.", "cta": "Следить за 66"}),
        ], fields={"day": 12, "track": "apps", "handle": "@flowleaf66"}, style="paper"),
    },
)
