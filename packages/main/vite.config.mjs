import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@worker": path.resolve("../rapier-worker/src"),
    },
  },
  server: {
    fs: {
      allow: [".."], // 上位フォルダから Worker を参照可能に
    },
  },
});
