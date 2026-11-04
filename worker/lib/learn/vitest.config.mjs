// OWNER: learn. Vitest config for learn tests without the Cloudflare Vite plugin (which can't run under vitest).
// Run: npx vitest run --config worker/lib/learn/vitest.config.mjs   (or `npm test` once a root vitest.config exists)
import { defineConfig } from "vitest/config";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
export default defineConfig({
  root,
  resolve: { alias: { "@web": path.join(root, "web/src"), "@shared": path.join(root, "shared") } },
  test: { include: ["web/src/features/{learn,onboarding}/**/*.test.{ts,tsx}", "worker/lib/learn/**/*.test.{ts,mjs}"] },
});
