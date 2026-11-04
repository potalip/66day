// OWNER: game agent. Badge catalog = `content/badges.json` (curriculum-owned, source of truth for copy and ids)
// + a few game-only extras. Content badges whose `rule` starts with "Game rule" / "Secret. Game rule" are evaluated
// here (BADGE_RULES); every other content badge is awarded on `day.completed` (event `badges` or the day file).
import type { Lang } from "../../../shared/types";

export type BadgeGroup = "program" | "streak" | "craft" | "rhythm" | "level" | "secret";

export interface BadgeDef {
  id: string;
  icon: string; // emoji, or a built-in icon name (web/src/features/game/icons.tsx)
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  rule?: string;
  group: BadgeGroup;
  /** hidden (shown as "?") until earned */
  secret?: boolean;
  order: number;
}

export interface Counters {
  tasks: number;
  days: number;
  bosses: number;
  ships: number;
  shares: number;
  resources: number;
  renders: number;
  rests: number;
  nightShips: number;
  earlyBird: number;
  comebacks: number;
  freezesUsed: number;
  polyglot: number;
  quests?: number;
  onboarded?: number;
  /** resource XP limiter: [local day, count] */
  resDay?: [string, number];
  /** lesson languages opened per day: bit 1 = en, bit 2 = ru */
  lessons?: Record<string, number>;
}

export const emptyCounters = (): Counters => ({
  tasks: 0, days: 0, bosses: 0, ships: 0, shares: 0, resources: 0, renders: 0, rests: 0,
  nightShips: 0, earlyBird: 0, comebacks: 0, freezesUsed: 0, polyglot: 0,
});

export interface RuleCtx { c: Counters; streak: number; level: number }

const B = (
  id: string, group: BadgeGroup, order: number, icon: string, en: [string, string], ru: [string, string], secret = false,
): BadgeDef => ({ id, group, order, icon, secret, title: { en: en[0], ru: ru[0] }, description: { en: en[1], ru: ru[1] } });

/**
 * Game-owned badges. The ones that also exist in content/badges.json (streak-7/30/66, comeback, public-builder,
 * night-owl, polyglot) are fallbacks only — content copy wins when the file is present.
 */
export const BUILTIN_BADGES: BadgeDef[] = [
  B("first-step", "craft", 199, "seed", ["First Step", "Chose a path and showed up."], ["Первый шаг", "Путь выбран, первый шаг сделан."]),
  B("first-ship", "craft", 204, "rocket", ["It's Alive", "Shipped something real."], ["Оно живое!", "Что-то настоящее вышло в мир."]),
  B("first-render", "craft", 205, "play", ["First Render", "Rendered your first video."], ["Первый рендер", "Первое видео отрендерено."]),
  B("first-task", "craft", 200, "check", ["First Task", "Finished your very first task."], ["Первое задание", "Самое первое задание закрыто."]),
  B("tasks-50", "craft", 201, "stack", ["Fifty Tasks", "Fifty finished tasks. That's a body of work."], ["Пятьдесят заданий", "Пятьдесят закрытых заданий — это уже портфолио."]),
  B("public-builder", "craft", 202, "📢", ["Building in Public", "Ten public posts about your work."], ["Строю публично", "Десять публичных постов о своей работе."]),
  B("curious", "craft", 203, "book", ["Curious Mind", "Studied 10 resources from the library."], ["Любопытный ум", "10 материалов из библиотеки изучено."]),
  B("streak-3", "streak", 300, "flame", ["Warming Up", "Three days in a row."], ["Разогрев", "Три дня подряд."]),
  B("streak-7", "streak", 301, "🔥", ["7-Day Streak", "Seven days in a row."], ["Неделя без пропусков", "Семь дней подряд."]),
  B("streak-14", "streak", 302, "flame", ["Two Weeks Strong", "Fourteen days in a row. A rhythm is forming."], ["Две недели в ритме", "Четырнадцать дней подряд. Ритм уже складывается."]),
  B("streak-30", "streak", 303, "🌳", ["30-Day Streak", "Thirty days in a row."], ["Месяц в потоке", "Тридцать дней подряд."]),
  B("streak-66", "streak", 304, "🍃", ["Unbroken 66", "66 days in a row."], ["Непрерывные 66", "66 дней подряд."]),
  B("quest-3", "rhythm", 402, "🧭", ["Quest Keeper", "Completed three weekly quests."], ["Хранитель квестов", "Три квеста недели выполнены."]),
  B("comeback", "rhythm", 400, "🔁", ["Comeback", "Lost the streak and came back anyway."], ["Вернулся", "Серия прервалась — а ты всё равно вернулся."]),
  B("saved-by-freeze", "rhythm", 401, "snowflake", ["Saved by Frost", "A streak freeze kept your streak alive."], ["Спасено морозом", "Заморозка сохранила твою серию."]),
  B("level-5", "level", 500, "star", ["Level 5", "Reached level 5."], ["Уровень 5", "Пятый уровень взят."]),
  B("level-10", "level", 501, "star", ["Level 10", "Reached level 10."], ["Уровень 10", "Десятый уровень взят."]),
  B("level-20", "level", 502, "star", ["Level 20", "Reached level 20."], ["Уровень 20", "Двадцатый уровень взят."]),
  B("night-owl", "secret", 600, "🦉", ["Night Shift", "Finished a task after midnight. Now go to sleep."], ["Ночная смена", "Задание закрыто после полуночи. А теперь — спать."], true),
  B("polyglot", "secret", 601, "🗣️", ["Polyglot", "Read the same lesson in both languages."], ["Полиглот", "Прочитал один и тот же урок на двух языках."], true),
  B("early-bird", "secret", 602, "sunrise", ["Early Bird", "Finished a task before 7 a.m. The quiet hours are yours."], ["Жаворонок", "Задание закрыто до семи утра. Тихие часы — твои."], true),
  B("well-rested", "secret", 603, "moon", ["Well Rested", "Took three rest days seriously. Recovery is part of the work."], ["Восстановление", "Три дня отдыха — честно и всерьёз. Отдых — тоже часть работы."], true),
];

/** Rule-based badges: id → predicate. Content day badges have no entry here (they come with day.completed). */
export const BADGE_RULES: Record<string, (x: RuleCtx) => boolean> = {
  "first-step": (x) => !!x.c.onboarded,
  "first-ship": (x) => x.c.ships >= 1, // also awarded by the day-2 file
  "first-render": (x) => x.c.renders >= 1, // also awarded by the video day-15 file
  "first-task": (x) => x.c.tasks >= 1,
  "tasks-50": (x) => x.c.tasks >= 50,
  "public-builder": (x) => x.c.shares >= 10,
  curious: (x) => x.c.resources >= 10,
  "streak-3": (x) => x.streak >= 3,
  "streak-7": (x) => x.streak >= 7,
  "streak-14": (x) => x.streak >= 14,
  "streak-30": (x) => x.streak >= 30,
  "streak-66": (x) => x.streak >= 66,
  comeback: (x) => x.c.comebacks >= 1,
  "saved-by-freeze": (x) => x.c.freezesUsed >= 1,
  "level-5": (x) => x.level >= 5,
  "level-10": (x) => x.level >= 10,
  "level-20": (x) => x.level >= 20,
  "night-owl": (x) => x.c.nightShips >= 1, // any task 00:00–04:59 local (content rule)
  polyglot: (x) => x.c.polyglot >= 1,
  "early-bird": (x) => x.c.earlyBird >= 1,
  "well-rested": (x) => x.c.rests >= 3,
  "quest-3": (x) => (x.c.quests ?? 0) >= 3,
};

export const BADGE_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;

interface ContentBadge {
  id: string;
  icon?: string;
  title?: Partial<Record<Lang, string>>;
  description?: Partial<Record<Lang, string>>;
  rule?: string;
  secret?: boolean;
}

const SECRET_RE = /\bsecret\b/i;
/** Content descriptions of secret badges start with "Secret badge: …" — the grid already says it's secret. */
const stripSecret = (s: string) => s.replace(/^(secret badge|секретный значок)\s*:\s*/i, "").replace(/^./, (c) => c.toUpperCase());

/** Merge content badges over built-ins. Content wins on copy/icon; day badges are ordered by their day. */
export function mergeCatalog(content: unknown): BadgeDef[] {
  const byId = new Map(BUILTIN_BADGES.map((b) => [b.id, { ...b }]));
  const list = Array.isArray(content) ? (content as ContentBadge[]) : [];
  list.forEach((cb, i) => {
    if (!cb || typeof cb.id !== "string" || !BADGE_ID.test(cb.id)) return;
    const prev = byId.get(cb.id);
    const secret = !!(cb.secret ?? (cb.rule && SECRET_RE.test(cb.rule))) || !!prev?.secret;
    const desc = (l: Lang) => cb.description?.[l] ?? (l === "ru" ? cb.description?.en : undefined) ?? prev?.description[l] ?? "";
    const dayMatch = cb.rule?.match(/day\s+(\d{1,2})/i);
    byId.set(cb.id, {
      id: cb.id,
      icon: cb.icon || prev?.icon || "medal",
      title: { en: cb.title?.en ?? prev?.title.en ?? cb.id, ru: cb.title?.ru ?? prev?.title.ru ?? cb.title?.en ?? cb.id },
      description: { en: secret ? stripSecret(desc("en")) : desc("en"), ru: secret ? stripSecret(desc("ru")) : desc("ru") },
      rule: cb.rule ?? prev?.rule,
      group: secret ? "secret" : prev?.group ?? "program",
      secret,
      order: prev?.order ?? (dayMatch ? Number(dayMatch[1]) : 100 + i),
    });
  });
  return [...byId.values()].sort((a, b) => a.order - b.order);
}

// content/badges.json is owned by the curriculum agent; glob returns {} if it's missing.
const contentFiles = import.meta.glob("../../../content/badges.json", { eager: true, import: "default" }) as Record<string, unknown>;
export const CATALOG: BadgeDef[] = mergeCatalog(Object.values(contentFiles)[0]);
export const CATALOG_BY_ID = new Map(CATALOG.map((b) => [b.id, b]));
