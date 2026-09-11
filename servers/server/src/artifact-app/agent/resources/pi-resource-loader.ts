import { DefaultResourceLoader, type ResourceLoader } from "@earendil-works/pi-coding-agent";

import { loadPrompt } from "@/agent-resources/prompts";

const ARTIFACT_APP_SYSTEM_PROMPT_PATH = "pi/artifact-app-agent.md";

export interface CreatePiResourceLoaderInput {
  /** Pi Agent 当前应用项目的工作目录。 */
  readonly workspacePath: string;

  /** Pi 的全局资源目录，由应用启动层注入。 */
  readonly agentDir: string;
}

/**
 * 创建当前应用项目使用的 Pi 资源加载器。
 *
 * Artifact App 规则通过 appendSystemPrompt 追加，避免覆盖 Pi 自带的编码提示词。
 * 项目 Extension 会执行 JavaScript，因此不允许从应用工作区加载。
 */
export async function createPiResourceLoader(input: CreatePiResourceLoaderInput): Promise<ResourceLoader> {
  const systemPrompt = loadPrompt(ARTIFACT_APP_SYSTEM_PROMPT_PATH).trim();
  const resourceLoader = new DefaultResourceLoader({
    cwd: input.workspacePath,
    agentDir: input.agentDir,
    appendSystemPrompt: [systemPrompt],
    noExtensions: true,
    noThemes: true
  });

  await resourceLoader.reload();
  return resourceLoader;
}
