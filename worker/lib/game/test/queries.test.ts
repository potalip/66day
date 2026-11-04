import { beforeEach, describe, expect, it } from "vitest";
import { createTestD1 } from "./d1-shim";
import { applyEvent } from "../store";
import { getLeaderboard, getMe, getProfile } from "../queries";

let db: ReturnType<typeof createTestD1>;
const now = new Date("2026-11-04T12:00:00Z");
const lastWeek = new Date("2026-10-27T12:00:00Z");

async function user(id: string, track: "apps" | "video", xp: number, at = now) {
  await db.prepare("INSERT INTO users (id, display_name, track) VALUES (?,?,?)").bind(id, id.toUpperCase(), track).run();
  await applyEvent(db, id, { type: "task.completed", taskId: `${id}-t`, day: 1, xp }, { now: at });
}

beforeEach(async () => {
  db = createTestD1();
  await user("a", "apps", 100);
  await user("b", "video", 300);
  await user("c", "apps", 300);
  await user("d", "apps", 50, lastWeek);
});

describe("leaderboard", () => {
  it("orders by XP, ties share a rank (earlier first)", async () => {
    const r = await getLeaderboard(db, "a", "all", "all", 50, now);
    expect(r.rows.map((x) => [x.userId, x.rank])).toEqual([["b", 1], ["c", 1], ["a", 3], ["d", 4]]);
    expect(r.me?.isMe).toBe(true);
    expect(r.total).toBe(4);
  });

  it("filters by track and by week", async () => {
    const apps = await getLeaderboard(db, "a", "all", "apps", 50, now);
    expect(apps.rows.map((x) => x.userId)).toEqual(["c", "a", "d"]);
    const week = await getLeaderboard(db, "d", "week", "all", 50, now);
    expect(week.rows.map((x) => x.userId)).not.toContain("d");
    expect(week.me).toBeNull();
  });

  it("pins the viewer with a correct rank when outside the limit", async () => {
    const r = await getLeaderboard(db, "d", "all", "all", 2, now);
    expect(r.rows).toHaveLength(2);
    expect(r.me).toMatchObject({ userId: "d", rank: 4 });
  });
});

describe("me / profile", () => {
  it("me has level, ranks, 66 activity cells", async () => {
    const me = await getMe(db, "a", now);
    expect(me.xp).toBe(100);
    expect(me.level).toBe(2);
    expect(me.ranks.all).toBe(3);
    expect(me.activity).toHaveLength(66);
    expect(me.activity[0].xp).toBe(100);
    expect(me.streak.status).toBe("done");
  });
  it("profile 404s for unknown users and marks isMe", async () => {
    expect(await getProfile(db, "zzz", "a", now)).toBeNull();
    expect((await getProfile(db, "a", "a", now))?.isMe).toBe(true);
    expect((await getProfile(db, "a", "b", now))?.isMe).toBe(false);
  });
});

describe("legacy badge ids", () => {
  it("are mapped to their current badge or hidden, never shown as raw ids", async () => {
    const ins = (id: string) => db.prepare("INSERT INTO game_badges (user_id, badge_id, awarded_at) VALUES ('a', ?, 1)").bind(id).run();
    await ins("first-day");
    await ins("boss-3");
    await ins("totally-unknown");
    const ids = (await getProfile(db, "a", "a", now))!.badges.map((b) => b.id);
    expect(ids).toContain("hello-agent");
    expect(ids).not.toContain("first-day");
    expect(ids).not.toContain("boss-3");
    expect(ids).not.toContain("totally-unknown");
  });
});
