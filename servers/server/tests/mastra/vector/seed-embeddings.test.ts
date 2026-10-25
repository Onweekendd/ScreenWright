import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  doEmbed: vi.fn(),
  resolveEmbeddingModel: vi.fn(),
  listIndexes: vi.fn(),
  describeIndex: vi.fn(),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  upsert: vi.fn()
}));
vi.mock("node:fs", () => ({
  default: {
    readdirSync: () => [{ name: "chart.md", isDirectory: () => false, isFile: () => true }],
    readFileSync: () => "图表组件文档"
  }
}));
vi.mock("@/mastra/provider/model-registry", () => ({
  getModelConfigSync: () => ({ dimensions: 1024 }),
  resolveEmbeddingModel: mocks.resolveEmbeddingModel
}));
vi.mock("@/mastra/vector/index", () => ({ vector: mocks }));

import { seedComponentEmbeddings } from "@/mastra/vector/seed-embeddings";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.resolveEmbeddingModel.mockReturnValue({ doEmbed: mocks.doEmbed });
  mocks.doEmbed.mockResolvedValue({ embeddings: [Array(1024).fill(0.1)] });
  mocks.listIndexes.mockResolvedValue(["component_docs"]);
  mocks.describeIndex.mockResolvedValue({ dimension: 1024, count: 1 });
});

describe("组件向量重建前的维度检查", () => {
  it("输出维度不符时在删旧索引前停止，不逐条重试整批文档", async () => {
    mocks.doEmbed.mockResolvedValue({ embeddings: [Array(2048).fill(0.1)] });

    await expect(seedComponentEmbeddings({ reset: true })).rejects.toThrow("返回 2048 维，但索引配置为 1024 维");
    expect(mocks.doEmbed).toHaveBeenCalledTimes(1);
    expect(mocks.listIndexes).not.toHaveBeenCalled();
    expect(mocks.deleteIndex).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("embedding 请求失败时保留旧索引", async () => {
    mocks.doEmbed.mockRejectedValue(new Error("upstream unavailable"));
    await expect(seedComponentEmbeddings({ reset: true })).rejects.toThrow("upstream unavailable");
    expect(mocks.deleteIndex).not.toHaveBeenCalled();
  });

  it("探测通过后重建，并固定使用同一份模型写入文档", async () => {
    const result = await seedComponentEmbeddings({ reset: true });
    expect(result).toEqual({ embedded: 1, failed: 0 });
    expect(mocks.resolveEmbeddingModel).toHaveBeenCalledTimes(1);
    expect(mocks.doEmbed).toHaveBeenCalledTimes(2);
    expect(mocks.deleteIndex).toHaveBeenCalledExactlyOnceWith({ indexName: "component_docs" });
    expect(mocks.createIndex).toHaveBeenCalledExactlyOnceWith({ indexName: "component_docs", dimension: 1024 });
    expect(mocks.upsert.mock.calls[0][0].vectors[0]).toHaveLength(1024);
  });
});
