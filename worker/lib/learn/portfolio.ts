/**
 * OWNER: learn. Public portfolio: what a student shipped during the 66 days.
 *
 * Items = the latest proof per task (learn_submissions) that has a link, a file or text.
 * Visibility default: public for boss days and ship tasks with a link/file proof; private for everything else
 * (reflections, quizzes, notes). Students can flip it and edit the title/description (learn_portfolio_items).
 * Strangers only ever see public items; files are served only while their item is public.
 */
import type { Env } from "../../env";
import type { CurriculumTask, DayTrack, Lang, Track } from "../../../shared/types";
import { getProfile } from "../game/queries";
import { TOTAL, content } from "./content";
import { localDate } from "./schedule";

export type PortfolioKind = "boss" | "ship" | "other";
export type Visibility = "public" | "private";

export interface PortfolioItem {
  taskId: string;
  submissionId: string;
  day: number;
  track: DayTrack;
  kind: PortfolioKind;
  title: string;
  description: string | null;
  /** Curriculum title of the task / day, for context ("Day 13 · Boss: …"). */
  taskTitle: string;
  dayTitle: string;
  url: string | null;
  file: { href: string; name: string; type: string; size: number; isImage: boolean } | null;
  text: string | null;
  visibility: Visibility;
  createdAt: number;
}

export interface PortfolioResponse {
  user: { id: string; name: string | null; track: Track | null; joinedAt: number | null };
  isMe: boolean;
  stats: { completedDays: number; totalDays: number; percent: number; bossDone: number; bossTotal: number; publicItems: number; lastActive: string | null };
  game: { level: number; rank: string; xp: number; streak: { current: number; best: number }; badges: { id: string; awardedAt: number }[] } | null;
  items: PortfolioItem[];
}

interface TaskMeta { task: CurriculumTask; day: number; track: DayTrack; boss: boolean; dayTitle: string }
const taskIndex = new Map<string, TaskMeta>();
for (const d of content.days) {
  for (const t of d.tasks) taskIndex.set(`${d.lang}/${t.id}`, { task: t, day: d.day, track: d.track, boss: !!d.boss, dayTitle: d.title });
}
const metaOf = (lang: Lang, taskId: string) => taskIndex.get(`${lang}/${taskId}`) ?? taskIndex.get(`${lang === "ru" ? "en" : "ru"}/${taskId}`) ?? null;

const BOSS_DAYS = new Set(content.days.filter((d) => d.boss).map((d) => d.day));
export const bossTotal = BOSS_DAYS.size;

export function kindOf(m: Pick<TaskMeta, "boss" | "task">): PortfolioKind {
  if (m.boss) return "boss";
  if (m.task.type === "ship") return "ship";
  return "other";
}

/** Default visibility before the student chooses. */
export function defaultVisibility(kind: PortfolioKind, proof: CurriculumTask["proof"]): Visibility {
  return (kind === "boss" || kind === "ship") && (proof === "link" || proof === "file") ? "public" : "private";
}

const IMAGE = /^image\/(png|jpeg|gif|webp|avif)$/;

export interface Row {
  id: string; task_id: string; day: number; proof_type: CurriculumTask["proof"]; text_value: string | null; url_value: string | null;
  file_key: string | null; file_name: string | null; file_type: string | null; file_size: number | null; created_at: number;
  visibility: Visibility | null; title: string | null; description: string | null; sort: number | null;
}

/** Latest proof per task + overrides. */
async function loadRows(env: Env, userId: string): Promise<Row[]> {
  const res = await env.DB.prepare(
    `SELECT s.id, s.task_id, s.day, s.proof_type, s.text_value, s.url_value, s.file_key, s.file_name, s.file_type, s.file_size, s.created_at,
            p.visibility, p.title, p.description, p.sort
     FROM learn_submissions s
     LEFT JOIN learn_portfolio_items p ON p.user_id = s.user_id AND p.task_id = s.task_id
     WHERE s.user_id = ?1 AND s.proof_type != 'none'
       AND s.rowid = (SELECT x.rowid FROM learn_submissions x WHERE x.user_id = ?1 AND x.task_id = s.task_id ORDER BY x.created_at DESC, x.rowid DESC LIMIT 1)
     ORDER BY s.day ASC, s.task_id ASC`,
  ).bind(userId).all<Row>();
  return res.results;
}

export function toItem(r: Row, lang: Lang, userId: string): PortfolioItem | null {
  const m = metaOf(lang, r.task_id);
  if (!m) return null; // task no longer in the curriculum
  const kind = kindOf(m);
  const visibility = r.visibility ?? defaultVisibility(kind, r.proof_type);
  const isFile = !!r.file_key;
  return {
    taskId: r.task_id,
    submissionId: r.id,
    day: m.day,
    track: m.track,
    kind,
    title: r.title?.trim() || m.task.title,
    description: r.description?.trim() || null,
    taskTitle: m.task.title,
    dayTitle: m.dayTitle,
    url: r.url_value,
    file: isFile
      ? { href: `/api/progress/portfolio/${userId}/files/${r.id}`, name: r.file_name ?? "file", type: r.file_type ?? "application/octet-stream", size: r.file_size ?? 0, isImage: IMAGE.test(r.file_type ?? "") }
      : null,
    text: r.text_value,
    visibility,
    createdAt: r.created_at,
  };
}

const kindRank: Record<PortfolioKind, number> = { boss: 0, ship: 1, other: 2 };

export async function getPortfolio(env: Env, userId: string, viewerId: string, lang: Lang): Promise<PortfolioResponse | null> {
  const user = await env.DB.prepare("SELECT id, display_name, track, started_at, created_at, timezone FROM users WHERE id = ?")
    .bind(userId).first<{ id: string; display_name: string | null; track: Track | null; started_at: number | null; created_at: number; timezone: string | null }>();
  if (!user) return null;
  const isMe = userId === viewerId;
  const [rows, days] = await Promise.all([
    loadRows(env, userId),
    env.DB.prepare("SELECT day, completed_at FROM learn_day_progress WHERE user_id = ? ORDER BY completed_at DESC").bind(userId).all<{ day: number; completed_at: number }>(),
  ]);
  const all = rows.map((r) => toItem(r, lang, userId)).filter((x): x is PortfolioItem => !!x);
  const items = (isMe ? all : all.filter((i) => i.visibility === "public"))
    .sort((a, b) => (a.visibility === b.visibility ? 0 : a.visibility === "public" ? -1 : 1) || kindRank[a.kind] - kindRank[b.kind] || b.day - a.day);
  const doneDays = new Set(days.results.map((d) => d.day));
  const bossDone = [...BOSS_DAYS].filter((d) => doneDays.has(d)).length;

  let game: PortfolioResponse["game"] = null;
  try {
    const p = await getProfile(env.DB, userId, viewerId);
    if (p) game = { level: p.level, rank: p.rank, xp: p.xp, streak: { current: p.streak.current, best: p.streak.best }, badges: p.badges };
  } catch (e) {
    console.error("portfolio: game profile failed", e);
  }
  const last = days.results[0]?.completed_at;
  return {
    user: { id: user.id, name: user.display_name, track: user.track, joinedAt: user.started_at ?? user.created_at },
    isMe,
    stats: {
      completedDays: doneDays.size, totalDays: TOTAL, percent: Math.round((doneDays.size / TOTAL) * 100),
      bossDone, bossTotal, publicItems: all.filter((i) => i.visibility === "public").length,
      lastActive: last ? localDate(last, user.timezone || "UTC") : null,
    },
    game,
    items,
  };
}

export interface ItemPatch { visibility?: Visibility; title?: string | null; description?: string | null }

/** Owner edit. Only tasks the student actually submitted proof for can be edited. */
export async function updateItem(env: Env, userId: string, taskId: string, patch: ItemPatch): Promise<boolean> {
  const has = await env.DB.prepare("SELECT 1 FROM learn_submissions WHERE user_id = ? AND task_id = ? AND proof_type != 'none' LIMIT 1").bind(userId, taskId).first();
  if (!has) return false;
  const clean = (v: string | null | undefined, max: number) => (v === undefined ? undefined : v === null ? null : v.trim().replace(/\s+\n/g, "\n").slice(0, max) || null);
  const title = clean(patch.title, 120);
  const description = clean(patch.description, 600);
  await env.DB.prepare(
    `INSERT INTO learn_portfolio_items (user_id, task_id, visibility, title, description) VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT (user_id, task_id) DO UPDATE SET
       visibility = COALESCE(?3, visibility),
       title = CASE WHEN ?6 THEN ?4 ELSE title END,
       description = CASE WHEN ?7 THEN ?5 ELSE description END,
       updated_at = unixepoch()`,
  ).bind(userId, taskId, patch.visibility ?? null, title ?? null, description ?? null, title !== undefined ? 1 : 0, description !== undefined ? 1 : 0).run();
  return true;
}

/** A file is publicly readable only while its item is public (owner can always read it). */
export async function getPublicFile(env: Env, userId: string, submissionId: string, viewerId: string) {
  const row = await env.DB.prepare(
    `SELECT s.task_id, s.proof_type, s.file_key, s.file_name, s.file_type, p.visibility
     FROM learn_submissions s LEFT JOIN learn_portfolio_items p ON p.user_id = s.user_id AND p.task_id = s.task_id
     WHERE s.id = ? AND s.user_id = ?`,
  ).bind(submissionId, userId).first<{ task_id: string; proof_type: CurriculumTask["proof"]; file_key: string | null; file_name: string | null; file_type: string | null; visibility: Visibility | null }>();
  if (!row?.file_key) return null;
  if (userId !== viewerId) {
    const m = metaOf("en", row.task_id);
    const vis = row.visibility ?? (m ? defaultVisibility(kindOf(m), row.proof_type) : "private");
    if (vis !== "public") return null;
    // Only the latest proof of a task is part of the portfolio.
    const latest = await env.DB.prepare("SELECT id FROM learn_submissions WHERE user_id = ? AND task_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1").bind(userId, row.task_id).first<{ id: string }>();
    if (latest?.id !== submissionId) return null;
  }
  const obj = await env.MEDIA.get(row.file_key);
  return obj ? { obj, name: row.file_name ?? "file", type: row.file_type ?? "application/octet-stream" } : null;
}

/** For server-side meta tags (OG) — see docs/requests/learn-to-orchestrator.md. */
export async function portfolioMeta(env: Env, userId: string, lang: Lang): Promise<{ title: string; description: string } | null> {
  const p = await getPortfolio(env, userId, "", lang);
  if (!p) return null;
  const name = p.user.name || (lang === "ru" ? "Студент FlowLeaf" : "FlowLeaf student");
  return lang === "ru"
    ? { title: `${name} — портфолио FlowLeaf 66`, description: `${p.stats.completedDays} из 66 дней, ${p.stats.publicItems} проектов: приложения и видео, сделанные с ИИ-агентами.` }
    : { title: `${name} — FlowLeaf 66 portfolio`, description: `${p.stats.completedDays} of 66 days, ${p.stats.publicItems} projects built with AI coding agents.` };
}
