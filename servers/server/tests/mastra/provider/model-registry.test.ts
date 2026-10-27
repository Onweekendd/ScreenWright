import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn()
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    aiModel: {
      findUnique: prismaMocks.findUnique,
      create: prismaMocks.create
    }
  }
}));

import {
  getModelConfigSync,
  invalidateModelConfigs,
  MODEL_ROLES,
  resolveEmbeddingModel,
  warmModelConfigs
} from "@/mastra/provider/model-registry";

const row = (role: string, over: Record<string, unknown> = {}) => ({
  role,
  baseUrl: "https://x/v1",
  apiKey: "k",
  modelId: "m",
  contextLength: null,
  dimensions: null,
  ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  invalidateModelConfigs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("model-registry", () => {
  it("embedding-3 的配置维度进入真实 SDK 请求，建库与检索都返回 1024 维", async () => {
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role, { modelId: "embedding-3", dimensions: 1024 }))
    );
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
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role, { modelId: "embedding-3", dimensions: 1024 }))
    );
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
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role))
    );

    await warmModelConfigs();

    expect(prismaMocks.create).not.toHaveBeenCalled();
    for (const role of MODEL_ROLES) {
      expect(getModelConfigSync(role).modelId).toBe("m");
    }
  });

  it("warmModelConfigs：缺行时用 env 兜底 create", async () => {
    vi.stubEnv("REASONING_MODEL_API_KEY", "ds-key");
    vi.stubEnv("REASONING_MODEL_BASE_URL", "https://api.deepseek.com");
    prismaMocks.findUnique.mockResolvedValue(null);
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
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role))
    );
    await warmModelConfigs();

    // 第二次重读卡在查库上：生图 worker 每个任务开始前都会这样重读一次
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    prismaMocks.findUnique.mockImplementation(async ({ where }: { where: { role: string } }) => {
      await gate;
      return row(where.role, { modelId: "m2" });
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
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(where.role === "video" ? null : row(where.role, { baseUrl: "https://images.example/v1" }))
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
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(where.role === "video" ? null : row(where.role))
    );
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve(data));
    await warmModelConfigs();
    expect(getModelConfigSync("video")).toMatchObject({
      baseUrl: "https://video.example/api/v3",
      apiKey: "video-key",
      modelId: "video-model"
    });

    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role))
    );
    await warmModelConfigs();
    expect(getModelConfigSync("video")).toMatchObject({ baseUrl: "https://x/v1", apiKey: "k", modelId: "m" });
    expect(prismaMocks.create).toHaveBeenCalledTimes(1);
  });

  it("getModelConfigSync：未 warm 抛错", () => {
    expect(() => getModelConfigSync("reasoning")).toThrow(/未初始化/);
  });

  it("invalidateModelConfigs：清缓存后再读抛错", async () => {
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role))
    );
    await warmModelConfigs();
    expect(getModelConfigSync("reasoning").role).toBe("reasoning");

    invalidateModelConfigs();
    expect(() => getModelConfigSync("reasoning")).toThrow();
  });
});
