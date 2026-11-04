#!/usr/bin/env node
// Validates content/curriculum/** against docs/curriculum/OUTLINE.md (the skeleton contract)
// and docs/CONTENT-FORMAT.md rules. Zero dependencies: includes a small YAML-subset parser
// that covers the frontmatter shape we use (scalars, inline arrays, block lists, list of maps).
// Usage: node docs/curriculum/tools/validate.mjs [--quiet]
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const quiet = process.argv.includes("--quiet");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

// ---------- YAML subset ----------
function scalar(raw) {
  const s = raw.trim();
  if (s === "") return null;
  if (s.startsWith('"')) {
    if (!s.endsWith('"') || s.length < 2) throw new Error(`unterminated string: ${s}`);
    return JSON.parse(s);
  }
  if (s.startsWith("'")) {
    if (!s.endsWith("'")) throw new Error(`unterminated string: ${s}`);
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith("[")) {
    if (!s.endsWith("]")) throw new Error(`bad inline array: ${s}`);
    const inner = s.slice(1, -1).trim();
    return inner ? inner.split(",").map((x) => scalar(x)) : [];
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (/^[:#&*!|>%@`]/.test(s) || /:\s/.test(s) || /\s#/.test(s)) throw new Error(`unquoted special string: ${s}`);
  return s;
}
function stripComment(line) {
  // remove " # comment" outside quotes
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === "\\" && q === '"') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i).replace(/\s+$/, "");
  }
  return line.replace(/\s+$/, "");
}
export function parseFrontmatter(text) {
  const lines = text.split("\n").map(stripComment);
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const m = /^([A-Za-z][\w]*):(.*)$/.exec(line);
    if (!m) throw new Error(`unexpected line: ${line}`);
    const key = m[1];
    const rest = m[2];
    if (rest.trim() !== "") { out[key] = scalar(rest); i++; continue; }
    // block value
    const items = [];
    i++;
    while (i < lines.length && (lines[i].startsWith(" ") || !lines[i].trim())) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      const im = /^(\s+)-\s+(.*)$/.exec(l);
      if (!im) throw new Error(`bad list item under ${key}: ${l}`);
      const indent = im[1].length;
      const body = im[2];
      const kv = /^([A-Za-z][\w]*):(.*)$/.exec(body);
      if (!kv) { items.push(scalar(body)); i++; continue; }
      const obj = { [kv[1]]: scalar(kv[2]) };
      i++;
      while (i < lines.length && lines[i].trim() && !/^\s+-\s/.test(lines[i]) && lines[i].startsWith(" ".repeat(indent + 2))) {
        const kv2 = /^\s+([A-Za-z][\w]*):(.*)$/.exec(lines[i]);
        if (!kv2) throw new Error(`bad map line under ${key}: ${lines[i]}`);
        obj[kv2[1]] = scalar(kv2[2]);
        i++;
      }
      items.push(obj);
    }
    out[key] = items;
  }
  return out;
}

// ---------- outline ----------
function parseOutline() {
  const md = readFileSync(join(root, "docs/curriculum/OUTLINE.md"), "utf8");
  const days = new Map(); // key `${day}/${track}`
  for (const line of md.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 8 || !/^\d+$/.test(cells[1])) continue;
    const [, day, track, , outcome, tasksCell, xp, flags] = cells;
    const tasks = [...tasksCell.matchAll(/(d\d\d-(?:apps-|video-)?t\d+) · (\w+) · (\d+) · (\w+)/g)].map((t) => ({
      id: t[1], type: t[2], xp: Number(t[3]), proof: t[4],
    }));
    const est = /(\d+) min/.exec(outcome);
    const badges = flags.includes("🏅") ? flags.split("🏅")[1].trim().split(/[\s,]+/).filter(Boolean) : [];
    const sum = tasks.reduce((a, t) => a + t.xp, 0);
    if (sum !== Number(xp)) err(`OUTLINE day ${day}/${track}: XP column ${xp} != task sum ${sum}`);
    days.set(`${Number(day)}/${track}`, {
      day: Number(day), track, tasks, estMinutes: est ? Number(est[1]) : null,
      rest: flags.includes("🛌"), boss: flags.includes("🐉"), badges,
    });
  }
  return days;
}

const phaseOf = (d) => (d <= 14 ? 1 : d <= 35 ? 2 : d <= 52 ? 3 : 4);
const TYPES = new Set(["watch", "read", "build", "ship", "reflect", "quiz", "share"]);
const PROOFS = new Set(["none", "link", "text", "file"]);

const outline = parseOutline();
const badgeIds = new Set();
const badgesPath = join(root, "content/badges.json");
if (existsSync(badgesPath)) {
  const badges = JSON.parse(readFileSync(badgesPath, "utf8"));
  for (const b of badges) {
    if (badgeIds.has(b.id)) err(`badges.json: duplicate id ${b.id}`);
    badgeIds.add(b.id);
    for (const f of ["title", "description"]) if (!b[f]?.ru || !b[f]?.en) err(`badges.json: ${b.id} missing ${f}.ru/en`);
    if (!b.icon || !b.rule) err(`badges.json: ${b.id} missing icon/rule`);
  }
  if (badges.length < 20 || badges.length > 30) warn(`badges.json has ${badges.length} badges (target 20–30)`);
} else warn("content/badges.json missing");

for (const [, o] of outline) for (const b of o.badges) if (badgeIds.size && !badgeIds.has(b)) err(`OUTLINE badge ${b} not in badges.json`);

const stats = { files: 0, words: {} };
const parsed = {};
for (const lang of ["ru", "en"]) {
  const base = join(root, "content/curriculum", lang);
  const prog = join(base, "program.json");
  if (!existsSync(prog)) err(`${lang}/program.json missing`);
  else {
    const p = JSON.parse(readFileSync(prog, "utf8"));
    if (p.lang !== lang) err(`${lang}/program.json lang mismatch`);
    if (!p.title || !p.tagline || !Array.isArray(p.phases)) err(`${lang}/program.json incomplete`);
    const covered = new Set();
    for (const ph of p.phases || []) for (let d = ph.days[0]; d <= ph.days[1]; d++) covered.add(d);
    for (let d = 1; d <= 66; d++) if (!covered.has(d)) err(`${lang}/program.json: day ${d} not in any phase`);
  }
  for (let d = 1; d <= 66; d++) {
    const nn = String(d).padStart(2, "0");
    const common = join(base, "common", `day-${nn}.md`);
    const apps = join(base, "apps", `day-${nn}.md`);
    const video = join(base, "video", `day-${nn}.md`);
    const hasC = existsSync(common), hasA = existsSync(apps), hasV = existsSync(video);
    if (hasC && (hasA || hasV)) err(`${lang} day ${d}: both common and track files exist`);
    if (!hasC && !(hasA && hasV)) { err(`${lang} day ${d}: missing (${hasA ? "" : "apps "}${hasV ? "" : "video "}${hasC ? "" : "common"})`); }
    const files = hasC ? [["common", common]] : [["apps", apps], ["video", video]].filter(([, p]) => existsSync(p));
    for (const [track, path] of files) {
      const rel = `${lang}/${track}/day-${nn}.md`;
      const o = outline.get(`${d}/${track}`);
      if (!o) { err(`${rel}: not in OUTLINE as ${track}`); continue; }
      const text = readFileSync(path, "utf8");
      const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
      if (!m) { err(`${rel}: no frontmatter`); continue; }
      let fm;
      try { fm = parseFrontmatter(m[1]); } catch (e) { err(`${rel}: YAML: ${e.message}`); continue; }
      stats.files++;
      const body = m[2];
      const words = body.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      const wordsAll = body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      stats.words[rel] = wordsAll;
      const min = o.rest ? 150 : 300;
      if (wordsAll < min) err(`${rel}: body too short (${wordsAll} words)`);
      if (words > 1100) warn(`${rel}: body long (${words} words excl. code)`);
      if (fm.day !== d) err(`${rel}: day ${fm.day} != ${d}`);
      if (fm.track !== track) err(`${rel}: track ${fm.track}`);
      if (fm.phase !== phaseOf(d)) err(`${rel}: phase ${fm.phase} != ${phaseOf(d)}`);
      if (typeof fm.title !== "string" || !fm.title) err(`${rel}: title missing`);
      if (typeof fm.summary !== "string" || !fm.summary) err(`${rel}: summary missing`);
      else if (fm.summary.length > 160) warn(`${rel}: summary ${fm.summary.length} chars`);
      if (fm.estMinutes !== o.estMinutes) err(`${rel}: estMinutes ${fm.estMinutes} != ${o.estMinutes}`);
      if (!!fm.rest !== o.rest) err(`${rel}: rest flag mismatch`);
      if (!!fm.boss !== o.boss) err(`${rel}: boss flag mismatch`);
      const fb = fm.badges || [];
      if (JSON.stringify([...fb].sort()) !== JSON.stringify([...o.badges].sort())) err(`${rel}: badges ${JSON.stringify(fb)} != ${JSON.stringify(o.badges)}`);
      if (!Array.isArray(fm.resources)) err(`${rel}: resources must be a list`);
      else for (const r of fm.resources) if (typeof r !== "string" || !(/^https?:\/\//.test(r) || /^lib:/.test(r))) err(`${rel}: bad resource ${r}`);
      if (!Array.isArray(fm.tasks)) { err(`${rel}: tasks missing`); continue; }
      if (fm.tasks.length !== o.tasks.length) err(`${rel}: ${fm.tasks.length} tasks != ${o.tasks.length}`);
      fm.tasks.forEach((t, k) => {
        const e = o.tasks[k];
        if (!TYPES.has(t.type)) err(`${rel}: task ${t.id} bad type ${t.type}`);
        if (!PROOFS.has(t.proof)) err(`${rel}: task ${t.id} bad proof ${t.proof}`);
        if (typeof t.title !== "string" || !t.title) err(`${rel}: task ${t.id} title missing`);
        if (!e) return;
        for (const f of ["id", "type", "xp", "proof"]) if (t[f] !== e[f]) err(`${rel}: task ${k + 1} ${f} ${t[f]} != ${e[f]}`);
      });
      if (!/- \[ \]/.test(body)) warn(`${rel}: no "done when" checklist`);
      if (lang === "ru" && /\b(the|and|you|your)\b/i.test(body.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""))) warn(`${rel}: English words in RU prose?`);
      parsed[rel] = fm;
    }
  }
}

// XP totals per track
for (const track of ["apps", "video"]) {
  let total = 0;
  for (let d = 1; d <= 66; d++) {
    const o = outline.get(`${d}/common`) || outline.get(`${d}/${track}`);
    if (!o) err(`OUTLINE: day ${d} missing for ${track}`);
    else total += o.tasks.reduce((a, t) => a + t.xp, 0);
  }
  if (!quiet) console.log(`XP total (${track} path): ${total}`);
}

if (!quiet) {
  console.log(`Validated ${stats.files} day files.`);
  for (const w of warns) console.log("WARN  " + w);
}
for (const e of errors) console.log("ERROR " + e);
console.log(errors.length ? `\n${errors.length} error(s)` : "\nOK — no errors");
process.exit(errors.length ? 1 : 0);
