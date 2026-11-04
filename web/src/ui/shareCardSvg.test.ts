import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SHARE_PALETTE, escapeXml, ruDays, shareCardSvg, shareText, wrap } from "./shareCardSvg";

const css = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");
const block = (re: RegExp) => Object.fromEntries([...re.exec(css)![1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
const light = block(/:root \{([\s\S]*?)\n\}/);
const dark = block(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/);

describe("share card palette mirrors tokens", () => {
  const map = { bg: "bg", surface: "surface", surface2: "surface-2", fg: "fg", muted: "muted", line: "line", lineStrong: "line-strong",
    accent: "accent", accentFg: "accent-fg", accentInk: "accent-ink", accentSoft: "accent-soft", gold: "gold", goldBright: "gold-bright", goldSoft: "gold-soft" } as const;
  for (const [k, tok] of Object.entries(map)) {
    it(`light ${k}`, () => expect(SHARE_PALETTE.light[k as keyof typeof map]).toBe(light[tok]));
    it(`dark ${k}`, () => expect(SHARE_PALETTE.dark[k as keyof typeof map]).toBe(dark[tok]));
  }
});

describe("shareCardSvg", () => {
  const base = { kind: "day" as const, lang: "en" as const, day: 12, title: "Taste both tracks, then choose", streak: 9, xp: 1240, name: "Alex", track: "apps" as const };
  it("renders both sizes with the right viewBox", () => {
    expect(shareCardSvg(base, "portrait")).toContain('viewBox="0 0 1080 1350"');
    expect(shareCardSvg(base, "landscape")).toContain('viewBox="0 0 1200 630"');
  });
  it("escapes user text", () => {
    const svg = shareCardSvg({ ...base, name: `<script>"x"&`, title: "a < b" });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;&quot;x&quot;&amp;");
  });
  it("draws 66 cells and localises copy", () => {
    const ru = shareCardSvg({ ...base, lang: "ru", track: "video" });
    expect(ru).toContain("ДЕНЬ 12 ИЗ 66");
    expect(ru).toContain("Трек «Видео»");
    expect(ru).toContain("1 240");
  });
  it("clamps the day", () => expect(shareCardSvg({ ...base, day: 99 })).toContain("DAY 66 OF 66"));
  it("streak card", () => expect(shareCardSvg({ ...base, kind: "streak", streak: 21, lang: "ru" })).toContain("21 день подряд".split(" ")[0]));
});

describe("helpers", () => {
  it("ruDays", () => expect([1, 2, 5, 11, 21, 22, 25, 112].map(ruDays)).toEqual(["день", "дня", "дней", "дней", "день", "дня", "дней", "дней"]));
  it("escapeXml", () => expect(escapeXml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;"));
  it("wrap limits lines and adds an ellipsis", () => {
    const lines = wrap("one two three four five six seven eight nine ten eleven twelve", 200, 40, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });
  it("shareText is native per language", () => {
    expect(shareText({ kind: "day", lang: "en", day: 3, streak: 3 })).toBe("Day 3 of 66, done. 3-day streak. #FlowLeaf66");
    expect(shareText({ kind: "streak", lang: "ru", day: 5, streak: 22 })).toBe("22 дня подряд создаю с ИИ. Цель — 66. #FlowLeaf66");
  });
});
