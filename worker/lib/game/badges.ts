// OWNER: game agent. Badge catalog = built-in defaults merged with `content/badges.json` (curriculum-owned)
// when that file exists. Content entries override title/description/icon by id and can add new
// curriculum badges (awarded via `day.completed` → `badges`). Rule-based badges are evaluated here.
import type { Lang } from "../../../shared/types";

export interface BadgeDef {
  id: string;
  icon: string; // a built-in icon name (see web/src/features/game/icons.tsx) or an emoji
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  rule?: string;
  /** display group */
  group: "start" | "streak" | "craft" | "rhythm" | "level" | "program";
  /** sort order inside the grid */
  order: number;
}

export interface Counters {
  tasks: number;
  days: number;
  bosses: number;
  ships: number;
  resources: number;
  renders: number;
  nightOwl: number;
  earlyBird: number;
  comebacks: number;
  freezesUsed: number;
  /** resource XP limiter: [local day, count] */
  resDay?: [string, number];
}

export const emptyCounters = (): Counters => ({
  tasks: 0, days: 0, bosses: 0, ships: 0, resources: 0, renders: 0, nightOwl: 0, earlyBird: 0, comebacks: 0, freezesUsed: 0,
});

export interface RuleCtx {
  c: Counters;
  streak: number;
  level: number;
  onboarded: boolean;
  lastDayCompleted?: number;
}

const B = (
  id: string, group: BadgeDef["group"], order: number, icon: string,
  en: [string, string], ru: [string, string],
): BadgeDef => ({ id, group, order, icon, title: { en: en[0], ru: ru[0] }, description: { en: en[1], ru: ru[1] } });

/** Built-in defaults. Copy is written natively in both languages. */
export const BUILTIN_BADGES: BadgeDef[] = [
  B("first-step", "start", 10, "seed", ["First step", "Chose a path and showed up."], ["Первый шаг", "Путь выбран, первый шаг сделан."]),
  B("first-task", "start", 11, "check", ["First task", "Finished your very first task."], ["Первое задание", "Самое первое задание закрыто."]),
  B("first-day", "start", 12, "sun", ["Day one, done", "Completed a full day of the program."], ["Первый день позади", "Целый день программы позади."]),
  B("first-ship", "craft", 20, "rocket", ["First ship", "Put something real out into the world."], ["Первый релиз", "Что-то настоящее вышло в мир."]),
  B("boss-1", "craft", 21, "flag", ["Milestone", "Beat your first boss day."], ["Рубеж", "Первый босс-день пройден."]),
  B("boss-3", "craft", 22, "trophy", ["Boss hunter", "Beat three boss days."], ["Охотник на боссов", "Три босс-дня пройдены."]),
  B("first-render", "craft", 23, "play", ["First render", "Rendered your first video in Studio."], ["Первый рендер", "Первое видео отрендерено в Студии."]),
  B("tasks-50", "craft", 24, "stack", ["Fifty tasks", "Fifty finished tasks. That's a body of work."], ["Пятьдесят заданий", "Пятьдесят закрытых заданий — это уже портфолио."]),
  B("curious", "craft", 25, "book", ["Curious mind", "Studied 10 resources from the library."], ["Любопытный ум", "10 материалов из библиотеки изучено."]),
  B("streak-3", "streak", 30, "flame", ["Warming up", "3 days in a row."], ["Разогрев", "3 дня подряд."]),
  B("streak-7", "streak", 31, "flame", ["One week", "7 days in a row. A rhythm is forming."], ["Неделя", "7 дней подряд. Ритм складывается."]),
  B("streak-14", "streak", 32, "flame", ["Two weeks", "14 days in a row."], ["Две недели", "14 дней подряд."]),
  B("streak-30", "streak", 33, "flame", ["Thirty days", "30 days in a row. This is who you are now."], ["Тридцать дней", "30 дней подряд. Теперь это часть тебя."]),
  B("streak-66", "streak", 34, "leaf", ["Habit formed", "66 days in a row. It's automatic now."], ["Привычка сформирована", "66 дней подряд. Теперь это на автомате."]),
  B("saved-by-freeze", "rhythm", 40, "snowflake", ["Saved by frost", "A streak freeze kept your streak alive."], ["Спасено морозом", "Заморозка сохранила твою серию."]),
  B("comeback", "rhythm", 41, "return", ["Comeback", "Lost the streak, came back anyway. That's the real skill."], ["Возвращение", "Серия прервалась, но ты снова здесь. Это и есть главный навык."]),
  B("early-bird", "rhythm", 42, "sunrise", ["Early bird", "Finished a task before 8 a.m."], ["Жаворонок", "Задание закрыто до 8 утра."]),
  B("night-owl", "rhythm", 43, "moon", ["Night owl", "Finished a task after midnight. Now go to sleep."], ["Сова", "Задание закрыто после полуночи. А теперь — спать."]),
  B("level-5", "level", 50, "star", ["Level 5", "Reached level 5."], ["Уровень 5", "Пятый уровень взят."]),
  B("level-10", "level", 51, "star", ["Level 10", "Reached level 10."], ["Уровень 10", "Десятый уровень взят."]),
  B("level-20", "level", 52, "star", ["Level 20", "Reached level 20."], ["Уровень 20", "Двадцатый уровень взят."]),
  B("finisher", "program", 60, "crown", ["66 / 66", "Completed the whole program."], ["66 из 66", "Вся программа пройдена целиком."]),
];

/** Rule-based badges: id → predicate. */
export const BADGE_RULES: Record<string, (x: RuleCtx) => boolean> = {
  "first-step": (x) => x.onboarded,
  "first-task": (x) => x.c.tasks >= 1,
  "first-day": (x) => x.c.days >= 1,
  "first-ship": (x) => x.c.ships >= 1 || x.c.bosses >= 1,
  "boss-1": (x) => x.c.bosses >= 1,
  "boss-3": (x) => x.c.bosses >= 3,
  "first-render": (x) => x.c.renders >= 1,
  "tasks-50": (x) => x.c.tasks >= 50,
  curious: (x) => x.c.resources >= 10,
  "streak-3": (x) => x.streak >= 3,
  "streak-7": (x) => x.streak >= 7,
  "streak-14": (x) => x.streak >= 14,
  "streak-30": (x) => x.streak >= 30,
  "streak-66": (x) => x.streak >= 66,
  "saved-by-freeze": (x) => x.c.freezesUsed >= 1,
  comeback: (x) => x.c.comebacks >= 1,
  "early-bird": (x) => x.c.earlyBird >= 1,
  "night-owl": (x) => x.c.nightOwl >= 1,
  "level-5": (x) => x.level >= 5,
  "level-10": (x) => x.level >= 10,
  "level-20": (x) => x.level >= 20,
  finisher: (x) => x.lastDayCompleted === 66,
};

export const BADGE_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;

interface ContentBadge {
  id: string;
  icon?: string;
  title?: Partial<Record<Lang, string>>;
  description?: Partial<Record<Lang, string>>;
  rule?: string;
}

/** Merge built-ins with content badges (content wins on copy/icon; new ids become "program" badges). */
export function mergeCatalog(content: unknown): BadgeDef[] {
  const byId = new Map(BUILTIN_BADGES.map((b) => [b.id, { ...b }]));
  const list = Array.isArray(content) ? (content as ContentBadge[]) : [];
  let order = 100;
  for (const cb of list) {
    if (!cb || typeof cb.id !== "string" || !BADGE_ID.test(cb.id)) continue;
    const prev = byId.get(cb.id);
    const title = { en: cb.title?.en ?? prev?.title.en ?? cb.id, ru: cb.title?.ru ?? prev?.title.ru ?? cb.title?.en ?? cb.id };
    const description = {
      en: cb.description?.en ?? prev?.description.en ?? "",
      ru: cb.description?.ru ?? prev?.description.ru ?? cb.description?.en ?? "",
    };
    byId.set(cb.id, {
      id: cb.id,
      icon: cb.icon || prev?.icon || "medal",
      title,
      description,
      rule: cb.rule ?? prev?.rule,
      group: prev?.group ?? "program",
      order: prev?.order ?? order++,
    });
  }
  return [...byId.values()].sort((a, b) => a.order - b.order);
}

// content/badges.json is owned by the curriculum agent and may not exist yet; glob returns {} when missing.
const contentFiles = import.meta.glob("../../../content/badges.json", { eager: true, import: "default" }) as Record<string, unknown>;
export const CATALOG: BadgeDef[] = mergeCatalog(Object.values(contentFiles)[0]);
export const CATALOG_BY_ID = new Map(CATALOG.map((b) => [b.id, b]));
