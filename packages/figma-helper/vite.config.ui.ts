import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

const API_BASE =
  process.env.BUILD_TARGET === "dev"
    ? "http://localhost:4111/customApi"
    : "https://localhost/ai/customApi";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __API_BASE__: JSON.stringify(API_BASE)
  },
  plugins: [vue(), viteSingleFile()],
  root: resolve(__dirname),
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        entryFileNames: "ui.js"
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
});
