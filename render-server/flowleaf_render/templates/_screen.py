"""Shared 'screenshot in a device' scene kind: show what you built in a phone or browser mockup."""
from __future__ import annotations

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop
from ..core import Frame
from ..icons import draw_icon
from ..schema import Field, SceneKind, L

DEVICES = [{"value": "phone", "label": L("Phone", "Телефон")}, {"value": "browser", "label": L("Browser", "Браузер")},
           {"value": "none", "label": L("No frame", "Без рамки")}]


def placeholder(f: Frame, x, y, w, h, r, alpha=1.0):
    """Wireframe of an app screen, used when no image is set (or it failed to load)."""
    ctx, s, P = f.ctx, f.s, f.P
    fill_rrect(ctx, x, y, w, h, r, P.bg2 if not P.dark else P.surface, alpha)
    ctx.save(); rrect(ctx, x, y, w, h, r); ctx.clip()
    pad = w * .08
    fill_rrect(ctx, x, y, w, h * .12, 0, P.accent, alpha * .9)
    cy = y + h * .17
    for k in range(4):
        ch = h * .15
        fill_rrect(ctx, x + pad, cy, w - 2 * pad, ch, w * .04, P.surface if not P.dark else P.bg2, alpha)
        stroke_rrect(ctx, x + pad, cy, w - 2 * pad, ch, w * .04, P.line, max(1, 2 * s), alpha)
        circle(ctx, x + pad + ch * .45, cy + ch / 2, ch * .25, P.accent if k == 0 else P.line, alpha)
        fill_rrect(ctx, x + pad + ch * .9, cy + ch * .3, (w - 2 * pad) * .5, ch * .14, ch * .07, P.muted, alpha * .5)
        fill_rrect(ctx, x + pad + ch * .9, cy + ch * .56, (w - 2 * pad) * .32, ch * .1, ch * .05, P.line, alpha)
        cy += ch + h * .03
    ctx.restore()
    draw_icon(ctx, "search", x + w - pad - h * .03, y + h * .06, h * .045, P.on_accent, alpha * .9, 2)


def device(f: Frame, kind, x, y, w, h, img, t, alpha=1.0):
    """Draw a device frame with the image inside. (x, y, w, h) is the outer box."""
    ctx, s, P = f.ctx, f.s, f.P
    if alpha <= 0: return
    if kind == "phone":
        r = w * .14
        shadow(ctx, x, y, w, h, r, 60 * s, .35 * alpha, 24 * s)
        fill_rrect(ctx, x, y, w, h, r, "#111316", alpha)
        b = w * .035
        sx, sy, sw, sh, sr = x + b, y + b, w - 2 * b, h - 2 * b, r - b
        if img: image_cover(ctx, img, sx, sy, sw, sh, alpha, zoom=1.0, pan=(0, -max(0, ease(t, .6, 6, in_out_cubic)) * sh * .25),
                            radius=sr, top=True)
        else: placeholder(f, sx, sy, sw, sh, sr, alpha)
        fill_rrect(ctx, x + w / 2 - w * .14, y + b + w * .03, w * .28, w * .07, w * .035, "#111316", alpha)
    elif kind == "browser":
        r = 22 * s
        bar = max(46 * s, h * .08)
        shadow(ctx, x, y, w, h, r, 50 * s, .3 * alpha, 20 * s)
        fill_rrect(ctx, x, y, w, h, r, P.surface if not P.dark else "#1B1F23", alpha)
        stroke_rrect(ctx, x, y, w, h, r, P.line, max(1, 2 * s), alpha)
        for k, c in enumerate(("#FF5F57", "#FEBC2E", "#28C840")):
            circle(ctx, x + bar * .6 + k * bar * .42, y + bar / 2, bar * .12, c, alpha)
        fill_rrect(ctx, x + bar * 2.2, y + bar * .22, w - bar * 3, bar * .56, bar * .28, P.bg2 if not P.dark else "#111316", alpha)
        sx, sy, sw, sh = x + 2 * s, y + bar, w - 4 * s, h - bar - 2 * s
        if img: image_cover(ctx, img, sx, sy, sw, sh, alpha, zoom=lerp(1.0, 1.06, ease(t, 0, 6, linear)), radius=r * .6, top=True)
        else: placeholder(f, sx, sy, sw, sh, r * .6, alpha)
    else:
        r = 30 * s
        shadow(ctx, x, y, w, h, r, 50 * s, .25 * alpha, 20 * s)
        if img: image_cover(ctx, img, x, y, w, h, alpha, zoom=lerp(1.0, 1.08, ease(t, 0, 6, linear)), radius=r)
        else: placeholder(f, x, y, w, h, r, alpha)


def draw_screen(f: Frame, sc, bc: BuildCtx, deco="dots"):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, deco, seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    img = (bc.sb.get("_assets") or {}).get(fl.get("image") or "")
    kind = fl.get("device", "phone")
    W, H = x1 - x0, y1 - y0
    title, cap = fl.get("title", ""), fl.get("caption", "")
    a = ease(t, .05, .5)
    rise = (1 - ease(t, .05, .7, out_back)) * 90 * s
    if f.wide:
        dh = H
        dw = dh * (9 / 19.5) if kind == "phone" else min(W * .58, dh * 1.45)
        dh = dh if kind == "phone" else dw / 1.45
        dx = x1 - dw - 20 * s; dy = (y0 + y1) / 2 - dh / 2
        device(f, kind, dx, dy + rise, dw, dh, img, t, a)
        tx, tw = x0, dx - x0 - 90 * s
        ts, tl = fit(title, tw, H * .45, 88 * s, "Black", 34 * s, lh=1.06, max_lines=4) if title else (0, [])
        th = ts * (.727 + 1.06 * (len(tl) - 1)) if tl else 0
        cs, cl = fit(cap, tw, H * .35, 44 * s, "Medium", 24 * s, lh=1.35, max_lines=5) if cap else (0, [])
        ch = cs * (.727 + 1.35 * (len(cl) - 1)) if cl else 0
        ty = (y0 + y1) / 2 - (th + (50 * s + ch if cl else 0)) / 2
        if tl: kinetic_lines(f, tl, tx, ty, ts, .3, "Black", align="l", valign="t", lh=1.06)
        if cl: paragraph(ctx, cl, tx, ty + th + 50 * s, cs, "Medium", P.muted, align="l", lh=1.35, reveal=.8, t=t)
    else:
        ts, tl = fit(title, W, H * .2, f.pick(84, 70, 0) * s, "Black", 34 * s, lh=1.06, max_lines=2) if title else (0, [])
        th = ts * (.727 + 1.06 * (len(tl) - 1)) if tl else 0
        cs, cl = fit(cap, W, H * .14, f.pick(42, 36, 0) * s, "Medium", 22 * s, lh=1.3, max_lines=2) if cap else (0, [])
        chh = cs * (.727 + 1.3 * (len(cl) - 1)) if cl else 0
        top = y0 + (th + 60 * s if tl else 0)
        bottom = y1 - (chh + 50 * s if cl else 0)
        avail = bottom - top
        if kind == "phone":
            dh = avail; dw = dh * 9 / 19.5
            if dw > W * .8: dw = W * .8; dh = dw * 19.5 / 9
        else:
            dw = W + (60 * s if f.vertical else 0); dh = min(avail, dw / (1.0 if f.vertical else 1.45) if kind == "browser" else dw)
        dx = f.cx - dw / 2; dy = top + (avail - dh) / 2
        if tl: kinetic_lines(f, tl, f.cx, y0, ts, .2, "Black", valign="t", lh=1.06)
        device(f, kind, dx, dy + rise, dw, dh, img, t, a)
        if cl: paragraph(ctx, cl, f.cx, bottom + 50 * s, cs, "Medium", P.muted, lh=1.3, reveal=.8, t=t)
    handle_tag(f, bc.g.get("handle"), 1) if not tl or f.wide else None


def screen_kind(deco="dots", hint="Show a screenshot of what you built (upload an image)."):
    return SceneKind("screen", L("Screenshot", "Скриншот"), [
        Field("image", "image", L("Screenshot (image)", "Скриншот (картинка)"),
              help=L("PNG or JPG of your app. Without one we show a neutral sketch.",
                     "PNG или JPG твоего приложения. Без картинки покажем нейтральный набросок.")),
        Field("device", "select", L("Frame", "Рамка"), options=DEVICES, default="phone"),
        Field("title", "text", L("Title", "Заголовок"), max_len=50),
        Field("caption", "textarea", L("Caption", "Подпись"), max_len=110),
    ], (4.5, 2.5, 9.0), draw=lambda f, sc, bc: draw_screen(f, sc, bc, deco), hint=hint,
        sfx=lambda sc, bc: [(.1, "whoosh", {"gain": -14})])
