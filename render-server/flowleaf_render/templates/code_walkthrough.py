"""Code walkthrough: code typing in an editor window with syntax colours, line highlights + notes, terminal runs."""
from __future__ import annotations

import functools

from pygments import lex
from pygments.lexers import get_lexer_by_name
from pygments.token import Token

from ..common import *  # noqa: F403
from ..common import BuildCtx, backdrop, handle_field, intro_kind, outro_kind
from ..core import Frame
from ..schema import Field, SceneKind, Template, L, example, parse_lines

LANGS = ["python", "javascript", "typescript", "html", "css", "bash", "json", "sql", "text"]
DECO = {"terminal": "dots", "paper": "dots", "night": "dots"}


@functools.lru_cache(64)
def tokenize(code: str, language: str):
    """-> list of lines, each a list of (text, role) with role in kw/str/num/com/fn/fg."""
    try:
        lexer = get_lexer_by_name(language if language != "text" else "text", stripnl=False, ensurenl=False)
    except Exception:  # noqa: BLE001
        lexer = get_lexer_by_name("text")
    lines, cur = [], []
    for ttype, val in lex(code, lexer):
        if ttype in Token.Comment: role = "com"
        elif ttype in Token.Keyword or ttype in Token.Operator.Word: role = "kw"
        elif ttype in Token.Literal.String: role = "str"
        elif ttype in Token.Literal.Number: role = "num"
        elif ttype in Token.Name.Function or ttype in Token.Name.Class or ttype in Token.Name.Builtin \
                or ttype in Token.Name.Tag or ttype in Token.Name.Attribute: role = "fn"
        else: role = "fg"
        parts = val.split("\n")
        for k, p in enumerate(parts):
            if k > 0: lines.append(cur); cur = []
            if p: cur.append((p, role))
    lines.append(cur)
    while len(lines) > 1 and not lines[-1]: lines.pop()
    return lines


def role_color(P, role):
    syn = P.syntax or ("#FF7B72", "#A5D6FF", "#79C0FF", "#7D8590", "#D2A8FF")
    return {"kw": syn[0], "str": syn[1], "num": syn[2], "com": syn[3], "fn": syn[4]}.get(role, P.fg)


def window(f: Frame, x, y, w, h, title, alpha=1.0, bgc=None):
    """Editor window with traffic-light dots and a title. Returns content top y."""
    ctx, s, P = f.ctx, f.s, f.P
    r = 28 * s
    shadow(ctx, x, y, w, h, r, 50 * s, (.35 if P.dark else .16) * alpha, 20 * s)
    fill_rrect(ctx, x, y, w, h, r, bgc or P.code_bg or P.surface, alpha)
    stroke_rrect(ctx, x + .5, y + .5, w - 1, h - 1, r, P.line, max(1, 2 * s), alpha)
    bar = 74 * s
    line(ctx, x, y + bar, x + w, y + bar, P.line, max(1, 2 * s), alpha)
    for k, c in enumerate(("#FF5F57", "#FEBC2E", "#28C840")):
        circle(ctx, x + 40 * s + k * 34 * s, y + bar / 2, 10 * s, c, alpha)
    if title:
        text(ctx, title, x + w / 2, y + bar / 2, 28 * s, "Medium", P.muted, alpha, family="mono", max_w=w - 260 * s)
    return y + bar


def draw_code(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    code = fl["code"] or ""
    lines = tokenize(code, fl.get("language", "python"))
    hl = set(parse_lines(fl.get("highlight", "")))
    note = fl.get("note", "")
    n = len(lines)
    maxcols = max([sum(len(tk) for tk, _ in ln) for ln in lines] + [12])
    # layout
    if f.wide:
        ww = (x1 - x0) * (.64 if note else 1); wx = x0; wy = y0 + 10 * s; wh = y1 - y0 - 10 * s
        nx, ny, nw = wx + ww + 60 * s, None, x1 - (wx + ww + 60 * s)
    else:
        ww = x1 - x0 + f.pick(40, 40, 0) * s; wx = f.cx - ww / 2
        wy = y0 + f.pick(10, 0, 0) * s
        wh = (y1 - y0) * (f.pick(.68, .66, 1) if note else 1)
        nx, nw = x0, x1 - x0
    pad = 34 * s
    gutter_cols = len(str(n)) + 1
    cw_unit = text_width("M", 100, "Regular", 0, "mono") / 100     # monospace advance per px of size
    avail_w = ww - 2 * pad
    avail_h = wh - 74 * s - 2 * pad
    lh = 1.55
    size = min(f.pick(40, 36, 36) * s, avail_w / ((maxcols + gutter_cols + .5) * cw_unit), avail_h / (n * lh + .3))
    size = max(14 * s, size)
    need = 74 * s + 2 * pad + n * size * lh
    if not f.wide:
        if not f.vertical: wy += 40 * s; wh -= 40 * s
        note_h = 300 * s if note else 0
        wh = min(wh, need)
        wy = wy + max(0, ((y1 - wy) - (wh + note_h)) / 2)
    else:
        wh = min(wh, max(need, 500 * s)); wy = (y0 + y1) / 2 - wh / 2
    rise = (1 - ease(t, 0, .5, out_back)) * 60 * s
    a = ease(t, 0, .35)
    top = window(f, wx, wy + rise, ww, wh, fl.get("filename") or fl.get("language", ""), a)
    adv = cw_unit * size
    gx = wx + pad
    cx0 = gx + gutter_cols * adv
    total_chars = sum(sum(len(tk) for tk, _ in ln) + 1 for ln in lines)
    type_end = min(sc["duration"] * .5, .4 + total_chars / 45)
    shown = int(total_chars * prog(t, .4, type_end))
    hl_u = ease(t, type_end + .1, type_end + .5)
    used = 0
    cursor = None
    for i, ln in enumerate(lines):
        y = top + pad + i * size * lh + rise
        mid = y + size * lh / 2
        if hl and (i + 1) in hl and hl_u > 0:
            fill_rrect(ctx, wx + 8 * s, mid - size * lh / 2, ww - 16 * s, size * lh, 8 * s, P.accent, .16 * hl_u)
            fill_rrect(ctx, wx + 8 * s, mid - size * lh / 2, 6 * s, size * lh, 3 * s, P.accent, hl_u)
        dim = 1 - (.55 * hl_u if hl and (i + 1) not in hl else 0)
        text(ctx, str(i + 1).rjust(gutter_cols - 1), gx, mid, size, "Regular", P.muted, a * .6 * dim, "lm", family="mono")
        col = 0
        for tk, role in ln:
            if used >= shown: break
            vis = tk[: max(0, shown - used)]
            used += len(vis)
            if vis.strip():
                text(ctx, vis, cx0 + col * adv, mid, size, "Medium" if role != "kw" else "Bold", role_color(P, role),
                     a * dim, "lm", family="mono")
            col += len(vis)
            if len(vis) < len(tk): break
        if used < shown: used += 1   # newline
        if cursor is None and used >= shown: cursor = (cx0 + col * adv, mid)
    if cursor and t < type_end + .8:
        on = (t * 2.2) % 1 < .6 or t < type_end
        if on: fill_rrect(ctx, cursor[0] + 2 * s, cursor[1] - size * .62, size * .55, size * 1.24, 2 * s, P.accent, a)
    if note:
        na = ease(t, type_end + .3, type_end + .7)
        ns0 = f.pick(46, 40, 44) * s
        if f.wide:
            ns, nl = fit(note, nw - 100 * s, wh * .7, ns0, "SemiBold", 24 * s, lh=1.3, max_lines=7)
            nh = ns * (.727 + 1.3 * (len(nl) - 1)) + 100 * s
            ny = wy + wh / 2 - nh / 2
        else:
            ny = wy + wh + 50 * s
            ns, nl = fit(note, nw - 100 * s, y1 - ny - 100 * s, ns0, "SemiBold", 24 * s, lh=1.3, max_lines=4)
            nh = ns * (.727 + 1.3 * (len(nl) - 1)) + 100 * s
        dy = (1 - ease(t, type_end + .3, type_end + .8, out_back)) * 40 * s
        card(f, nx, ny + dy, nw, nh, 30 * s, alpha=na)
        fill_rrect(ctx, nx, ny + dy, 12 * s, nh, 6 * s, P.accent, na)
        paragraph(ctx, nl, nx + 50 * s, ny + dy + 50 * s, ns, "SemiBold", P.fg, na, align="l", lh=1.3)
    handle_tag(f, bc.g.get("handle"), 1)


def draw_terminal(f: Frame, sc, bc: BuildCtx):
    ctx, t, s, P = f.ctx, f.t, f.s, f.P
    backdrop(f, DECO.get(P.id, "dots"), seed=bc.index)
    x0, y0, x1, y1 = f.safe()
    fl = sc["fields"]
    cmd = fl.get("command", "")
    out = [ln for ln in (fl.get("output") or "").split("\n")][:12]
    title = fl.get("title", "")
    ww = min(x1 - x0 + (40 * s if not f.wide else 0), 1500 * s)
    wx = f.cx - ww / 2
    n = 1 + len(out)
    pad = 40 * s
    maxcols = max([len(cmd) + 2] + [len(o) for o in out] + [20])
    cw_unit = text_width("M", 100, "Regular", 0, "mono") / 100
    lh = 1.6
    size = min(f.pick(38, 34, 36) * s, (ww - 2 * pad) / (maxcols * cw_unit))
    size = max(14 * s, size)
    wh = 74 * s + 2 * pad + n * size * lh
    th = 0
    if title:
        ts, tl = fit(title, x1 - x0, 220 * s, f.pick(76, 64, 66) * s, "ExtraBold", 30 * s, lh=1.1, max_lines=2)
        th = ts * (.727 + 1.1 * (len(tl) - 1)) + 80 * s
    block = th + wh
    by = max(y0, f.cy - block / 2 - 20 * s)
    if title:
        paragraph(ctx, tl, f.cx, by, ts, "ExtraBold", P.fg, lh=1.1, reveal=0, t=t)
    wy = by + th + (1 - ease(t, .1, .6, out_back)) * 50 * s
    a = ease(t, .1, .4)
    term_bg = "#0D1117" if not P.dark else (P.code_bg or P.surface)
    top = window(f, wx, wy, ww, wh, fl.get("shell_title") or "terminal", a, bgc=term_bg)
    adv = cw_unit * size
    x = wx + pad
    y = top + pad + size * lh / 2
    type_end = .5 + len(cmd) / 22
    shown = int(len(cmd) * prog(t, .5, type_end))
    text(ctx, "$", x, y, size, "Bold", "#3FBF85", a, "lm", family="mono")
    if shown: text(ctx, cmd[:shown], x + 2 * adv, y, size, "Medium", "#E6EDF3", a, "lm", family="mono")
    if t < type_end + .3 and (t * 2.2) % 1 < .6:
        fill_rrect(ctx, x + (2 + shown) * adv + 2 * s, y - size * .62, size * .55, size * 1.24, 2 * s, "#3FBF85", a)
    for k, o in enumerate(out):
        ta = type_end + .35 + k * min(.28, 1.6 / max(1, len(out)))
        oa = ease(t, ta, ta + .2)
        low = o.strip().lower()
        c = "#3FBF85" if low.startswith(("✓", "✔", "ok", "done", "success", "готово", "→", "➜")) else \
            "#FF7B72" if low.startswith(("error", "✗", "x ", "ошибка", "fail")) else "#9DA7B3"
        text(ctx, o, x, y + (k + 1) * size * lh, size, "Regular", c, oa, "lm", family="mono")
    handle_tag(f, bc.g.get("handle"), 1)


CODE = SceneKind("code", L("Code", "Код"), [
    Field("filename", "text", L("File name", "Имя файла"), max_len=40),
    Field("language", "select", L("Language", "Язык"),
          options=[{"value": v, "label": L(v.capitalize() if v != "text" else "Plain text",
                                           v.capitalize() if v != "text" else "Текст")} for v in LANGS],
          default="python"),
    Field("code", "code", L("Code", "Код"), required=True, max_len=900, max_lines=16),
    Field("highlight", "lines", L("Lines to highlight (e.g. 2, 4-5)", "Подсветить строки (например 2, 4-5)")),
    Field("note", "textarea", L("Explanation shown after typing", "Пояснение после набора"), max_len=140),
], (6.0, 3.5, 12.0), draw=draw_code,
    hint="Real, runnable code, max ~12 lines and ~44 characters per line. Highlight the 1-3 lines that matter.",
    sfx=lambda sc, bc: [(.4, "type", {"gain": -16, "dur": min(2.5, sc["duration"] * .45)})])

TERMINAL = SceneKind("terminal", L("Terminal", "Терминал"), [
    Field("title", "text", L("Heading above the terminal", "Заголовок над терминалом"), max_len=50),
    Field("command", "text", L("Command", "Команда"), required=True, max_len=70),
    Field("output", "code", L("Output", "Вывод"), max_len=500, max_lines=10),
], (4.6, 3.0, 9.0), draw=draw_terminal, hint="One shell command and its short, realistic output (lines starting with ✓ are green).",
    sfx=lambda sc, bc: [(.5, "type", {"gain": -16, "dur": .9})])

TEMPLATE = Template(
    id="code-walkthrough",
    name=L("Code walkthrough", "Разбор кода"),
    description=L("Code types itself in an editor, key lines light up, then it runs in a terminal.",
                  "Код набирается в редакторе, важные строки подсвечиваются, потом запуск в терминале."),
    category="code",
    styles=["terminal", "paper", "night"],
    fields=[handle_field()],
    scene_kinds=[intro_kind(), CODE, TERMINAL, outro_kind()],
    min_scenes=2, max_scenes=8, music="focus", transition="fade",
    ai_notes="Teach one small, real snippet. Keep code short (<= 12 lines, <= 44 chars wide) so it stays readable on a "
             "phone. Use the note to explain the highlighted lines in plain words. Code identifiers stay in English "
             "even in the Russian version; comments and notes follow the language.",
    examples={
        "en": example("code-walkthrough", "en", "Call Claude from Python in 6 lines", [
            ("intro", 3.0, "Here's how to call Claude from Python in six lines.",
             {"kicker": "Python", "title": "Call Claude in 6 lines", "subtitle": "Your first AI API call"}),
            ("code", 6.5, "Import the SDK, create a client, send one message, and print the reply.",
             {"filename": "hello_claude.py", "language": "python",
              "code": "import anthropic\n\nclient = anthropic.Anthropic()\nmsg = client.messages.create(\n"
                      "    model=\"claude-sonnet-5-5\",\n    max_tokens=300,\n"
                      "    messages=[{\"role\": \"user\",\n               \"content\": \"Hi!\"}],\n)\n"
                      "print(msg.content[0].text)",
              "highlight": "4-6", "note": "One call: pick a model, cap the length, send your message."}),
            ("terminal", 4.4, "Run it, and the model answers.",
             {"title": "Run it", "command": "python hello_claude.py",
              "output": "Hi! How can I help you today?\n✓ done in 1.2s"}),
            ("outro", 3.4, "Tomorrow: give it tools.", {"title": "Next: give it tools.", "cta": "Follow for part 2"}),
        ], fields={"handle": "@flowleaf66"}, style="terminal"),
        "ru": example("code-walkthrough", "ru", "Вызов Claude из Python за 6 строк", [
            ("intro", 3.0, "Как вызвать Claude из Python за шесть строк.",
             {"kicker": "Python", "title": "Claude за 6 строк", "subtitle": "Твой первый запрос к ИИ по API"}),
            ("code", 6.5, "Импортируем SDK, создаём клиент, отправляем сообщение и печатаем ответ.",
             {"filename": "hello_claude.py", "language": "python",
              "code": "import anthropic\n\nclient = anthropic.Anthropic()\nmsg = client.messages.create(\n"
                      "    model=\"claude-sonnet-5-5\",\n    max_tokens=300,\n"
                      "    messages=[{\"role\": \"user\",\n               \"content\": \"Привет!\"}],\n)\n"
                      "print(msg.content[0].text)",
              "highlight": "4-6", "note": "Один вызов: выбираем модель, ограничиваем длину, отправляем сообщение."}),
            ("terminal", 4.4, "Запускаем — и модель отвечает.",
             {"title": "Запускаем", "command": "python hello_claude.py",
              "output": "Привет! Чем могу помочь?\n✓ готово за 1,2 с"}),
            ("outro", 3.4, "Завтра — дадим ему инструменты.",
             {"title": "Дальше — инструменты.", "cta": "Подпишись на часть 2"}),
        ], fields={"handle": "@flowleaf66"}, style="terminal"),
    },
)
