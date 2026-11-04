// OWNER: game agent. Pure game rules: (state, event, context) → (new state, awards). No I/O here.
import type { Award, GameEvent, Track } from "../../../shared/types";
import { BADGE_ID, BADGE_RULES, type BadgeDef, type Counters } from "./badges";
import type { CurriculumIndex } from "./curriculum";
import { levelForXp, rankFor } from "./levels";
import { applyActivity, type StreakState } from "./streak";
import { localParts } from "./time";

export const XP = {
  taskMax: 500,
  dayBonus: 20,
  bossBonus: 100,
  onboarding: 10,
  resource: 2,
  resourceDailyCap: 10, // only the first 10 resources a day give XP (learning > farming)
  render: 25,
  streakBonus: { 3: 15, 7: 30, 14: 50, 30: 100, 66: 200 } as Record<number, number>,
};

export interface GameState {
  xp: number;
  level: number;
  track: Track | null;
  streak: StreakState;
  counters: Counters & { onboarded?: number };
  badges: Set<string>;
}

export interface EventCtx {
  now: Date;
  tz: string;
  curriculum: CurriculumIndex;
  catalog: Map<string, BadgeDef>;
}

export interface Outcome {
  key: string;
  localDay: string;
  xp: number;
  awards: Award[];
  state: GameState;
  newBadges: string[];
}

export class InvalidEvent extends Error {}

const str = (v: unknown, max = 120): string => {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new InvalidEvent("bad id");
  return v.trim();
};
const dayNum = (v: unknown): number => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 66) throw new InvalidEvent("bad day");
  return v;
};

/** Event identity used for idempotency. */
export function eventKey(ev: GameEvent): string {
  switch (ev.type) {
    case "task.completed": return `task:${str(ev.taskId)}`;
    case "day.completed": return `day:${dayNum(ev.day)}`;
    case "onboarding.completed": return "onboarding";
    case "resource.viewed": return `res:${str(ev.resourceId)}`;
    case "studio.rendered": return `render:${str(ev.projectId)}`;
    default: throw new InvalidEvent("unknown event type");
  }
}

const STREAK_EVENTS = new Set<GameEvent["type"]>(["task.completed", "day.completed", "onboarding.completed", "studio.rendered"]);

export function reduce(prev: GameState, ev: GameEvent, ctx: EventCtx): Outcome {
  const key = eventKey(ev);
  const { day: localDay, hour } = localParts(ctx.now, ctx.tz);
  const c = { ...prev.counters };
  const badgesNow = new Set(prev.badges);
  const explicitBadges: string[] = [];
  let track = prev.track;
  let xp = 0;
  let lastDayCompleted: number | undefined;

  switch (ev.type) {
    case "task.completed": {
      const raw = Number(ev.xp);
      xp = Number.isFinite(raw) ? Math.max(0, Math.min(XP.taskMax, Math.round(raw))) : 0;
      c.tasks++;
      if (ctx.curriculum.shipTasks.has(ev.taskId)) c.ships++;
      if (hour < 5) c.nightOwl++;
      else if (hour < 8) c.earlyBird++;
      break;
    }
    case "day.completed": {
      c.days++;
      xp = XP.dayBonus;
      if (ctx.curriculum.bossDays.has(ev.day)) {
        c.bosses++;
        xp += XP.bossBonus;
      }
      lastDayCompleted = ev.day;
      const fromEvent = Array.isArray(ev.badges) ? ev.badges : [];
      for (const b of [...fromEvent, ...(ctx.curriculum.dayBadges.get(ev.day) ?? [])]) {
        if (typeof b === "string" && BADGE_ID.test(b)) explicitBadges.push(b);
      }
      break;
    }
    case "onboarding.completed":
      c.onboarded = 1;
      xp = XP.onboarding;
      if (ev.track === "apps" || ev.track === "video") track = ev.track;
      break;
    case "resource.viewed": {
      c.resources++;
      const [d, n] = c.resDay ?? ["", 0];
      const count = d === localDay ? n : 0;
      if (count < XP.resourceDailyCap) xp = XP.resource;
      c.resDay = [localDay, count + 1];
      break;
    }
    case "studio.rendered":
      c.renders++;
      xp = XP.render;
      break;
  }

  const awards: Award[] = [];
  let streak = prev.streak;
  if (STREAK_EVENTS.has(ev.type)) {
    const ch = applyActivity(prev.streak, localDay);
    streak = ch.state;
    if (ch.freezesUsed) {
      c.freezesUsed += ch.freezesUsed;
      awards.push({ kind: "streak", id: "freeze-used", amount: ch.freezesUsed, label: `Streak freeze used (${ch.freezesUsed})` });
    }
    if (ch.restarted) c.comebacks++;
    if (ch.extended) {
      const bonus = XP.streakBonus[streak.streak] ?? 0;
      xp += bonus;
      awards.push({ kind: "streak", id: "streak", amount: streak.streak, label: `${streak.streak}-day streak` });
    }
    if (ch.freezeEarned) awards.push({ kind: "streak", id: "freeze-earned", amount: streak.freezes, label: "Streak freeze earned" });
  }

  const totalXp = prev.xp + xp;
  const level = levelForXp(totalXp);
  if (xp > 0) awards.unshift({ kind: "xp", amount: xp, label: `+${xp} XP` });
  if (level > prev.level) awards.push({ kind: "level", amount: level, id: rankFor(level), label: `Level ${level}` });

  const ruleCtx = { c, streak: streak.streak, level, onboarded: !!c.onboarded, lastDayCompleted };
  const newBadges: string[] = [];
  const grant = (id: string) => {
    if (badgesNow.has(id)) return;
    badgesNow.add(id);
    newBadges.push(id);
    awards.push({ kind: "badge", id, label: ctx.catalog.get(id)?.title.en ?? id });
  };
  explicitBadges.forEach(grant);
  for (const [id, rule] of Object.entries(BADGE_RULES)) if (rule(ruleCtx)) grant(id);

  return {
    key,
    localDay,
    xp,
    awards,
    newBadges,
    state: { xp: totalXp, level, track, streak, counters: c, badges: badgesNow },
  };
}
