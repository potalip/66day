import { Hono } from "hono";
import type { AppEnv } from "../env";

// OWNER: see docs/OWNERSHIP.md — only the owning agent edits this file.
export const progress = new Hono<AppEnv>();

progress.get("/health", (c) => c.json({ ok: true, area: "progress" }));
