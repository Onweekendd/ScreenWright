// @ts-check
import baseConfig from "@screenwright/eslint-config";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,

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
            // 副作用导入（side-effect imports，无 from 的导入）必须排在最前
            ["^dotenv"],
            // Mastra 框架
            ["^mastra"],
            // Node.js 内置模块
            ["^node:"],
            // 第三方包
            ["^@?\\w"],
            // 根目录别名导入（~/ 开头）
            ["^~/"],
            // 内部别名导入（@/ 开头）
            ["^@/"],
            // 相对路径导入（../ 和 ./）
            ["^\\."]
          ]
        }
      ],
      "simple-import-sort/exports": "error"
    }
  },

  // 项目特定的忽略规则
  {
    // agent-workspace 的**运行产物**（屏数据、任务记录、artifact-app）不参与 lint——
    // 它们是 agent 跑出来的，不是我们写的。
    //
    // 逐个列出运行产物目录，避免忽略未来可能放进工作区的源码。
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.d.ts",
      // eval 的运行产物：agent 写出来的过滤器 JS、以及从 agent-workspace 拷进去的副本。
      // 与 agent-workspace 的屏数据同性质——不是我们写的源码，每轮跑完即弃（`evals/runs/` 亦不入库）。
      "evals/runs/**",
      "agent-workspace/screen_*/**",
      "agent-workspace/tasks/**",
      "agent-workspace/artifact-app/**",
      "agent-workspace/skills/**",
      "agent-workspace/types/**"
    ]
  }
];
