import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    // Figma 插件沙箱不支持 ?. ?? 等现代语法，必须降到 es2017 以下让 Vite 转译
    target: "es6",
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/code.ts"),
      formats: ["iife"],
      name: "code",
      fileName: () => "code.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
