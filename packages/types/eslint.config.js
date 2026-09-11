import baseConfig from "@screenwright/eslint-config";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  ...baseConfig,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            //  zod
            ["^zod"],
            // 第三方包
            ["^@?\\w"],
            // 内部别名导入（@/ 开头）
            ["^@/"],
            // 其他相对路径导入（../ 和 ./）
            ["^\\."],
            // 样式导入（.css, .scss, .less 等）
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },

  // 项目特定的忽略规则
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "sql/**", "**/*.d.ts"],
  },
];
