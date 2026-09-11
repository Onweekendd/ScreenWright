import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/shared/index.ts"),
      formats: ["es"],
      fileName: "index"
    },
    outDir: "dist/shared",
    emptyOutDir: true,
    rollupOptions: {
      external: []
    }
  }
});
