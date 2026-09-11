import { describe, expect, it, vi } from "vitest";

const dependencyMocks = vi.hoisted(() => {
  const artifactAppService = { executeCodeTask: vi.fn() };
  const artifactAppPreviewManager = { start: vi.fn(), get: vi.fn(), stop: vi.fn(), stopAll: vi.fn() };
  const artifactAppRuntime = { artifactAppService, previewManager: artifactAppPreviewManager };
  const delegateAppCodeTool = { id: "delegate-app-code" };
  const swAgent = { id: "sw-agent" };
  const runtimeConfig = {
    apiKey: "test-deepseek-key",
    appsRoot: "D:/artifact-app/apps",
    sessionsRoot: "D:/artifact-app/sessions",
    taskStorageRoot: "D:/agent-workspace/tasks"
  };

  return {
    artifactAppService,
    artifactAppPreviewManager,
    artifactAppRuntime,
    delegateAppCodeTool,
    swAgent,
    runtimeConfig,
    getAgentWorkspacePath: vi.fn(() => "D:/agent-workspace"),
    resolveArtifactAppRuntimeConfig: vi.fn(() => runtimeConfig),
    createArtifactAppRuntime: vi.fn(async () => artifactAppRuntime),
    createDelegateAppCodeTool: vi.fn(() => delegateAppCodeTool),
    createSwAgent: vi.fn(() => swAgent)
  };
});

vi.mock("@/agent-resources/workspace-path", () => ({
  getAgentWorkspacePath: dependencyMocks.getAgentWorkspacePath
}));

vi.mock("@/artifact-app/startup/create-artifact-app-service", () => ({
  createArtifactAppRuntime: dependencyMocks.createArtifactAppRuntime
}));

vi.mock("@/mastra/config/artifact-app-runtime-config", () => ({
  resolveArtifactAppRuntimeConfig: dependencyMocks.resolveArtifactAppRuntimeConfig
}));

vi.mock("@/mastra/tools/artifact-app", () => ({
  createDelegateAppCodeTool: dependencyMocks.createDelegateAppCodeTool
}));

vi.mock("@/mastra/agents/sw-agent", () => ({
  createSwAgent: dependencyMocks.createSwAgent
}));

vi.mock("@/mastra/provider/model-registry", () => ({
  warmModelConfigs: vi.fn(async () => {}),
  getModelConfigSync: vi.fn(() => ({
    role: "reasoning",
    baseUrl: "https://api.deepseek.com",
    apiKey: "test-key",
    modelId: "deepseek-v4-flash",
    contextLength: 1_000_000,
    dimensions: null
  }))
}));

import { artifactAppPreviewManager, artifactAppService, swAgent, delegateAppCodeTool } from "@/mastra/runtime";

describe("Mastra 运行时组合根", () => {
  it("模块启动：解析配置后，应把同一个 ArtifactAppService 注入委派工具并注册到 BI Agent", () => {
    // Arrange
    const expectedRuntimeObjects = {
      artifactAppService: dependencyMocks.artifactAppService,
      artifactAppPreviewManager: dependencyMocks.artifactAppPreviewManager,
      delegateAppCodeTool: dependencyMocks.delegateAppCodeTool,
      swAgent: dependencyMocks.swAgent
    };

    // Act
    const actualRuntimeObjects = { artifactAppService, artifactAppPreviewManager, delegateAppCodeTool, swAgent };

    // Assert
    expect(actualRuntimeObjects).toEqual(expectedRuntimeObjects);
    expect(dependencyMocks.createArtifactAppRuntime).toHaveBeenCalledWith(dependencyMocks.runtimeConfig);
    expect(dependencyMocks.createDelegateAppCodeTool).toHaveBeenCalledWith({
      artifactAppService: dependencyMocks.artifactAppService
    });
    expect(dependencyMocks.createSwAgent).toHaveBeenCalledWith({
      delegateAppCodeTool: dependencyMocks.delegateAppCodeTool
    });
  });
});
