import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Report, buildContent, compactRanges, crossValidate, parseDay, parseProgram, splitFrontmatter } from "../../../scripts/build-content.mjs";

const program = { lang: "en", title: "T", tagline: "t", phases: [{ id: 1, days: [1, 66], title: "All", goal: "g" }] };
const ctx = (over = {}) => ({ lang: "en", track: "common", dayFromName: 7, file: "en/common/day-07.md", program, badgeIds: new Set(["week-1"]), ...over });
const dayMd = (fm) => `---\n${fm}\n---\n\n## Body\n\nText.\n`;
const GOOD = `day: 7
track: common
phase: 1
title: "Rest"
summary: "One sentence."
estMinutes: 30
rest: true
badges: [week-1]
resources:
  - https://example.com/x
tasks:
  - id: d07-t1
    type: reflect
    title: "Write"
    xp: 20
    proof: text`;

describe("splitFrontmatter", () => {
  it("rejects files without frontmatter", () => {
    expect(() => splitFrontmatter("# hi")).toThrow(/frontmatter/);
  });
  it("handles CRLF and BOM", () => {
    expect(splitFrontmatter("﻿---\r\na: 1\r\n---\r\nbody").data).toEqual({ a: 1 });
  });
});

describe("parseDay", () => {
  it("parses a valid day", () => {
    const r = new Report();
    const d = parseDay(dayMd(GOOD), ctx(), r);
    expect(r.errors).toEqual([]);
    expect(d).toMatchObject({ day: 7, track: "common", lang: "en", rest: true, badges: ["week-1"], tasks: [{ id: "d07-t1", proof: "text", xp: 20 }] });
    expect(d.bodyMd).toBe("## Body\n\nText.");
  });
  it.each([
    ["day mismatch", GOOD.replace("day: 7", "day: 8"), /does not match file name/],
    ["track mismatch", GOOD.replace("track: common", "track: apps"), /does not match folder/],
    ["bad task id", GOOD.replace("d07-t1", "d7-t1"), /must look like "d07-t<N>"/],
    ["bad type", GOOD.replace("type: reflect", "type: dance"), /type must be one of/],
    ["bad proof", GOOD.replace("proof: text", "proof: photo"), /proof must be one of/],
    ["xp not int", GOOD.replace("xp: 20", "xp: twenty"), /xp must be a positive integer/],
    ["unknown badge", GOOD.replace("[week-1]", "[nope]"), /badge "nope" is not defined/],
    ["bad resource", GOOD.replace("https://example.com/x", "example.com"), /must be an http\(s\) URL/],
    ["phase missing", GOOD.replace("phase: 1", "phase: 9"), /phase 9 is not defined/],
    ["no tasks", GOOD.split("tasks:")[0] + "tasks: []", /tasks must be a non-empty list/],
  ])("errors on %s", (_n, fm, re) => {
    const r = new Report();
    expect(parseDay(dayMd(fm), ctx(), r)).toBeNull();
    expect(r.errors.join("\n")).toMatch(re);
  });
  it("track task ids need the track", () => {
    const r = new Report();
    const fm = GOOD.replace("track: common", "track: apps").replace("d07-t1", "d07-apps-t1");
    expect(parseDay(dayMd(fm), ctx({ track: "apps", file: "en/apps/day-07.md" }), r)).not.toBeNull();
    expect(r.errors).toEqual([]);
  });
  it("errors on empty body", () => {
    const r = new Report();
    parseDay(`---\n${GOOD}\n---\n`, ctx(), r);
    expect(r.errors.join()).toMatch(/body/);
  });
});

describe("parseProgram", () => {
  it("detects gaps and overlaps", () => {
    const r = new Report();
    parseProgram({ ...program, phases: [{ id: 1, days: [1, 10], title: "a", goal: "g" }, { id: 2, days: [10, 60], title: "b", goal: "g" }] }, "en", "p", r);
    expect(r.errors.join("\n")).toMatch(/do not cover days 61–66/);
    expect(r.errors.join("\n")).toMatch(/overlap on days 10/);
  });
});

describe("crossValidate", () => {
  const d = (lang, track, day, tasks) => ({ lang, track, day, phase: 1, tasks, badges: undefined });
  it("requires identical task ids and xp across languages", () => {
    const r = new Report();
    crossValidate([d("en", "common", 1, [{ id: "d01-t1", xp: 10 }]), d("ru", "common", 1, [{ id: "d01-t1", xp: 15 }])], r);
    expect(r.errors.join()).toMatch(/task ids\/xp differ/);
  });
  it("requires both tracks for split days, and no common+track mix", () => {
    const r = new Report();
    crossValidate([d("en", "apps", 2, []), d("ru", "apps", 2, []), d("en", "common", 3, []), d("en", "video", 3, []), d("ru", "common", 3, [])], r);
    const all = r.errors.join("\n");
    expect(all).toMatch(/en\/day-02: has apps\/ but not video/);
    expect(all).toMatch(/en\/day-03: has both common/);
  });
  it("missing days are warnings, or errors when strict", () => {
    const r1 = new Report();
    crossValidate([], r1);
    expect(r1.errors).toEqual([]);
    expect(r1.warnings.join()).toMatch(/66 of 66 days have no content yet: 1–66/);
    const r2 = new Report();
    crossValidate([], r2, { strict: true });
    expect(r2.errors.length).toBe(2);
  });
});

describe("buildContent", () => {
  it("builds the shipped fixtures without errors", () => {
    const root = path.resolve(import.meta.dirname, "../../..");
    const { out, report } = buildContent({ root, dir: path.join(root, "content/fixtures"), source: "fixtures" });
    expect(report.errors).toEqual([]);
    expect(out.programs.en.phases.length).toBeGreaterThan(0);
    expect(out.days.filter((x) => x.lang === "ru").length).toBe(out.days.filter((x) => x.lang === "en").length);
  });
  it("reports bad file names", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "fl-content-"));
    const dir = path.join(root, "content/curriculum");
    for (const l of ["en", "ru"]) {
      fs.mkdirSync(path.join(dir, l, "common"), { recursive: true });
      fs.writeFileSync(path.join(dir, l, "program.json"), JSON.stringify({ ...program, lang: l }));
      fs.writeFileSync(path.join(dir, l, "common", "day-7.md"), dayMd(GOOD));
    }
    const { report } = buildContent({ root, dir, source: "curriculum" });
    expect(report.errors.join()).toMatch(/must be "day-NN.md"/);
  });
});

it("compactRanges", () => expect(compactRanges([1, 2, 3, 5, 7, 8])).toBe("1–3, 5, 7–8"));
