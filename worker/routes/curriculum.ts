import { Hono } from "hono";
import type { AppEnv } from "../env";
import type { ProgramResponse } from "../lib/learn/api-types";
import { TOTAL, allSummaries, content, getDay, getProgram, isLang, isTrack } from "../lib/learn/content";

// OWNER: learn. Read-only curriculum API (content compiled from /content by scripts/build-content.mjs).
export const curriculum = new Hono<AppEnv>();

curriculum.get("/health", (c) => c.json({ ok: true, area: "curriculum", source: content.source, days: content.days.length }));

async function resolve(c: { req: { query: (k: string) => string | undefined }; env: AppEnv["Bindings"]; get: (k: "userId") => string }) {
  const qLang = c.req.query("lang");
  const qTrack = c.req.query("track");
  let lang = isLang(qLang) ? qLang : undefined;
  let track = isTrack(qTrack) ? qTrack : undefined;
  if (!lang || !track) {
    const u = await c.env.DB.prepare("SELECT lang, track FROM users WHERE id = ?").bind(c.get("userId")).first<{ lang: string; track: string | null }>();
    lang ??= isLang(u?.lang) ? u.lang : "en";
    track ??= isTrack(u?.track) ? u.track : "apps";
  }
  return { lang, track };
}

/** GET /api/curriculum/program?lang=ru&track=video — program + 66 day summaries. */
curriculum.get("/program", async (c) => {
  const { lang, track } = await resolve(c);
  const body: ProgramResponse = { lang, track, source: content.source, totalDays: TOTAL, program: getProgram(lang), days: allSummaries(lang, track) };
  return c.json(body);
});

/** GET /api/curriculum/day/:day?lang&track — full day content (no progress). */
curriculum.get("/day/:day{[0-9]+}", async (c) => {
  const n = Number(c.req.param("day"));
  const { lang, track } = await resolve(c);
  const d = n >= 1 && n <= TOTAL ? getDay(lang, track, n) : null;
  if (!d) return c.json({ error: "day_not_found" }, 404);
  return c.json(d);
});

/** GET /api/curriculum/badges — badge definitions from content/badges.json (empty until curriculum ships it). */
curriculum.get("/badges", (c) => c.json(content.badges));
