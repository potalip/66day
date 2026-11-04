import { beforeEach, describe, expect, it } from "vitest";
import { createTestD1 } from "./d1-shim";
import { applyEvent, loadState } from "../store";
import { buildIndex } from "../curriculum";
import { pickQuests, questProgress, QUESTS, type QuestDef, type WeekEvent } from "../quests";
import { getCertificate, getQuests, certIdFor } from "../queries";
import type { CurriculumDay } from "../../../../shared/types";

const q = (goal: QuestDef["goal"]): QuestDef => ({ id: "t", slot: 1, tracks: ["apps"], xp: 10, icon: "x", goal, title: { en: "t", ru: "t" }, description: { en: "", ru: "" } });
const ev = (type: string, localDay: string, taskType?: WeekEvent["taskType"]): WeekEvent => ({ type, localDay, taskType });

describe("quest pool", () => {
  it("every quest is well-formed and bilingual", () => {
    const ids = new Set<string>();
    for (const x of QUESTS) {
      expect(ids.has(x.id), x.id).toBe(false);
      ids.add(x.id);
      expect(x.title.en && x.title.ru && x.description.en && x.description.ru, x.id).toBeTruthy();
      expect(x.goal.target).toBeGreaterThan(0);
      expect(x.xp).toBeGreaterThan(0);
    }
  });
  it("picks one quest per slot (max 3), deterministic per week, respecting track", () => {
    for (const track of ["apps", "video"] as const) {
      const a = pickQuests("2026-W45", track);
      expect(a.length).toBeGreaterThanOrEqual(1);
      expect(a.length).toBeLessThanOrEqual(3);
      expect(new Set(a.map((x) => x.slot)).size).toBe(a.length);
      expect(a.every((x) => x.tracks.includes(track))).toBe(true);
      expect(pickQuests("2026-W45", track)).toEqual(a);
    }
  });
  it("rotates across weeks", () => {
    const weeks = Array.from({ length: 6 }, (_, i) => pickQuests(`2026-W${40 + i}`, "apps").map((x) => x.id).join());
    expect(new Set(weeks).size).toBeGreaterThan(1);
  });
});

describe("quest progress", () => {
  it("active days counts distinct days of real activity only", () => {
    const evs = [ev("task.completed", "2026-11-02"), ev("task.completed", "2026-11-02"), ev("day.completed", "2026-11-03"), ev("resource.viewed", "2026-11-04")];
    expect(questProgress(q({ kind: "active_days", target: 4 }), evs)).toBe(2);
  });
  it("consecutive days by task type", () => {
    const evs = [ev("task.completed", "2026-11-02", "build"), ev("task.completed", "2026-11-03", "read"), ev("task.completed", "2026-11-04", "ship"), ev("task.completed", "2026-11-05", "build")];
    expect(questProgress(q({ kind: "consecutive_days", target: 3, types: ["build", "ship"] }), evs)).toBe(2);
    evs.push(ev("task.completed", "2026-11-03", "build"));
    expect(questProgress(q({ kind: "consecutive_days", target: 3, types: ["build", "ship"] }), evs)).toBe(3);
  });
  it("is capped at target", () => {
    const evs = Array.from({ length: 12 }, () => ev("task.completed", "2026-11-02"));
    expect(questProgress(q({ kind: "tasks", target: 10 }), evs)).toBe(10);
  });
});

const day = (d: Partial<CurriculumDay>): CurriculumDay => ({ day: 1, track: "common", lang: "en", phase: 1, title: "t", summary: "", estMinutes: 30, tasks: [], resources: [], bodyMd: "", ...d });
const curriculum = buildIndex([
  day({ day: 1, tasks: Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, type: "build" as const, title: "b", xp: 10, proof: "none" as const })) }),
  day({ day: 13, boss: true }),
]);

describe("quest completion through the event pipeline", () => {
  let db: ReturnType<typeof createTestD1>;
  const U = "q1";
  beforeEach(async () => {
    db = createTestD1();
    await db.prepare("INSERT INTO users (id, track, lang) VALUES (?, 'apps', 'en')").bind(U).run();
  });

  it("awards bonus XP exactly once when a quest goal is met", async () => {
    const now = new Date("2026-11-04T10:00:00Z"); // W45
    const quests = pickQuests("2026-W45", "apps");
    const tasksQuest = quests.find((x) => x.goal.kind === "tasks");
    // drive 12 tasks across the week (Mon..Wed), enough for "tasks" / "active_days"-like goals
    const all: { kind: string; id?: string; amount?: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const at = new Date(Date.UTC(2026, 10, 2 + (i % 3), 9 + i));
      all.push(...(await applyEvent(db, U, { type: "task.completed", taskId: `t${i}`, day: 1, xp: 10 }, { now: at, curriculum })));
    }
    const view = await getQuests(db, U, now);
    expect(view.week).toBe("2026-W45");
    const questAwards = all.filter((a) => a.id?.startsWith("quest:"));
    expect(questAwards.length).toBe(view.quests.filter((x) => x.done).length);
    if (tasksQuest) expect(view.quests.find((x) => x.id === tasksQuest.id)?.done).toBe(true);
    // replays never re-award
    const again = await applyEvent(db, U, { type: "task.completed", taskId: "t0", day: 1, xp: 10 }, { now, curriculum });
    expect(again.some((a) => a.id?.startsWith("quest:"))).toBe(false);
    const s = (await loadState(db, U)).state;
    expect(s.xp).toBe(120 + questAwards.reduce((n, a) => n + (a.amount ?? 0), 0) + 15 /* 3-day streak bonus */);
  });

  it("quests reset with the ISO week", async () => {
    await applyEvent(db, U, { type: "task.completed", taskId: "t1", day: 1, xp: 10 }, { now: new Date("2026-11-04T10:00:00Z"), curriculum });
    const next = await getQuests(db, U, new Date("2026-11-10T10:00:00Z"));
    expect(next.week).toBe("2026-W46");
    expect(next.quests.every((x) => x.progress === 0 && !x.done)).toBe(true);
  });
});

describe("certificate", () => {
  it("not started → in progress → complete, with a stable id", async () => {
    const db = createTestD1();
    await db.prepare("INSERT INTO users (id, display_name, track) VALUES ('c1', 'Ada', 'video')").run();
    expect((await getCertificate(db, "c1"))?.status).toBe("not_started");
    await applyEvent(db, "c1", { type: "day.completed", day: 1 }, { now: new Date("2026-09-01T10:00:00Z"), skipQuests: true });
    const mid = await getCertificate(db, "c1");
    expect(mid).toMatchObject({ status: "in_progress", daysDone: 1, completedAt: null, name: "Ada", track: "video" });
    await applyEvent(db, "c1", { type: "day.completed", day: 66 }, { now: new Date("2026-11-04T10:00:00Z"), skipQuests: true });
    const done = await getCertificate(db, "c1");
    expect(done?.status).toBe("complete");
    expect(done?.certId).toMatch(/^FL66-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(done?.certId).toBe(await certIdFor("c1"));
    expect(await certIdFor("c2")).not.toBe(done?.certId);
    expect(await getCertificate(db, "nobody")).toBeNull();
  });
});
