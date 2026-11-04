import { defineConfig } from "vitest/config";

// Root test entry: runs every area's own vitest config as a project (keeps the Cloudflare Vite plugin out of tests).
export default defineConfig({
  test: {
    projects: ["web/src/ui/vitest.config.ts", "worker/lib/*/vitest.config.{ts,mjs}", "web/src/features/*/vitest.config.{ts,mjs}"],
  },
});
