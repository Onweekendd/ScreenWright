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
    // 但 `agent-workspace/scripts/` 是例外，必须检：它是我们自己维护的源码，而且 skill 里把
    // `simulateEvent.ts` 标成「必须执行」的验证步骤。整个目录一刀切忽略过一次代价——
    // `simulateEvent.ts` 里一处写死的 `../../src/...` 相对导入（层数取决于脚本文件自己在哪，
    // 拷进 eval 工作区就指向不存在的目录）在 lint 和 tsc 双盲区里躺了很久，直到 eval 里
    // 那个凑巧存在的软链被清掉才暴露。类型侧的对应措施见 tsconfig.agent-scripts.json。
    //
    // 写成「逐个列出要忽略的子目录」而不是「忽略 agent-workspace/** 再取反」：flat config 里
    // 一旦目录本身被忽略，目录内的 `!` 取反就不再生效（实测 scripts/ 仍被跳过）。
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
