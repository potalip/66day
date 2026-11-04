import type { Env } from "../../env";
import { type LessonMaterial, type LibLang, type Level, type LibTrack, type SourceType, safeJson } from "./schema";
import { type ResourceRow, toResource } from "./repo";

/** What a student sees on a library card. */
export interface ResourceCard {
  id: string; sourceType: SourceType; url: string | null; externalId: string | null;
  title: string; originalTitle: string; hook: string | null; author: string | null; durationSec: number | null;
  thumbnailUrl: string | null; tracks: LibTrack[]; topics: string[]; level: Level; origLang: string;
  estMinutes: number | null; hasLesson: boolean; featured: boolean; publishedAt: number | null; tags: string[];
  suggestedDays: { day: number; track: LibTrack }[];
}

export interface CatalogFilters { q?: string; track?: string; topic?: string; level?: string; type?: string }

type Row = ResourceRow & { m_data: string | null };

/** All published resources visible to `lang`, with that language's lesson (if ready). Small library → filter in JS. */
export async function loadPublished(env: Env, lang: LibLang): Promise<{ card: ResourceCard; material: LessonMaterial | null; search: string }[]> {
  const { results } = await env.DB.prepare(
    `SELECT r.*, m.data AS m_data FROM lib_resources r
     LEFT JOIN lib_materials m ON m.resource_id = r.id AND m.lang = ?1 AND m.state = 'ready'
     WHERE r.status = 'published' AND EXISTS (SELECT 1 FROM json_each(r.audience) WHERE value = ?1)
     ORDER BY r.featured DESC, r.sort_weight DESC, r.published_at DESC`,
  ).bind(lang).all<Row>();
  return results.map((row) => {
    const r = toResource(row);
    const m = safeJson<LessonMaterial | null>(row.m_data, null);
    const card: ResourceCard = {
      id: r.id, sourceType: r.sourceType, url: r.url, externalId: r.externalId,
      title: m?.title || r.title, originalTitle: r.title, hook: m?.hook ?? null, author: r.author, durationSec: r.durationSec,
      thumbnailUrl: r.thumbnailUrl, tracks: r.tracks.length ? r.tracks : (m?.tracks ?? []), topics: r.topics.length ? r.topics : (m?.topics ?? []),
      level: r.level, origLang: r.origLang, estMinutes: m?.estMinutes ?? (r.durationSec ? Math.ceil(r.durationSec / 60) : null),
      hasLesson: !!m, featured: r.featured, publishedAt: r.publishedAt, tags: m?.tags ?? [],
      suggestedDays: (r.suggestedDays.length ? r.suggestedDays : (m?.suggestedDays ?? [])).map(({ day, track }) => ({ day, track })),
    };
    const search = norm([card.title, r.title, r.author, m?.hook, m?.summary, ...(m?.tags ?? []), ...card.topics].filter(Boolean).join(" "));
    return { card, material: m, search };
  });
}

export function norm(s: string) {
  return s.toLowerCase().replace(/ё/g, "е").normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function applyFilters<T extends { card: ResourceCard; search: string }>(items: T[], f: CatalogFilters): T[] {
  const terms = f.q ? norm(f.q).split(/\s+/).filter(Boolean) : [];
  return items.filter(({ card, search }) =>
    (!f.track || card.tracks.includes(f.track as LibTrack)) &&
    (!f.topic || card.topics.includes(f.topic)) &&
    (!f.level || card.level === f.level) &&
    (!f.type || card.sourceType === f.type) &&
    terms.every((t) => search.includes(t)),
  );
}

export function facets(items: { card: ResourceCard }[]) {
  const count = (pick: (c: ResourceCard) => string[]) => {
    const m: Record<string, number> = {};
    for (const { card } of items) for (const k of pick(card)) m[k] = (m[k] ?? 0) + 1;
    return m;
  };
  return {
    track: count((c) => c.tracks),
    topic: count((c) => c.topics),
    level: count((c) => [c.level]),
    type: count((c) => [c.sourceType]),
  };
}

/** Related = shared topics/tracks, scored. */
export function related(all: { card: ResourceCard }[], self: ResourceCard, n = 4): ResourceCard[] {
  return all
    .filter(({ card }) => card.id !== self.id)
    .map(({ card }) => ({
      card,
      score: card.topics.filter((t) => self.topics.includes(t)).length * 3 + card.tracks.filter((t) => self.tracks.includes(t)).length
        + (card.level === self.level ? 1 : 0),
    }))
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.card);
}

/** Resources for a curriculum day: suggestedDays match on day + (common or same track). */
export function forDay(all: { card: ResourceCard }[], day: number, track?: string): ResourceCard[] {
  return all
    .map(({ card }) => card)
    .filter((c) => c.suggestedDays.some((d) => d.day === day && (!track || d.track === "common" || d.track === track)));
}
