import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    minioFile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn()
    },
    minioGroup: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
  }
}));

vi.mock("@/lib/storage/blob-store", () => ({
  blobUrl: (k: string) => `http://localhost:4111/blobs/${k}`,
  saveBlob: vi
    .fn()
    .mockResolvedValue({ key: "bi-assets/abc.png", url: "http://localhost:4111/blobs/bi-assets/abc.png", size: 123 }),
  deleteBlob: vi.fn()
}));

import { deleteBlob, saveBlob } from "@/lib/storage/blob-store";
import { addGroup, deleteFile, listGroups, pageFiles, uploadFile, usedSize } from "@/mastra/services/assets.server";
import { prismaClient } from "@/mastra/storage/prisma";

const now = new Date("2025-01-01T00:00:00.000Z");
const fileRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  userId: 1,
  name: "图1",
  fileName: "png",
  url: "http://localhost:4111/blobs/bi-assets/abc.png",
  blobKey: "bi-assets/abc.png",
  resourceType: 1,
  fileType: 1,
  auth: null,
  largeId: null,
  groupId: null,
  cover: null,
  coverName: null,
  resourceSize: 123,
  layerIds: [],
  largeUseIds: null,
  createdBy: "admin",
  createdTime: now,
  updatedBy: "admin",
  updatedTime: now,
  ...over
});

beforeEach(() => vi.clearAllMocks());

describe("pageFiles", () => {
  it("MyBatis 分页 + assetItem 形状", async () => {
    vi.mocked(prismaClient.minioFile.count).mockResolvedValue(1);
    vi.mocked(prismaClient.minioFile.findMany).mockResolvedValue([fileRow() as never]);
    const res = await pageFiles(1, { current: 1, size: 20, groupId: 0 });
    expect(res.result.total).toBe(1);
    expect(res.result.records[0].url).toContain("/blobs/");
    expect(typeof res.result.records[0].layerIds).toBe("string");
  });
});

describe("uploadFile", () => {
  it("写 blob 并落库，url 用 blob 地址", async () => {
    vi.mocked(prismaClient.minioFile.create).mockResolvedValue(fileRow() as never);
    const file = new File([new Uint8Array([1, 2, 3])], "x.png", { type: "image/png" });
    const res = await uploadFile(1, "admin", file, { name: "图1", groupId: 0, fileType: 1 });
    expect(saveBlob).toHaveBeenCalled();
    const data = vi.mocked(prismaClient.minioFile.create).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.blobKey).toBe("bi-assets/abc.png");
    expect(data.resourceSize).toBe(123);
    expect(res.result.name).toBe("图1");
  });
});

describe("deleteFile", () => {
  it("非 owner → 404，不删 blob", async () => {
    vi.mocked(prismaClient.minioFile.findUnique).mockResolvedValue(fileRow({ userId: 2 }) as never);
    await expect(deleteFile(1, 1)).rejects.toThrow();
    expect(deleteBlob).not.toHaveBeenCalled();
  });
  it("owner → 删 blob + 删行", async () => {
    vi.mocked(prismaClient.minioFile.findUnique).mockResolvedValue(fileRow() as never);
    await deleteFile(1, 1);
    expect(deleteBlob).toHaveBeenCalledWith("bi-assets/abc.png");
    expect(prismaClient.minioFile.delete).toHaveBeenCalled();
  });
});

describe("usedSize", () => {
  it("汇总 resourceSize", async () => {
    vi.mocked(prismaClient.minioFile.findMany).mockResolvedValue([
      { resourceSize: 100 },
      { resourceSize: 250 }
    ] as never);
    const res = await usedSize(1);
    expect(res.result.size).toBe(350);
  });
});

describe("addGroup", () => {
  it("落库返回 {id,name,type}", async () => {
    vi.mocked(prismaClient.minioGroup.create).mockResolvedValue({ id: 3, name: "G", type: 0 } as never);
    const res = await addGroup(1, "admin", "G", 0);
    expect(res.result).toEqual({ id: 3, name: "G", type: 0 });
  });
});

describe("listGroups（素材树）", () => {
  it("只返回 pageGroups（场景/系统素材开源版已移除），对齐 handleAssetsData", async () => {
    vi.mocked(prismaClient.minioGroup.findMany).mockResolvedValue([{ id: 7, name: "P1", type: 1 } as never]);
    vi.mocked(prismaClient.minioFile.count).mockResolvedValue(0);
    const res = await listGroups(1);
    expect(res.result.pageGroups.list).toHaveLength(1);
  });
});
