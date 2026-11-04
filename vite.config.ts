import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const dir = import.meta.dirname;

export default defineConfig({
  publicDir: "web/public",
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@web": `${dir}/web/src`,
      "@shared": `${dir}/shared`,
      "@content": `${dir}/content`,
    },
  },
});
