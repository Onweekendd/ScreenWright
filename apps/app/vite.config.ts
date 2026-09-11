import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import buildInfoPlugin from "./src/build/gitVisionInfo";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default ({ mode }: { mode: string }) => {
  const isDev = mode === "development" || (process.env.npm_lifecycle_event ?? "").startsWith("dev");
  // vitest 以 mode="test" 加载本配置；测试期同样直连 packages 源码，避免每改一次
  // @screenwright/composables 等包源码就要 rebuild dist 才能跑测试
  const isTest = mode === "test";
  const env = loadEnv(mode, process.cwd());

  const envVars = {
    NODE_ENV: env.VITE_NODE_ENV,
    PUBLIC_PATH: env.VITE_PUBLIC_PATH,
    VITE_API_BASE_URL: env.VITE_API_BASE_URL,
    MINIO_BASE_URL: env.VITE_MINIO_BASE_URL,
    BASE_URL: env.VITE_BASE_URL,
    BASE_URL_CITY: env.VITE_API_BASE_URL_CITY,
    MINIO_DEFAULT_PREFIX: env.VITE_MINIO_DEFAULT_PREFIX,
    RESOURCE_BASE_URL: env.VITE_RESOURCE_BASE_URL,
    SOCKET_IO_URL: env.VITE_SOCKET_IO_URL,
    DOCUMENT_URL: env.VITE_DOCUMENT_URL,
    WEBSITE_PAY: env.VITE_WEBSITE_PAY,
    WEBSITE_ORDER: env.VITE_WEBSITE_ORDER,
    WEBSITE_HOME: env.VITE_WEBSITE_HOME,
    VITE_FUNAI_API_URL: env.VITE_FUNAI_API_URL
  };

  const define: Record<string, string> = {
    "process.env": JSON.stringify(
      Object.fromEntries(Object.entries(envVars).filter(([, value]) => value !== undefined))
    )
  };

  return defineConfig({
    define,
    plugins: [
      vue(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src/service-workers/minioCache",
        filename: "minio-cache-online.ts",
        injectRegister: "script-defer",
        injectManifest: {
          injectionPoint: undefined
        },
        manifest: {
          name: "Screenwright",
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
      }),
      ViteImageOptimizer({
        test: /\.(jpe?g|png|gif|svg)$/i,
        include: ["**/*.{jpg,jpeg,png,gif,svg}"],
        exclude: [],
        jpeg: { quality: 70 },
        jpg: { quality: 70 },
        png: { quality: 70 },
        gif: { optimizationLevel: 3 } as any,
        svg: { multipass: true }
      }),
      buildInfoPlugin({
        gitWorkTree: process.env.WORKSPACE || process.cwd()
      })
    ],
    resolve: {
      alias: [
        { find: "@", replacement: resolve(__dirname, "src") },
        // 开发/测试期直连 material/use 源码，免全量重打、保留逐组件 HMR；正式构建仍消费 dist。
        // 测试期同样直连，否则改 packages 源码需先 rebuild dist 才会生效（见 isTest 注释）
        ...(isDev || isTest
          ? [
              // 子入口别名必须排在 @screenwright/material 通用别名之前：resolve.alias 按数组顺序取首个匹配，
              // 通用别名对字符串 find 默认按前缀匹配（find 本身或 find + "/..."），
              // 若放在前面会先命中 @screenwright/material/chart 等子路径，拼接出 src/index.ts/chart 这种非法路径
              { find: "@screenwright/material/text", replacement: resolve(__dirname, "../../packages/material/src/text.ts") },
              {
                find: "@screenwright/material/chart",
                replacement: resolve(__dirname, "../../packages/material/src/chart.ts")
              },
              {
                find: "@screenwright/material/indicator",
                replacement: resolve(__dirname, "../../packages/material/src/indicator.ts")
              },
              {
                find: "@screenwright/material/media",
                replacement: resolve(__dirname, "../../packages/material/src/media.ts")
              },
              {
                find: "@screenwright/material/interactive",
                replacement: resolve(__dirname, "../../packages/material/src/interactive.ts")
              },
              {
                find: "@screenwright/material/exhibit",
                replacement: resolve(__dirname, "../../packages/material/src/exhibit.ts")
              },
              {
                find: "@screenwright/material/extends",
                replacement: resolve(__dirname, "../../packages/material/src/extends.ts")
              },
              {
                find: "@screenwright/material/equipment",
                replacement: resolve(__dirname, "../../packages/material/src/equipment.ts")
              },
              { find: "@screenwright/material", replacement: resolve(__dirname, "../../packages/material/src/index.ts") },
              { find: "@material", replacement: resolve(__dirname, "../../packages/material/src") },
              { find: "@editor", replacement: resolve(__dirname, "../../packages/material/src/editor-ui") },
              { find: "@screenwright/composables", replacement: resolve(__dirname, "../../packages/composables/src/index.ts") },
              { find: "@screenwright/core", replacement: resolve(__dirname, "../../packages/core/src/index.ts") }
            ]
          : []),
        { find: /^vue$/, replacement: "vue/dist/vue.esm-bundler.js" },
        { find: /^vue-full$/, replacement: "vue/dist/vue.esm-bundler.js" },
        { find: "@vercel/oidc", replacement: resolve(__dirname, "src/stubs/vercel-oidc.ts") }
      ]
    },
    base: env.VITE_PUBLIC_PATH,
    server: {
      host: "0.0.0.0",
      proxy: {}
    },
    // 在开发模式保留 console.log，非开发时移除
    esbuild: {
      // 仅当处于开发模式或通过 `npm run dev` 启动时保留 console/debugger
      drop: isDev ? [] : ["console", "debugger"],
      sourcemap: isDev
    },
    build: {
      target: "es2020",
      sourcemap: mode === "development" ? true : false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      cssCodeSplit: true, // 启用CSS分割
      // 使用 esbuild 进行压缩，比 terser 快 20-40 倍
      minify: "esbuild",
      rollupOptions: {
        external: ["@mastra/core", "@mastra/ai-sdk"],
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          // 优化后的代码分割策略：更合理的分组
          manualChunks(id) {
            // 物料包及其纯逻辑底座（use/core//ui）合并成一个 chunk。
            // 为何连同底座一起：material dist 顶层 re-export @screenwright/composables（模块初始化期即执行），
            // 若 use/core 落入 app 主 chunk，会形成 app 主 chunk ↔ material-vendor 的跨 chunk 循环，
            // 初始化顺序错乱即 TDZ。把同层底座并入本 chunk 后，material-vendor 对外只单向依赖
            // vue-vendor/vendor 等第三方，无环，不会 TDZ。
            // 注意：这些均为 workspace symlink 包，Rollup 解析为真实路径 packages/xxx/dist，
            // id 不含 node_modules，故须在下方 node_modules 分支之前单独判定。
            if (
              id.includes("packages/material/dist") ||
              id.includes("@screenwright/material") ||
              id.includes("packages/composables/dist") ||
              id.includes("@screenwright/composables") ||
              id.includes("packages/core/dist") ||
              id.includes("@screenwright/core") ||
              id.includes("packages/types/dist") ||
              id.includes("@screenwright/types") ||
              id.includes("packages/ui/dist") ||
              id.includes("@screenwright/ui")
            ) {
              return "material-vendor";
            }
            // 大型第三方库单独打包
            if (id.includes("node_modules")) {
              // Vue 生态 + Element Plus（与 vue 强耦合，需同包避免循环加载导致的 TDZ 报错）
              if (
                id.includes("vue") ||
                id.includes("pinia") ||
                id.includes("@vue") ||
                id.includes("element-plus") ||
                id.includes("@element-plus")
              ) {
                return "vue-vendor";
              }
              // Monaco 编辑器
              if (id.includes("monaco-editor")) {
                return "monaco-vendor";
              }
              // 其他较大的库
              if (id.includes("lodash") || id.includes("axios") || id.includes("dayjs")) {
                return "utils-vendor";
              }

              if (id.includes("flv.js") || id.includes("hls.js")) {
                return "video-vendor";
              }

              if (id.includes("three")) {
                return "three-vendor";
              }
              // 其余的 node_modules 依赖打包到一起
              return "vendor";
            }
          }
        }
      }
    },
    worker: {
      format: "es",
      rollupOptions: {
        output: {
          entryFileNames: "assetsResources/[name]-[hash].js",
          chunkFileNames: "assetsResources/[name]-[hash].js"
        }
      }
    },
    // @ts-ignore
    test: {
      exclude: ["node_modules", "dist", "public"],
      environment: "jsdom",
      setupFiles: ["./src/tests/setup.ts"],
      alias: [
        { find: "@", replacement: resolve(__dirname, "src") },
        { find: /^vue$/, replacement: "vue/dist/vue.esm-bundler.js" },
        { find: /^vue-full$/, replacement: "vue/dist/vue.esm-bundler.js" }
      ]
    },
    optimizeDeps: {
      exclude: ["@mastra/core", "@vercel/oidc"],
      // 预构建依赖项，减少首次启动时间
      include: ["vue", "vue-router", "pinia", "element-plus", "axios", "lodash-es", "dayjs", "@vueuse/core"]
    },
    // 缓存配置，提升二次构建速度
    cacheDir: "node_modules/.vite"
  });
};
