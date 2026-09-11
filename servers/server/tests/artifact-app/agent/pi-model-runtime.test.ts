import type {
  CreateAgentSessionOptions,
  CreateModelRuntimeOptions,
  ModelRuntime
} from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdkMocks = vi.hoisted(() => ({
  createRuntime: vi.fn()
}));

vi.mock("@earendil-works/pi-coding-agent", () => ({
  ModelRuntime: {
    create: sdkMocks.createRuntime
  }
}));

type PiModel = NonNullable<CreateAgentSessionOptions["model"]>;

beforeEach(() => {
  vi.resetModules();
  sdkMocks.createRuntime.mockReset();
  // 录制开关来自环境变量，测试里显式定住，避免受 .env 影响
  vi.stubEnv("RECORD_LLM", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createPiModelRuntime", () => {
  it("模块导入后尚未调用工厂时，不应创建 ModelRuntime", async () => {
    // Arrange
    const expectedCreateCount = 0;

    // Act
    await import("@/artifact-app/agent/runtime/pi-model-runtime");
    const actualCreateCount = sdkMocks.createRuntime.mock.calls.length;

    // Assert
    expect(actualCreateCount).toBe(expectedCreateCount);
  });

  it("API Key 为空时不再 throw（首启未配模型），仍创建 Runtime 并透传空 key", async () => {
    // Arrange
    const model = {} as PiModel;
    const runtime = createModelRuntimeStub(model);
    sdkMocks.createRuntime.mockResolvedValue(runtime.value);
    const { createPiModelRuntime } = await import("@/artifact-app/agent/runtime/pi-model-runtime");

    // Act
    const result = await createPiModelRuntime({ apiKey: "" });

    // Assert
    expect(result).toEqual({ modelRuntime: runtime.value, model });
    expect(runtime.setRuntimeApiKey).toHaveBeenCalledWith("deepseek", "");
    expect(runtime.registerProvider).not.toHaveBeenCalled();
  });

  it("传入自定义 baseUrl 时，registerProvider 叠加 endpoint", async () => {
    // Arrange
    const runtime = createModelRuntimeStub({} as PiModel);
    sdkMocks.createRuntime.mockResolvedValue(runtime.value);
    const { createPiModelRuntime } = await import("@/artifact-app/agent/runtime/pi-model-runtime");

    // Act
    await createPiModelRuntime({ apiKey: "k", baseUrl: "https://gw/v1", modelId: "custom" });

    // Assert
    expect(runtime.registerProvider).toHaveBeenCalledWith("deepseek", { baseUrl: "https://gw/v1", apiKey: "k" });
  });

  it("给定有效配置时，应创建 Runtime、注入 DeepSeek Key 并返回 Flash 模型", async () => {
    // Arrange
    const model = {} as PiModel;
    const runtime = createModelRuntimeStub(model);
    const runtimeOptions: CreateModelRuntimeOptions = { refreshOnCreate: false };
    sdkMocks.createRuntime.mockResolvedValue(runtime.value);
    const { createPiModelRuntime } = await import("@/artifact-app/agent/runtime/pi-model-runtime");

    // Act
    const result = await createPiModelRuntime({ apiKey: "test-deepseek-key", runtimeOptions });

    // Assert
    expect({
      result,
      createArguments: sdkMocks.createRuntime.mock.calls,
      modelArguments: runtime.getModel.mock.calls,
      apiKeyArguments: runtime.setRuntimeApiKey.mock.calls
    }).toEqual({
      result: { modelRuntime: runtime.value, model },
      createArguments: [[runtimeOptions]],
      modelArguments: [["deepseek", "deepseek-v4-flash"]],
      apiKeyArguments: [["deepseek", "test-deepseek-key"]]
    });
  });

  it("Runtime 中不存在 Flash 模型时，应返回明确错误且不写入 API Key", async () => {
    // Arrange
    const runtime = createModelRuntimeStub(undefined);
    sdkMocks.createRuntime.mockResolvedValue(runtime.value);
    const { createPiModelRuntime } = await import("@/artifact-app/agent/runtime/pi-model-runtime");

    // Act
    const result = createPiModelRuntime({ apiKey: "test-deepseek-key" });

    // Assert
    await expect(result).rejects.toThrow("回退 deepseek-v4-flash 也不存在");
    expect(runtime.setRuntimeApiKey).not.toHaveBeenCalled();
  });

  it("开启 LLM 录制时，应用包了录制的 provider 覆盖内置 DeepSeek", async () => {
    // Arrange
    vi.stubEnv("RECORD_LLM", "true");
    const provider = createDeepseekProviderStub();
    const runtime = createModelRuntimeStub({} as PiModel, provider);
    sdkMocks.createRuntime.mockResolvedValue(runtime.value);
    const { createPiModelRuntime } = await import("@/artifact-app/agent/runtime/pi-model-runtime");

    // Act
    await createPiModelRuntime({ apiKey: "test-deepseek-key" });
    const [registered] = runtime.registerNativeProvider.mock.calls[0] as [Record<string, unknown>];

    // Assert
    expect(runtime.getProvider).toHaveBeenCalledWith("deepseek");
    expect(registered.id).toBe("deepseek");
    expect(registered.stream).not.toBe(provider.stream);
  });

  it("未开启 LLM 录制时，不应改动 Runtime 的 provider", async () => {
    // Arrange
    const runtime = createModelRuntimeStub({} as PiModel, createDeepseekProviderStub());
    sdkMocks.createRuntime.mockResolvedValue(runtime.value);
    const { createPiModelRuntime } = await import("@/artifact-app/agent/runtime/pi-model-runtime");

    // Act
    await createPiModelRuntime({ apiKey: "test-deepseek-key" });

    // Assert
    expect(runtime.getProvider).not.toHaveBeenCalled();
    expect(runtime.registerNativeProvider).not.toHaveBeenCalled();
  });
});

function createModelRuntimeStub(model: PiModel | undefined, provider?: unknown) {
  const getModel = vi.fn<ModelRuntime["getModel"]>().mockReturnValue(model);
  const setRuntimeApiKey = vi.fn<ModelRuntime["setRuntimeApiKey"]>().mockResolvedValue(undefined);
  const getProvider = vi.fn().mockReturnValue(provider);
  const registerNativeProvider = vi.fn();
  const registerProvider = vi.fn();
  const value = {
    getModel,
    setRuntimeApiKey,
    getProvider,
    registerNativeProvider,
    registerProvider
  } as unknown as ModelRuntime;

  return { value, getModel, setRuntimeApiKey, getProvider, registerNativeProvider, registerProvider };
}

function createDeepseekProviderStub() {
  return { id: "deepseek", name: "DeepSeek", auth: {}, getModels: () => [], stream: vi.fn(), streamSimple: vi.fn() };
}
