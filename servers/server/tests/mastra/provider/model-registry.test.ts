import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("model-registry", () => {
  it("warmModelConfigs：3 行都存在时直接读，不 create", async () => {
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

    expect(prismaMocks.create).toHaveBeenCalledTimes(3);
    const reasoningCreate = prismaMocks.create.mock.calls.find((c) => c[0].data.role === "reasoning")?.[0].data;
    expect(reasoningCreate).toMatchObject({ apiKey: "ds-key", baseUrl: "https://api.deepseek.com", modelId: "deepseek-v4-flash" });
    vi.unstubAllEnvs();
  });

  it("getModelConfigSync：未 warm 抛错", () => {
    expect(() => getModelConfigSync("reasoning")).toThrow(/未初始化/);
  });

  it("invalidateModelConfigs：清缓存后再读抛错", async () => {
    prismaMocks.findUnique.mockImplementation(({ where }: { where: { role: string } }) =>
      Promise.resolve(row(where.role))
    );
    await warmModelConfigs();
    expect(getModelConfigSync("vision").role).toBe("vision");

    invalidateModelConfigs();
    expect(() => getModelConfigSync("vision")).toThrow();
  });
});
