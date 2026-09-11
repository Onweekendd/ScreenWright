import path from "node:path";

import Vue from "@vitejs/plugin-vue";
import type { ConfigEnv } from "vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  // 用于去重 external 日志
  const externalLogCache = new Set<string>();

  return {
    resolve: {
      alias: {
        "@": `${path.resolve(__dirname, "src")}/`,
        "vue-full": "vue" // 完整版 Vue (包含编译器)
      }
    },
    plugins: [
      Vue(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src/service-workers/minioCache",
        filename: "minio-cache-export.ts",
        injectRegister: "script-defer",
        injectManifest: {
          injectionPoint: undefined
        },
        manifest: {
          name: "Screenwright-export",
          scope: "/",
          short_name: "Screenwright",
          description: "Screenwright - Business Intelligence Platform",
          theme_color: "#232630",
          background_color: "#232630",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/favicon.ico",
              sizes: "64x64 32x32 24x24 16x16",
              type: "image/x-icon"
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: "module"
        }
      })
    ],
    esbuild: {
      drop: ["console", "debugger"],
      sourcemap: false
    },
    publicDir: false,
    build: {
      outDir: "public/lib",
      emptyOutDir: false,
      sourcemap: false,
      minify: "esbuild",
      // 禁止资源内联，防止 CSS 文件过大
      assetsInlineLimit: 0,
      lib: {
        entry: path.resolve(__dirname, "src/views/view/exportEntry/index.ts"),
        name: "screenwright",
        fileName: (format) => `screenwright.${format}.js`,
        formats: ["umd"] // lib 中已定义格式
      },
      rollupOptions: {
        // 定义外部依赖，不打包进 bundle
        external: (id, importer, isResolved) => {
          const cacheKey = `${id}::${importer || "(entry)"}`;
          const shouldLog = !externalLogCache.has(cacheKey);

          if (shouldLog) {
            externalLogCache.add(cacheKey);
          }

          // 1. 排除 npm 包
          if (
            id === "vue" ||
            id === "vue-router" ||
            // vue-full 是 vue 的别名，不应该单独 external
            id.startsWith("element-plus") ||
            id === "monaco-editor" ||
            id === "monaco-editor-core" ||
            id.startsWith("monaco-editor/") ||
            id.startsWith("monaco-editor-core/")
          ) {
            if (shouldLog) {
              console.log(`✅ External (npm): ${id}`);
              console.log(`   ↳ Imported by: ${importer || "(entry)"}`);
              console.log(`   ↳ IsResolved: ${isResolved}`);
            }
            return true;
          }

          // 2. 排除特定的应用级模块（防止打包 store、router 等全局状态）
          if (
            id.includes("/store/") ||
            id.includes("/router/") ||
            id === "@/store" ||
            id === "@/router" ||
            id.includes("/main.ts")
          ) {
            if (shouldLog) {
              console.log(`✅ External (app): ${id}`);
              console.log(`   ↳ Imported by: ${importer || "(entry)"}`);
              console.log(`   ↳ IsResolved: ${isResolved}`);
            }
            return true;
          }

          // 3. 其他 @/ 模块需要打包（因为库需要这些代码才能运行）
          if (id.startsWith("@/")) {
            if (shouldLog) {
              console.log(`📦 Bundled: ${id}`);
              console.log(`   ↳ Imported by: ${importer || "(entry)"}`);
            }
          }
          return false;
        },
        output: {
          // UMD 格式必需：定义外部依赖的全局变量名
          globals: {
            vue: "Vue",
            "vue-router": "VueRouter",
            "element-plus": "ElementPlus"
          },
          exports: "named",
          assetFileNames: "screenwright[extname]",
          // format 已在 lib.formats 中定义，这里删除避免重复
          inlineDynamicImports: true
        },
        treeshake: {
          // 关键：关闭激进的 Tree-shaking，防止 console 被误判为"无副作用"删除
          moduleSideEffects: true,
          propertyReadSideEffects: true,
          tryCatchDeoptimization: false
        }
      },
      cssCodeSplit: false
    },
    define: {
      "process.env": {
        BASE_URL: loadEnv(mode, process.cwd()).VITE_BASE_URL,
        PUBLIC_PATH: loadEnv(mode, process.cwd()).VITE_PUBLIC_PATH,
        VITE_API_BASE_URL: loadEnv(mode, process.cwd()).VITE_API_BASE_URL,
        MINIO_BASE_URL: loadEnv(mode, process.cwd()).VITE_MINIO_BASE_URL,
        MINIO_DEFAULT_PREFIX: loadEnv(mode, process.cwd()).VITE_MINIO_DEFAULT_PREFIX,
        RESOURCE_BASE_URL: loadEnv(mode, process.cwd()).VITE_RESOURCE_BASE_URL,
        DOCUMENT_URL: loadEnv(mode, process.cwd()).VITE_DOCUMENT_URL,
        WEBSITE_PAY: loadEnv(mode, process.cwd()).VITE_WEBSITE_PAY,
        WEBSITE_ORDER: loadEnv(mode, process.cwd()).VITE_WEBSITE_ORDER,
        WEBSITE_HOME: loadEnv(mode, process.cwd()).VITE_WEBSITE_HOME
      },
      __BUILD_MODE__: JSON.stringify("lib")
    }
  };
});
