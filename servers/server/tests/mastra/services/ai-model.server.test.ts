import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn()
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    aiModel: {
      findUnique: prismaMocks.findUnique,
      findMany: prismaMocks.findMany,
      count: prismaMocks.count,
      create: prismaMocks.create,
      update: prismaMocks.update,
      updateMany: prismaMocks.updateMany,
      delete: prismaMocks.delete
    },
    $transaction: prismaMocks.transaction
  }
}));

import {
  AiModelNotFoundError,
  createAiModel,
  deleteAiModel,
  LastAiModelError,
  listAiModels,
  setDefaultAiModel,
  testAiModel,
  updateAiModel
} from "@/mastra/services/ai-model/ai-model.server";

const row = (role: string, over: Record<string, unknown> = {}) => ({
  id: `${role}-1`,
  role,
  name: "",
  baseUrl: "https://x/v1",
  apiKey: "sk-secret-1234",
  modelId: "m",
  contextLength: null,
  dimensions: null,
  isDefault: true,
  ...over
});

/** 按 id 查的 mock：id 形如 `${role}-n`，角色从 id 前缀推出 */
const roleOf = (id: string) => id.split("-")[0];
const mockFindById = (over: Record<string, unknown> = {}) =>
  prismaMocks.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
    Promise.resolve(row(roleOf(where.id), { id: where.id, ...over }))
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockFindById();
  prismaMocks.findMany.mockResolvedValue([
    row("reasoning"),
    row("reasoning", { id: "reasoning-2", modelId: "claude", isDefault: false }),
    row("vision"),
    row("embedding"),
    row("image"),
    row("video")
  ]);
  prismaMocks.update.mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
    Promise.resolve(row(roleOf(where.id), { id: where.id, ...data }))
  );
  prismaMocks.transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
});

afterEach(() => vi.unstubAllGlobals());

describe("ai-model.server", () => {
  it("连接测试使用表单中的临时维度，并检查模型返回值", async () => {
    mockFindById({ modelId: "embedding-3", dimensions: 2048 });
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ index: 0, embedding: Array(1024).fill(0.1) }]
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetch);

    const result = await testAiModel("embedding", { dimensions: 1024 }, "embedding-1");

    expect(result.ok).toBe(true);
    expect(JSON.parse(fetch.mock.calls[0][1].body).dimensions).toBe(1024);
    expect(prismaMocks.update).not.toHaveBeenCalled();
  });

  it("连接测试不能把维度不符误报成连接正常", async () => {
    mockFindById({ modelId: "embedding-3", dimensions: 1024 });
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

    const result = await testAiModel("embedding", {}, "embedding-1");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("请求 1024 维，但返回 2048 维");
  });

  it("连接测试不传 id 时不读库，只用表单值", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ task_id: "task-test" })));
    vi.stubGlobal("fetch", fetch);

    await testAiModel("video", { baseUrl: "https://llm-api.net/minimax/v2", apiKey: "sk-form", modelId: "MiniMax-H3" });

    expect(prismaMocks.findUnique).not.toHaveBeenCalled();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer sk-form");
  });

  it("listAiModels：同角色多条都返回，按角色顺序排列，丢弃未知角色", async () => {
    const list = await listAiModels();

    expect(list.map((model) => model.id)).toEqual(["reasoning-1", "reasoning-2", "embedding-1", "image-1", "video-1"]);
    expect(list.filter((model) => model.isDefault).map((model) => model.role)).toEqual([
      "reasoning",
      "embedding",
      "image",
      "video"
    ]);
  });

  it("listAiModels：不回传 key 明文/片段，只给 hasApiKey", async () => {
    const list = await listAiModels();
    expect(list.find((model) => model.role === "video")?.hasApiKey).toBe(true);
    expect(list[0].hasApiKey).toBe(true);
    const leaked = list[0] as unknown as Record<string, unknown>;
    expect(leaked.apiKey).toBeUndefined();
    expect(leaked.apiKeyMasked).toBeUndefined();
    expect(JSON.stringify(list)).not.toContain("1234");
  });

  it("updateAiModel：按 id 更新，空 apiKey 不覆盖旧值", async () => {
    await updateAiModel("reasoning-2", { modelId: "new-model", apiKey: "" });

    const call = prismaMocks.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "reasoning-2" });
    expect(call.data).not.toHaveProperty("apiKey");
    expect(call.data.modelId).toBe("new-model");
  });

  it("updateAiModel：传了 apiKey 则覆盖", async () => {
    await updateAiModel("reasoning-1", { apiKey: "sk-new" });
    expect(prismaMocks.update.mock.calls[0][0].data.apiKey).toBe("sk-new");
  });

  it("updateAiModel：id 不存在报 AiModelNotFoundError，不写库", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);
    await expect(updateAiModel("nope", { modelId: "x" })).rejects.toBeInstanceOf(AiModelNotFoundError);
    expect(prismaMocks.update).not.toHaveBeenCalled();
  });

  it("createAiModel：角色已有配置时新增的不是默认", async () => {
    prismaMocks.count.mockResolvedValue(1);
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(row("image", data))
    );

    const vo = await createAiModel("image", { modelId: "gpt-image-2", apiKey: "sk-img" });

    expect(prismaMocks.create.mock.calls[0][0].data).toMatchObject({
      role: "image",
      modelId: "gpt-image-2",
      apiKey: "sk-img",
      isDefault: false
    });
    expect(vo.isDefault).toBe(false);
  });

  it("createAiModel：角色没有配置时新增的自动成为默认", async () => {
    prismaMocks.count.mockResolvedValue(0);
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(row("video", data))
    );

    await createAiModel("video", { modelId: "MiniMax-H3" });

    expect(prismaMocks.create.mock.calls[0][0].data.isDefault).toBe(true);
  });

  it("createAiModel：没填 apiKey 时从 copyKeyFrom 那条复制密钥（可跨角色），返回值不含密钥", async () => {
    prismaMocks.count.mockResolvedValue(1);
    mockFindById({ apiKey: "sk-shared" });
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(row("embedding", data))
    );

    const vo = await createAiModel("embedding", { modelId: "embedding-3", copyKeyFrom: "reasoning-1" });

    expect(prismaMocks.create.mock.calls[0][0].data.apiKey).toBe("sk-shared");
    expect(JSON.stringify(vo)).not.toContain("sk-shared");
  });

  it("createAiModel：填了 apiKey 时忽略 copyKeyFrom", async () => {
    prismaMocks.count.mockResolvedValue(1);
    prismaMocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(row("image", data))
    );

    await createAiModel("image", { modelId: "m", apiKey: "sk-own", copyKeyFrom: "reasoning-1" });

    expect(prismaMocks.findUnique).not.toHaveBeenCalled();
    expect(prismaMocks.create.mock.calls[0][0].data.apiKey).toBe("sk-own");
  });

  it("setDefaultAiModel：同一事务里清掉同角色旧默认再设新默认", async () => {
    const vo = await setDefaultAiModel("reasoning-2");

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1);
    expect(prismaMocks.updateMany).toHaveBeenCalledWith({
      where: { role: "reasoning", isDefault: true },
      data: { isDefault: false }
    });
    expect(prismaMocks.update).toHaveBeenCalledWith({ where: { id: "reasoning-2" }, data: { isDefault: true } });
    expect(vo.isDefault).toBe(true);
  });

  it("deleteAiModel：角色只剩一条时拒绝删除", async () => {
    prismaMocks.count.mockResolvedValue(1);
    await expect(deleteAiModel("image-1")).rejects.toBeInstanceOf(LastAiModelError);
    expect(prismaMocks.delete).not.toHaveBeenCalled();
  });

  it("deleteAiModel：还有其他配置时删除", async () => {
    prismaMocks.count.mockResolvedValue(2);
    await deleteAiModel("reasoning-2");
    expect(prismaMocks.delete).toHaveBeenCalledWith({ where: { id: "reasoning-2" } });
  });

  it("视频测试向任务接口提交临时配置，未重填的密钥使用该条已存值", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ task_id: "task-test" })));
    vi.stubGlobal("fetch", fetch);

    const result = await testAiModel(
      "video",
      {
        baseUrl: "https://llm-api.net//minimax/v2/video_generation",
        modelId: "MiniMax-H3"
      },
      "video-1"
    );

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://llm-api.net/minimax/v2/video_generation");
    expect(request.method).toBe("POST");
    expect(request.headers.Authorization).toBe("Bearer sk-secret-1234");
    expect(JSON.parse(request.body)).toMatchObject({ model: "MiniMax-H3", duration: 5, resolution: "768P" });
    expect(prismaMocks.findUnique).toHaveBeenCalledWith({ where: { id: "video-1" } });
    expect(prismaMocks.update).not.toHaveBeenCalled();
  });

  it("视频测试拒绝 HTTP 错误以及没有任务 ID 的响应", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-invalid" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "model unavailable" } })));
    vi.stubGlobal("fetch", fetch);

    expect(await testAiModel("video", {}, "video-1")).toMatchObject({
      ok: false,
      error: expect.stringContaining("HTTP 401")
    });
    expect(await testAiModel("video", {}, "video-1")).toMatchObject({
      ok: false,
      error: expect.stringContaining("model unavailable")
    });
  });
});
