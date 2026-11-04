// Studio tests run without the Cloudflare vite plugin (which can't start inside vitest).
// Run: npx vitest run --config worker/lib/studio/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: new URL("../../..", import.meta.url).pathname,
  test: { include: ["worker/lib/studio/**/*.test.ts", "web/src/features/studio/**/*.test.ts"], environment: "node" },
});
