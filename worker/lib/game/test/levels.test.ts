import { describe, expect, it } from "vitest";
import { levelForXp, levelProgress, rankFor, xpForLevel } from "../levels";
import { CURRICULUM } from "../curriculum";
import { XP } from "../engine";

describe("level curve", () => {
  it("starts at level 1 with 0 XP and is strictly increasing", () => {
    expect(levelForXp(0)).toBe(1);
    for (let l = 1; l < 40; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });

  it("early levels come fast: level 2 within one task, level 5 within the first week", () => {
    expect(xpForLevel(2)).toBeLessThanOrEqual(60);
    expect(xpForLevel(5)).toBeLessThanOrEqual(7 * 100);
  });

  it("gaps between levels grow (later levels feel earned)", () => {
    const gap = (l: number) => xpForLevel(l + 1) - xpForLevel(l);
    expect(gap(20)).toBeGreaterThan(gap(5) * 2);
  });

  it("finishing 66 days at ~100 XP/day lands at level 20–25", () => {
    const streakBonus = Object.values(XP.streakBonus).reduce((a, b) => a + b, 0);
    for (const perDay of [85, 100, 115]) {
      const lvl = levelForXp(perDay * 66 + streakBonus);
      expect(lvl).toBeGreaterThanOrEqual(20);
      expect(lvl).toBeLessThanOrEqual(25);
    }
  });

  it("if the real curriculum is present, completing it lands at level 18–27", () => {
    if (!CURRICULUM.totalTaskXp) return; // curriculum not generated yet
    const total = CURRICULUM.totalTaskXp + 66 * XP.dayBonus + CURRICULUM.bossDays.size * XP.bossBonus;
    expect(levelForXp(total)).toBeGreaterThanOrEqual(18);
    expect(levelForXp(total)).toBeLessThanOrEqual(27);
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
