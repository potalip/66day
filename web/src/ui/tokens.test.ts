import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Guards WCAG AA contrast for the token pairs we promise in styles.css.
const css = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");
function block(re: RegExp) { const m = re.exec(css); if (!m) throw new Error("block not found"); return m[1]; }
function vars(src: string) {
  const out: Record<string, string> = {};
  for (const m of src.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}
const light = vars(block(/:root \{([\s\S]*?)\n\}/));
const dark = vars(block(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/));

const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const TEXT = ["fg", "muted", "accent", "accent-ink", "gold", "danger"];
const BGS = ["bg", "surface", "surface-2"];
const PAIRS: [string, string][] = [["accent-fg", "accent"], ["accent-ink", "accent-soft"], ["gold-ink", "gold-soft"], ["danger-ink", "danger-soft"], ["info", "info-soft"]];

for (const [name, t] of [["light", light], ["dark", dark]] as const) {
  describe(`${name} theme contrast`, () => {
    for (const fg of TEXT) for (const bg of BGS)
      it(`${fg} on ${bg} ≥ 4.5`, () => expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5));
    for (const [fg, bg] of PAIRS)
      it(`${fg} on ${bg} ≥ 4.5`, () => expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5));
    it("dark block mirrors every light token", () => {
      if (name === "dark") for (const k of ["bg", "fg", "accent", "gold", "line"]) expect(t[k]).toBeDefined();
    });
  });
}
