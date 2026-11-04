// Type-only re-exports of the worker contracts so web code stays in sync with the API.
export type { ResourceCard } from "../../../../worker/lib/library/catalog";
export type { LessonMaterial, QuizItem, LibTrack, Level, SourceType, LibLang } from "../../../../worker/lib/library/schema";
export type { Resource, MaterialRecord, PipelineEvent } from "../../../../worker/lib/library/repo";
import type { ResourceCard } from "../../../../worker/lib/library/catalog";
import type { LessonMaterial, LibLang } from "../../../../worker/lib/library/schema";

export interface LibraryList { items: ResourceCard[]; total: number; facets: Record<"track" | "topic" | "level" | "type", Record<string, number>> }
export interface Collection { id: string; title: string; description: string | null; items: ResourceCard[] }
export interface ResourceDetail {
  resource: {
    id: string; sourceType: ResourceCard["sourceType"]; url: string | null; externalId: string | null; title: string;
    author: string | null; authorUrl: string | null; durationSec: number | null; thumbnailUrl: string | null;
    tracks: ResourceCard["tracks"]; topics: string[]; level: ResourceCard["level"]; origLang: string;
    suggestedDays: { day: number; track: string }[]; publishedAt: number | null; embedUrl: string | null;
  };
  lang: LibLang;
  material: LessonMaterial | null;
  otherLangAvailable: boolean;
  saved: { forDate: string | null; doneAt: number | null; isToday: boolean } | null;
  related: ResourceCard[];
}
