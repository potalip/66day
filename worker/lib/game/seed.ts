// OWNER: game agent. Dev-only demo data: ~30 students with realistic, varied histories.
// Runs every event through the real engine (with a simulated clock), so the data is internally consistent.
import type { GameEvent, Track } from "../../../shared/types";
import { applyEvent } from "./store";

export const SEED_PREFIX = "seed-";

const NAMES = [
  ["Аня Морозова", "ru"], ["Дмитрий К.", "ru"], ["Лена Соколова", "ru"], ["Тимур", "ru"], ["Маша Ветрова", "ru"],
  ["Игорь Белов", "ru"], ["Катя Л.", "ru"], ["Артём Новиков", "ru"], ["Оля", "ru"], ["Саша Грин", "ru"],
  ["Никита Орлов", "ru"], ["Вера Ш.", "ru"], ["Рустам", "ru"], ["Полина Ким", "ru"],
  ["Maya Chen", "en"], ["Jordan Ellis", "en"], ["Priya R.", "en"], ["Tom Becker", "en"], ["Sofia Alvarez", "en"],
  ["Sam O'Neill", "en"], ["Hana Sato", "en"], ["Leo Martins", "en"], ["Grace Okafor", "en"], ["Noah W.", "en"],
  ["Elif Kaya", "en"], ["Ben Carter", "en"], ["Ivy Nguyen", "en"], ["Marcus Lee", "en"], [null, "en"], [null, "ru"],
] as const;

const TZ = ["Europe/Moscow", "Asia/Almaty", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "UTC", "Asia/Kolkata"];

/** Small deterministic PRNG so the seed is stable between runs. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export async function seedDemo(db: D1Database, now = new Date()): Promise<{ users: number; events: number }> {
  await clearDemo(db);
  const rand = rng(66);
  let events = 0;
  for (let i = 0; i < NAMES.length; i++) {
    const [name, lang] = NAMES[i];
    const id = `${SEED_PREFIX}${String(i + 1).padStart(2, "0")}`;
    const track: Track = rand() < 0.55 ? "apps" : "video";
    const tz = lang === "ru" ? TZ[Math.floor(rand() * 2)] : TZ[2 + Math.floor(rand() * 6)];
    const daysAgo = 3 + Math.floor(rand() * 40); // started 3–42 days ago
    const diligence = 0.45 + rand() * 0.55; // chance to show up on a given day
    const startTs = now.getTime() - daysAgo * 86_400_000;
    await db
      .prepare("INSERT INTO users (id, display_name, lang, track, started_at, timezone, created_at) VALUES (?,?,?,?,?,?,?)")
      .bind(id, name, lang, track, Math.floor(startTs / 1000), tz, Math.floor(startTs / 1000))
      .run();

    const evs: [Date, GameEvent][] = [[new Date(startTs), { type: "onboarding.completed", track }]];
    let programDay = 1;
    for (let d = 0; d <= daysAgo && programDay <= 66; d++) {
      if (d > 0 && rand() > diligence) continue;
      const hour = rand() < 0.1 ? 23.5 + rand() * 3 : rand() < 0.15 ? 6 + rand() * 1.5 : 9 + rand() * 12;
      const base = startTs - (startTs % 86_400_000) + d * 86_400_000 + hour * 3_600_000;
      if (base > now.getTime()) break;
      const tasks = 2 + Math.floor(rand() * 3);
      const prefix = programDay <= 14 ? "" : `${track}-`;
      for (let t = 1; t <= tasks; t++) {
        evs.push([new Date(base + t * 600_000), { type: "task.completed", taskId: `d${String(programDay).padStart(2, "0")}-${prefix}t${t}`, day: programDay, xp: [20, 25, 30, 40][Math.floor(rand() * 4)] }]);
      }
      if (rand() < 0.9) evs.push([new Date(base + 50 * 60_000), { type: "day.completed", day: programDay }]);
      if (rand() < 0.4) evs.push([new Date(base + 55 * 60_000), { type: "resource.viewed", resourceId: `seed-res-${Math.floor(rand() * 40)}` }]);
      if (track === "video" && rand() < 0.15) evs.push([new Date(base + 58 * 60_000), { type: "studio.rendered", projectId: `seed-proj-${i}-${d}` }]);
      programDay++;
    }
    for (const [at, ev] of evs) {
      if (at.getTime() > now.getTime()) continue;
      await applyEvent(db, id, ev, { now: at });
      events++;
    }
  }
  return { users: NAMES.length, events };
}

export async function clearDemo(db: D1Database) {
  const like = `${SEED_PREFIX}%`;
  await db.batch([
    db.prepare("DELETE FROM game_events WHERE user_id LIKE ?").bind(like),
    db.prepare("DELETE FROM game_stats WHERE user_id LIKE ?").bind(like),
    db.prepare("DELETE FROM game_weekly WHERE user_id LIKE ?").bind(like),
    db.prepare("DELETE FROM game_badges WHERE user_id LIKE ?").bind(like),
    db.prepare("DELETE FROM game_activity WHERE user_id LIKE ?").bind(like),
    db.prepare("DELETE FROM users WHERE id LIKE ?").bind(like),
  ]);
}
