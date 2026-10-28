import { LocalFilesystem, LocalSandbox, Workspace, WORKSPACE_TOOLS } from "@mastra/core/workspace";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

const BASE_PATH = getAgentWorkspacePath();

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
      workingDirectory: BASE_PATH
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
