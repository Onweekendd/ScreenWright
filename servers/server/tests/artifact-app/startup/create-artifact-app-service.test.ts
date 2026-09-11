import type { CreateAgentSessionOptions, ModelRuntime } from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vitest";

import { ArtifactAppService } from "@/artifact-app/application/artifact-app-service";

const dependencyMocks = vi.hoisted(() => ({
  createPiModelRuntime: vi.fn()
}));

vi.mock("@/artifact-app/agent/runtime/pi-model-runtime", () => ({
  createPiModelRuntime: dependencyMocks.createPiModelRuntime
}));

import { createArtifactAppService } from "@/artifact-app/startup/create-artifact-app-service";

type PiModel = NonNullable<CreateAgentSessionOptions["model"]>;

describe("createArtifactAppService", () => {
  it("创建服务：给定启动参数时，应创建一次共享 ModelRuntime 并返回应用服务", async () => {
    // Arrange
    const modelRuntime = {} as ModelRuntime;
    const model = {} as PiModel;
    dependencyMocks.createPiModelRuntime.mockResolvedValue({ modelRuntime, model });

    // Act
    const service = await createArtifactAppService({
      apiKey: "test-deepseek-key",
      appsRoot: "D:/artifact-app/apps",
      sessionsRoot: "D:/artifact-app/sessions",
      taskStorageRoot: "D:/agent-workspace/tasks"
    });

    // Assert
    expect(service).toBeInstanceOf(ArtifactAppService);
    expect(dependencyMocks.createPiModelRuntime).toHaveBeenCalledOnce();
    expect(dependencyMocks.createPiModelRuntime).toHaveBeenCalledWith({
      apiKey: "test-deepseek-key",
      baseUrl: undefined,
      modelId: undefined,
      runtimeOptions: undefined
    });
  });
});
