import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    largeScreen: { findUnique: vi.fn(), update: vi.fn() },
    largeScreenVersion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn()
    },
    layers: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    module: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn((arr: Promise<unknown>[]) => Promise.all(arr))
  }
}));

import {
  copyVersion,
  createVersion,
  deleteVersion,
  listVersion,
  publishVersion,
  updateVersion
} from "@/mastra/services/version.server";
import { prismaClient } from "@/mastra/storage/prisma";

const now = new Date("2025-01-01T00:00:00.000Z");
const screen = (over: Record<string, unknown> = {}) => ({ id: 1, versionCode: "1", ...over });
const versionRow = (over: Record<string, unknown> = {}) => ({
  id: 10,
  largeId: 1,
  versionCode: "1",
  versionDesc: "初版",
  config: [],
  detail: null,
  backgroundUrl: null,
  sceneInfo: null,
  statusAnimation: null,
  aniFrameSet: null,
  dataFilterArr: null,
  encodedControl: null,
  minioIds: null,
  status: false,
  password: null,
  expirationTime: null,
  publishInfo: null,
  createdBy: "onweekend",
  createdTime: now,
  updatedBy: "onweekend",
  updatedTime: now,
  ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screen() as never);
  vi.mocked(prismaClient.largeScreen.update).mockResolvedValue(screen() as never);
  vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(versionRow() as never);
  vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([versionRow()] as never);
  vi.mocked(prismaClient.largeScreenVersion.create).mockImplementation(
    (({ data }: { data: Record<string, unknown> }) => Promise.resolve(versionRow(data))) as never
  );
  vi.mocked(prismaClient.largeScreenVersion.update).mockResolvedValue(versionRow() as never);
  vi.mocked(prismaClient.largeScreenVersion.deleteMany).mockResolvedValue({ count: 1 } as never);
  vi.mocked(prismaClient.layers.deleteMany).mockResolvedValue({ count: 0 } as never);
});

describe("version.server（多版本）", () => {
  it("listVersion 返回版本行数组", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([
      versionRow({ versionCode: "1" }),
      versionRow({ versionCode: "2", password: "x" })
    ] as never);
    const res = await listVersion(1);
    expect(res.result).toHaveLength(2);
    expect(res.result[1].versionCode).toBe("2");
    expect(res.result[1].hasPassword).toBe(true);
  });

  it("listVersion 大屏不存在 → 抛", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(null as never);
    await expect(listVersion(9)).rejects.toThrow();
  });

  it("createVersion 用 max+1 版本号建新版本行并镜像", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([
      { versionCode: "1" },
      { versionCode: "2" }
    ] as never);
    const res = await createVersion(1, "onweekend");
    expect(res.result?.versionCode).toBe("3");
    const createArg = vi.mocked(prismaClient.largeScreenVersion.create).mock.calls.at(-1)?.[0].data as Record<
      string,
      unknown
    >;
    expect(createArg.versionCode).toBe("3");
    // 切到新版本：镜像回 large_screen
    expect(vi.mocked(prismaClient.largeScreen.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versionCode: "3" }) })
    );
  });

  it("createVersion 是空白大屏：config 置空、不拷 layers", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(
      versionRow({ config: [11, 22], detail: { width: 1920 } }) as never
    );
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([
      { id: 11, moduleId: 75, config: {}, versionCode: "1" }
    ] as never);
    await createVersion(1, "onweekend");
    const createArg = vi.mocked(prismaClient.largeScreenVersion.create).mock.calls.at(-1)?.[0].data as Record<
      string,
      unknown
    >;
    expect(createArg.config).toEqual([]);
    expect(createArg.detail).toEqual({ width: 1920 });
    expect(vi.mocked(prismaClient.layers.create)).not.toHaveBeenCalled();
  });

  it("copyVersion 深拷源版本 layers（生成新 id）", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([
      { versionCode: "1" },
      { versionCode: "2" }
    ] as never);
    vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(
      versionRow({ versionCode: "2", config: [11] }) as never
    );
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([
      { id: 11, userId: 1, moduleId: 75, config: { id: 11 }, minioIds: [], dataJson: {}, versionCode: "2" }
    ] as never);
    vi.mocked(prismaClient.layers.create).mockResolvedValue({ id: 99 } as never);
    await copyVersion(1, "2", "onweekend");
    expect(vi.mocked(prismaClient.layers.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versionCode: "3" }) })
    );
  });

  it("updateVersion 写 versionDesc", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(
      versionRow({ versionDesc: "新说明" }) as never
    );
    const res = await updateVersion(1, "1", "新说明", "onweekend");
    expect(res.result?.versionDesc).toBe("新说明");
    expect(vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data).toMatchObject({
      versionDesc: "新说明"
    });
  });

  it("deleteVersion 唯一版本 → 抛", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([{ versionCode: "1" }] as never);
    await expect(deleteVersion(1, "1")).rejects.toThrow();
  });

  it("deleteVersion 非唯一 → 删版本行 + 该版本 layers", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([
      { versionCode: "1" },
      { versionCode: "2" }
    ] as never);
    await deleteVersion(1, "2");
    expect(vi.mocked(prismaClient.layers.deleteMany)).toHaveBeenCalledWith({
      where: { largeId: 1, versionCode: "2" }
    });
    expect(vi.mocked(prismaClient.largeScreenVersion.deleteMany)).toHaveBeenCalledWith({
      where: { largeId: 1, versionCode: "2" }
    });
  });

  it("publishVersion 置当前版本 status=true", async () => {
    vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(
      versionRow({ status: true }) as never
    );
    const res = await publishVersion(1, "onweekend", { path: "/p" });
    expect(res.result?.status).toBe(true);
    expect(vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data).toMatchObject({ status: true });
  });
});
