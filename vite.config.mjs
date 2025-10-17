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
        { src: 'node_modules/@ucl-nuee/ik-cd-worker/public/wasm',
          dest: '.', },
        { src: 'node_modules/@ucl-nuee/ik-cd-worker/public/ik_cd_worker.js',
          dest: '.', },
        { src: 'node_modules/@ucl-nuee/jaka-zu5/public/jaka_zu_5',
          dest: '.', },
        { src: 'node_modules/@ucl-nuee/nova2/public/nova2_robot',
          dest: '.', },
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
