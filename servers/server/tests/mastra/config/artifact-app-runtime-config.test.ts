import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveArtifactAppRuntimeConfig } from "@/mastra/config/artifact-app-runtime-config";

const reasoning = { apiKey: "test-key", baseUrl: "", modelId: "deepseek-v4-flash" };

describe("resolveArtifactAppRuntimeConfig", () => {
  it("解析配置：给定相对运行目录时，应从启动工作目录解析受信任路径", () => {
    const cwd = path.resolve("screenwright-runtime");
    const result = resolveArtifactAppRuntimeConfig({
      cwd,
      agentWorkspacePath: "agent-workspace",
      env: { ARTIFACT_APP_ROOT: "artifact-data" },
      reasoning
    });

    expect(result).toEqual({
      apiKey: "test-key",
      baseUrl: undefined,
      modelId: "deepseek-v4-flash",
      appsRoot: path.join(cwd, "artifact-data", "apps"),
      sessionsRoot: path.join(cwd, "artifact-data", "sessions"),
      taskStorageRoot: path.join(cwd, "agent-workspace", "tasks")
    });
  });

  it("解析配置：未覆盖 Artifact App 根目录时，应放在共享 Agent Workspace 中", () => {
    const cwd = path.resolve("screenwright-runtime");
    const result = resolveArtifactAppRuntimeConfig({
      cwd,
      agentWorkspacePath: "agent-workspace",
      env: {},
      reasoning
    });

    expect(result).toEqual({
      apiKey: "test-key",
      baseUrl: undefined,
      modelId: "deepseek-v4-flash",
      appsRoot: path.join(cwd, "agent-workspace", "artifact-app", "apps"),
      sessionsRoot: path.join(cwd, "agent-workspace", "artifact-app", "sessions"),
      taskStorageRoot: path.join(cwd, "agent-workspace", "tasks")
    });
  });

  it("推理配置有自定义 endpoint 时透传 baseUrl", () => {
    const result = resolveArtifactAppRuntimeConfig({
      cwd: path.resolve("x"),
      agentWorkspacePath: "agent-workspace",
      env: {},
      reasoning: { apiKey: "", baseUrl: "https://my-gw/v1", modelId: "custom-model" }
    });
    expect(result.apiKey).toBe("");
    expect(result.baseUrl).toBe("https://my-gw/v1");
    expect(result.modelId).toBe("custom-model");
  });
});
