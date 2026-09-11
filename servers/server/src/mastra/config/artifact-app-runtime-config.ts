import path from "node:path";

import type { CreateArtifactAppServiceOptions } from "@/artifact-app/startup/create-artifact-app-service";

const ARTIFACT_APP_DIRECTORY = "artifact-app";

export interface ResolveArtifactAppRuntimeConfigInput {
  readonly cwd: string;
  readonly agentWorkspacePath: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  /** 推理模型配置（ai_model 表 reasoning 行）。Pi Agent 与主 agent 共用同一个推理模型。 */
  readonly reasoning: { apiKey: string; baseUrl: string; modelId: string };
}

export function resolveArtifactAppRuntimeConfig(
  input: ResolveArtifactAppRuntimeConfigInput
): CreateArtifactAppServiceOptions {
  const agentWorkspaceRoot = path.resolve(input.cwd, input.agentWorkspacePath);
  const artifactAppRoot = input.env.ARTIFACT_APP_ROOT
    ? path.resolve(input.cwd, input.env.ARTIFACT_APP_ROOT)
    : path.join(agentWorkspaceRoot, ARTIFACT_APP_DIRECTORY);

  // apiKey 为空不再 throw：装机版首启可能还没配模型，让 Pi 在实际调用时报错，不阻塞启动。
  return {
    apiKey: input.reasoning.apiKey,
    baseUrl: input.reasoning.baseUrl || undefined,
    modelId: input.reasoning.modelId || undefined,
    appsRoot: path.join(artifactAppRoot, "apps"),
    sessionsRoot: path.join(artifactAppRoot, "sessions"),
    taskStorageRoot: path.join(agentWorkspaceRoot, "tasks")
  };
}
