import { Hono } from "hono";
import type { AppEnv } from "../env";

// OWNER: see docs/OWNERSHIP.md — only the owning agent edits this file.
export const studio = new Hono<AppEnv>();

studio.get("/health", (c) => c.json({ ok: true, area: "studio" }));
