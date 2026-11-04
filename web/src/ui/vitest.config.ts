// Minimal Vitest config for design-owned tests (the root vite.config's cloudflare() plugin can't run under Vitest).
// Run: npx vitest run --config web/src/ui/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../../..");
export default defineConfig({
  root,
  resolve: { alias: { "@web": path.join(root, "web/src"), "@shared": path.join(root, "shared") } },
  test: { include: ["web/src/ui/**/*.test.ts", "web/src/features/landing/**/*.test.ts"], environment: "node" },
});
