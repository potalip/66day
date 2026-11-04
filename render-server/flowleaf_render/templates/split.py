"""Split-screen tutorial: steps on one side, the thing itself on the other — code typing, a screenshot or a
screen-recording clip. Side by side on 16:9, stacked on 9:16 and 1:1."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example, parse_lines
from ._screen import device
from .code_walkthrough import LANGS, role_color, tokenize, window


def code_panel(f: Frame, x, y, w, h, code, language, hl, t, t0, title):
    ctx, s, P = f.ctx, f.s, f.P
    top = window(f, x, y, w, h, title or language, 1.0)
    lines = tokenize(code or "", language or "text")
    n = len(lines)
    pad = 28 * s
    maxcols = max([sum(len(tk) for tk, _ in ln) for ln in lines] + [16])
    cw = text_width("M", 100, "Regular", 0, "mono") / 100
    size = max(12 * s, min(34 * s, (w - 2 * pad) / ((maxcols + 3) * cw), (h - (top - y) - 2 * pad) / (n * 1.5 + .3)))
    adv = cw * size
    total = sum(sum(len(tk) for tk, _ in ln) + 1 for ln in lines)
    t_end = t0 + min(2.5, total / 50)
    shown = int(total * prog(t, t0, t_end))
    hl_u = ease(t, t_end + .1, t_end + .5)
    used = 0
    for i, ln in enumerate(lines):
        mid = top + pad + i * size * 1.5 + size * .75
        on = (i + 1) in hl
        if on and hl_u > 0:
            fill_rrect(ctx, x + 6 * s, mid - size * .75, w - 12 * s, size * 1.5, 6 * s, P.accent, .16 * hl_u)
            fill_rrect(ctx, x + 6 * s, mid - size * .75, 5 * s, size * 1.5, 2 * s, P.accent, hl_u)
        dim = 1 - (.5 * hl_u if hl and not on else 0)
        col = 0
        for tk, role in ln:
            if used >= shown: break
            vis = tk[: max(0, shown - used)]; used += len(vis)
            if vis.strip():
                text(ctx, vis, x + pad + 2.5 * adv + col * adv, mid, size, "Medium", role_color(P, role), dim, "lm", family="mono")
            col += len(vis)
            if len(vis) < len(tk): break
        if used < shown: used += 1
        text(ctx, str(i + 1), x + pad + 1.6 * adv, mid, size, "Regular", P.muted, .55 * dim, "rm", family="mono")


def draw_split(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, "dots", seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    W, H = x1 - x0, y1 - y0
    gap = 60 * s
    if f.wide:
        tx, ty, tw, th_ = x0, y0 + 70 * s, W * .4, H - 70 * s
        px, py, pw, ph = x0 + W * .4 + gap, y0 + 20 * s, W * .6 - gap, H - 40 * s
    else:
        ph = H * (.5 if f.vertical else .5)
        px, py, pw, ph = x0 - (20 * s if f.vertical else 0), y0, W + (40 * s if f.vertical else 0), ph
        tx, ty, tw, th_ = x0, y0 + ph + gap, W, H - ph - gap
    # panel
    u = ease(t, 0, .6, out_back)
    a = ease(t, 0, .3)
    mode = fl.get("panel", "code")
    py_ = py + (1 - u) * 60 * s
    assets = bc.sb.get("_assets") or {}
    if mode == "image":
        device(f, "browser", px, py_, pw, ph, assets.get(fl.get("image") or ""), t, a)
    elif mode == "video":
        card(f, px, py_, pw, ph, 28 * s, alpha=a)
        clip = assets.get(fl.get("video") or "")
        if not (clip and video_frame(ctx, clip, px + 8 * s, py_ + 8 * s, pw - 16 * s, ph - 16 * s, float(fl.get("start") or 0), t, a, 22 * s)):
            device(f, "none", px + 8 * s, py_ + 8 * s, pw - 16 * s, ph - 16 * s, None, t, a)
    else:
        code_panel(f, px, py_, pw, ph, fl.get("code", ""), fl.get("language", "python"), set(parse_lines(fl.get("highlight", ""))),
                   t, .5, fl.get("filename", ""))
    # steps
    title = fl.get("title", "")
    yy = ty
    if title:
        ts, tl = fit(title, tw, th_ * .3, f.pick(72, 56, 70) * s, "Black", 30 * s, lh=1.06, max_lines=2)
        kinetic_lines(f, tl, tx, yy, ts, .2, "Black", align="l", valign="t", lh=1.06)
        yy += ts * (.727 + 1.06 * (len(tl) - 1)) + f.pick(50, 34, 50) * s
    bullets = [b for b in fl.get("bullets", []) if b][:4]
    n = max(1, len(bullets))
    per = max(.8, (sc["duration"] - 1.4) / n)
    avail = ty + th_ - yy
    row = min(f.pick(150, 90, 150) * s, avail / n)
    for k, b in enumerate(bullets):
        t0 = .9 + k * per
        ba = ease(t, t0, t0 + .35)
        if ba <= 0: continue
        cur = t < t0 + per or k == n - 1
        dim = 1 if cur else .5
        r = min(26 * s, row * .22)
        y = yy + k * row
        circle(ctx, tx + r, y + r * 1.2, r, P.accent if cur else P.line, ba)
        text(ctx, str(k + 1), tx + r, y + r * 1.2, r * 1.1, "Black", P.on_accent if cur else P.muted, ba)
        bs, bl = fit(b, tw - 3 * r, row * .85, f.pick(44, 32, 40) * s, "SemiBold", 18 * s, lh=1.2, max_lines=3)
        paragraph(ctx, bl, tx + 3 * r, y + r * 1.2, bs, "SemiBold", P.fg, ba * dim, align="l", lh=1.2, valign="t" if len(bl) > 1 else "m")
    handle_tag(f, bc.g.get("handle"), 1) if f.wide else None


SPLIT = SceneKind("split", L("Split screen", "Разделённый экран"), [
    Field("title", "text", L("Title", "Заголовок"), max_len=50),
    Field("bullets", "list", L("Steps (1-4, appear one by one)", "Шаги (1-4, по очереди)"), min_items=1, max_items=4, max_len=80),
    Field("panel", "select", L("Right/top panel shows", "Справа/сверху показываем"), options=[
        {"value": "code", "label": L("Code", "Код")}, {"value": "image", "label": L("Screenshot", "Скриншот")},
        {"value": "video", "label": L("Screen recording", "Запись экрана")}], default="code"),
    Field("filename", "text", L("File name", "Имя файла"), max_len=40),
    Field("language", "select", L("Code language", "Язык кода"),
          options=[{"value": v, "label": L(v.capitalize(), v.capitalize())} for v in LANGS], default="python"),
    Field("code", "code", L("Code", "Код"), max_len=700, max_lines=14),
    Field("highlight", "lines", L("Highlight lines", "Подсветить строки")),
    Field("image", "image", L("Screenshot", "Скриншот")),
    Field("video", "video", L("Screen recording", "Запись экрана")),
    Field("start", "number", L("Clip start (seconds)", "Начало клипа (сек.)"), min=0, max=3600, default=0),
], (7.0, 3.5, 14.0), draw=draw_split,
    hint="Left: 2-4 short imperative steps. Right: the matching code (<= 12 lines) or a screenshot/recording.",
    sfx=lambda sc, bc: [(.5, "type", {"gain": -18, "dur": 1.5})] if sc["fields"].get("panel", "code") == "code" else [])

TEMPLATE = Template(
    id="split",
    name=L("Split-screen tutorial", "Урок на разделённом экране"),
    description=L("Steps on one side, the code, screenshot or screen recording on the other.",
                  "Шаги с одной стороны, код, скриншот или запись экрана — с другой."),
    category="code",
    styles=["paper", "terminal", "night"],
    fields=[handle_field()],
    scene_kinds=[intro_kind(), SPLIT, outro_kind()],
    min_scenes=1, max_scenes=8, music="focus", transition="fade",
    ai_notes="Tutorial: each split scene pairs 2-4 steps with the exact code (or screen) they refer to. Code stays in "
             "English identifiers; steps follow the video language.",
    examples={
        "en": example("split", "en", "A Telegram bot in 3 steps", [
            ("intro", 2.8, "Let's build a tiny Telegram bot in three steps.", {"kicker": "Tutorial", "title": "A Telegram bot in 3 steps"}),
            ("split", 8.0, "Install the library, paste your token, and reply to every message.",
             {"title": "The whole bot", "bullets": ["Install python-telegram-bot", "Paste your token from BotFather", "Reply to every message"],
              "panel": "code", "filename": "bot.py", "language": "python", "highlight": "6-7",
              "code": "from telegram.ext import Application, MessageHandler, filters\n\nTOKEN = \"paste-your-token\"\n\n"
                      "async def echo(update, ctx):\n    text = update.message.text\n    await update.message.reply_text(f\"You said: {text}\")\n\n"
                      "app = Application.builder().token(TOKEN).build()\napp.add_handler(MessageHandler(filters.TEXT, echo))\napp.run_polling()"}),
            ("split", 6.0, "Run it, then message your bot.",
             {"title": "Run it", "bullets": ["python bot.py", "Open your bot in Telegram", "Say hi"], "panel": "image", "image": ""}),
            ("outro", 3.2, "Tomorrow: give it a memory.", {"title": "Next: give it a memory.", "cta": "Follow for part 2"}),
        ], fields={"handle": "@flowleaf66"}, style="paper"),
        "ru": example("split", "ru", "Бот в Telegram за 3 шага", [
            ("intro", 2.8, "Собираем маленького бота в Telegram за три шага.", {"kicker": "Урок", "title": "Бот в Telegram за 3 шага"}),
            ("split", 8.0, "Ставим библиотеку, вставляем токен и отвечаем на каждое сообщение.",
             {"title": "Весь бот", "bullets": ["Поставь python-telegram-bot", "Вставь токен от BotFather", "Отвечай на каждое сообщение"],
              "panel": "code", "filename": "bot.py", "language": "python", "highlight": "6-7",
              "code": "from telegram.ext import Application, MessageHandler, filters\n\nTOKEN = \"вставь-свой-токен\"\n\n"
                      "async def echo(update, ctx):\n    text = update.message.text\n    await update.message.reply_text(f\"Ты написал: {text}\")\n\n"
                      "app = Application.builder().token(TOKEN).build()\napp.add_handler(MessageHandler(filters.TEXT, echo))\napp.run_polling()"}),
            ("split", 6.0, "Запускаем и пишем боту.",
             {"title": "Запускаем", "bullets": ["python bot.py", "Открой бота в Telegram", "Напиши «привет»"], "panel": "image", "image": ""}),
            ("outro", 3.2, "Завтра — дадим ему память.", {"title": "Дальше — память бота.", "cta": "Подпишись на часть 2"}),
        ], fields={"handle": "@flowleaf66"}, style="paper"),
    },
)
