// OWNER: game agent. Level curve tuned for a 66-day program.
//
// Cumulative XP to reach level L:  A * (L-1)^P, rounded to 10.
// With A=54, P=1.6: L2=50, L3=160, L5=490, L10=1820, L15=3740, L20=6100, L22=7020, L25=8730.
// A student who does every task (~70–90 XP/day) plus day bonuses and streak bonuses lands around
// 6,500–8,000 XP after 66 days → level ~21–24. Early levels come within the first few days.

export const LEVEL_A = 54;
export const LEVEL_P = 1.6;

/** Total XP needed to *reach* `level` (level 1 = 0). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round((LEVEL_A * Math.pow(level - 1, LEVEL_P)) / 10) * 10;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  xp: number;
  levelStartXp: number;
  nextLevelXp: number;
  /** 0..1 progress inside the current level */
  progress: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(Math.max(0, xp));
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return { level, xp, levelStartXp, nextLevelXp, progress: (xp - levelStartXp) / (nextLevelXp - levelStartXp) };
}

/** Rank titles — a leaf's life. Localised in the UI by `rank` key. */
export const RANKS = [
  { from: 1, key: "seed" },
  { from: 2, key: "sprout" },
  { from: 4, key: "leaf" },
  { from: 7, key: "sapling" },
  { from: 11, key: "branch" },
  { from: 16, key: "grove" },
  { from: 21, key: "tree" },
  { from: 26, key: "forest" },
] as const;
export type RankKey = (typeof RANKS)[number]["key"];

export function rankFor(level: number): RankKey {
  let r: RankKey = "seed";
  for (const x of RANKS) if (level >= x.from) r = x.key;
  return r;
}
