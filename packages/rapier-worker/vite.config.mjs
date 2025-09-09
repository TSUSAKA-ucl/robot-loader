import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import fs from "fs";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: "src/rapier-worker.js",
      name: "RapierWorker",
      fileName: "rapier-worker",
      formats: ["es"],
    },
    outDir: "dist-worker",
    rollupOptions: {
      external: [],
    },
  },
  plugins: [wasm(),
	    {
              name: "copy-rapier-worker-to-main-public",
	      closeBundle() {
		const distDir = path.resolve(__dirname, "dist-worker");
		const publicDir = path.resolve(__dirname, "../main/public");
		// ディレクトリ内のファイルをすべてコピー
		// compatを使用している場合wasmはjs内に埋め込まれてるためコピー不要
		fs.readdirSync(distDir).forEach((file) => {
		  fs.copyFileSync(path.join(distDir, file), path.join(publicDir, file));
		});
	      },
	    },
	   ],
  
});
