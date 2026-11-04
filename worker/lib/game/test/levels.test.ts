import { describe, expect, it } from "vitest";
import { levelForXp, levelProgress, rankFor, xpForLevel } from "../levels";
import { CURRICULUM } from "../curriculum";
import { XP } from "../engine";

describe("level curve", () => {
  it("starts at level 1 with 0 XP and is strictly increasing", () => {
    expect(levelForXp(0)).toBe(1);
    for (let l = 1; l < 40; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });

  it("early levels come fast: level 2 within a couple of tasks, level 5 within the first week", () => {
    expect(xpForLevel(2)).toBeLessThanOrEqual(80);
    expect(xpForLevel(5)).toBeLessThanOrEqual(7 * 100);
  });

  it("gaps between levels grow (later levels feel earned)", () => {
    const gap = (l: number) => xpForLevel(l + 1) - xpForLevel(l);
    expect(gap(20)).toBeGreaterThan(gap(5) * 2);
  });

  const full = (taskXp: number) => taskXp + 66 * XP.dayBonus + 5 * XP.bossBonus;
  it("finishing everything (curriculum: apps 6,970 / video 6,890 task XP) lands at level 21–23", () => {
    for (const t of [6970, 6890]) {
      expect(levelForXp(full(t))).toBeGreaterThanOrEqual(21);
      expect(levelForXp(full(t) + Object.values(XP.streakBonus).reduce((a, b) => a + b, 0))).toBeLessThanOrEqual(23);
    }
    // a student who does ~70% lands mid-teens, not stuck in single digits
    expect(levelForXp(full(6970) * 0.7)).toBeGreaterThanOrEqual(16);
  });

  it("the generated curriculum (when present) matches those totals within 10%", () => {
    for (const tr of ["apps", "video"] as const) {
      const t = CURRICULUM.totalTaskXp[tr];
      if (!t) return; // curriculum not generated in this environment
      expect(levelForXp(full(t))).toBeGreaterThanOrEqual(20);
      expect(levelForXp(full(t))).toBeLessThanOrEqual(24);
    }
  });

  it("levelProgress is consistent at boundaries", () => {
    const t = xpForLevel(7);
    expect(levelProgress(t).level).toBe(7);
    expect(levelProgress(t).progress).toBe(0);
    expect(levelProgress(t - 1).level).toBe(6);
    expect(levelProgress(t - 1).progress).toBeGreaterThan(0.9);
  });

  it("rank titles follow levels", () => {
    expect(rankFor(1)).toBe("seed");
    expect(rankFor(4)).toBe("leaf");
    expect(rankFor(22)).toBe("tree");
  });
});
