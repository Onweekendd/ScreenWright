import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick, ref } from "vue";

const { mockGetAiModels, mockGetThreadModels, mockSetThreadModel, mockError } = vi.hoisted(() => ({
  mockGetAiModels: vi.fn(),
  mockGetThreadModels: vi.fn(),
  mockSetThreadModel: vi.fn(),
  mockError: vi.fn()
}));

vi.mock("@/api/aiModel", () => ({
  getAiModels: mockGetAiModels,
  getThreadModels: mockGetThreadModels,
  setThreadModel: mockSetThreadModel
}));

vi.mock("element-plus", () => ({ ElMessage: { error: mockError } }));

import type { AiModelVo } from "@/api/aiModel";
import { refreshAiModels, useThreadModels } from "@/views/build/components/agentBI/hooks/useThreadModels";

const model = (id: string, over: Partial<AiModelVo> = {}): AiModelVo => ({
  id,
  role: id.split("-")[0] as AiModelVo["role"],
  name: "",
  baseUrl: "https://x/v1",
  hasApiKey: true,
  modelId: id,
  contextLength: null,
  dimensions: null,
  isDefault: false,
  ...over
});

const MODELS = [
  model("reasoning-1", { isDefault: true, contextLength: 1_000_000 }),
  model("reasoning-2", { contextLength: 200_000 }),
  model("image-1", { isDefault: true }),
  model("video-1", { isDefault: true })
];

/** 等 watch 里的异步请求落定 */
const flush = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

beforeEach(async () => {
  vi.clearAllMocks();
  mockGetAiModels.mockResolvedValue(MODELS);
  mockGetThreadModels.mockResolvedValue({});
  await refreshAiModels();
});

describe("useThreadModels", () => {
  it("新对话：没有覆盖时各角色取默认，上下文窗口取默认推理模型的", () => {
    const tm = useThreadModels(ref(undefined));

    expect(tm.effectiveModel("reasoning")?.id).toBe("reasoning-1");
    expect(tm.effectiveModel("image")?.id).toBe("image-1");
    expect(tm.reasoningContextLength.value).toBe(1_000_000);
    expect(mockGetThreadModels).not.toHaveBeenCalled();
  });

  it("新对话：选非默认模型只改本地，不请求后端（等建对话时一起提交）", async () => {
    const tm = useThreadModels(ref(undefined));

    await tm.selectModel("reasoning", "reasoning-2");

    expect(tm.selection.value).toEqual({ reasoning: "reasoning-2" });
    expect(tm.effectiveModel("reasoning")?.id).toBe("reasoning-2");
    expect(tm.reasoningContextLength.value).toBe(200_000);
    expect(mockSetThreadModel).not.toHaveBeenCalled();
  });

  it("选回默认那条等于跟随默认：清掉覆盖", async () => {
    const tm = useThreadModels(ref(undefined));
    await tm.selectModel("reasoning", "reasoning-2");

    await tm.selectModel("reasoning", "reasoning-1");

    expect(tm.selection.value).toEqual({});
  });

  it("已有对话：打开时拉取该对话的选择", async () => {
    mockGetThreadModels.mockResolvedValue({ reasoning: "reasoning-2" });

    const tm = useThreadModels(ref("t1"));
    await flush();

    expect(mockGetThreadModels).toHaveBeenCalledWith("t1");
    expect(tm.effectiveModel("reasoning")?.id).toBe("reasoning-2");
  });

  it("已有对话：选模型写后端，选默认时传 null", async () => {
    const tm = useThreadModels(ref("t1"));
    await flush();
    mockSetThreadModel.mockResolvedValueOnce({ image: "image-2" }).mockResolvedValueOnce({});

    await tm.selectModel("image", "image-2");
    expect(mockSetThreadModel).toHaveBeenLastCalledWith("t1", "image", "image-2");

    await tm.selectModel("image", "image-1");
    expect(mockSetThreadModel).toHaveBeenLastCalledWith("t1", "image", null);
  });

  it("写后端失败时回滚本地选择并提示", async () => {
    const tm = useThreadModels(ref("t1"));
    await flush();
    mockSetThreadModel.mockRejectedValue(new Error("网络错误"));

    await tm.selectModel("reasoning", "reasoning-2");

    expect(tm.selection.value).toEqual({});
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining("网络错误"));
  });

  it("覆盖指向的配置已被删：回退默认，与后端解析一致", async () => {
    mockGetThreadModels.mockResolvedValue({ reasoning: "reasoning-deleted" });

    const tm = useThreadModels(ref("t1"));
    await flush();

    expect(tm.effectiveModel("reasoning")?.id).toBe("reasoning-1");
  });

  it("切回新对话时清空选择，新对话从默认开始", async () => {
    mockGetThreadModels.mockResolvedValue({ reasoning: "reasoning-2" });
    const threadId = ref<string | undefined>("t1");
    const tm = useThreadModels(threadId);
    await flush();

    threadId.value = undefined;
    await flush();

    expect(tm.selection.value).toEqual({});
  });

  it("请求期间切了对话：丢弃过期结果", async () => {
    let resolveFirst!: (v: object) => void;
    mockGetThreadModels
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce({ image: "image-1" });
    const threadId = ref<string | undefined>("t1");
    const tm = useThreadModels(threadId);

    threadId.value = "t2";
    await flush();
    resolveFirst({ reasoning: "reasoning-2" });
    await flush();

    expect(tm.selection.value).toEqual({ image: "image-1" });
  });
});
