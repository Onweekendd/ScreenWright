import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { resolve } from "path"
import { readdirSync, existsSync } from "fs"
import dts from "vite-plugin-dts"

// 获取所有组件和hooks作为入口
const components = readdirSync(resolve(__dirname, "src/components"))
  .filter((name) => {
    // 优先使用 index.ts，其次使用 index.vue
    const indexTsPath = resolve(__dirname, `src/components/${name}/index.ts`)
    const indexVuePath = resolve(__dirname, `src/components/${name}/index.vue`)
    return existsSync(indexTsPath) || existsSync(indexVuePath)
  })
  .map((name) => {
    const indexTsPath = resolve(__dirname, `src/components/${name}/index.ts`)
    const indexVuePath = resolve(__dirname, `src/components/${name}/index.vue`)
    return [name, existsSync(indexTsPath) ? indexTsPath : indexVuePath]
  })

const hooks = readdirSync(resolve(__dirname, "src/hooks"))
  .filter((name) => name.endsWith(".ts"))
  .map((name) => [name.replace(".ts", ""), resolve(__dirname, `src/hooks/${name}`)])

const entries = Object.fromEntries([["index", resolve(__dirname, "main.ts")], ...components, ...hooks])

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ["src/**/*.ts", "src/**/*.vue", "main.ts"],
      outDir: "dist",
      staticImport: true,
      insertTypesEntry: true,
      copyDtsFiles: false
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  build: {
    lib: {
      entry: entries,
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      // 外部化依赖，不打包进组件库
      external: [
        "vue",
        "vue-router",
        "element-plus",
        "@element-plus/icons-vue",
        "@vueuse/core",
        "lodash-es",
        "monaco-editor"
      ],
      output: {
        // 保留目录结构
        preserveModules: false,
        exports: "named",
        // 为外部依赖提供全局变量
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "element-plus": "ElementPlus",
          "@element-plus/icons-vue": "ElementPlusIconsVue",
          "@vueuse/core": "VueUse",
          "lodash-es": "_",
          "monaco-editor": "monaco"
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "index.css"
          return assetInfo.name as string
        }
      }
    },
    sourcemap: false,
    cssCodeSplit: false,
    // 清空输出目录
    emptyOutDir: true
  }
})
