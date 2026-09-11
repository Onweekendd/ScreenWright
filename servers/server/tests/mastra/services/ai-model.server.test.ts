import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { listAiModels, updateAiModel } from "@/mastra/services/ai-model.server";

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
  prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) => Promise.resolve(row(where.role)));
  prismaMocks.findMany.mockResolvedValue([row("reasoning"), row("vision"), row("embedding")]);
});

describe("ai-model.server", () => {
  it("listAiModels：不回传 key 明文/片段，只给 hasApiKey", async () => {
    const list = await listAiModels();
    expect(list).toHaveLength(3);
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
});
