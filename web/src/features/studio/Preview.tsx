/**
 * Live in-browser preview of a storyboard: a lightweight HTML/CSS sketch of every scene kind, driven by a clock,
 * so students see timing and text without a render server. Layout is in design pixels (1080 on the short side)
 * on a stage that is CSS-scaled to fit, mirroring the Python templates.
 */
import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Palette, Scene, Storyboard, TemplateDef } from "./api";
import { Icon, cx } from "./ui";

const SIZE: Record<string, [number, number]> = { "9x16": [1080, 1920], "1x1": [1080, 1080], "16x9": [1920, 1080] };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a || 1e-6));
const outCubic = (u: number) => 1 - (1 - u) ** 3;
const outBack = (u: number) => { const s = 1.7; const v = u - 1; return 1 + (s + 1) * v ** 3 + s * v ** 2; };
const ease = (t: number, a: number, b: number) => outCubic(prog(t, a, b));
const str = (v: unknown) => (v == null ? "" : String(v));
const keyOf = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Pick a font size that keeps `text` inside roughly `area` px² at line-height lh. */
function fitSize(text: string, width: number, height: number, max: number, min = 28, lh = 1.12, charW = 0.55) {
  const n = Math.max(1, text.length);
  let s = max;
  while (s > min) {
    const perLine = Math.max(1, Math.floor(width / (s * charW)));
    const lines = Math.ceil(n / perLine) + (text.split(" ").some((w) => w.length > perLine) ? 1 : 0);
    if (lines * s * lh <= height) break;
    s -= 2;
  }
  return s;
}

export interface Timeline { starts: number[]; total: number }
export function timeline(sb: Storyboard): Timeline {
  const starts: number[] = []; let acc = 0;
  for (const s of sb.scenes) { starts.push(acc); acc += s.duration; }
  return { starts, total: acc };
}

function captionChunks(text: string, dur: number) {
  const parts = text.trim().split(/(?<=[.!?…])\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (const p of parts) {
    let w = p.split(/\s+/);
    while (w.length > 9) { const cut = w.length > 11 ? 7 : Math.floor(w.length / 2); chunks.push(w.slice(0, cut).join(" ")); w = w.slice(cut); }
    if (w.length) chunks.push(w.join(" "));
  }
  const span = Math.max(.5, dur - .45), total = chunks.reduce((a, c) => a + c.length + 8, 0);
  let t = .2;
  return chunks.map((c) => { const d = span * (c.length + 8) / total; const r = { a: t, b: t + d, c }; t += d; return r; });
}

// ---------------------------------------------------------------------------------------------- stage
interface Ctx { P: Palette; W: number; H: number; t: number; dur: number; sb: Storyboard; T: TemplateDef; i: number; nth: number; count: number; v: boolean; wide: boolean }

function Words({ text, t, start, size, color, hl, hcolor, weight = 900, align = "center", lh = 1.06, stagger = .07 }:
  { text: string; t: number; start: number; size: number; color: string; hl?: Set<string>; hcolor?: string; weight?: number; align?: "center" | "left"; lh?: number; stagger?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{ fontSize: size, fontWeight: weight, lineHeight: lh, textAlign: align, letterSpacing: "-0.02em", color }}>
      {words.map((w, k) => {
        const u = prog(t, start + k * stagger, start + k * stagger + .5);
        const e = outBack(u);
        return (
          <span key={k} style={{
            display: "inline-block", marginRight: "0.26em", opacity: outCubic(Math.min(1, u * 1.6)),
            transform: `translateY(${(1 - e) * size * .45}px) scale(${.75 + .25 * e})`, color: hl?.has(keyOf(w)) ? hcolor : undefined,
          }}>{w}</span>
        );
      })}
    </div>
  );
}

const Appear = ({ t, at, children, rise = 30, style }: { t: number; at: number; children: ReactNode; rise?: number; style?: CSSProperties }) => {
  const u = ease(t, at, at + .45);
  return <div style={{ opacity: u, transform: `translateY(${(1 - u) * rise}px)`, ...style }}>{children}</div>;
};

function Pill({ children, bg, fg, size = 30 }: { children: ReactNode; bg: string; fg: string; size?: number }) {
  return <span style={{ display: "inline-block", background: bg, color: fg, fontSize: size, fontWeight: 700, padding: `${size * .4}px ${size * .8}px`, borderRadius: 999, letterSpacing: ".04em" }}>{children}</span>;
}

function CardBox({ c, children, style }: { c: Ctx; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: c.P.surface, border: `2px solid ${c.P.line}`, borderRadius: 36, boxShadow: c.P.dark ? "0 20px 50px rgba(0,0,0,.35)" : "0 18px 40px rgba(0,0,0,.10)", ...style }}>{children}</div>;
}

function Center({ c, children, gap = 50, align = "center" }: { c: Ctx; children: ReactNode; gap?: number; align?: "center" | "left" }) {
  const padX = c.v ? 90 : c.wide ? 260 : 100;
  return (
    <div style={{ position: "absolute", left: padX, right: padX, top: c.v ? 230 : 90, bottom: c.v ? 330 : 150, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: align === "center" ? "center" : "flex-start", textAlign: align, gap }}>{children}</div>
  );
}

function Handle({ c }: { c: Ctx }) {
  const h = str(c.sb.fields.handle);
  if (!h) return null;
  return <div style={{ position: "absolute", left: c.v ? 90 : c.wide ? 130 : 90, top: c.v ? 175 : 70, fontSize: 30, fontWeight: 600, color: c.P.muted }}>{h}</div>;
}

function sceneBody(c: Ctx, sc: Scene): ReactNode {
  const f = sc.fields; const { P, t, v } = c;
  const colW = c.W - (v ? 180 : c.wide ? 520 : 200);
  const emph = (s: unknown) => new Set(str(s).split(/[,\s]+/).map(keyOf).filter(Boolean));
  switch (sc.kind) {
    case "intro": case "hook": {
      const title = str(f.title ?? f.text);
      const size = fitSize(title, colW, (c.H - 560) * .55, v ? 140 : 120, 48);
      return (
        <Center c={c} gap={40}>
          {str(f.kicker) && <Appear t={t} at={0}><Pill bg={P.accent} fg={P.on_accent}>{str(f.kicker).toUpperCase()}</Pill></Appear>}
          <Words text={title} t={t} start={.2} size={size} color={P.fg} hl={emph(f.emphasis)} hcolor={P.accent} />
          {sc.kind === "hook" && <div style={{ height: 14, borderRadius: 7, background: P.accent, width: `${30 * ease(t, .8, 1.4)}%` }} />}
          {str(f.subtitle) && <Appear t={t} at={.9}><div style={{ fontSize: v ? 46 : 40, color: P.muted, fontWeight: 500 }}>{str(f.subtitle)}</div></Appear>}
        </Center>
      );
    }
    case "statement": {
      const text = str(f.text); const size = fitSize(text, colW - 70, (c.H - 560) * .6, v ? 96 : 84, 36, 1.16);
      const hl = emph(f.emphasis);
      return (
        <Center c={c} align="left" gap={30}>
          {str(f.label) && <Appear t={t} at={.05}><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: ".12em", color: P.muted }}>{str(f.label).toUpperCase()}</div></Appear>}
          <div style={{ borderLeft: `14px solid ${P.accent}`, paddingLeft: 56 }}>
            <Appear t={t} at={.2}><div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.16, color: P.fg }}>
              {text.split(" ").map((w, k) => <span key={k} style={{ color: hl.has(keyOf(w)) ? P.accent : undefined }}>{w} </span>)}
            </div></Appear>
          </div>
        </Center>
      );
    }
    case "quote": {
      const q = str(f.quote); const size = fitSize(q, colW, (c.H - 560) * .5, v ? 76 : 68, 32, 1.22);
      return (
        <Center c={c} gap={40}>
          <Appear t={t} at={0}><div style={{ fontSize: 220, lineHeight: .6, fontWeight: 900, color: P.accent, height: 110 }}>“</div></Appear>
          <Appear t={t} at={.35}><div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.22, color: P.fg }}>{q}</div></Appear>
          {str(f.author) && <Appear t={t} at={1}><div style={{ fontSize: 38, color: P.muted, fontWeight: 600 }}>— {str(f.author)}</div></Appear>}
        </Center>
      );
    }
    case "outro": {
      const title = str(f.title); const size = fitSize(title, colW, 300, v ? 104 : 92, 40);
      return (
        <Center c={c} gap={44}>
          <Leaf color={P.accent} size={130 * outBack(prog(t, 0, .7))} />
          <Words text={title} t={t} start={.35} size={size} color={P.fg} />
          {str(f.subtitle) && <Appear t={t} at={.8}><div style={{ fontSize: v ? 42 : 36, color: P.muted }}>{str(f.subtitle)}</div></Appear>}
          {str(f.cta) && <Appear t={t} at={1.05}><span style={{ display: "inline-block", background: P.accent, color: P.on_accent, fontWeight: 700, fontSize: 40, padding: "28px 56px", borderRadius: 999 }}>{str(f.cta)}</span></Appear>}
        </Center>
      );
    }
    case "next": {
      const title = str(f.title); const size = fitSize(title, colW, 400, v ? 104 : 92, 40);
      const day = Number(c.sb.fields.day ?? 1) + 1;
      const label = str(f.label) || (c.sb.lang === "ru" ? `ЗАВТРА · ДЕНЬ ${day}` : `TOMORROW · DAY ${day}`);
      return (
        <Center c={c} gap={50}>
          <Appear t={t} at={0}><Pill bg={P.accent2} fg={P.dark ? P.bg : "#fff"}>{label}</Pill></Appear>
          <Words text={title} t={t} start={.25} size={size} color={P.fg} />
          {str(f.text) && <Appear t={t} at={.8}><div style={{ fontSize: 44, color: P.muted }}>{str(f.text)}</div></Appear>}
        </Center>
      );
    }
    case "step": case "item": case "feature": {
      const isStep = sc.kind === "step", isItem = sc.kind === "item";
      const order = c.sb.fields.order === "countup" ? "up" : "down";
      const rank = isItem ? (order === "down" ? c.count - c.nth : c.nth + 1) : c.nth + 1;
      const title = str(f.title), body = str(f.body ?? f.note);
      const ts = fitSize(title, colW - 140, 260, v ? 88 : 80, 36, 1.1);
      const label = c.sb.lang === "ru" ? `ШАГ ${c.nth + 1} ИЗ ${c.count}` : `STEP ${c.nth + 1} OF ${c.count}`;
      const rise = (1 - outBack(prog(t, .05, .65))) * 80;
      return (
        <Center c={c} gap={40}>
          {isStep && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 14, width: "100%" }}>
                {Array.from({ length: c.count }, (_, j) => (
                  <div key={j} style={{ flex: 1, height: 10, borderRadius: 5, background: P.line, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: P.accent, width: `${(j < c.nth ? 1 : j === c.nth ? ease(t, .1, .7) : 0) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: ".14em", color: P.muted }}>{label}</div>
            </div>
          )}
          {isItem && <div style={{ fontSize: v ? 300 : 240, fontWeight: 900, lineHeight: .9, color: P.accent, transform: `translateX(${(1 - ease(t, .05, .6)) * 400}px)`, opacity: ease(t, .05, .3) }}>#{rank}</div>}
          {sc.kind === "feature" && (
            <div style={{ width: 300, height: 300, borderRadius: 999, background: P.accent, transform: `scale(${outBack(prog(t, .05, .6))})`, display: "grid", placeItems: "center" }}>
              <Leaf color={P.on_accent} size={150} />
            </div>
          )}
          {sc.kind === "feature" ? (
            <>
              <Words text={title} t={t} start={.35} size={ts} color={P.fg} />
              {body && <Appear t={t} at={.8}><div style={{ fontSize: 46, color: P.muted, lineHeight: 1.35 }}>{body}</div></Appear>}
            </>
          ) : (
            <CardBox c={c} style={{ width: "100%", padding: "64px 70px", opacity: ease(t, .05, .5), transform: `translateY(${rise}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
              {isStep && <div style={{ width: 220, height: 220, borderRadius: 999, background: `${P.accent}22`, border: `4px solid ${P.accent}`, display: "grid", placeItems: "center", fontSize: 96, fontWeight: 900, color: P.accent }}>{c.nth + 1}</div>}
              <div style={{ fontSize: ts, fontWeight: 800, lineHeight: 1.1, color: P.fg }}>{title}</div>
              {body && <Appear t={t} at={.7}><div style={{ fontSize: v ? 48 : 40, color: P.muted, lineHeight: 1.35 }}>{body}</div></Appear>}
            </CardBox>
          )}
        </Center>
      );
    }
    case "stat": {
      const value = Number(f.value ?? 0), dec = Number(f.decimals ?? 0);
      const u = ease(t, .2, 1.6);
      const loc = c.sb.lang === "ru" ? "ru-RU" : "en-US";
      const num = `${str(f.prefix)}${(value * u).toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec })}${str(f.suffix)}`;
      const R = v ? 330 : 250, circ = 2 * Math.PI * R;
      return (
        <Center c={c} gap={60}>
          <div style={{ position: "relative", width: R * 2 + 40, height: R * 2 + 40 }}>
            <svg viewBox={`0 0 ${R * 2 + 40} ${R * 2 + 40}`} width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke={P.line} strokeWidth="22" />
              <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke={P.accent} strokeWidth="22" strokeLinecap="round"
                strokeDasharray={`${circ * u} ${circ}`} transform={`rotate(-90 ${R + 20} ${R + 20})`} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: fitSize(num, R * 1.6, 220, v ? 190 : 160, 60), fontWeight: 900, color: P.fg }}>{num}</div>
          </div>
          <Appear t={t} at={1}><div style={{ fontSize: v ? 72 : 60, fontWeight: 800, color: P.fg }}>{str(f.label)}</div></Appear>
          {str(f.context) && <Appear t={t} at={1.3}><div style={{ fontSize: 42, color: P.muted }}>{str(f.context)}</div></Appear>}
        </Center>
      );
    }
    case "bars": {
      const items = ((f.items as string[]) ?? []).map((s) => {
        const m = /^(.+?)\s*[:—–=|-]\s*([-+]?[\d\s.,]+)\s*(\S*)$/.exec(s);
        return m ? { label: m[1], v: parseFloat(m[2].replace(/\s/g, "").replace(",", ".")) || 0, suf: m[3] } : null;
      }).filter(Boolean) as { label: string; v: number; suf: string }[];
      const max = Math.max(1, ...items.map((x) => Math.abs(x.v)));
      return (
        <Center c={c} gap={50} align="left">
          {str(f.title) && <div style={{ fontSize: 64, fontWeight: 800, color: P.fg, alignSelf: "center" }}>{str(f.title)}</div>}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: v ? 60 : 36 }}>
            {items.map((it, j) => {
              const u = ease(t, .35 + j * .12, 1.35 + j * .12);
              return (
                <div key={j} style={{ opacity: ease(t, .25 + j * .12, .55 + j * .12) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 46, fontWeight: 600, color: P.fg, marginBottom: 16 }}>
                    <span>{it.label}</span><span style={{ fontWeight: 800 }}>{Math.round(it.v * u * 10) / 10}{it.suf}</span>
                  </div>
                  <div style={{ height: 44, borderRadius: 22, background: P.line }}>
                    <div style={{ height: "100%", borderRadius: 22, background: it.v === max ? P.accent : `${P.accent}99`, width: `${Math.max(4, (Math.abs(it.v) / max) * u * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {str(f.source) && <div style={{ fontSize: 26, color: P.muted }}>{str(f.source)}</div>}
        </Center>
      );
    }
    case "compare": {
      if ("left_label" in f) {
        const vals = [Number(f.left_value ?? 0), Number(f.right_value ?? 0)], mx = Math.max(1, ...vals.map(Math.abs));
        const win = vals[0] >= vals[1] ? 0 : 1;
        return (
          <Center c={c} gap={50}>
            {str(f.title) && <div style={{ fontSize: 64, fontWeight: 800, color: P.fg }}>{str(f.title)}</div>}
            <div style={{ display: "flex", gap: 80, alignItems: "flex-end", height: v ? 900 : 520, borderBottom: `3px solid ${P.line}` }}>
              {[0, 1].map((j) => {
                const u = ease(t, .3 + j * .25, 1.5 + j * .25);
                return (
                  <div key={j} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: 260 }}>
                    <div style={{ fontSize: 84, fontWeight: 900, color: P.fg }}>{str(f.prefix)}{Math.round(vals[j] * u * 10) / 10}{str(f.suffix)}</div>
                    <div style={{ width: 240, borderRadius: 26, background: j === win ? P.accent : P.muted, opacity: j === win ? 1 : .5, height: `${Math.max(.05, Math.abs(vals[j]) / mx * u) * (v ? 600 : 300)}px` }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 80 }}>{[f.left_label, f.right_label].map((l, j) => <div key={j} style={{ width: 260, fontSize: 40, color: P.muted, fontWeight: 600 }}>{str(l)}</div>)}</div>
            {str(f.caption) && <Appear t={t} at={1.6}><div style={{ fontSize: 46, fontWeight: 700, color: P.fg }}>{str(f.caption)}</div></Appear>}
          </Center>
        );
      }
      const bp = (f.before_points as string[]) ?? [], ap = (f.after_points as string[]) ?? [];
      const t2 = .5 + .18 * bp.length;
      const box = (title: string, pts: string[], good: boolean, at: number) => (
        <Appear t={t} at={at} style={{ flex: 1, width: "100%" }}>
          <CardBox c={c} style={{ padding: 50, height: "100%", border: good ? `4px solid ${P.accent}` : `2px solid ${P.line}`, background: good ? P.surface : `${P.surface}aa` }}>
            <Pill bg={good ? P.accent : P.muted} fg={good ? P.on_accent : P.bg} size={26}>{title.toUpperCase()}</Pill>
            <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 36 }}>
              {pts.map((p, k) => (
                <div key={k} style={{ display: "flex", gap: 24, alignItems: "center", fontSize: v ? 50 : 40, color: good ? P.fg : P.muted, fontWeight: good ? 600 : 500, opacity: ease(t, at + .2 + k * .18, at + .6 + k * .18) }}>
                  <span style={{ width: 54, height: 54, flex: "none", borderRadius: 99, background: good ? P.accent : P.muted, color: good ? P.on_accent : P.bg, display: "grid", placeItems: "center", fontSize: 32, fontWeight: 900 }}>{good ? "✓" : "✕"}</span>{p}
                </div>
              ))}
            </div>
          </CardBox>
        </Appear>
      );
      return (
        <div style={{ position: "absolute", left: v ? 90 : 130, right: v ? 90 : 130, top: v ? 290 : 150, bottom: v ? 330 : 140, display: "flex", flexDirection: v ? "column" : "row", gap: 70 }}>
          {box(str(f.before_title) || (c.sb.lang === "ru" ? "Было" : "Before"), bp, false, 0)}
          {box(str(f.after_title) || (c.sb.lang === "ru" ? "Стало" : "After"), ap, true, t2)}
        </div>
      );
    }
    case "swipe": {
      const u = outCubic(prog(t, c.dur * .38, c.dur * .38 + .7));
      const side = (label: string, text: string, after: boolean) => (
        <div style={{ position: "absolute", inset: 0, background: after ? P.bg : P.bg2, clipPath: after ? `inset(0 ${100 - u * 100}% 0 0)` : undefined }}>
          <Center c={c} gap={40}>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: ".14em", color: after ? P.fg : P.muted, opacity: .7 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: fitSize(text, colW, 500, v ? 100 : 90, 40), fontWeight: 900, lineHeight: 1.06, color: after ? P.fg : P.muted, textDecoration: after ? "none" : "line-through", textDecorationColor: P.accent2 }}>{text}</div>
          </Center>
        </div>
      );
      return (
        <>
          {side(str(f.before_label) || (c.sb.lang === "ru" ? "Было" : "Before"), str(f.before), false)}
          {side(str(f.after_label) || (c.sb.lang === "ru" ? "Стало" : "After"), str(f.after), true)}
          {u > 0 && u < 1 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${u * 100}%`, width: 20, marginLeft: -10, background: P.accent }} />}
        </>
      );
    }
    case "code": {
      const code = str(f.code).split("\n");
      const hl = new Set(str(f.highlight).split(/[,\s]+/).flatMap((p) => { const m = /^(\d+)(?:-(\d+))?$/.exec(p); if (!m) return []; const a = +m[1], b = +(m[2] ?? a); return Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k); }));
      const chars = code.reduce((a, l) => a + l.length + 1, 0);
      const typeEnd = Math.min(c.dur * .5, .4 + chars / 45);
      let shown = Math.floor(chars * prog(t, .4, typeEnd));
      const hu = ease(t, typeEnd + .1, typeEnd + .5);
      const maxCols = Math.max(20, ...code.map((l) => l.length));
      const fs = Math.min(v ? 40 : 36, (c.W * (c.wide ? .6 : 1) - 260) / ((maxCols + 3) * .6));
      return (
        <div style={{ position: "absolute", left: v ? 70 : 130, right: c.wide ? "38%" : v ? 70 : 90, top: v ? 260 : 120, display: "flex", flexDirection: "column", gap: 40 }}>
          <Window c={c} title={str(f.filename) || str(f.language)}>
            <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: fs, lineHeight: 1.55, color: P.fg }}>
              {code.map((ln, k) => {
                const vis = ln.slice(0, Math.max(0, shown)); shown -= ln.length + 1;
                const on = hl.has(k + 1);
                return (
                  <div key={k} style={{ display: "flex", background: on ? `${P.accent}${Math.round(hu * 40).toString(16).padStart(2, "0")}` : undefined, borderLeft: `6px solid ${on && hu > 0 ? P.accent : "transparent"}`, opacity: hl.size && !on ? 1 - .5 * hu : 1 }}>
                    <span style={{ width: "2.4em", flex: "none", color: P.muted, opacity: .6, textAlign: "right", paddingRight: ".8em" }}>{k + 1}</span>
                    <span style={{ whiteSpace: "pre" }}>{vis || " "}</span>
                  </div>
                );
              })}
            </pre>
          </Window>
          {str(f.note) && <Appear t={t} at={typeEnd + .3} style={c.wide ? { position: "absolute", left: "105%", width: c.W * .3, top: 120 } : undefined}>
            <CardBox c={c} style={{ padding: "40px 46px", borderLeft: `12px solid ${P.accent}`, fontSize: v ? 44 : 38, fontWeight: 600, color: P.fg, lineHeight: 1.3 }}>{str(f.note)}</CardBox>
          </Appear>}
        </div>
      );
    }
    case "terminal": {
      const cmd = str(f.command), out = str(f.output).split("\n").filter((x, k, a) => x || k < a.length - 1);
      const typeEnd = .5 + cmd.length / 22;
      return (
        <Center c={c} gap={50}>
          {str(f.title) && <div style={{ fontSize: v ? 76 : 64, fontWeight: 800, color: P.fg }}>{str(f.title)}</div>}
          <div style={{ width: "100%", textAlign: "left" }}>
            <Window c={c} title="terminal" dark>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: v ? 36 : 34, lineHeight: 1.6, color: "#E6EDF3" }}>
                <div><span style={{ color: "#3FBF85" }}>$ </span>{cmd.slice(0, Math.floor(cmd.length * prog(t, .5, typeEnd)))}</div>
                {out.map((o, k) => <div key={k} style={{ opacity: ease(t, typeEnd + .35 + k * .25, typeEnd + .55 + k * .25), color: /^(✓|✔|ok|done|готово)/i.test(o.trim()) ? "#3FBF85" : "#9DA7B3" }}>{o || " "}</div>)}
              </pre>
            </Window>
          </div>
        </Center>
      );
    }
    case "recap": {
      const day = Number(f.day ?? 1);
      const done = (f.done as string[]) ?? [];
      const ru = c.sb.lang === "ru";
      return (
        <div style={{ position: "absolute", left: v ? 90 : 130, right: v ? 90 : 130, top: v ? 230 : 90, bottom: v ? 330 : 140, display: "flex", flexDirection: v ? "column" : "row", gap: 60 }}>
          <div style={{ flex: v ? "none" : "0 0 42%" }}>
            <Pill bg={P.accent} fg={P.on_accent}>{ru ? `ДЕНЬ ${day} ИЗ 66` : `DAY ${day} OF 66`}</Pill>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 10, marginTop: 40 }}>
              {Array.from({ length: 66 }, (_, k) => {
                const d = k + 1, on = d < day && prog(t, .2 + (k / day) * 1.2, .45 + (k / day) * 1.2) > 0;
                return <div key={k} style={{ aspectRatio: "1", borderRadius: 10, border: `2px solid ${P.line}`, background: d === day && t > 1.4 ? P.accent2 : on ? P.accent : "transparent" }} />;
              })}
            </div>
            {!v && <div style={{ marginTop: 40, fontSize: 72, fontWeight: 900, color: P.accent }}>{Math.round(day / 66 * 100)}%</div>}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 34 }}>
            <Appear t={t} at={.6}><div style={{ fontSize: v ? 76 : 64, fontWeight: 800, color: P.fg, lineHeight: 1.08 }}>{str(f.title)}</div></Appear>
            {done.map((d, k) => (
              <Appear key={k} t={t} at={1 + k * .25}><div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: v ? 44 : 38, fontWeight: 600, color: P.fg }}>
                <span style={{ width: 56, height: 56, flex: "none", borderRadius: 99, background: P.accent, color: P.on_accent, display: "grid", placeItems: "center", fontSize: 32 }}>✓</span>{d}
              </div></Appear>
            ))}
            <div style={{ flex: 1 }} />
            <Appear t={t} at={1.6}><div style={{ display: "flex", gap: 30 }}>
              {[[`+${Math.round(Number(f.xp ?? 0) * ease(t, 1.7, 2.6))} XP`, ru ? "опыта за день" : "earned today"], [`${Number(f.streak ?? 0)} ${ru ? "дн." : "days"}`, ru ? "серия" : "streak"]].map(([a, b], k) => (
                <CardBox key={k} c={c} style={{ flex: 1, padding: "34px 40px" }}>
                  <div style={{ fontSize: 52, fontWeight: 900, color: P.fg }}><span style={{ color: P.accent2 }}>{k ? "⚡" : "★"}</span> {a}</div>
                  <div style={{ fontSize: 28, color: P.muted, fontWeight: 600 }}>{b}</div>
                </CardBox>
              ))}
            </div></Appear>
          </div>
        </div>
      );
    }
    default:
      return <Center c={c}><div style={{ fontSize: 60, color: P.fg }}>{sc.kind}</div></Center>;
  }
}

function Window({ c, title, children, dark }: { c: Ctx; title: string; children: ReactNode; dark?: boolean }) {
  const bg = dark ? (c.P.dark ? c.P.code_bg : "#0D1117") : c.P.code_bg || c.P.surface;
  return (
    <div style={{ background: bg, border: `2px solid ${c.P.line}`, borderRadius: 28, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
      <div style={{ height: 74, display: "flex", alignItems: "center", gap: 14, padding: "0 30px", borderBottom: `2px solid ${c.P.line}`, position: "relative" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => <span key={col} style={{ width: 20, height: 20, borderRadius: 99, background: col }} />)}
        <span style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 28, color: c.P.muted }}>{title}</span>
      </div>
      <div style={{ padding: 34 }}>{children}</div>
    </div>
  );
}

function Leaf({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size * .62} viewBox="-50 -31 100 62" aria-hidden style={{ transform: "rotate(-34deg)" }}>
      <path d="M-50 0 C-20 -38 25 -34 50 0 C25 34 -20 38 -50 0Z" fill={color} />
    </svg>
  );
}

export function Stage({ sb, T, t, className }: { sb: Storyboard; T: TemplateDef; t: number; className?: string }) {
  const [W, H] = SIZE[sb.format] ?? SIZE["9x16"];
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / W));
    ro.observe(el); setK(el.clientWidth / W);
    return () => ro.disconnect();
  }, [W]);
  const P = (T.styles.find((s) => s.id === sb.style) ?? T.styles[0]).palette;
  const tl = timeline(sb);
  let i = tl.starts.findIndex((s, j) => t >= s && t < s + sb.scenes[j].duration);
  if (i < 0) i = Math.max(0, sb.scenes.length - 1);
  const sc = sb.scenes[i];
  const lt = sc ? t - tl.starts[i] : 0;
  const kinds = sb.scenes.map((s) => s.kind);
  const c: Ctx = { P, W, H, t: lt, dur: sc?.duration ?? 1, sb, T, i, nth: kinds.slice(0, i).filter((x) => x === sc?.kind).length,
    count: kinds.filter((x) => x === sc?.kind).length, v: H > W * 1.2, wide: W > H * 1.2 };
  const cue = sb.captions && sc ? captionChunks(sc.voiceover, sc.duration).find((q) => lt >= q.a && lt <= q.b) : undefined;
  // transition: wipe bars / fade near scene edges
  const edgeIn = sc && i > 0 ? 1 - prog(lt, 0, .4) : 0;
  const edgeOut = sc && i < sb.scenes.length - 1 ? prog(lt, sc.duration - .4, sc.duration) : 0;
  const cover = Math.max(edgeIn, edgeOut);
  return (
    <div ref={box} className={cx("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${W} / ${H}`, background: P.bg }}>
      <div style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0, fontFamily: "Inter, var(--font-sans)",
        background: `radial-gradient(ellipse at 50% 38%, ${P.bg2} 0%, ${P.bg} 70%)`, color: P.fg }}>
        {sc ? <>{sceneBody(c, sc)}<Handle c={c} /></> : null}
        {cue && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: c.v ? 250 : 50, textAlign: "center" }}>
            <span style={{ background: "rgba(0,0,0,.66)", color: "#fff", fontSize: c.v ? 40 : 34, fontWeight: 600, padding: "10px 24px", borderRadius: 14, display: "inline-block", maxWidth: "80%" }}>{cue.c}</span>
          </div>
        )}
        {sb.transition === "wipe" && cover > 0 && Array.from({ length: 7 }, (_, r) => {
          const d = r / 7 * .2, u = clamp((cover - d) / .8);
          return <div key={r} style={{ position: "absolute", left: 0, top: (H / 7) * r - 1, height: H / 7 + 2, width: `${u * 100}%`, borderRadius: `0 ${H / 14}px ${H / 14}px 0`, background: r % 2 ? P.accent2 : P.accent }} />;
        })}
        {sb.transition === "fade" && cover > 0 && <div style={{ position: "absolute", inset: 0, background: P.bg, opacity: cover * .9 }} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- player
export function usePlayer(total: number) {
  const [t, setT] = useState(() => Math.min(1.6, total * .5));
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0), last = useRef(0);
  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000; last.current = now;
      setT((x) => { const y = x + dt; if (y >= total) { setPlaying(false); return total - .001; } return y; });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, total]);
  useEffect(() => { setT((x) => Math.min(x, Math.max(0, total - .001))); }, [total]);
  const toggle = useCallback(() => { setPlaying((p) => { if (!p) setT((x) => (x >= total - .05 ? 0 : x)); return !p; }); }, [total]);
  return { t, setT, playing, setPlaying, toggle };
}

export function PreviewPlayer({ sb, T, labels, focusScene }: { sb: Storyboard; T: TemplateDef; labels: { play: string; pause: string; restart: string; scene: string }; focusScene?: number | null }) {
  const tl = timeline(sb);
  const { t, setT, playing, toggle } = usePlayer(tl.total);
  useEffect(() => {
    if (focusScene != null && tl.starts[focusScene] != null && !playing) setT(tl.starts[focusScene] + Math.min(sb.scenes[focusScene].duration * .7, 2.2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusScene]);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const maxW = sb.format === "9x16" ? "max-w-[300px]" : sb.format === "1x1" ? "max-w-[420px]" : "max-w-full";
  return (
    <div>
      <div className={cx("mx-auto overflow-hidden rounded-[12px] border border-line shadow-sm", maxW)}>
        <button type="button" onClick={toggle} aria-label={playing ? labels.pause : labels.play} className="block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-accent">
          <Stage sb={sb} T={T} t={reduced && !playing ? Math.min(t + 1.5, tl.total) : t} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={toggle} aria-label={playing ? labels.pause : labels.play}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <Icon name={playing ? "pause" : "play"} />
        </button>
        <button type="button" onClick={() => setT(0)} aria-label={labels.restart}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
          <Icon name="restart" />
        </button>
        <input type="range" min={0} max={tl.total} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} aria-label="Timeline"
          className="h-1.5 flex-1 cursor-pointer accent-[var(--accent)]" />
        <span className="w-20 text-right text-xs tabular-nums text-muted">{t.toFixed(1)} / {tl.total.toFixed(1)} s</span>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {sb.scenes.map((s, j) => {
          const on = t >= tl.starts[j] && t < tl.starts[j] + s.duration;
          return (
            <button key={j} type="button" tabIndex={-1} onClick={() => setT(tl.starts[j] + .01)} title={`${labels.scene} ${j + 1}`}
              className={cx("h-1.5 rounded-full transition", on ? "bg-accent" : "bg-surface-2 hover:bg-line")} style={{ flex: s.duration }} />
          );
        })}
      </div>
    </div>
  );
}
