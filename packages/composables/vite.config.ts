import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["src/**/__tests__/**", "src/**/*.test.ts"],
      outDir: "dist"
    })
  ],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts"
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        "vue",
        "vue-router",
        "@screenwright/core",
        "@screenwright/types",
        "axios",
        /^element-plus($|\/)/,
        /^@screenwright\/ui($|\/)/
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
    sourcemap: true
  }
});
