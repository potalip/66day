import { describe, expect, it } from "vitest";
import { computeSchedule, dayAccess, daysBetween, localDate } from "./schedule";

const done = (days: number[], date: string) => days.map((day) => ({ day, localDate: date }));

describe("computeSchedule", () => {
  it("new student: day 1 open", () => {
    const s = computeSchedule({ completed: [], startDate: "2026-11-01", today: "2026-11-01" });
    expect(s).toMatchObject({ nextDay: 1, status: "open", calendarDay: 1, behind: 0, percent: 0 });
  });
  it("after finishing today's day, the next waits until tomorrow", () => {
    const s = computeSchedule({ completed: done([1], "2026-11-01"), startDate: "2026-11-01", today: "2026-11-01" });
    expect(s).toMatchObject({ nextDay: 2, status: "waiting", completedToday: 1 });
  });
  it("opens the next day the following calendar day", () => {
    const s = computeSchedule({ completed: done([1], "2026-11-01"), startDate: "2026-11-01", today: "2026-11-02" });
    expect(s).toMatchObject({ nextDay: 2, status: "open", calendarDay: 2, behind: 0 });
  });
  it("allows catching up after missed days, up to the calendar day", () => {
    const base = { startDate: "2026-11-01", today: "2026-11-05" };
    expect(computeSchedule({ ...base, completed: done([1], "2026-11-01") })).toMatchObject({ nextDay: 2, status: "open", behind: 3 });
    const caught = [...done([1], "2026-11-01"), ...done([2, 3, 4], "2026-11-05")];
    expect(computeSchedule({ ...base, completed: caught })).toMatchObject({ nextDay: 5, status: "open", behind: 0 });
    const ahead = [...caught, ...done([5], "2026-11-05")];
    expect(computeSchedule({ ...base, completed: ahead })).toMatchObject({ nextDay: 6, status: "waiting" });
  });
  it("never leaves you with nothing to do if you haven't done anything today", () => {
    // e.g. start date shifted by a timezone change: calendar says day 1, but day 1 is done yesterday
    const s = computeSchedule({ completed: done([1], "2026-10-31"), startDate: "2026-11-01", today: "2026-11-01" });
    expect(s.status).toBe("open");
  });
  it("next day is the first gap", () => {
    const s = computeSchedule({ completed: done([1, 2, 4], "2026-11-01"), startDate: "2026-10-01", today: "2026-11-01" });
    expect(s.nextDay).toBe(3);
  });
  it("finished after 66", () => {
    const all = done(Array.from({ length: 66 }, (_, i) => i + 1), "2026-12-01");
    const s = computeSchedule({ completed: all, startDate: "2026-09-01", today: "2026-12-02" });
    expect(s).toMatchObject({ nextDay: null, status: "finished", percent: 100, calendarDay: 66 });
  });
});

describe("dayAccess", () => {
  const s = computeSchedule({ completed: done([1], "2026-11-01"), startDate: "2026-11-01", today: "2026-11-01" });
  it("maps states", () => {
    const set = new Set([1]);
    expect(dayAccess(1, set, s)).toBe("done");
    expect(dayAccess(2, set, s)).toBe("waiting");
    expect(dayAccess(3, set, s)).toBe("locked");
  });
});

describe("dates", () => {
  it("localDate respects the timezone", () => {
    const t = Date.UTC(2026, 10, 1, 23, 30) / 1000; // 23:30 UTC
    expect(localDate(t, "UTC")).toBe("2026-11-01");
    expect(localDate(t, "Europe/Moscow")).toBe("2026-11-02");
    expect(localDate(t, "America/Los_Angeles")).toBe("2026-11-01");
    expect(localDate(t, "Not/AZone")).toBe("2026-11-01");
  });
  it("daysBetween", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});
