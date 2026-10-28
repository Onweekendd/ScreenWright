import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn()
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    aiModel: {
      findMany: prismaMocks.findMany,
      create: prismaMocks.create,
      update: prismaMocks.update
    }
  }
}));

import {
  getModelConfigSync,
  invalidateModelConfigs,
  MODEL_ROLES,
  resolveEmbeddingModel,
  resolveModelConfig,
  resolveReasoningModel,
  warmModelConfigs
} from "@/mastra/provider/model-registry";

const row = (role: string, over: Record<string, unknown> = {}) => ({
  id: `${role}-1`,
  role,
  name: "",
  baseUrl: "https://x/v1",
  apiKey: "k",
  modelId: "m",
  contextLength: null,
  dimensions: null,
  isDefault: true,
  ...over
});

/** 每个角色一条默认配置 */
const allRoles = (over: Record<string, unknown> = {}) => MODEL_ROLES.map((role) => row(role, over));

beforeEach(() => {
  vi.clearAllMocks();
  invalidateModelConfigs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("model-registry", () => {
  it.each([
    { name: "没有思考字段", deltas: [{ content: "主标题已改为那拉提·文旅数据中心。" }], reasoning: "" },
    {
      name: "思考字段为 null",
      deltas: [{ reasoning_content: null, content: "主标题已改为那拉提·文旅数据中心。" }],
      reasoning: ""
    },
    {
      name: "空思考后输出正文",
      deltas: [{ reasoning_content: "" }, { content: "主标题已改为那拉提·文旅数据中心。" }],
      reasoning: ""
    },
    {
      name: "有思考再输出正文",
      deltas: [
        { reasoning_content: "检查标题" },
        { reasoning_content: "是否已更新" },
        { content: "主标题已改为那拉提·文旅数据中心。" }
      ],
      reasoning: "检查标题是否已更新"
    }
  ])("推理流正确区分正文和思考：$name", async ({ deltas, reasoning }) => {
    prismaMocks.findMany.mockResolvedValue(allRoles());
    await warmModelConfigs();
    vi.stubEnv("RECORD_LLM", "false");
    const event = (delta: Record<string, unknown>, finishReason: string | null = null) =>
      `data: ${JSON.stringify({
        id: "completion-test",
        object: "chat.completion.chunk",
        created: 1,
        model: "m",
        choices: [{ index: 0, delta, finish_reason: finishReason }]
      })}\n\n`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async () =>
          new Response(deltas.map((delta) => event(delta)).join("") + event({}, "stop") + "data: [DONE]\n\n", {
            headers: { "Content-Type": "text/event-stream" }
          })
      )
    );

    const { stream } = await resolveReasoningModel().doStream({
      prompt: [{ role: "user", content: [{ type: "text", text: "修改主标题" }] }]
    });
    let text = "";
    let thought = "";
    for await (const chunk of stream) {
      if (chunk.type === "text-delta") {
        text += chunk.delta;
      }
      if (chunk.type === "reasoning-delta") {
        thought += chunk.delta;
      }
      expect(chunk.type).not.toBe("error");
    }
    expect(text).toBe("主标题已改为那拉提·文旅数据中心。");
    expect(thought).toBe(reasoning);
  });

  it("embedding-3 的配置维度进入真实 SDK 请求，建库与检索都返回 1024 维", async () => {
    prismaMocks.findMany.mockResolvedValue(allRoles({ modelId: "embedding-3", dimensions: 1024 }));
    await warmModelConfigs();
    // 每次调用都需要新的 Response body。
    const fetch = vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            data: [{ index: 0, embedding: Array(1024).fill(0.1) }],
            usage: { prompt_tokens: 1, total_tokens: 1 }
          }),
          { headers: { "Content-Type": "application/json" } }
        )
    );
    vi.stubGlobal("fetch", fetch);

    for (const text of ["组件文档", "搜索柱状图"]) {
      const result = await resolveEmbeddingModel().doEmbed({
        values: [text],
        providerOptions: { openai: { user: "test-user" } }
      });
      expect(result.embeddings[0]).toHaveLength(1024);
    }
    for (const [, request] of fetch.mock.calls) {
      expect(JSON.parse(request.body)).toMatchObject({ model: "embedding-3", dimensions: 1024, user: "test-user" });
    }
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("服务商忽略 dimensions 时立即返回维度错误", async () => {
    prismaMocks.findMany.mockResolvedValue(allRoles({ modelId: "embedding-3", dimensions: 1024 }));
    await warmModelConfigs();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ index: 0, embedding: Array(2048).fill(0.1) }]
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(resolveEmbeddingModel().doEmbed({ values: ["查询"] })).rejects.toThrow("请求 1024 维，但返回 2048 维");
  });

  it("warmModelConfigs：所有角色都存在时直接读，不 create", async () => {
    prismaMocks.findMany.mockResolvedValue(allRoles());

    await warmModelConfigs();

    expect(prismaMocks.create).not.toHaveBeenCalled();
    for (const role of MODEL_ROLES) {
      expect(getModelConfigSync(role).modelId).toBe("m");
    }
  });

  it("warmModelConfigs：缺行时用 env 兜底 create", async () => {
    vi.stubEnv("REASONING_MODEL_API_KEY", "ds-key");
    vi.stubEnv("REASONING_MODEL_BASE_URL", "https://api.deepseek.com");
    prismaMocks.findMany.mockResolvedValue([]);
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve(data));

    await warmModelConfigs();

    expect(prismaMocks.create).toHaveBeenCalledTimes(MODEL_ROLES.length);
    const reasoningCreate = prismaMocks.create.mock.calls.find((c) => c[0].data.role === "reasoning")?.[0].data;
    expect(reasoningCreate).toMatchObject({
      apiKey: "ds-key",
      baseUrl: "https://api.deepseek.com",
      modelId: "deepseek-v4-flash"
    });
    vi.unstubAllEnvs();
  });

  it("warmModelConfigs：重读期间并发读缓存仍拿得到旧配置，读完才换成新的", async () => {
    prismaMocks.findMany.mockResolvedValue(allRoles());
    await warmModelConfigs();

    // 第二次重读卡在查库上：生图 worker 每个任务开始前都会这样重读一次
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    prismaMocks.findMany.mockImplementation(async () => {
      await gate;
      return allRoles({ modelId: "m2" });
    });
    const rewarm = warmModelConfigs();

    expect(getModelConfigSync("image").modelId).toBe("m");
    release();
    await rewarm;
    expect(getModelConfigSync("image").modelId).toBe("m2");
  });

  it("缺少 video 角色时沿用数据库里的生图网关和密钥，保存独立配置", async () => {
    for (const name of ["VIDEO_MODEL_BASE_URL", "VIDEO_MODEL_API_KEY", "VIDEO_MODEL_ID"]) {
      vi.stubEnv(name, "");
    }
    prismaMocks.findMany.mockResolvedValue(
      allRoles({ baseUrl: "https://images.example/v1" }).filter((r) => r.role !== "video")
    );
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve(data));

    await warmModelConfigs();

    expect(prismaMocks.create).toHaveBeenCalledTimes(1);
    expect(getModelConfigSync("video")).toMatchObject({
      role: "video",
      baseUrl: "https://images.example/minimax/v2",
      apiKey: "k",
      modelId: "MiniMax-H3"
    });
  });

  it("VIDEO_MODEL_* 仅用于初始化，已有 video 配置不被 env 或生图配置覆盖", async () => {
    vi.stubEnv("VIDEO_MODEL_BASE_URL", "https://video.example/api/v3");
    vi.stubEnv("VIDEO_MODEL_API_KEY", "video-key");
    vi.stubEnv("VIDEO_MODEL_ID", "video-model");
    prismaMocks.findMany.mockResolvedValue(allRoles().filter((r) => r.role !== "video"));
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve(data));
    await warmModelConfigs();
    expect(getModelConfigSync("video")).toMatchObject({
      baseUrl: "https://video.example/api/v3",
      apiKey: "video-key",
      modelId: "video-model"
    });

    prismaMocks.findMany.mockResolvedValue(allRoles());
    await warmModelConfigs();
    expect(getModelConfigSync("video")).toMatchObject({ baseUrl: "https://x/v1", apiKey: "k", modelId: "m" });
    expect(prismaMocks.create).toHaveBeenCalledTimes(1);
  });

  it("同角色多条配置：getModelConfigSync 取默认那条，resolveModelConfig 按 id 取", async () => {
    prismaMocks.findMany.mockResolvedValue([
      ...allRoles(),
      row("reasoning", { id: "reasoning-2", modelId: "claude", isDefault: false })
    ]);

    await warmModelConfigs();

    expect(getModelConfigSync("reasoning").modelId).toBe("m");
    expect(resolveModelConfig("reasoning", "reasoning-2").modelId).toBe("claude");
    expect(resolveModelConfig("reasoning").modelId).toBe("m");
  });

  it("resolveModelConfig：id 不存在或角色对不上时回退默认，不抛错", async () => {
    prismaMocks.findMany.mockResolvedValue(allRoles());
    await warmModelConfigs();

    expect(resolveModelConfig("reasoning", "deleted-id").id).toBe("reasoning-1");
    expect(resolveModelConfig("reasoning", "image-1").id).toBe("reasoning-1");
  });

  it("有配置但没有默认行时，把最早一条补为默认", async () => {
    prismaMocks.findMany.mockResolvedValue([
      ...allRoles().filter((r) => r.role !== "image"),
      row("image", { id: "image-old", modelId: "old", isDefault: false }),
      row("image", { id: "image-new", modelId: "new", isDefault: false })
    ]);
    prismaMocks.update.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(row("image", { id: where.id, modelId: "old", isDefault: true }))
    );

    await warmModelConfigs();

    expect(prismaMocks.update).toHaveBeenCalledWith({ where: { id: "image-old" }, data: { isDefault: true } });
    expect(getModelConfigSync("image").id).toBe("image-old");
    expect(resolveModelConfig("image", "image-new").modelId).toBe("new");
  });

  it("getModelConfigSync：未 warm 抛错", () => {
    expect(() => getModelConfigSync("reasoning")).toThrow(/未初始化/);
  });

  it("invalidateModelConfigs：清缓存后再读抛错", async () => {
    prismaMocks.findMany.mockResolvedValue(allRoles());
    await warmModelConfigs();
    expect(getModelConfigSync("reasoning").role).toBe("reasoning");

    invalidateModelConfigs();
    expect(() => getModelConfigSync("reasoning")).toThrow();
  });
});
