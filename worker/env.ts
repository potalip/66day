export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  JOBS: Queue<JobMessage>;
  ASSETS: Fetcher;
  APP_ENV: string;
  CLAUDE_MODEL: string;
  CLAUDE_MODEL_SMART: string;
  RENDER_SERVER_URL: string;
  ANTHROPIC_API_KEY?: string;
  ADMIN_TOKEN?: string;
  RENDER_SERVER_TOKEN?: string;
  MEDIA_WORKER_URL?: string;   // external transcription service (worker/lib/library/MEDIA-WORKER.md)
  MEDIA_WORKER_TOKEN?: string;
  PUBLIC_BASE_URL?: string;    // public origin, used for callback URLs
  STUDIO_MAX_ACTIVE?: string;  // concurrent renders per user (default 2)
  STUDIO_MAX_DAILY?: string;   // renders per user per 24h (default 40)
}

/** Every async job goes through one queue; `kind` routes it. Add kinds, never rename. */
export type JobMessage =
  | { kind: "resource.ingest"; resourceId: string }
  | { kind: "resource.build_lesson"; resourceId: string; lang: "ru" | "en" }
  | { kind: "studio.plan"; projectId: string }
  | { kind: "studio.render"; projectId: string };

export type AppEnv = { Bindings: Env; Variables: { userId: string } };
