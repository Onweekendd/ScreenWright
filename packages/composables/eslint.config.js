import baseConfig from "@screenwright/eslint-config";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  ...baseConfig,
  {
    plugins: {
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // 第三方包（含 @screenwright/*）
            ["^@?\\w"],
            // 内部别名导入（@/ 开头）
            ["^@/"],
            // 其他相对路径导入（../ 和 ./）
            ["^\\."]
          ]
        }
      ],
      "simple-import-sort/exports": "error"
    }
  },

  // 项目特定的忽略规则
  {
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts"]
  }
];
