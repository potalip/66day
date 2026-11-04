"""Tiny vector icon set (stroke icons on a 24-unit grid, lucide-like). draw_icon(ctx, name, cx, cy, size, color)."""
from __future__ import annotations

import math

import cairo

from .core import src

ICONS = ("idea", "code", "rocket", "chat", "check", "gear", "chart", "play", "book", "bolt", "target", "clock",
         "heart", "star", "user", "leaf", "search", "lock")

ICON_LABELS = {
    "idea": ("Idea", "Идея"), "code": ("Code", "Код"), "rocket": ("Launch", "Запуск"), "chat": ("Chat", "Чат"),
    "check": ("Done", "Готово"), "gear": ("Settings", "Настройка"), "chart": ("Growth", "Рост"),
    "play": ("Video", "Видео"), "book": ("Learn", "Учёба"), "bolt": ("Fast", "Быстро"), "target": ("Goal", "Цель"),
    "clock": ("Time", "Время"), "heart": ("Love", "Любовь"), "star": ("Star", "Звезда"), "user": ("Person", "Человек"),
    "leaf": ("Leaf", "Лист"), "search": ("Search", "Поиск"), "lock": ("Secure", "Защита"),
}


def _paths(ctx, name):
    m, l, c, a = ctx.move_to, ctx.line_to, ctx.curve_to, ctx.arc
    def circ(x, y, r): ctx.new_sub_path(); a(x, y, r, 0, 2 * math.pi)
    def rr(x, y, w, h, r):
        ctx.new_sub_path()
        a(x + w - r, y + r, r, -math.pi / 2, 0); a(x + w - r, y + h - r, r, 0, math.pi / 2)
        a(x + r, y + h - r, r, math.pi / 2, math.pi); a(x + r, y + r, r, math.pi, 3 * math.pi / 2); ctx.close_path()
    if name == "idea":
        m(9, 18); l(15, 18); m(10, 21.5); l(14, 21.5)
        ctx.new_sub_path(); a(12, 9, 6, math.pi * .8, math.pi * 2.2)
        m(16.8, 12.6); c(15.6, 14, 15, 15, 15, 16); l(9, 16); c(9, 15, 8.4, 14, 7.2, 12.6)
    elif name == "code":
        m(8, 6); l(2, 12); l(8, 18); m(16, 6); l(22, 12); l(16, 18); m(14, 4); l(10, 20)
    elif name == "rocket":
        m(12, 2.5); c(16, 5, 17, 10, 15.5, 15); l(8.5, 15); c(7, 10, 8, 5, 12, 2.5); ctx.close_path()
        circ(12, 9, 1.8)
        m(8.5, 12.5); l(5.5, 16); l(8.5, 17); m(15.5, 12.5); l(18.5, 16); l(15.5, 17)
        m(10.5, 18); l(10, 21.5); m(13.5, 18); l(14, 21.5)
    elif name == "chat":
        m(21, 15); c(21, 16.1, 20.1, 17, 19, 17); l(8, 17); l(3, 21); l(3, 5); c(3, 3.9, 3.9, 3, 5, 3); l(19, 3)
        c(20.1, 3, 21, 3.9, 21, 5); ctx.close_path(); m(8, 8.5); l(16, 8.5); m(8, 12); l(13, 12)
    elif name == "check":
        circ(12, 12, 9.5); m(7.5, 12.2); l(10.6, 15.3); l(16.5, 9)
    elif name == "gear":
        circ(12, 12, 3)
        for k in range(8):
            ang = k * math.pi / 4
            m(12 + 6.2 * math.cos(ang), 12 + 6.2 * math.sin(ang)); l(12 + 9.3 * math.cos(ang), 12 + 9.3 * math.sin(ang))
        circ(12, 12, 6.2)
    elif name == "chart":
        m(3, 3); l(3, 21); l(21, 21); m(7.5, 17); l(7.5, 13); m(12, 17); l(12, 9); m(16.5, 17); l(16.5, 6)
    elif name == "play":
        rr(2.5, 4.5, 19, 15, 3); m(10, 9); l(15, 12); l(10, 15); ctx.close_path()
    elif name == "book":
        m(12, 6.5); c(10, 4.5, 6, 4, 2.5, 4.5); l(2.5, 19); c(6, 18.5, 10, 19, 12, 21)
        c(14, 19, 18, 18.5, 21.5, 19); l(21.5, 4.5); c(18, 4, 14, 4.5, 12, 6.5); l(12, 21)
    elif name == "bolt":
        m(13, 2); l(4, 14); l(12, 14); l(11, 22); l(20, 10); l(12, 10); ctx.close_path()
    elif name == "target":
        circ(12, 12, 9.5); circ(12, 12, 5.5); circ(12, 12, 1.6)
    elif name == "clock":
        circ(12, 12, 9.5); m(12, 6.5); l(12, 12); l(15.5, 14)
    elif name == "heart":
        m(12, 20.5); c(5, 15.5, 2.5, 12, 2.5, 8.5); c(2.5, 5.5, 4.8, 3.5, 7.5, 3.5); c(9.5, 3.5, 11, 4.6, 12, 6.2)
        c(13, 4.6, 14.5, 3.5, 16.5, 3.5); c(19.2, 3.5, 21.5, 5.5, 21.5, 8.5); c(21.5, 12, 19, 15.5, 12, 20.5)
        ctx.close_path()
    elif name == "star":
        pts = []
        for k in range(10):
            ang = -math.pi / 2 + k * math.pi / 5
            r = 10 if k % 2 == 0 else 4.3
            pts.append((12 + r * math.cos(ang), 12.6 + r * math.sin(ang)))
        m(*pts[0]); [l(*p) for p in pts[1:]]; ctx.close_path()
    elif name == "user":
        circ(12, 8, 4.2); m(4, 21); c(4, 16.5, 7.5, 14, 12, 14); c(16.5, 14, 20, 16.5, 20, 21)
    elif name == "leaf":
        m(4, 20); c(4, 10, 10, 4, 20, 4); c(20, 14, 14, 20, 4, 20); ctx.close_path(); m(4, 20); l(14, 10)
    elif name == "search":
        circ(10.5, 10.5, 7); m(15.5, 15.5); l(21, 21)
    elif name == "lock":
        rr(4, 10.5, 16, 11, 2.5); m(7.5, 10.5); l(7.5, 7.5); c(7.5, 2.5, 16.5, 2.5, 16.5, 7.5); l(16.5, 10.5)
        m(12, 14.5); l(12, 17.5)
    else:
        circ(12, 12, 9)


def draw_icon(ctx, name, cx, cy, size, color, alpha=1.0, width=2.0, scale=1.0):
    if alpha <= 0 or size <= 0: return
    ctx.save()
    k = size / 24 * scale
    ctx.translate(cx - 12 * k, cy - 12 * k); ctx.scale(k, k)
    ctx.new_path(); _paths(ctx, name if name in ICONS else "star")
    ctx.restore()
    src(ctx, color, alpha)
    ctx.set_line_width(width * size / 24 * scale)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()


def icon_options():
    return [{"value": k, "label": {"en": ICON_LABELS[k][0], "ru": ICON_LABELS[k][1]}} for k in ICONS]
