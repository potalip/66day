import { beforeEach, describe, expect, it } from "vitest";
import { createTestD1 } from "./d1-shim";
import { applyEvent, loadState } from "../store";
import { buildIndex } from "../curriculum";
import { CATCH_UP, ONBOARDING_SET, pickQuests, questProgress, questTarget, QUESTS, QUESTS_BY_ID, type QuestDef, type WeekEvent } from "../quests";
import { CURRICULUM } from "../curriculum";
import { getCertificate, getQuests, certIdFor } from "../queries";
import type { CurriculumDay } from "../../../../shared/types";

const q = (goal: QuestDef["goal"]): QuestDef => ({ id: "t", track: "common", weeks: "all", xp: 10, icon: "x", goal, title: { en: "t", ru: "t" }, description: { en: "", ru: "" } });
const ev = (type: string, localDay: string, extra: Partial<WeekEvent> = {}): WeekEvent => ({ type, localDay, ...extra });
const task = (id: string, localDay: string, taskType: WeekEvent["taskType"], proof?: WeekEvent["proof"]) => ev("task.completed", localDay, { taskId: id, taskType, proof });

describe("quest pool (curriculum's 25)", () => {
  it("has 25 well-formed, bilingual quests with valid task ids", () => {
    expect(QUESTS).toHaveLength(25);
    const ids = new Set<string>();
    for (const x of QUESTS) {
      expect(ids.has(x.id), x.id).toBe(false);
      ids.add(x.id);
      expect(x.title.en && x.title.ru && x.description.en && x.description.ru, x.id).toBeTruthy();
      expect(questTarget(x)).toBeGreaterThan(0);
      expect(x.xp).toBeGreaterThanOrEqual(30);
      expect(x.xp).toBeLessThanOrEqual(60);
    }
    if (CURRICULUM.taskType.size) {
      const all = JSON.stringify(QUESTS).match(/"d\d\d-[a-z0-9-]+"/g) ?? [];
      for (const id of all) expect(CURRICULUM.taskType.has(JSON.parse(id)), id).toBe(true);
    }
  });

  it("program week 1 → the onboarding set (shared only)", () => {
    expect(pickQuests("2026-W45", { track: "apps", programWeek: 1 }).map((x) => x.id)).toEqual(ONBOARDING_SET);
  });

  it("later weeks → 1 shared + 2 own-track quests eligible for that program week, deterministic", () => {
    for (const track of ["apps", "video"] as const) {
      for (let pw = 3; pw <= 10; pw++) {
        const a = pickQuests("2026-W45", { track, programWeek: pw });
        expect(a.length).toBe(3);
        expect(a.filter((x) => x.track === "common").length).toBeGreaterThanOrEqual(1);
        for (const x of a) {
          expect(x.track === "common" || x.track === track).toBe(true);
          expect(x.weeks === "all" || x.weeks.includes(pw), `${x.id} in week ${pw}`).toBe(true);
        }
        expect(pickQuests("2026-W45", { track, programWeek: pw })).toEqual(a);
      }
    }
  });

  it("avoids repeating last week's quests when there is an alternative", () => {
    const ctx = { track: "video" as const, programWeek: 8 };
    const a = pickQuests("2026-W44", ctx).map((x) => x.id);
    const b = pickQuests("2026-W45", ctx).map((x) => x.id);
    const shared = b.filter((id) => QUESTS_BY_ID.get(id)!.track === "common");
    expect(shared.some((id) => a.includes(id))).toBe(false);
  });

  it("students who are behind get a returning quest", () => {
    for (const w of ["2026-W40", "2026-W45", "2026-W50"]) {
      const a = pickQuests(w, { track: "apps", programWeek: 5, behind: true }).map((x) => x.id);
      expect(a.some((id) => CATCH_UP.includes(id))).toBe(true);
    }
  });
});

describe("quest rules", () => {
  it("task_days counts distinct days with a task", () => {
    const evs = [task("a", "2026-11-02", "read"), task("b", "2026-11-02", "build"), ev("day.completed", "2026-11-03"), task("c", "2026-11-04", "read")];
    expect(questProgress(q({ count: "task_days", target: 5 }), evs)).toBe(2);
  });
  it("proof filters: words, lines, url pattern, video file, ids, anyOf", () => {
    const long = Array.from({ length: 45 }, () => "word").join(" ");
    expect(questProgress(q({ count: "tasks", target: 3, types: ["reflect"], minWords: 40 }), [
      task("r1", "d", "reflect", { text: long }), task("r2", "d", "reflect", { text: "too short" }),
    ])).toBe(1);
    expect(questProgress(q({ count: "tasks", target: 1, ids: ["x"], minLines: 3 }), [task("x", "d", "build", { text: "a\nb\nc" })])).toBe(1);
    const ci = q({ count: "tasks", target: 2, anyOf: [{ ids: ["d29-apps-t3"] }, { types: ["build"], urlPattern: "github\\.com/.+/actions/runs/" }] });
    expect(questProgress(ci, [task("d29-apps-t3", "d", "build"), task("z", "d", "build", { url: "https://github.com/me/app/actions/runs/123" }), task("y", "d", "build", { url: "https://example.com" })])).toBe(2);
    expect(questProgress(q({ count: "tasks", target: 3, videoFile: true }), [task("v1", "d", "build", { fileType: "video/mp4" }), task("v2", "d", "build", { fileType: "image/png" })])).toBe(1);
  });
  it("parts add up; alternatives take the best", () => {
    const helper = QUESTS_BY_ID.get("q-apps-helper")!;
    expect(questProgress(helper, [task("d42-t1", "d", "share")])).toBe(2); // the same task can satisfy both parts
    expect(questProgress(helper, [task("x", "d", "read")])).toBe(0);
    const hook = QUESTS_BY_ID.get("q-video-hook-battle")!;
    expect(questTarget(hook)).toBe(2);
    expect(questProgress(hook, [task("d31-video-t3", "d", "ship")])).toBe(2);
    expect(questProgress(hook, [task("d24-video-t2", "d", "build")])).toBe(1);
  });
  it("counts each task once even if re-submitted", () => {
    expect(questProgress(q({ count: "tasks", target: 5 }), [task("a", "d", "build"), task("a", "d", "build")])).toBe(1);
  });
});

const day = (d: Partial<CurriculumDay>): CurriculumDay => ({ day: 1, track: "common", lang: "en", phase: 1, title: "t", summary: "", estMinutes: 30, tasks: [], resources: [], bodyMd: "", ...d });
const curriculum = buildIndex([
  day({ day: 1, tasks: Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, type: (i % 2 ? "share" : "build") as "share" | "build", title: "b", xp: 10, proof: "none" as const })) }),
]);

describe("quest completion through the event pipeline", () => {
  let db: ReturnType<typeof createTestD1>;
  const U = "q1";
  beforeEach(async () => {
    db = createTestD1();
    await db.prepare("INSERT INTO users (id, track, lang) VALUES (?, 'apps', 'ru')").bind(U).run();
  });

  it("week 1: 'five of seven' and 'say it out loud' complete once, with localised labels", async () => {
    const all: { kind: string; id?: string; amount?: number; label?: string }[] = [];
    for (let i = 0; i < 10; i++) {
      const at = new Date(Date.UTC(2026, 10, 2 + (i % 5), 9 + i)); // Mon..Fri of W45
      all.push(...(await applyEvent(db, U, { type: "task.completed", taskId: `t${i}`, day: 1, xp: 10 }, { now: at, curriculum })));
    }
    const view = await getQuests(db, U, new Date("2026-11-06T20:00:00Z"));
    expect(view.programWeek).toBe(1);
    const done = view.quests.filter((x) => x.done).map((x) => x.id).sort();
    expect(done).toEqual(["q-five-of-seven", "q-say-it-out-loud"]);
    const qa = all.filter((a) => a.id?.startsWith("quest:"));
    expect(qa.map((a) => a.id).sort()).toEqual(["quest:q-five-of-seven", "quest:q-say-it-out-loud"]);
    expect(qa.find((a) => a.id === "quest:q-five-of-seven")?.label).toBe("Квест недели: Пять из семи (+50 XP)");
    const again = await applyEvent(db, U, { type: "task.completed", taskId: "t0", day: 1, xp: 10 }, { now: new Date("2026-11-06T21:00:00Z"), curriculum });
    expect(again.some((a) => a.id?.startsWith("quest:"))).toBe(false);
    const s = (await loadState(db, U)).state;
    expect(s.xp).toBe(100 + 50 + 40 + 15 /* 3-day streak bonus */);
  });

  it("quests reset with the ISO week", async () => {
    await applyEvent(db, U, { type: "task.completed", taskId: "t1", day: 1, xp: 10 }, { now: new Date("2026-11-04T10:00:00Z"), curriculum });
    const next = await getQuests(db, U, new Date("2026-11-10T10:00:00Z"));
    expect(next.week).toBe("2026-W46");
    expect(next.quests.every((x) => x.progress === 0 && !x.done)).toBe(true);
  });

  it("the set follows the program week reached before the ISO week started", async () => {
    for (let d = 1; d <= 15; d++) await applyEvent(db, U, { type: "day.completed", day: d }, { now: new Date(Date.UTC(2026, 9, 10 + d)), curriculum, skipQuests: true });
    const v = await getQuests(db, U, new Date("2026-11-04T10:00:00Z"));
    expect(v.programWeek).toBe(3);
    expect(v.quests).toHaveLength(3);
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
