import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

const RapierWorkerDist='node_modules/@ucl-nuee/rapier-worker/dist-worker/';
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: RapierWorkerDist+'rapier-worker.mjs',
          dest: '.',
        },
        {
          src: RapierWorkerDist+'rapierObjectUtils.js',
          dest: '.',
        },
        {
          src: 'public/physicalObj.config.js',
          dest: '.',
        },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
