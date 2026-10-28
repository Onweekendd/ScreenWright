import { beforeEach, describe, expect, it, vi } from "vitest";

import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";

const api = vi.hoisted(() => ({
  getAiModels: vi.fn(),
  createAiModel: vi.fn(),
  updateAiModel: vi.fn(),
  deleteAiModel: vi.fn(),
  setDefaultAiModel: vi.fn(),
  testAiModel: vi.fn(),
  reindexEmbeddings: vi.fn()
}));
const ui = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn(), confirm: vi.fn() }));

// 只替换请求函数，aiModelLabel 等纯函数用真实实现
vi.mock("@/api/aiModel", async (importOriginal) => ({
  ...(await importOriginal<typeof AiModelApi>()),
  ...api
}));
vi.mock("element-plus", () => ({
  ElMessage: { success: ui.success, warning: ui.warning, error: ui.error },
  ElMessageBox: { confirm: ui.confirm }
}));
vi.mock("@/assets/image/models/embedding.png", () => ({ default: "" }));
vi.mock("@/assets/image/models/image.png", () => ({ default: "" }));
vi.mock("@/assets/image/models/reasoning.png", () => ({ default: "" }));
vi.mock("@/assets/image/models/video.png", () => ({ default: "" }));

import type * as AiModelApi from "@/api/aiModel";
import type { AiModelVo } from "@/api/aiModel";
import { NEW_ID, useAiModelSettings } from "@/views/settings/useAiModelSettings";

const model = (id: string, over: Partial<AiModelVo> = {}): AiModelVo => ({
  id,
  role: id.split("-")[0] as AiModelVo["role"],
  name: "",
  baseUrl: "https://x/v1",
  hasApiKey: true,
  modelId: `${id}-model`,
  contextLength: null,
  dimensions: null,
  isDefault: false,
  ...over
});

const MODELS = [
  model("reasoning-1", { isDefault: true }),
  model("reasoning-2", { name: "Claude" }),
  model("embedding-1", { isDefault: true, dimensions: 1024 }),
  model("image-1", { isDefault: true }),
  model("video-1", { isDefault: true })
];

const flush = async () => {
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await nextTick();
  }
};

const setup = async () => {
  let settings!: ReturnType<typeof useAiModelSettings>;
  mount(
    defineComponent({
      setup() {
        settings = useAiModelSettings();
        return () => null;
      }
    })
  );
  await flush();
  return settings;
};

beforeEach(() => {
  vi.clearAllMocks();
  api.getAiModels.mockResolvedValue(MODELS);
});

describe("useAiModelSettings", () => {
  it("加载后各角色选中默认那条，表单回填但 apiKey 为空", async () => {
    const s = await setup();

    expect(s.states.reasoning.items.map((m) => m.id)).toEqual(["reasoning-1", "reasoning-2"]);
    expect(s.states.reasoning.editingId).toBe("reasoning-1");
    expect(s.states.embedding.form).toMatchObject({ modelId: "embedding-1-model", dimensions: 1024, apiKey: "" });
  });

  it("编辑已有配置：保存时按 id 更新，空 apiKey 不提交", async () => {
    api.updateAiModel.mockResolvedValue(model("reasoning-2"));
    const s = await setup();
    s.select("reasoning", "reasoning-2");
    s.states.reasoning.form.modelId = "claude-sonnet";

    await s.save("reasoning");

    expect(api.updateAiModel).toHaveBeenCalledWith(
      "reasoning-2",
      expect.objectContaining({ modelId: "claude-sonnet", apiKey: undefined })
    );
    expect(s.states.reasoning.editingId).toBe("reasoning-2");
  });

  it("复制：进入新增态、预填表单、沿用原条密钥，保存后选中新条目", async () => {
    const created = model("reasoning-3");
    api.createAiModel.mockResolvedValue(created);
    const s = await setup();

    s.duplicate("reasoning", MODELS[1]);
    expect(s.states.reasoning.editingId).toBe(NEW_ID);
    expect(s.states.reasoning.form.name).toBe("Claude 副本");
    expect(s.apiKeyPlaceholder("reasoning")).toContain("推理模型 · Claude");

    api.getAiModels.mockResolvedValue([...MODELS, created]);
    await s.save("reasoning");

    expect(api.createAiModel).toHaveBeenCalledWith(
      expect.objectContaining({ role: "reasoning", copyKeyFrom: "reasoning-2", name: "Claude 副本" })
    );
    expect(s.states.reasoning.editingId).toBe("reasoning-3");
  });

  it("新增态测试连接：用 copyKeyFrom 那条的已存密钥兜底", async () => {
    api.testAiModel.mockResolvedValue({ ok: true, latencyMs: 12 });
    const s = await setup();
    s.duplicate("image", MODELS[3]);

    await s.test("image");

    expect(api.testAiModel).toHaveBeenCalledWith("image", expect.objectContaining({ id: "image-1" }));
    expect(s.states.image.testResult).toEqual({ ok: true, text: "连接正常（12ms）" });
  });

  it("新增时没填模型 id 不提交", async () => {
    const s = await setup();
    s.startCreate("video");

    await s.save("video");

    expect(api.createAiModel).not.toHaveBeenCalled();
    expect(ui.warning).toHaveBeenCalledWith("请填写模型 id");
  });

  it("刷新列表不会丢掉其他角色正在填写的新增表单", async () => {
    api.setDefaultAiModel.mockResolvedValue(model("reasoning-2", { isDefault: true }));
    const s = await setup();
    s.startCreate("image");
    s.states.image.form.modelId = "draft-model";

    await s.setDefault("reasoning", "reasoning-2");

    expect(s.states.image.editingId).toBe(NEW_ID);
    expect(s.states.image.form.modelId).toBe("draft-model");
  });

  it("切换默认嵌入模型时提示重建索引", async () => {
    api.setDefaultAiModel.mockResolvedValue(model("embedding-2", { isDefault: true }));
    const s = await setup();

    await s.setDefault("embedding", "embedding-2");

    expect(ui.warning).toHaveBeenCalledWith(expect.stringContaining("重建索引"));
  });

  it("删除：用户取消确认则不调接口", async () => {
    ui.confirm.mockRejectedValue("cancel");
    const s = await setup();

    await s.remove(MODELS[1]);

    expect(api.deleteAiModel).not.toHaveBeenCalled();
  });

  it("删除正在编辑的条目后回到默认那条", async () => {
    ui.confirm.mockResolvedValue("confirm");
    api.deleteAiModel.mockResolvedValue(null);
    const s = await setup();
    s.select("reasoning", "reasoning-2");

    api.getAiModels.mockResolvedValue(MODELS.filter((m) => m.id !== "reasoning-2"));
    await s.remove(MODELS[1]);

    expect(api.deleteAiModel).toHaveBeenCalledWith("reasoning-2");
    expect(s.states.reasoning.editingId).toBe("reasoning-1");
  });
});
