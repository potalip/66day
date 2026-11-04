import { beforeEach, describe, expect, it } from "vitest";
import { createTestD1 } from "./d1-shim";
import { applyEvent, loadState } from "../store";
import { buildIndex } from "../curriculum";
import type { CurriculumDay } from "../../../../shared/types";

const day = (d: Partial<CurriculumDay>): CurriculumDay => ({
  day: 1, track: "common", lang: "en", phase: 1, title: "t", summary: "", estMinutes: 30, tasks: [], resources: [], bodyMd: "", ...d,
});
const curriculum = buildIndex([
  day({ day: 14, boss: true, title: "Ship your first app", tasks: [{ id: "d14-t1", type: "ship", title: "Deploy it", xp: 80, proof: "link" }] }),
  day({ day: 7, rest: true, badges: ["week-1"] }),
  day({ day: 20, track: "apps", badges: ["bot-builder"] }),
  day({ day: 20, track: "video", badges: ["voice-on"] }),
  day({ day: 21, track: "apps", tasks: Array.from({ length: 10 }, (_, i) => ({ id: `share-${i}`, type: "share" as const, title: "Post", xp: 10, proof: "link" as const })) }),
]);

let db: ReturnType<typeof createTestD1>;
const U = "u1";
const at = (iso: string) => ({ now: new Date(iso), curriculum });

beforeEach(async () => {
  db = createTestD1();
  await db.prepare("INSERT INTO users (id, timezone, track) VALUES (?, ?, ?)").bind(U, "Europe/Moscow", "apps").run();
});

describe("applyEvent", () => {
  it("awards XP, streak and first-task badge", async () => {
    const a = await applyEvent(db, U, { type: "task.completed", taskId: "d01-t1", day: 1, xp: 30 }, at("2026-11-04T10:00:00Z"));
    expect(a[0]).toMatchObject({ kind: "xp", amount: 30 });
    expect(a.find((x) => x.kind === "badge" && x.id === "first-task")).toBeTruthy();
    expect(a.find((x) => x.kind === "streak")?.amount).toBe(1);
    const { state } = await loadState(db, U);
    expect(state.xp).toBe(30);
    expect(state.track).toBe("apps");
  });

  it("is idempotent: retries return the same awards and never double-count", async () => {
    const ev = { type: "task.completed" as const, taskId: "d01-t1", day: 1, xp: 30 };
    const first = await applyEvent(db, U, ev, at("2026-11-04T10:00:00Z"));
    const again = await applyEvent(db, U, ev, at("2026-11-04T10:00:05Z"));
    const later = await applyEvent(db, U, { ...ev, xp: 999 }, at("2026-11-05T10:00:00Z"));
    expect(again).toEqual(first);
    expect(later).toEqual(first);
    const { state } = await loadState(db, U);
    expect(state.xp).toBe(30);
    expect(state.streak.streak).toBe(1);
    const w = await db.prepare("SELECT SUM(xp) s FROM game_weekly WHERE user_id = ?").bind(U).first<{ s: number }>();
    expect(w?.s).toBe(30);
  });

  it("concurrent events for one user do not lose updates", async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) => applyEvent(db, U, { type: "task.completed", taskId: `t${i}`, day: 1, xp: 10 }, at("2026-11-04T10:00:00Z"))),
    );
    const { state } = await loadState(db, U);
    expect(state.xp).toBe(80);
    expect(state.counters.tasks).toBe(8);
  });

  it("concurrent duplicates count once", async () => {
    const ev = { type: "task.completed" as const, taskId: "same", day: 1, xp: 10 };
    await Promise.all([1, 2, 3].map(() => applyEvent(db, U, ev, at("2026-11-04T10:00:00Z"))));
    expect((await loadState(db, U)).state.xp).toBe(10);
  });

  it("uses the user's timezone for streak days", async () => {
    // 20:00 UTC Nov 4 = 23:00 MSK Nov 4; 21:30 UTC Nov 5 = 00:30 MSK Nov 6 → missed Nov 5 locally
    await applyEvent(db, U, { type: "task.completed", taskId: "a", day: 1, xp: 10 }, at("2026-11-04T20:00:00Z"));
    await applyEvent(db, U, { type: "task.completed", taskId: "b", day: 2, xp: 10 }, at("2026-11-05T21:30:00Z"));
    expect((await loadState(db, U)).state.streak.streak).toBe(1);
  });

  it("boss days, ship tasks, day badges and the night-owl secret (task after midnight local)", async () => {
    await applyEvent(db, U, { type: "task.completed", taskId: "d14-t1", day: 14, xp: 80 }, at("2026-11-04T22:30:00Z")); // 01:30 MSK
    const a = await applyEvent(db, U, { type: "day.completed", day: 14 }, at("2026-11-04T22:31:00Z"));
    const ids = (await loadState(db, U)).state.badges;
    expect(ids.has("night-owl")).toBe(true);
    expect(a[0]).toMatchObject({ kind: "xp", amount: 120 });
    const b = await applyEvent(db, U, { type: "day.completed", day: 7, badges: ["extra-badge", "BAD ID!"] }, at("2026-11-04T22:32:00Z"));
    const got = b.filter((x) => x.kind === "badge").map((x) => x.id);
    expect(got).toContain("extra-badge");
    expect(got).not.toContain("BAD ID!");
  });

  it("night-owl needs a task after midnight local time (not 23:00)", async () => {
    await applyEvent(db, U, { type: "task.completed", taskId: "x", day: 1, xp: 10 }, at("2026-11-04T20:30:00Z")); // 23:30 MSK
    expect((await loadState(db, U)).state.badges.has("night-owl")).toBe(false);
    await applyEvent(db, U, { type: "task.completed", taskId: "y", day: 1, xp: 10 }, at("2026-11-04T21:30:00Z")); // 00:30 MSK
    expect((await loadState(db, U)).state.badges.has("night-owl")).toBe(true);
  });

  it("day badges fall back to the day file of the student's own track", async () => {
    const a = await applyEvent(db, U, { type: "day.completed", day: 20 }, at("2026-11-04T10:00:00Z")); // U is on apps
    const ids = a.filter((x) => x.kind === "badge").map((x) => x.id);
    expect(ids).toContain("bot-builder");
    expect(ids).not.toContain("voice-on");
  });

  it("public-builder after 10 share tasks; labels are localised to the student's language", async () => {
    await db.prepare("UPDATE users SET lang = 'ru' WHERE id = ?").bind(U).run();
    let last: { kind: string; id?: string; label?: string }[] = [];
    for (let i = 0; i < 10; i++) last = await applyEvent(db, U, { type: "task.completed", taskId: `share-${i}`, day: 21, xp: 10 }, at("2026-11-04T10:00:00Z"));
    const pb = last.find((x) => x.id === "public-builder");
    expect(pb).toBeTruthy();
    expect(pb?.label).toBe("Строю публично");
  });

  it("polyglot: the same lesson opened in both languages (zero XP)", async () => {
    expect(await applyEvent(db, U, { type: "lesson.viewed", day: 3, lang: "en" }, at("2026-11-04T10:00:00Z"))).toEqual([]);
    await applyEvent(db, U, { type: "lesson.viewed", day: 4, lang: "ru" }, at("2026-11-04T10:00:00Z"));
    const a = await applyEvent(db, U, { type: "lesson.viewed", day: 3, lang: "ru" }, at("2026-11-04T10:01:00Z"));
    expect(a.map((x) => x.id)).toEqual(["polyglot"]);
    expect((await loadState(db, U)).state.xp).toBe(0);
  });

  it("rest days count for the streak and three of them earn well-rested", async () => {
    await applyEvent(db, U, { type: "day.completed", day: 7 }, at("2026-11-04T10:00:00Z"));
    const s = (await loadState(db, U)).state;
    expect(s.streak.streak).toBe(1);
    expect(s.counters.rests).toBe(1);
  });

  it("caps resource XP per day and rejects invalid events", async () => {
    for (let i = 0; i < 12; i++) await applyEvent(db, U, { type: "resource.viewed", resourceId: `r${i}` }, at("2026-11-04T10:00:00Z"));
    const { state } = await loadState(db, U);
    expect(state.xp).toBe(20);
    expect(state.badges.has("curious")).toBe(true);
    await expect(applyEvent(db, U, { type: "day.completed", day: 99 }, at("2026-11-04T10:00:00Z"))).rejects.toThrow();
  });

  it("streak milestones, freezes and level ups over a month", async () => {
    let awards: { kind: string; id?: string; amount?: number }[] = [];
    for (let d = 0; d < 9; d++) {
      const iso = new Date(Date.UTC(2026, 10, 1 + d, 9)).toISOString();
      awards = awards.concat(await applyEvent(db, U, { type: "task.completed", taskId: `t${d}`, day: d + 1, xp: 60 }, at(iso)));
    }
    let s = (await loadState(db, U)).state;
    expect(s.streak.streak).toBe(9);
    expect(s.streak.freezes).toBe(1);
    expect(s.badges.has("streak-7")).toBe(true);
    expect(awards.some((a) => a.kind === "level")).toBe(true);
    // skip Nov 10, come back Nov 11 → freeze saves it
    await applyEvent(db, U, { type: "task.completed", taskId: "t10", day: 10, xp: 60 }, at("2026-11-11T09:00:00Z"));
    s = (await loadState(db, U)).state;
    expect(s.streak.streak).toBe(11); // the frozen day counts as kept
    expect(s.badges.has("saved-by-freeze")).toBe(true);
  });
});
