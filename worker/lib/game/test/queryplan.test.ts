import { describe, expect, it } from "vitest";
import { createTestD1 } from "./d1-shim";
import { getLeaderboard } from "../queries";

describe("leaderboard queries use indexes (stay fast at 100k users)", () => {
  const db = createTestD1();
  const plan = (sql: string, ...p: unknown[]) =>
    (db.sqlite.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...(p as never[])) as { detail: string }[]).map((r) => r.detail).join(" | ");

  it("all-time / per track / weekly ordered scans avoid temp b-trees", () => {
    for (const [sql, p] of [
      ["SELECT x.user_id FROM game_stats x JOIN users u ON u.id = x.user_id WHERE x.xp > 0 ORDER BY x.xp DESC, x.updated_at ASC LIMIT 50", []],
      ["SELECT x.user_id FROM game_stats x JOIN users u ON u.id = x.user_id WHERE x.xp > 0 AND x.track = ? ORDER BY x.xp DESC, x.updated_at ASC LIMIT 50", ["apps"]],
      ["SELECT x.user_id FROM game_weekly x JOIN game_stats s ON s.user_id = x.user_id JOIN users u ON u.id = x.user_id WHERE x.week = ? AND x.xp > 0 ORDER BY x.xp DESC, x.updated_at ASC LIMIT 50", ["2026-W45"]],
      ["SELECT x.user_id FROM game_weekly x JOIN game_stats s ON s.user_id = x.user_id JOIN users u ON u.id = x.user_id WHERE x.week = ? AND x.xp > 0 AND x.track = ? ORDER BY x.xp DESC, x.updated_at ASC LIMIT 50", ["2026-W45", "video"]],
    ] as const) {
      const p2 = plan(sql, ...p);
      expect(p2, p2).not.toMatch(/TEMP B-TREE/);
      expect(p2, p2).toMatch(/USING (COVERING )?INDEX game_/);
    }
  });

  it("runs on an empty database", async () => {
    const r = await getLeaderboard(db, "nobody", "week", "all");
    expect(r.rows).toEqual([]);
    expect(r.me).toBeNull();
  });
});
