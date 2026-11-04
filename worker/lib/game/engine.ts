// OWNER: game agent. Pure game rules: (state, event, context) → (new state, awards). No I/O here.
import type { Award, GameEvent, Lang, Track } from "../../../shared/types";
import { BADGE_ID, BADGE_RULES, type BadgeDef, type Counters } from "./badges";
import { badgesForDay, isBossDay, isRestDay, type CurriculumIndex } from "./curriculum";
import { levelForXp, rankFor, type RankKey } from "./levels";
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

/** Game-internal events on top of the shared contract (shared/types.ts is orchestrator-owned). */
export type LessonViewedEvent = { type: "lesson.viewed"; day: number; lang: Lang };
export type QuestCompletedEvent = { type: "quest.completed"; questId: string; week: string; xp: number; title?: string };
export type AnyGameEvent = GameEvent | LessonViewedEvent | QuestCompletedEvent;

export interface GameState {
  xp: number;
  level: number;
  track: Track | null;
  streak: StreakState;
  counters: Counters;
  badges: Set<string>;
}

export interface EventCtx {
  now: Date;
  tz: string;
  lang: Lang;
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
export function eventKey(ev: AnyGameEvent): string {
  switch (ev.type) {
    case "task.completed": return `task:${str(ev.taskId)}`;
    case "day.completed": return `day:${dayNum(ev.day)}`;
    case "onboarding.completed": return "onboarding";
    case "resource.viewed": return `res:${str(ev.resourceId)}`;
    case "studio.rendered": return `render:${str(ev.projectId)}`;
    case "lesson.viewed":
      if (ev.lang !== "en" && ev.lang !== "ru") throw new InvalidEvent("bad lang");
      return `lesson:${dayNum(ev.day)}:${ev.lang}`;
    case "quest.completed":
      if (!/^\d{4}-W\d{2}$/.test(String(ev.week))) throw new InvalidEvent("bad week");
      return `quest:${ev.week}:${str(ev.questId, 48)}`;
    default: throw new InvalidEvent("unknown event type");
  }
}

const STREAK_EVENTS = new Set<AnyGameEvent["type"]>(["task.completed", "day.completed", "onboarding.completed", "studio.rendered"]);

const RANK_LABEL: Record<Lang, Record<RankKey, string>> = {
  en: { seed: "Seed", sprout: "Sprout", leaf: "Leaf", sapling: "Sapling", branch: "Branch", grove: "Grove", tree: "Tree", forest: "Forest" },
  ru: { seed: "Семя", sprout: "Росток", leaf: "Лист", sapling: "Саженец", branch: "Ветвь", grove: "Роща", tree: "Дерево", forest: "Лес" },
};
const ruDays = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "день" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "дня" : "дней");
/** Localised award labels (learn shows `label` as-is). */
export const label = {
  xp: (n: number) => `+${n} XP`,
  level: (l: Lang, n: number) => (l === "ru" ? `Уровень ${n} · ${RANK_LABEL.ru[rankFor(n)]}` : `Level ${n} · ${RANK_LABEL.en[rankFor(n)]}`),
  streak: (l: Lang, n: number) => (l === "ru" ? `Серия: ${n} ${ruDays(n)}` : `${n}-day streak`),
  quest: (l: Lang, title: string, xp: number) => (l === "ru" ? `Квест недели: ${title} (+${xp} XP)` : `Weekly quest: ${title} (+${xp} XP)`),
  freezeEarned: (l: Lang) => (l === "ru" ? "Получена заморозка серии" : "Streak freeze earned"),
  freezeUsed: (l: Lang, n: number) => (l === "ru" ? (n === 1 ? "Заморозка спасла серию" : `Заморозки спасли серию (${n})`) : n === 1 ? "A freeze saved your streak" : `${n} freezes saved your streak`),
};

export function reduce(prev: GameState, ev: AnyGameEvent, ctx: EventCtx): Outcome {
  const key = eventKey(ev);
  const { day: localDay, hour } = localParts(ctx.now, ctx.tz);
  const cur = ctx.curriculum;
  const c: Counters = { ...prev.counters };
  const badgesNow = new Set(prev.badges);
  const explicitBadges: string[] = [];
  let track = prev.track;
  let xp = 0;

  switch (ev.type) {
    case "task.completed": {
      const raw = Number(ev.xp);
      xp = Number.isFinite(raw) ? Math.max(0, Math.min(XP.taskMax, Math.round(raw))) : 0;
      c.tasks++;
      const type = cur.taskType.get(ev.taskId);
      if (type === "ship") c.ships++;
      // Night shift (secret): any task after midnight, before 05:00 local. (Counter name kept for stored state.)
      if (hour < 5) c.nightShips++;
      if (type === "share") c.shares++;
      if (hour >= 5 && hour < 7) c.earlyBird++;
      break;
    }
    case "day.completed": {
      c.days++;
      xp = XP.dayBonus;
      if (isBossDay(cur, ev.day, track)) {
        c.bosses++;
        xp += XP.bossBonus;
      }
      if (isRestDay(cur, ev.day, track)) c.rests++;
      const fromEvent = Array.isArray(ev.badges) ? ev.badges : [];
      // Prefer what the caller sends (learn passes the day file's badges for the student's track).
      const ids = fromEvent.length ? fromEvent : badgesForDay(cur, ev.day, track);
      for (const b of ids) if (typeof b === "string" && BADGE_ID.test(b)) explicitBadges.push(b);
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
    case "quest.completed":
      c.quests = (c.quests ?? 0) + 1;
      xp = Math.max(0, Math.min(300, Math.round(Number(ev.xp) || 0)));
      break;
    case "lesson.viewed": {
      const lessons = { ...(c.lessons ?? {}) };
      const mask = (lessons[ev.day] ?? 0) | (ev.lang === "en" ? 1 : 2);
      lessons[ev.day] = mask;
      c.lessons = lessons;
      if (mask === 3) c.polyglot++;
      break;
    }
  }

  const awards: Award[] = [];
  let streak = prev.streak;
  if (STREAK_EVENTS.has(ev.type)) {
    const ch = applyActivity(prev.streak, localDay);
    streak = ch.state;
    if (ch.freezesUsed) {
      c.freezesUsed += ch.freezesUsed;
      awards.push({ kind: "streak", id: "freeze-used", amount: ch.freezesUsed, label: label.freezeUsed(ctx.lang, ch.freezesUsed) });
    }
    if (ch.restarted) c.comebacks++;
    if (ch.extended) {
      // Bonuses for every milestone crossed (bridged freezes can jump over one).
      for (const [m, bonus] of Object.entries(XP.streakBonus)) if (prev.streak.streak < +m && streak.streak >= +m) xp += bonus;
      awards.push({ kind: "streak", id: "streak", amount: streak.streak, label: label.streak(ctx.lang, streak.streak) });
    }
    if (ch.freezeEarned) awards.push({ kind: "streak", id: "freeze-earned", amount: streak.freezes, label: label.freezeEarned(ctx.lang) });
  }

  const totalXp = prev.xp + xp;
  const level = levelForXp(totalXp);
  if (xp > 0) {
    awards.unshift(ev.type === "quest.completed"
      ? { kind: "xp", amount: xp, id: `quest:${ev.questId}`, label: label.quest(ctx.lang, ev.title ?? ev.questId, xp) }
      : { kind: "xp", amount: xp, label: label.xp(xp) });
  }
  if (level > prev.level) awards.push({ kind: "level", amount: level, id: rankFor(level), label: label.level(ctx.lang, level) });

  const ruleCtx = { c, streak: streak.streak, level };
  const newBadges: string[] = [];
  const grant = (id: string) => {
    if (badgesNow.has(id)) return;
    badgesNow.add(id);
    newBadges.push(id);
    awards.push({ kind: "badge", id, label: ctx.catalog.get(id)?.title[ctx.lang] ?? id });
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
