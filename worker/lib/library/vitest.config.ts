import { defineConfig } from "vitest/config";

// Library tests run in plain Node (no Cloudflare plugin): `npx vitest run --config worker/lib/library/vitest.config.ts`
// (The root vite.config.ts starts the Workers dev server, which conflicts with vitest.)
export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  test: { include: ["**/*.test.ts"], environment: "node" },
});
