import funbiNext from "@screenwright/eslint-config/next";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...funbiNext,
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
            ["^react", "^@react"],
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
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];

export default eslintConfig;
