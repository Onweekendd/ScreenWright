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
      // core 不打包类型包，由消费方解析；core 本身零 UI 框架依赖
      external: ["@screenwright/types"],
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
