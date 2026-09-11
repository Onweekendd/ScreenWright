import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      outDir: "dist"
    })
  ],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        schemas: "./src/schemas/index.ts",
        templates: "./src/templates/index.ts"
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: ["zod"],
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
