import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  upsert: vi.fn()
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    aiModel: {
      findUnique: prismaMocks.findUnique,
      findMany: prismaMocks.findMany,
      create: prismaMocks.create,
      upsert: prismaMocks.upsert
    }
  }
}));

import { listAiModels, testAiModel, updateAiModel } from "@/mastra/services/ai-model.server";

const row = (role: string, over: Record<string, unknown> = {}) => ({
  role,
  baseUrl: "https://x/v1",
  apiKey: "sk-secret-1234",
  modelId: "m",
  contextLength: null,
  dimensions: null,
  ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
    Promise.resolve(row(where.role))
  );
  prismaMocks.findMany.mockResolvedValue([
    row("reasoning"),
    row("vision"),
    row("embedding"),
    row("image"),
    row("video")
  ]);
});

afterEach(() => vi.unstubAllGlobals());

describe("ai-model.server", () => {
  it("连接测试使用表单中的临时维度，并检查模型返回值", async () => {
    prismaMocks.findUnique.mockResolvedValue(row("embedding", { modelId: "embedding-3", dimensions: 2048 }));
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ index: 0, embedding: Array(1024).fill(0.1) }]
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetch);

    const result = await testAiModel("embedding", { dimensions: 1024 });

    expect(result.ok).toBe(true);
    expect(JSON.parse(fetch.mock.calls[0][1].body).dimensions).toBe(1024);
    expect(prismaMocks.upsert).not.toHaveBeenCalled();
  });

  it("连接测试不能把维度不符误报成连接正常", async () => {
    prismaMocks.findUnique.mockResolvedValue(row("embedding", { modelId: "embedding-3", dimensions: 1024 }));
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

    const result = await testAiModel("embedding", {});

    expect(result.ok).toBe(false);
    expect(result.error).toContain("请求 1024 维，但返回 2048 维");
  });

  it("listAiModels：不回传 key 明文/片段，只给 hasApiKey", async () => {
    const list = await listAiModels();
    expect(list).toHaveLength(5);
    expect(list.find((model) => model.role === "video")?.hasApiKey).toBe(true);
    expect(list[0].hasApiKey).toBe(true);
    const leaked = list[0] as unknown as Record<string, unknown>;
    expect(leaked.apiKey).toBeUndefined();
    expect(leaked.apiKeyMasked).toBeUndefined();
    expect(JSON.stringify(list)).not.toContain("1234");
  });

  it("updateAiModel：空 apiKey 不覆盖旧值", async () => {
    prismaMocks.upsert.mockResolvedValue(row("reasoning", { modelId: "new-model" }));
    await updateAiModel("reasoning", { modelId: "new-model", apiKey: "" });

    const call = prismaMocks.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ role: "reasoning" });
    expect(call.update).not.toHaveProperty("apiKey");
    expect(call.update.modelId).toBe("new-model");
  });

  it("updateAiModel：传了 apiKey 则覆盖", async () => {
    prismaMocks.upsert.mockResolvedValue(row("vision"));
    await updateAiModel("vision", { apiKey: "sk-new" });
    expect(prismaMocks.upsert.mock.calls[0][0].update.apiKey).toBe("sk-new");
  });

  it("视频测试向任务接口提交临时配置，未重填的密钥使用 video 角色已存值", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ task_id: "task-test" })));
    vi.stubGlobal("fetch", fetch);

    const result = await testAiModel("video", {
      baseUrl: "https://llm-api.net//minimax/v2/video_generation",
      modelId: "MiniMax-H3"
    });

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://llm-api.net/minimax/v2/video_generation");
    expect(request.method).toBe("POST");
    expect(request.headers.Authorization).toBe("Bearer sk-secret-1234");
    expect(JSON.parse(request.body)).toMatchObject({ model: "MiniMax-H3", duration: 5, resolution: "768P" });
    expect(prismaMocks.findUnique).toHaveBeenCalledWith({ where: { role: "video" } });
    expect(prismaMocks.upsert).not.toHaveBeenCalled();
  });

  it("视频测试拒绝 HTTP 错误以及没有任务 ID 的响应", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-invalid" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "model unavailable" } })));
    vi.stubGlobal("fetch", fetch);

    expect(await testAiModel("video", {})).toMatchObject({ ok: false, error: expect.stringContaining("HTTP 401") });
    expect(await testAiModel("video", {})).toMatchObject({
      ok: false,
      error: expect.stringContaining("model unavailable")
    });
  });

  it("video 保存后热更新，空密钥保留旧值", async () => {
    prismaMocks.upsert.mockResolvedValue(row("video", { modelId: "new-video-model" }));
    await updateAiModel("video", { modelId: "new-video-model", apiKey: "" });
    expect(prismaMocks.upsert.mock.calls[0][0]).toMatchObject({
      where: { role: "video" },
      update: { modelId: "new-video-model" }
    });
    expect(prismaMocks.upsert.mock.calls[0][0].update).not.toHaveProperty("apiKey");
  });
});
