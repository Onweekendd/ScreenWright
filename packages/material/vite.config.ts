import { resolve } from "path";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ["src/**/*.ts", "src/**/*.vue"],
      outDir: "dist"
    })
  ],
  resolve: {
    alias: {
      "@material": resolve(__dirname, "src"),
      "@editor": resolve(__dirname, "src/editor-ui")
    }
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        text: resolve(__dirname, "src/text.ts"),
        chart: resolve(__dirname, "src/chart.ts"),
        indicator: resolve(__dirname, "src/indicator.ts"),
        media: resolve(__dirname, "src/media.ts"),
        interactive: resolve(__dirname, "src/interactive.ts"),
        exhibit: resolve(__dirname, "src/exhibit.ts"),
        extends: resolve(__dirname, "src/extends.ts"),
        equipment: resolve(__dirname, "src/equipment.ts")
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        "axios",
        "vue",
        "@screenwright/core",
        "@screenwright/types",
        "@screenwright/composables",
        "echarts-liquidfill",
        "echarts-wordcloud",
        "echarts-gl",
        "flv.js",
        "@screenwright/ui",
        "hls.js",
        "page-flip",
        "vuedraggable",
        "vue-router",
        /^echarts($|\/)/,
        /^element-plus($|\/)/,
        /^@element-plus\/icons-vue($|\/)/,
        /^photoswipe($|\/)/,
        /^three($|\/)/
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]"
      }
    },
    target: "esnext",
    minify: false,
    sourcemap: true,
    emptyOutDir: true
  }
});
