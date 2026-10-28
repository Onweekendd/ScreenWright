import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  aiModelFindUnique: vi.fn(),
  findMany: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn()
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    aiModel: { findUnique: prismaMocks.aiModelFindUnique },
    threadModel: {
      findMany: prismaMocks.findMany,
      upsert: prismaMocks.upsert,
      deleteMany: prismaMocks.deleteMany
    }
  }
}));

import { AiModelNotFoundError } from "@/mastra/services/ai-model/ai-model.server";
import {
  getThreadModels,
  initThreadModels,
  setThreadModel,
  ThreadModelRoleMismatchError
} from "@/mastra/services/ai-model/thread-model.server";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMocks.findMany.mockResolvedValue([]);
  prismaMocks.aiModelFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
    Promise.resolve({ id: where.id, role: where.id.split("-")[0] })
  );
});

describe("thread-model.server", () => {
  it("getThreadModels：行转成角色 → 配置 id，忽略不可按对话选择的角色", async () => {
    prismaMocks.findMany.mockResolvedValue([
      { threadId: "t1", role: "reasoning", aiModelId: "reasoning-2" },
      { threadId: "t1", role: "embedding", aiModelId: "embedding-2" }
    ]);

    expect(await getThreadModels("t1")).toEqual({ reasoning: "reasoning-2" });
    expect(prismaMocks.findMany).toHaveBeenCalledWith({ where: { threadId: "t1" } });
  });

  it("setThreadModel：按 (threadId, role) upsert", async () => {
    await setThreadModel("t1", "image", "image-2");

    expect(prismaMocks.upsert).toHaveBeenCalledWith({
      where: { threadId_role: { threadId: "t1", role: "image" } },
      create: { threadId: "t1", role: "image", aiModelId: "image-2" },
      update: { aiModelId: "image-2" }
    });
  });

  it("setThreadModel：传 null 删行，回到默认", async () => {
    await setThreadModel("t1", "reasoning", null);

    expect(prismaMocks.deleteMany).toHaveBeenCalledWith({ where: { threadId: "t1", role: "reasoning" } });
    expect(prismaMocks.upsert).not.toHaveBeenCalled();
  });

  it("setThreadModel：配置角色与目标角色不符时拒绝（不能把生图配置当推理模型）", async () => {
    await expect(setThreadModel("t1", "reasoning", "image-1")).rejects.toBeInstanceOf(ThreadModelRoleMismatchError);
    expect(prismaMocks.upsert).not.toHaveBeenCalled();
  });

  it("setThreadModel：配置不存在时报 AiModelNotFoundError", async () => {
    prismaMocks.aiModelFindUnique.mockResolvedValue(null);
    await expect(setThreadModel("t1", "video", "video-9")).rejects.toBeInstanceOf(AiModelNotFoundError);
  });

  it("initThreadModels：只写传了的角色", async () => {
    await initThreadModels("t1", { reasoning: "reasoning-2", video: "video-3" });

    expect(prismaMocks.upsert.mock.calls.map(([arg]) => arg.create)).toEqual([
      { threadId: "t1", role: "reasoning", aiModelId: "reasoning-2" },
      { threadId: "t1", role: "video", aiModelId: "video-3" }
    ]);
  });
});
