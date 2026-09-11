// @ts-check
import vueConfig from "@screenwright/eslint-config/vue";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...vueConfig,

  // 导入排序配置
  {
    plugins: {
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Vitest 测试框架
            ["^vitest"],
            // 测试工具文件（./test-utils 或 ../test-utils）
            ["^\\..*test-utils"],
            // Vue 相关包
            ["^vue", "^@vue"],
            // Node.js 内置模块
            ["^node:"],
            // 第三方包
            ["^@?\\w"],
            // 内部别名导入（@/ 开头）
            ["^@/"],
            // 其他相对路径导入（../ 和 ./）
            ["^\\."],
            // 样式导入（.css, .scss, .less 等）
            ["^.+\\.s?css$"]
          ]
        }
      ],
      "simple-import-sort/exports": "error"
    }
  },

  // 项目特定的忽略规则
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "sql/**", "**/*.d.ts"]
  }
];
