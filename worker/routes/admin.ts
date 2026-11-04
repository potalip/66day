import { Hono } from "hono";
import type { AppEnv } from "../env";

// OWNER: see docs/OWNERSHIP.md — only the owning agent edits this file.
export const admin = new Hono<AppEnv>();

admin.get("/health", (c) => c.json({ ok: true, area: "admin" }));
