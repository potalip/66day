// @ts-nocheck — node-only config (repo has no @types/node)
// OWNER: game agent. The root vite.config.ts loads the Cloudflare plugin, which vitest can't host,
// so game tests run with this plain config:  npx vitest run --config worker/lib/game/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
export default defineConfig({
  root,
  resolve: { alias: { "@web": path.join(root, "web/src"), "@shared": path.join(root, "shared"), "@content": path.join(root, "content") } },
  test: { include: ["worker/lib/game/**/*.test.ts", "web/src/features/game/**/*.test.ts"], environment: "node" },
});
