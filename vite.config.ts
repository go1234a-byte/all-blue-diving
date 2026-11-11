import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// @ts-expect-error — JS 모듈
import { crawlPlugin } from "./scripts/vite-crawl-plugin.mjs";

export default defineConfig({
  server: { host: "::", port: 8080 },
  plugins: [react(), crawlPlugin()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  base: "/",
  build: { outDir: "dist" },
});
