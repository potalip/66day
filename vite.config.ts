import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@web": path.resolve(__dirname, "web/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@content": path.resolve(__dirname, "content"),
    },
  },
});
