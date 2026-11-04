import { Hono } from "hono";
import type { AppEnv } from "../env";

// OWNER: see docs/OWNERSHIP.md — only the owning agent edits this file.
export const curriculum = new Hono<AppEnv>();

curriculum.get("/health", (c) => c.json({ ok: true, area: "curriculum" }));
