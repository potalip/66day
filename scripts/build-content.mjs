#!/usr/bin/env node
/**
 * OWNER: learn agent.
 *
 * Parses `content/curriculum/**` (YAML frontmatter + markdown) into `shared/curriculum.generated.json`,
 * validating every rule in docs/CONTENT-FORMAT.md. Exits non-zero with readable messages on any error.
 *
 * Source selection:
 *   - `content/curriculum/{ru,en}/program.json` exists → curriculum (the real program)
 *   - otherwise → `content/fixtures/` (small demo program owned by learn), so nobody is blocked
 *   - `--source fixtures|curriculum` forces one.
 *
 * Completeness ("every day 1..66 has content in every language") is an ERROR only with `--strict`
 * (or CONTENT_STRICT=1). By default it is a loud warning, because the curriculum is written incrementally
 * (days 1–14 first) and a partial program must still build and run. CI / release should use `--strict`.
 *
 * Usage: node scripts/build-content.mjs [--strict] [--source fixtures|curriculum] [--check] [--quiet]
 *   --check  validate only, do not write the JSON
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import YAML from "yaml";

export const TOTAL_DAYS = 66;
export const LANGS = ["ru", "en"];
export const DAY_TRACKS = ["common", "apps", "video"];
export const TASK_TYPES = ["watch", "read", "build", "ship", "reflect", "quiz", "share"];
export const PROOF_TYPES = ["none", "link", "text", "file"];
const KNOWN_KEYS = new Set([
  "day", "track", "phase", "title", "summary", "estMinutes", "rest", "boss", "badges", "resources", "tasks",
]);
const KNOWN_TASK_KEYS = new Set(["id", "type", "title", "xp", "proof", "optional"]);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Collects errors and warnings with file context. */
export class Report {
  constructor() { this.errors = []; this.warnings = []; }
  error(where, msg) { this.errors.push(`${where}: ${msg}`); }
  warn(where, msg) { this.warnings.push(`${where}: ${msg}`); }
}

/** Split a markdown file into { data, body }. Throws on missing/invalid frontmatter. */
export function splitFrontmatter(src) {
  const text = src.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/.exec(text);
  if (!m) throw new Error("missing YAML frontmatter (file must start with '---' and have a closing '---')");
  let data;
  try {
    data = YAML.parse(m[1]);
  } catch (e) {
    throw new Error(`invalid YAML frontmatter: ${String(e.message).split("\n")[0]}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("frontmatter must be a YAML mapping");
  return { data, body: m[2].trim() };
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const pad = (n) => String(n).padStart(2, "0");

/** Expected task id prefix for a day/track: d07- / d15-apps- / d15-video- */
export function taskIdPrefix(day, track) {
  return `d${pad(day)}-${track === "common" ? "" : `${track}-`}`;
}

/**
 * Validate + normalise one day file. Returns a CurriculumDay or null (errors go to `report`).
 * `ctx` = { lang, track, dayFromName, file, program, badgeIds:Set|null }
 */
export function parseDay(src, ctx, report) {
  const where = ctx.file;
  let fm;
  try {
    fm = splitFrontmatter(src);
  } catch (e) {
    report.error(where, e.message);
    return null;
  }
  const d = fm.data;
  const before = report.errors.length;

  for (const k of Object.keys(d)) if (!KNOWN_KEYS.has(k)) report.warn(where, `unknown frontmatter key "${k}" (ignored)`);

  if (d.day !== ctx.dayFromName) report.error(where, `day: ${JSON.stringify(d.day)} does not match file name (expected ${ctx.dayFromName})`);
  if (d.track !== ctx.track) report.error(where, `track: ${JSON.stringify(d.track)} does not match folder "${ctx.track}"`);
  if (!Number.isInteger(d.phase)) report.error(where, `phase must be an integer, got ${JSON.stringify(d.phase)}`);
  else if (ctx.program) {
    const ph = ctx.program.phases.find((p) => p.id === d.phase);
    if (!ph) report.error(where, `phase ${d.phase} is not defined in ${ctx.lang}/program.json`);
    else if (ctx.dayFromName < ph.days[0] || ctx.dayFromName > ph.days[1])
      report.error(where, `day ${ctx.dayFromName} is outside phase ${d.phase} range ${ph.days[0]}–${ph.days[1]}`);
  }
  if (!isStr(d.title)) report.error(where, "title is required (non-empty string)");
  if (!isStr(d.summary)) report.error(where, "summary is required (non-empty string)");
  if (!isPosInt(d.estMinutes)) report.error(where, `estMinutes must be a positive integer, got ${JSON.stringify(d.estMinutes)}`);
  for (const flag of ["rest", "boss"]) {
    if (d[flag] !== undefined && typeof d[flag] !== "boolean") report.error(where, `${flag} must be true/false`);
  }
  if (d.rest && d.boss) report.warn(where, "a day is both rest and boss — is that intended?");

  let badges;
  if (d.badges !== undefined && d.badges !== null) {
    if (!Array.isArray(d.badges) || !d.badges.every(isStr)) report.error(where, "badges must be a list of badge ids");
    else {
      badges = d.badges.map((b) => b.trim());
      if (ctx.badgeIds) {
        for (const b of badges) if (!ctx.badgeIds.has(b)) report.error(where, `badge "${b}" is not defined in content/badges.json`);
      }
    }
  }

  let resources = [];
  if (d.resources !== undefined && d.resources !== null) {
    if (!Array.isArray(d.resources)) report.error(where, "resources must be a list of URLs (or lib:<id>)");
    else {
      d.resources.forEach((r, i) => {
        if (!isStr(r)) return report.error(where, `resources[${i}] must be a string`);
        const v = r.trim();
        if (!/^https?:\/\/\S+$/.test(v) && !/^lib:[\w-]+$/.test(v))
          report.error(where, `resources[${i}] "${v}" must be an http(s) URL or lib:<id>`);
      });
      resources = d.resources.filter(isStr).map((r) => r.trim());
    }
  }

  const tasks = [];
  if (!Array.isArray(d.tasks) || d.tasks.length === 0) report.error(where, "tasks must be a non-empty list (1–4 tasks)");
  else {
    if (d.tasks.length > 4) report.warn(where, `${d.tasks.length} tasks — the format recommends 1–4`);
    const prefix = taskIdPrefix(ctx.dayFromName, ctx.track);
    const seen = new Set();
    d.tasks.forEach((t, i) => {
      const tw = `${where} tasks[${i}]`;
      if (!t || typeof t !== "object" || Array.isArray(t)) return report.error(tw, "must be a mapping");
      for (const k of Object.keys(t)) if (!KNOWN_TASK_KEYS.has(k)) report.warn(tw, `unknown key "${k}" (ignored)`);
      if (!isStr(t.id)) report.error(tw, "id is required");
      else {
        const re = new RegExp(`^${prefix}t\\d+$`);
        if (!re.test(t.id)) report.error(tw, `id "${t.id}" must look like "${prefix}t<N>"`);
        if (seen.has(t.id)) report.error(tw, `duplicate task id "${t.id}"`);
        seen.add(t.id);
      }
      if (!TASK_TYPES.includes(t.type)) report.error(tw, `type must be one of ${TASK_TYPES.join("|")}, got ${JSON.stringify(t.type)}`);
      if (!isStr(t.title)) report.error(tw, "title is required");
      if (!isPosInt(t.xp)) report.error(tw, `xp must be a positive integer, got ${JSON.stringify(t.xp)}`);
      const proof = t.proof === undefined ? "none" : t.proof;
      if (!PROOF_TYPES.includes(proof)) report.error(tw, `proof must be one of ${PROOF_TYPES.join("|")}, got ${JSON.stringify(t.proof)}`);
      if (t.optional !== undefined && typeof t.optional !== "boolean") report.error(tw, "optional must be true/false");
      const task = { id: String(t.id ?? "").trim(), type: t.type, title: String(t.title ?? "").trim(), xp: t.xp, proof };
      if (t.optional) task.optional = true;
      tasks.push(task);
    });
    if (tasks.length && tasks.every((t) => t.optional)) report.warn(where, "all tasks are optional — the day can be completed with no work");
  }

  if (!fm.body) report.error(where, "lesson body (markdown after the frontmatter) is empty");

  if (report.errors.length > before) return null;
  /** @type {import("../shared/types").CurriculumDay} */
  const day = {
    day: ctx.dayFromName,
    track: ctx.track,
    lang: ctx.lang,
    phase: d.phase,
    title: d.title.trim(),
    summary: d.summary.trim(),
    estMinutes: d.estMinutes,
    tasks,
    resources,
    bodyMd: fm.body,
  };
  if (d.rest) day.rest = true;
  if (d.boss) day.boss = true;
  if (badges?.length) day.badges = badges;
  return day;
}

/** Validate a program.json object. Returns Program or null. */
export function parseProgram(obj, lang, where, report) {
  const before = report.errors.length;
  if (!obj || typeof obj !== "object") { report.error(where, "must be a JSON object"); return null; }
  if (obj.lang !== lang) report.error(where, `lang must be "${lang}", got ${JSON.stringify(obj.lang)}`);
  if (!isStr(obj.title)) report.error(where, "title is required");
  if (!isStr(obj.tagline)) report.error(where, "tagline is required");
  if (!Array.isArray(obj.phases) || obj.phases.length === 0) report.error(where, "phases must be a non-empty list");
  else {
    const covered = new Array(TOTAL_DAYS + 1).fill(0);
    const ids = new Set();
    obj.phases.forEach((p, i) => {
      const pw = `${where} phases[${i}]`;
      if (!Number.isInteger(p?.id)) report.error(pw, "id must be an integer");
      else if (ids.has(p.id)) report.error(pw, `duplicate phase id ${p.id}`);
      else ids.add(p.id);
      if (!isStr(p?.title)) report.error(pw, "title is required");
      if (!isStr(p?.goal)) report.error(pw, "goal is required");
      const r = p?.days;
      if (!Array.isArray(r) || r.length !== 2 || !r.every(Number.isInteger) || r[0] < 1 || r[1] > TOTAL_DAYS || r[0] > r[1])
        report.error(pw, `days must be [from, to] within 1..${TOTAL_DAYS}, got ${JSON.stringify(r)}`);
      else for (let d = r[0]; d <= r[1]; d++) covered[d]++;
    });
    if (report.errors.length === before) {
      const gaps = [], overlaps = [];
      for (let d = 1; d <= TOTAL_DAYS; d++) {
        if (covered[d] === 0) gaps.push(d);
        if (covered[d] > 1) overlaps.push(d);
      }
      if (gaps.length) report.error(where, `phases do not cover days ${compactRanges(gaps)}`);
      if (overlaps.length) report.error(where, `phases overlap on days ${compactRanges(overlaps)}`);
    }
  }
  if (report.errors.length > before) return null;
  return {
    lang,
    title: obj.title.trim(),
    tagline: obj.tagline.trim(),
    phases: obj.phases.map((p) => ({ id: p.id, days: [p.days[0], p.days[1]], title: p.title.trim(), goal: p.goal.trim() })),
  };
}

/** Validate content/badges.json. Returns badge list or null. */
export function parseBadges(arr, where, report) {
  const before = report.errors.length;
  if (!Array.isArray(arr)) { report.error(where, "must be a JSON array"); return null; }
  const ids = new Set();
  arr.forEach((b, i) => {
    const bw = `${where} [${i}]`;
    if (!isStr(b?.id)) return report.error(bw, "id is required");
    if (ids.has(b.id)) report.error(bw, `duplicate badge id "${b.id}"`);
    ids.add(b.id);
    if (!isStr(b.icon)) report.error(bw, `"${b.id}": icon is required`);
    for (const f of ["title", "description"])
      for (const l of LANGS) if (!isStr(b?.[f]?.[l])) report.error(bw, `"${b.id}": ${f}.${l} is required`);
    if (!isStr(b.rule)) report.error(bw, `"${b.id}": rule is required`);
  });
  return report.errors.length > before ? null : arr;
}

/** Cross-language + completeness checks over parsed days. */
export function crossValidate(days, report, { strict = false, langs = LANGS } = {}) {
  const key = (l, t, d) => `${l}/${t}/${d}`;
  const map = new Map(days.map((d) => [key(d.lang, d.track, d.day), d]));
  // Work-in-progress gaps (half a track pair, a day in one language only) are errors only in strict mode:
  // the curriculum is written incrementally and a partial program must still build. The existing half is served;
  // students on the other track / language see "being written".
  const incomplete = (w, msg) => (strict ? report.error(w, msg) : report.warn(w, `${msg} (incomplete — allowed until --strict)`));
  const missing = {};
  for (const lang of langs) {
    missing[lang] = [];
    for (let n = 1; n <= TOTAL_DAYS; n++) {
      const c = map.get(key(lang, "common", n));
      const a = map.get(key(lang, "apps", n));
      const v = map.get(key(lang, "video", n));
      const w = `${lang}/day-${pad(n)}`;
      if (c && (a || v)) report.error(w, "has both common/ and a track-specific file — use one or the other");
      if (!c && (a ? !v : v)) incomplete(w, `has ${a ? "apps" : "video"}/ but not ${a ? "video" : "apps"}/ — track days need both tracks`);
      if (!c && !a && !v) missing[lang].push(n);
    }
  }
  // Same skeleton across languages: same tracks, same task ids, same xp.
  const [l1, l2] = langs;
  if (l1 && l2) {
    for (const d of days.filter((x) => x.lang === l1)) {
      const other = map.get(key(l2, d.track, d.day));
      const w = `day-${pad(d.day)} (${d.track})`;
      if (!other) {
        const conflict = DAY_TRACKS.some((t) => t !== d.track && (t === "common") !== (d.track === "common") && map.has(key(l2, t, d.day)));
        if (conflict) report.error(w, `is ${d.track === "common" ? "common" : "track-specific"} in ${l1} but not in ${l2} — the day/track skeleton must match`);
        else incomplete(w, `exists in ${l1} but not in ${l2}`);
        continue;
      }
      const a = d.tasks.map((t) => `${t.id}:${t.xp}${t.optional ? "?" : ""}`).join(",");
      const b = other.tasks.map((t) => `${t.id}:${t.xp}${t.optional ? "?" : ""}`).join(",");
      if (a !== b) report.error(w, `task ids/xp differ between ${l1} [${a}] and ${l2} [${b}] — they must be identical`);
      if (d.phase !== other.phase) report.error(w, `phase differs between ${l1} (${d.phase}) and ${l2} (${other.phase})`);
      if (!!d.rest !== !!other.rest || !!d.boss !== !!other.boss) report.error(w, `rest/boss flags differ between ${l1} and ${l2}`);
      if ((d.badges ?? []).join() !== (other.badges ?? []).join()) report.error(w, `badges differ between ${l1} and ${l2}`);
    }
    for (const d of days.filter((x) => x.lang === l2)) {
      if (map.has(key(l1, d.track, d.day))) continue;
      const conflict = DAY_TRACKS.some((t) => t !== d.track && (t === "common") !== (d.track === "common") && map.has(key(l1, t, d.day)));
      if (!conflict) incomplete(`day-${pad(d.day)} (${d.track})`, `exists in ${l2} but not in ${l1}`);
    }
  }
  for (const lang of langs) {
    if (!missing[lang].length) continue;
    const msg = `${missing[lang].length} of ${TOTAL_DAYS} days have no content yet: ${compactRanges(missing[lang])}`;
    if (strict) report.error(lang, msg);
    else report.warn(lang, msg);
  }
  return missing;
}

export function compactRanges(nums) {
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(i === j ? `${nums[i]}` : `${nums[i]}–${nums[j]}`);
    i = j;
  }
  return out.join(", ");
}

function readJson(file, report) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    report.error(rel(file), `invalid JSON: ${e.message}`);
    return null;
  }
}
const rel = (f) => path.relative(ROOT, f) || f;

/** Pick the content directory. */
export function resolveSource(root, forced) {
  const cur = path.join(root, "content/curriculum");
  const fix = path.join(root, "content/fixtures");
  if (forced === "fixtures") return { source: "fixtures", dir: fix };
  if (forced === "curriculum") return { source: "curriculum", dir: cur };
  const has = LANGS.some((l) => fs.existsSync(path.join(cur, l, "program.json")));
  return has ? { source: "curriculum", dir: cur } : { source: "fixtures", dir: fix };
}

/** Build everything from a content dir. Pure apart from reading files. */
export function buildContent({ root = ROOT, dir, source, strict = false }) {
  const report = new Report();
  const badgesFile = path.join(root, "content/badges.json");
  let badges = [];
  if (fs.existsSync(badgesFile)) badges = parseBadges(readJson(badgesFile, report), rel(badgesFile), report) ?? [];
  else report.warn("content/badges.json", "not found — badge ids in day files are not checked");
  const badgeIds = fs.existsSync(badgesFile) ? new Set(badges.map((b) => b.id)) : null;

  const programs = {};
  const days = [];
  for (const lang of LANGS) {
    const pf = path.join(dir, lang, "program.json");
    if (!fs.existsSync(pf)) { report.error(rel(pf), "missing"); continue; }
    const program = parseProgram(readJson(pf, report), lang, rel(pf), report);
    if (program) programs[lang] = program;
    for (const track of DAY_TRACKS) {
      const td = path.join(dir, lang, track);
      if (!fs.existsSync(td)) continue;
      for (const name of fs.readdirSync(td).sort()) {
        const file = path.join(td, name);
        if (!name.endsWith(".md")) {
          if (!name.startsWith(".")) report.warn(rel(file), "ignored (not a .md file)");
          continue;
        }
        const m = /^day-(\d{2})\.md$/.exec(name);
        if (!m) { report.error(rel(file), 'file name must be "day-NN.md" (two digits)'); continue; }
        const n = Number(m[1]);
        if (n < 1 || n > TOTAL_DAYS) { report.error(rel(file), `day must be 1..${TOTAL_DAYS}`); continue; }
        const day = parseDay(fs.readFileSync(file, "utf8"), { lang, track, dayFromName: n, file: rel(file), program, badgeIds }, report);
        if (day) days.push(day);
      }
    }
    for (const extra of fs.readdirSync(path.join(dir, lang))) {
      if (extra !== "program.json" && !DAY_TRACKS.includes(extra) && !extra.startsWith("."))
        report.warn(rel(path.join(dir, lang, extra)), `unexpected entry (expected program.json, ${DAY_TRACKS.join("/, ")}/)`);
    }
  }
  const missing = crossValidate(days, report, { strict });
  days.sort((a, b) => a.lang.localeCompare(b.lang) || a.day - b.day || a.track.localeCompare(b.track));
  const out = {
    version: 1,
    source,
    totalDays: TOTAL_DAYS,
    programs,
    days,
    badges,
    missingDays: missing,
  };
  return { out, report };
}

function main(argv) {
  const args = new Set(argv);
  const strict = args.has("--strict") || process.env.CONTENT_STRICT === "1";
  const quiet = args.has("--quiet");
  const si = argv.indexOf("--source");
  const forced = si >= 0 ? argv[si + 1] : undefined;
  const { source, dir } = resolveSource(ROOT, forced);
  const { out, report } = buildContent({ dir, source, strict });

  const tag = "[content]";
  if (!quiet || report.errors.length) {
    console.log(`${tag} source: ${rel(dir)} (${source})${strict ? " — strict" : ""}`);
    for (const w of report.warnings) console.warn(`${tag} warn  ${w}`);
  }
  if (report.errors.length) {
    for (const e of report.errors) console.error(`${tag} ERROR ${e}`);
    console.error(`${tag} ${report.errors.length} error(s). shared/curriculum.generated.json was NOT written.`);
    process.exit(1);
  }
  const counts = LANGS.map((l) => `${l}: ${out.days.filter((d) => d.lang === l).length} day files`).join(", ");
  if (!args.has("--check")) {
    const target = path.join(ROOT, "shared/curriculum.generated.json");
    const json = JSON.stringify(out, null, 1) + "\n";
    // Only touch the file when content changed, so `vite dev` doesn't reload needlessly.
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== json) fs.writeFileSync(target, json);
    console.log(`${tag} ok — ${counts}, ${out.badges.length} badges → ${rel(target)}`);
  } else {
    console.log(`${tag} ok — ${counts} (check only)`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2));
