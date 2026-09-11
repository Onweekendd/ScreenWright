import path from "node:path";

import { LocalFilesystem, LocalSandbox, Workspace, WORKSPACE_TOOLS } from "@mastra/core/workspace";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

const BASE_PATH = getAgentWorkspacePath();

/**
 * Screenwright 项目自己那份 tsconfig.json（带 `@/` 路径别名）的绝对路径，供沙箱里的
 * `npx tsx --tsconfig $FUNAI_PROJECT_TSCONFIG scripts/create-template.ts …` 这类脚本用
 * （事件干跑已从脚本改成 `simulateEvent` 工具，不再走这条路）。
 *
 * **不能让 skill 文档里写死一个相对路径去够它**——沙箱的 cwd 是工作区根（`BASE_PATH`），
 * 而工作区根到这份 tsconfig 的相对距离在真实部署（`agent-workspace/` 只比 Screenwright 项目根低
 * 一层，`../tsconfig.json` 凑巧够得到）和 eval（`evals/runs/.workspace/` 低三层，`../` 只够到
 * `evals/runs/`，那里根本没有这个文件）之间不一样。真实环境里的 `../tsconfig.json` 不是对的
 * 路径表达式，只是碰巧在那一层嵌套深度下算对了；换一层嵌套就会露馅——eval 就是第一个受害者，
 * 一次委派烧了 11 步去猜路径、写转义、包脚本、上 base64 硬绕。
 *
 * 顺便一提：工作区根自己也放着一份 `tsconfig.json`（`prepare-workspace.ts` 的 INFRASTRUCTURE
 * 之一），但那份是 `check-vue-part` 用的 vue-part 类型配置，没有 `@/` 别名，两份文件同名不同义，
 * 用错了会更隐蔽——这也是为什么修法是**发一个新环境变量**而不是"改成 tsconfig.json 不带 ../"。
 *
 * 用 `process.cwd()` 而不是 `import.meta.url`：`getAgentWorkspacePath()` 的默认值
 * `"./agent-workspace"` 本来就假定进程 cwd 是 Screenwright 项目根（`pnpm server:dev` / `pnpm eval`
 * 都从这里起），这里跟它保持同一个假设，不引入第二套解析逻辑。
 */
const PROJECT_TSCONFIG_PATH = path.resolve(process.cwd(), "tsconfig.json");

/**
 * 文件系统类工具一律禁用，统一使用自定义 readFileTool / editFilesTool / ...
 */
const DISABLED_FS_TOOLS = {
  [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: { enabled: false },
  [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: { enabled: false },
  [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: { enabled: false },
  [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: { enabled: false }
} as const;

/**
 * 构建 workspace 实例。
 *
 * 当前布局：
 * - 主 agent / 执行 / 校验 agent：`skills/common` + `skills/executor`（完整 SKILL.md + references）
 * - 视觉 agent：纯识图,不挂 workspace（无需 skill 上下文）
 */
function buildWorkspace(skills: string[]) {
  return new Workspace({
    filesystem: new LocalFilesystem({ basePath: BASE_PATH }),
    sandbox: new LocalSandbox({
      workingDirectory: BASE_PATH,
      // 只加这一个变量：LocalSandbox 默认只给沙箱进程留 PATH，其余宿主环境变量一律不带，
      // 这里不是覆盖掉什么，纯增量。
      env: { FUNAI_PROJECT_TSCONFIG: PROJECT_TSCONFIG_PATH }
    }),
    tools: DISABLED_FS_TOOLS,
    skills
  });
}

/** 主 / 执行 / 校验类 agent 用：协作 skill + 实现 skill 全量（含 references） */
const fullWorkspace = buildWorkspace(["skills/common", "skills/executor"]);

/** Mastra 实例级默认 workspace。其他 agent 未显式指定时继承此实例（= 全量 skill） */
const workspace = fullWorkspace;

export { fullWorkspace, workspace };
