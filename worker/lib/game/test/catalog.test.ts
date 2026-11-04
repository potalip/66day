import { describe, expect, it } from "vitest";
import contentBadges from "../../../../content/badges.json";
import { BADGE_RULES, CATALOG, CATALOG_BY_ID, mergeCatalog } from "../badges";
import { CURRICULUM } from "../curriculum";

type CB = { id: string; rule: string; icon: string; title: { en: string; ru: string } };
const content = contentBadges as CB[];

describe("badge catalog driven by content/badges.json", () => {
  it("contains every content badge with content copy", () => {
    for (const b of content) {
      const c = CATALOG_BY_ID.get(b.id);
      expect(c, b.id).toBeTruthy();
      expect(c!.title).toEqual(b.title);
      expect(c!.icon).toBe(b.icon);
    }
  });

  it("every 'Game rule' content badge has an engine rule", () => {
    for (const b of content.filter((x) => /game rule/i.test(x.rule))) expect(BADGE_RULES[b.id], b.id).toBeTypeOf("function");
  });

  it("day badges have no engine rule (they come with day.completed) and appear in some day file", () => {
    const listed = new Set([...CURRICULUM.dayBadges.values()].flat());
    for (const b of content.filter((x) => !/game rule/i.test(x.rule))) {
      expect(BADGE_RULES[b.id], b.id).toBeUndefined();
      if (listed.size) expect(listed.has(b.id), `${b.id} not listed in any day file`).toBe(true);
    }
  });

  it("secret badges are flagged and grouped", () => {
    expect(CATALOG_BY_ID.get("night-owl")?.secret).toBe(true);
    expect(CATALOG_BY_ID.get("polyglot")?.secret).toBe(true);
    expect(CATALOG_BY_ID.get("polyglot")?.description.en).not.toMatch(/^secret/i);
    expect(CATALOG.filter((b) => b.secret).every((b) => b.group === "secret")).toBe(true);
  });

  it("program badges are ordered by their day", () => {
    const prog = CATALOG.filter((b) => b.group === "program").map((b) => b.id);
    expect(prog.indexOf("first-step")).toBeLessThan(prog.indexOf("graduate"));
  });

  it("works without content (built-in fallback)", () => {
    const fallback = mergeCatalog(undefined);
    expect(fallback.find((b) => b.id === "streak-7")).toBeTruthy();
  });
});
