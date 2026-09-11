import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";
import { createArtifactAppRuntime } from "@/artifact-app/startup/create-artifact-app-service";

import { createSwAgent } from "./agents/sw-agent";
import { resolveArtifactAppRuntimeConfig } from "./config/artifact-app-runtime-config";
import { getModelConfigSync, warmModelConfigs } from "./provider/model-registry";
import { createDelegateAppCodeTool } from "./tools/artifact-app";

// 模型配置进程内同步缓存：所有 agent 的 `model: () => resolveXxx()` 依赖它已 warm。
// 写 ai_model 表后（ai-model.route.ts）会再次 warm。
await warmModelConfigs();

const artifactAppRuntimeConfig = resolveArtifactAppRuntimeConfig({
  cwd: process.cwd(),
  agentWorkspacePath: getAgentWorkspacePath(),
  env: process.env,
  reasoning: getModelConfigSync("reasoning")
});

const artifactAppRuntime = await createArtifactAppRuntime(artifactAppRuntimeConfig);

/** 当前 Screenwright 进程共享的 Artifact App 应用服务。 */
export const artifactAppService = artifactAppRuntime.artifactAppService;

/** 当前 Screenwright 进程共享的开发预览进程与端口映射。 */
export const artifactAppPreviewManager = artifactAppRuntime.previewManager;

/** 已完成 ArtifactAppService 依赖注入的 Mastra 委派工具。 */
export const delegateAppCodeTool = createDelegateAppCodeTool({ artifactAppService });

/** 当前进程唯一的 BI Agent 实例。 */
export const swAgent = createSwAgent({ delegateAppCodeTool });
