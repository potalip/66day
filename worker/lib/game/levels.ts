// OWNER: game agent. Level curve tuned for a 66-day program.
//
// Cumulative XP to reach level L:  A * (L-1)^P, rounded to 10.
// With A=65, P=1.6: L2=70, L3=200, L5=600, L10=2190, L15=4500, L20=7340, L22=8450, L23=9130.
// The real curriculum has ~6,970 (apps) / 6,890 (video) task XP; + 66×20 day bonus + 5×100 boss bonus
// ≈ 8,700–8,800 XP for completing everything → level 22 (23 with a perfect streak).
// Early levels come fast: level 2 after the first couple of tasks, level 5 within the first week.

export const LEVEL_A = 65;
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
