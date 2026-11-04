"""Data / number reveal: big counters with a ring, bar charts and A-vs-B comparisons."""
from __future__ import annotations

import re

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example

DECO = {"night": "dots", "paper": "dots", "forest": "rings"}


def parse_items(items):
    """['Label: 42', 'Other — 7.5%'] -> [(label, value, suffix)]"""
    out = []
    for it in items:
        m = re.match(r"^\s*(.+?)\s*[:—–=|-]\s*([-+]?[\d\s.,]+)\s*([^\d\s]*)\s*$", it)
        if not m: continue
        raw = m.group(2).replace(" ", "").replace(" ", "")
        if raw.count(",") == 1 and "." not in raw: raw = raw.replace(",", ".")
        raw = raw.replace(",", "")
        try: v = float(raw)
        except ValueError: continue
        out.append((m.group(1), v, m.group(3)))
    return out


def _decimals(v):
    return 0 if float(v).is_integer() else min(2, len(str(v).split(".")[1]))


def stat_title(f: Frame, label, y, w, t, size=None):
    if not label: return 0
    s = f.s
    size, lines = fit(label, w, 200 * s, size or f.pick(64, 56, 60) * s, "ExtraBold", 30 * s, lh=1.1, max_lines=2)
    return paragraph(f.ctx, lines, f.cx, y, size, "ExtraBold", f.P.fg, lh=1.1, reveal=.1, t=t)


def draw_stat(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index, lift=(f.cx, f.cy))
    x0, y0, x1, y1 = f.safe()
    W = x1 - x0
    fl = sc["fields"]
    value = float(fl.get("value") or 0)
    dec = int(fl.get("decimals") or 0)
    final = counter_text(value, dec, fl.get("prefix", ""), fl.get("suffix", ""), f.lang)
    R = f.pick(330, 250, 250) * s
    cy = f.cy - f.pick(120, 60, 40) * s
    if f.wide: cy = f.cy - 30 * s
    cx = f.cx - (330 * s if f.wide else 0)
    glow(ctx, cx, cy, R * 1.5, P.accent, .14)
    ring(ctx, cx, cy, R, P.line, 22 * s, 1, ease(t, 0, .3))
    ring(ctx, cx, cy, R, P.accent, 22 * s, ease(t, .2, 1.6, in_out_cubic))
    # end dot
    u = ease(t, .2, 1.6, in_out_cubic)
    if u > 0:
        import math
        ang = -math.pi / 2 + 2 * math.pi * u
        circle(ctx, cx + R * math.cos(ang), cy + R * math.sin(ang), 20 * s, P.accent2)
    size = min(f.pick(200, 160, 170) * s, R * 1.55 / max(1, text_width(final, 100, "Black") / 100))
    v = lerp(0, value, ease(t, .2, 1.6, out_expo))
    text(ctx, counter_text(v, dec, fl.get("prefix", ""), fl.get("suffix", ""), f.lang), cx, cy, size, "Black", P.fg,
         ease(t, .1, .4), scale=lerp(.85, 1, ease(t, .1, 1.6, out_back)))
    # label + context
    if f.wide:
        tx = cx + R + 120 * s; tw = x1 - tx
        ls, ll = fit(fl.get("label", ""), tw, 260 * s, 76 * s, "ExtraBold", 30 * s, lh=1.1, max_lines=3)
        lh_ = ls * (.727 + 1.1 * (len(ll) - 1))
        cs, cl = fit(fl.get("context", ""), tw, 260 * s, 44 * s, "Medium", 24 * s, lh=1.35, max_lines=4) \
            if fl.get("context") else (0, [])
        chh = cs * (.727 + 1.35 * (len(cl) - 1)) if cl else 0
        ty = cy - (lh_ + (40 * s + chh if cl else 0)) / 2
        paragraph(ctx, ll, tx, ty, ls, "ExtraBold", P.fg, align="l", lh=1.1, reveal=1.0, t=t)
        if cl: paragraph(ctx, cl, tx, ty + lh_ + 40 * s, cs, "Medium", P.muted, align="l", lh=1.35, reveal=1.3, t=t)
    else:
        ty = cy + R + 90 * s
        ls, ll = fit(fl.get("label", ""), W, f.pick(220, 120, 0) * s, f.pick(72, 60, 0) * s, "ExtraBold", 30 * s,
                     lh=1.1, max_lines=3)
        lh_ = paragraph(ctx, ll, f.cx, ty, ls, "ExtraBold", P.fg, lh=1.1, reveal=1.0, t=t)
        if fl.get("context"):
            cs, cl = fit(fl["context"], W * .92, max(40 * s, y1 - (ty + lh_ + 40 * s)), f.pick(44, 36, 0) * s,
                         "Medium", 24 * s, lh=1.35, max_lines=3)
            paragraph(ctx, cl, f.cx, ty + lh_ + 40 * s, cs, "Medium", P.muted, lh=1.35, reveal=1.3, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_bars(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W = f.measure(x1 - x0) if not f.wide else min(x1 - x0, 1500 * s)
    bx0 = f.cx - W / 2
    fl = sc["fields"]
    items = parse_items(fl.get("items", []))[:7]
    th = stat_title(f, fl.get("title"), y0 + f.pick(40, 10, 10) * s, W, t)
    if not items: return
    vmax = max(abs(v) for _, v, _ in items) or 1
    n = len(items)
    top = y0 + th + f.pick(140, 90, 90) * s
    avail = y1 - top - 20 * s
    row = min(f.pick(270, 140, 140) * s, avail / n)
    bar_h = row * .36
    lab_size = min(f.pick(50, 38, 42) * s, row * .25)
    val_size = lab_size * 1.05
    imax = max(range(n), key=lambda j: items[j][1])
    top += (avail - row * n) / 2
    for j, (label, v, suf) in enumerate(items):
        y = top + j * row
        a = ease(t, .25 + j * .12, .55 + j * .12)
        u = ease(t, .35 + j * .12, 1.35 + j * .12, out_expo)
        text(ctx, label, bx0, y + lab_size * .5, lab_size, "SemiBold", P.fg, a, "lm", max_w=W * .7)
        dec = _decimals(v)
        vs = counter_text(v * u, dec, "", suf, f.lang)
        text(ctx, vs, bx0 + W, y + lab_size * .5, val_size, "ExtraBold", P.accent if j == imax else P.fg, a, "rm")
        by = y + lab_size + row * .14
        fill_rrect(ctx, bx0, by, W, bar_h, bar_h / 2, P.line, a * .7)
        c = P.accent if j == imax else mixc(P.accent, P.surface if not P.dark else P.bg, .45)
        fill_rrect(ctx, bx0, by, max(bar_h, W * abs(v) / vmax * u), bar_h, bar_h / 2, c, a)
    if fl.get("source"):
        text(ctx, fl["source"], bx0, top + n * row + 10 * s, 26 * s, "Medium", P.muted, ease(t, 1.2, 1.6), "lm", max_w=W)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_compare(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    W = min(x1 - x0, 1300 * s)
    fl = sc["fields"]
    th = stat_title(f, fl.get("title"), y0 + f.pick(40, 10, 10) * s, W, t)
    vals = [float(fl.get("left_value") or 0), float(fl.get("right_value") or 0)]
    labels = [fl.get("left_label", ""), fl.get("right_label", "")]
    vmax = max(abs(v) for v in vals) or 1
    suf = fl.get("suffix", ""); pre = fl.get("prefix", "")
    cap = fl.get("caption", "")
    cap_h = 130 * s if cap else 0
    base = y1 - cap_h - 110 * s
    top = y0 + th + 220 * s
    hmax = base - top
    colw = W / 2
    bw = min(colw * .55, 300 * s)
    win = 0 if vals[0] >= vals[1] else 1
    for j in range(2):
        cx = f.cx - colw / 2 + j * colw
        u = ease(t, .3 + j * .25, 1.5 + j * .25, out_expo)
        h = max(bw * .2, hmax * abs(vals[j]) / vmax * u)
        c = P.accent if j == win else mixc(P.muted, P.bg, .35)
        a = ease(t, .2 + j * .25, .5 + j * .25)
        fill_rrect(ctx, cx - bw / 2, base - h, bw, h, 26 * s, c, a)
        dec = _decimals(vals[j])
        vsz = min(f.pick(96, 80, 84) * s, colw * .9 / max(1, text_width(counter_text(vals[j], dec, pre, suf, f.lang), 100,
                                                                            "Black") / 100))
        text(ctx, counter_text(vals[j] * u, dec, pre, suf, f.lang), cx, base - h - 70 * s, vsz, "Black",
             P.fg, a)
        ls, ll = fit(labels[j], colw * .9, 110 * s, f.pick(44, 38, 40) * s, "SemiBold", 24 * s, lh=1.2, max_lines=2)
        paragraph(ctx, ll, cx, base + 40 * s, ls, "SemiBold", P.muted, lh=1.2, alpha=a)
    line(ctx, f.cx - W / 2, base, f.cx + W / 2, base, P.line, 3 * s, ease(t, 0, .4))
    if cap:
        cs, cl = fit(cap, W, cap_h, f.pick(46, 40, 42) * s, "Bold", 24 * s, lh=1.25, max_lines=2)
        paragraph(ctx, cl, f.cx, y1 - cap_h + 30 * s, cs, "Bold", P.fg, lh=1.25, reveal=1.6, t=t)
    handle_tag(f, bc.g.get("handle"), 1)


STAT = SceneKind("stat", L("Big number", "Большое число"), [
    Field("value", "number", L("Number", "Число"), required=True, min=-1e12, max=1e12),
    Field("decimals", "number", L("Decimals", "Знаков после запятой"), min=0, max=2, default=0),
    Field("prefix", "text", L("Prefix (e.g. $)", "Префикс (например, $)"), max_len=4),
    Field("suffix", "text", L("Suffix (e.g. %, k, ×)", "Суффикс (например, %, тыс, ×)"), max_len=6),
    Field("label", "text", L("What it measures", "Что это за число"), required=True, max_len=60),
    Field("context", "textarea", L("Context / source", "Контекст / источник"), max_len=120),
], (4.2, 2.8, 7.0), draw=draw_stat, hint="Use only real, verifiable numbers or the creator's own data. Name the source in context.",
    sfx=lambda sc, bc: [(.2, "riser", {"gain": -18, "dur": 1.3}), (1.55, "impact", {"gain": -16})])

BARS = SceneKind("bars", L("Bar chart", "Столбчатая диаграмма"), [
    Field("title", "text", L("Chart title", "Заголовок"), max_len=60),
    Field("items", "list", L("Bars: one per line, “Label: 42”", "Столбцы: по одному в строке, «Название: 42»"),
          max_items=7, min_items=2, max_len=48),
    Field("source", "text", L("Source", "Источник"), max_len=80),
], (5.0, 3.0, 9.0), draw=draw_bars, hint="2-6 bars, each 'Label: number' with an optional unit (e.g. 'Python: 48%').")

COMPARE = SceneKind("compare", L("A vs B", "Сравнение"), [
    Field("title", "text", L("Title", "Заголовок"), max_len=60),
    Field("left_label", "text", L("Left label", "Слева: подпись"), required=True, max_len=30),
    Field("left_value", "number", L("Left value", "Слева: число"), min=-1e12, max=1e12),
    Field("right_label", "text", L("Right label", "Справа: подпись"), required=True, max_len=30),
    Field("right_value", "number", L("Right value", "Справа: число"), min=-1e12, max=1e12),
    Field("prefix", "text", L("Prefix", "Префикс"), max_len=4),
    Field("suffix", "text", L("Suffix", "Суффикс"), max_len=8),
    Field("caption", "text", L("Takeaway", "Вывод"), max_len=80),
], (4.8, 3.0, 8.0), draw=draw_compare, hint="Two comparable numbers with the same unit; caption = the takeaway.")

TEMPLATE = Template(
    id="numbers",
    name=L("Data & number reveal", "Цифры и данные"),
    description=L("Counters that roll up, bar charts that grow, A-vs-B comparisons.",
                  "Счётчики, растущие диаграммы и сравнение «было — стало»."),
    category="data",
    styles=["night", "paper", "forest"],
    fields=[handle_field()],
    scene_kinds=[intro_kind(), STAT, BARS, COMPARE, outro_kind()],
    min_scenes=2, max_scenes=8, music="drive", transition="wipe",
    ai_notes="Data story: intro question, 2-4 data scenes, outro takeaway. NEVER invent statistics: if the brief has "
             "no numbers, use the creator's own progress numbers (days, hours, apps shipped) or clearly hypothetical "
             "examples labelled as such in context.",
    examples={
        "en": example("numbers", "en", "My first 30 days of building with AI", [
            ("intro", 3.0, "Thirty days of building with AI. Here are my real numbers.",
             {"kicker": "Day 30", "title": "30 days of building with AI", "subtitle": "My real numbers"}),
            ("stat", 4.2, "Forty-two hours of focused practice. About eighty-four minutes a day.",
             {"value": 42, "suffix": "h", "label": "of focused practice", "context": "≈ 84 minutes a day, tracked daily"}),
            ("bars", 5.0, "Most of that time went into building, not watching tutorials.",
             {"title": "Where the hours went", "items": ["Building: 24h", "Debugging: 9h", "Lessons: 6h", "Shipping: 3h"],
              "source": "My own time log"}),
            ("compare", 4.8, "And I went from zero to five deployed apps.",
             {"title": "Apps deployed", "left_label": "Day 1", "left_value": 0, "right_label": "Day 30",
              "right_value": 5, "caption": "Small daily reps add up."}),
            ("outro", 3.4, "Thirty-six days to go.", {"title": "36 days to go.", "cta": "Follow the journey"}),
        ], fields={"handle": "@flowleaf66"}, style="night"),
        "ru": example("numbers", "ru", "30 дней создания с ИИ в цифрах", [
            ("intro", 3.0, "Тридцать дней создаю с ИИ. Вот мои настоящие цифры.",
             {"kicker": "День 30", "title": "30 дней с ИИ в цифрах", "subtitle": "Мои реальные данные"}),
            ("stat", 4.2, "Сорок два часа практики. Это примерно восемьдесят четыре минуты в день.",
             {"value": 42, "suffix": " ч", "label": "сфокусированной практики", "context": "≈ 84 минуты в день, по трекеру"}),
            ("bars", 5.0, "Больше всего времени ушло на создание, а не на просмотр уроков.",
             {"title": "Куда ушли часы", "items": ["Создание: 24 ч", "Отладка: 9 ч", "Уроки: 6 ч", "Релизы: 3 ч"],
              "source": "Мой личный трекер"}),
            ("compare", 4.8, "И я прошёл путь от нуля до пяти запущенных приложений.",
             {"title": "Запущено приложений", "left_label": "День 1", "left_value": 0, "right_label": "День 30",
              "right_value": 5, "caption": "Маленькие шаги каждый день складываются."}),
            ("outro", 3.4, "Осталось тридцать шесть дней.", {"title": "Ещё 36 дней.", "cta": "Следи за путём"}),
        ], fields={"handle": "@flowleaf66"}, style="night"),
    },
)
