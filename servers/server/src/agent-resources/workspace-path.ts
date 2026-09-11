/** 共享 Agent Workspace 在 Screenwright 服务目录下的默认位置。 */
export const DEFAULT_AGENT_WORKSPACE_PATH = "./agent-workspace";

/**
 * 获取 Agent Workspace 的运行时路径。
 *
 * 保留 MASTRA_WORKSPACE_PATH 以兼容现有部署；未配置时使用服务源码之外的共享工作区。
 */
export function getAgentWorkspacePath(): string {
  return process.env.MASTRA_WORKSPACE_PATH || DEFAULT_AGENT_WORKSPACE_PATH;
}
