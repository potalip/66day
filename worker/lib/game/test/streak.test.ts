import { describe, expect, it } from "vitest";
import { applyActivity, viewStreak, type StreakState } from "../streak";
import { addDays, isoWeek, localDay, localParts } from "../time";

const empty: StreakState = { streak: 0, best: 0, lastDay: null, freezes: 0 };

function run(days: string[], start = empty) {
  let s = start;
  const log = [];
  for (const d of days) {
    const ch = applyActivity(s, d);
    log.push(ch);
    s = ch.state;
  }
  return { s, log };
}

const seq = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe("streak", () => {
  it("counts consecutive days and ignores repeats on the same day", () => {
    const { s } = run(["2026-11-01", "2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(s.streak).toBe(3);
    expect(s.best).toBe(3);
  });

  it("a gap without freezes resets to 1 and marks a restart", () => {
    const { s, log } = run(["2026-11-01", "2026-11-02", "2026-11-04"]);
    expect(s.streak).toBe(1);
    expect(s.best).toBe(2);
    expect(log[2].restarted).toBe(true);
  });

  it("earns one freeze per 7 days, capped at 2", () => {
    const { s, log } = run(seq("2026-01-01", 28));
    expect(s.streak).toBe(28);
    expect(s.freezes).toBe(2);
    expect(log.filter((l) => l.freezeEarned)).toHaveLength(2);
  });

  it("freezes bridge missed days and are consumed", () => {
    const { s: after7 } = run(seq("2026-01-01", 7));
    expect(after7.freezes).toBe(1);
    const ch = applyActivity(after7, addDays("2026-01-07", 2)); // missed exactly one day
    expect(ch.freezesUsed).toBe(1);
    expect(ch.state.streak).toBe(8);
    expect(ch.state.freezes).toBe(0);
  });

  it("not enough freezes → streak lost, freezes kept", () => {
    const { s: after7 } = run(seq("2026-01-01", 7));
    const ch = applyActivity(after7, addDays("2026-01-07", 3)); // missed two days, only one freeze
    expect(ch.state.streak).toBe(1);
    expect(ch.freezesUsed).toBe(0);
    expect(ch.state.freezes).toBe(1);
  });

  it("time going backwards (timezone change) never breaks or double counts", () => {
    const { s } = run(["2026-11-02", "2026-11-01", "2026-11-02"]);
    expect(s.streak).toBe(1);
    expect(s.lastDay).toBe("2026-11-02");
  });

  it("works across month/year boundaries", () => {
    const { s } = run(["2025-12-31", "2026-01-01", "2026-01-02"]);
    expect(s.streak).toBe(3);
  });

  it("view: done / at risk / frozen / lost", () => {
    const st: StreakState = { streak: 5, best: 5, lastDay: "2026-11-03", freezes: 1 };
    expect(viewStreak(st, "2026-11-03").status).toBe("done");
    expect(viewStreak(st, "2026-11-04").status).toBe("at_risk");
    expect(viewStreak(st, "2026-11-05")).toMatchObject({ status: "frozen", current: 5, freezesPending: 1 });
    expect(viewStreak(st, "2026-11-06")).toMatchObject({ status: "lost", current: 0 });
    expect(viewStreak(empty, "2026-11-06").status).toBe("none");
  });
});

describe("time zones", () => {
  // 2026-11-04 23:30 UTC
  const t = new Date(Date.UTC(2026, 10, 4, 23, 30));
  it("same instant is a different local day in different zones", () => {
    expect(localDay(t, "UTC")).toBe("2026-11-04");
    expect(localDay(t, "Europe/Moscow")).toBe("2026-11-05");
    expect(localDay(t, "America/Los_Angeles")).toBe("2026-11-04");
    expect(localParts(t, "Asia/Kolkata")).toEqual({ day: "2026-11-05", hour: 5 });
  });
  it("invalid zones fall back to UTC", () => {
    expect(localDay(t, "Mars/Olympus")).toBe("2026-11-04");
  });
  it("a Moscow student studying at 01:00 local keeps the streak (counts for the new local day)", () => {
    const mon = localDay(new Date(Date.UTC(2026, 10, 2, 18, 0)), "Europe/Moscow"); // 21:00 MSK Mon
    const tue = localDay(new Date(Date.UTC(2026, 10, 3, 22, 0)), "Europe/Moscow"); // 01:00 MSK Wed? no: 01:00 Wed
    const { s } = run([mon, tue]);
    // 21:00 Mon → 01:00 Wed is a missed Tuesday in local time
    expect(s.streak).toBe(1);
    const wedUtcLate = localDay(new Date(Date.UTC(2026, 10, 3, 20, 0)), "Europe/Moscow"); // 23:00 Tue MSK
    expect(run([mon, wedUtcLate]).s.streak).toBe(2);
  });
  it("iso weeks", () => {
    expect(isoWeek(new Date(Date.UTC(2026, 10, 4)))).toBe("2026-W45");
    expect(isoWeek(new Date(Date.UTC(2027, 0, 1)))).toBe("2026-W53");
    expect(isoWeek(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-W01");
  });
});
