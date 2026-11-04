// OWNER: game agent. Daily streak with freezes. Pure functions — all dates are local YYYY-MM-DD strings.
import { daysBetween } from "./time";

export const FREEZE_EVERY = 7; // earn one freeze for every 7 consecutive days
export const MAX_FREEZES = 2;

export interface StreakState {
  streak: number;
  best: number;
  lastDay: string | null;
  freezes: number;
}

export interface StreakChange {
  state: StreakState;
  /** streak went up today (first counting activity of the day) */
  extended: boolean;
  /** a previous streak was lost and this activity started a new one */
  restarted: boolean;
  /** freezes consumed to bridge missed days */
  freezesUsed: number;
  /** a freeze was earned */
  freezeEarned: boolean;
}

/** Apply one streak-counting activity on local day `day`. */
export function applyActivity(s: StreakState, day: string): StreakChange {
  const none = { extended: false, restarted: false, freezesUsed: 0, freezeEarned: false };
  if (s.lastDay && daysBetween(s.lastDay, day) <= 0) {
    // Same day (or the clock / timezone moved backwards): nothing to do.
    return { state: s, ...none };
  }
  let streak = 1;
  let freezes = s.freezes;
  let freezesUsed = 0;
  let restarted = false;
  if (s.lastDay) {
    const missed = daysBetween(s.lastDay, day) - 1;
    if (missed === 0) streak = s.streak + 1;
    else if (missed <= freezes) {
      freezesUsed = missed;
      freezes -= missed;
      streak = s.streak + 1;
    } else {
      restarted = s.streak > 0;
    }
  }
  let freezeEarned = false;
  if (streak % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) {
    freezes++;
    freezeEarned = true;
  }
  return {
    state: { streak, best: Math.max(s.best, streak), lastDay: day, freezes },
    extended: true,
    restarted,
    freezesUsed,
    freezeEarned,
  };
}

export type StreakStatus =
  | "none" // never started
  | "done" // already counted today
  | "at_risk" // last activity yesterday — do something today to keep it
  | "frozen" // missed day(s) but freezes will cover them if you show up today
  | "lost"; // too many missed days; next activity restarts at 1

export interface StreakView {
  current: number;
  best: number;
  freezes: number;
  status: StreakStatus;
  /** freezes that will be consumed if the student is active today */
  freezesPending: number;
  lastDay: string | null;
}

/** What the streak looks like *today* without mutating anything (freezes are consumed lazily). */
export function viewStreak(s: StreakState, today: string): StreakView {
  const base = { best: s.best, freezes: s.freezes, lastDay: s.lastDay, freezesPending: 0 };
  if (!s.lastDay || s.streak === 0) return { ...base, current: 0, status: "none" };
  const gap = daysBetween(s.lastDay, today);
  if (gap <= 0) return { ...base, current: s.streak, status: "done" };
  if (gap === 1) return { ...base, current: s.streak, status: "at_risk" };
  const missed = gap - 1;
  if (missed <= s.freezes) return { ...base, current: s.streak, status: "frozen", freezesPending: missed };
  return { ...base, current: 0, status: "lost" };
}
