import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    layers: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    largeScreen: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    largeScreenVersion: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    module: {
      findFirst: vi.fn()
    }
  }
}));

import { copyLayer, deleteLayer, getLayer, saveLayer, updateLayer } from "@/mastra/services/layers.server";
import { prismaClient } from "@/mastra/storage/prisma";

const layerRow = (over: Record<string, unknown> = {}) => ({
  id: 100,
  userId: 1,
  moduleId: 75,
  largeId: 9001,
  config: { name: "柱状图" },
  minioIds: [],
  dataJson: {},
  versionCode: "1",
  createdBy: "admin",
  createdTime: new Date("2025-01-01T00:00:00.000Z"),
  updatedBy: "admin",
  updatedTime: new Date("2025-01-01T00:00:00.000Z"),
  ...over
});

/** 让 patchVersionConfig 里的 ensureVersionRow / 当前版本判定跑通：版本行 config 与传入一致，版本号 "1" */
const mockVersionConfig = (config: number[]) => {
  vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue({
    id: 10,
    largeId: 9001,
    versionCode: "1",
    config
  } as never);
  vi.mocked(prismaClient.largeScreenVersion.update).mockResolvedValue({ id: 10 } as never);
};

beforeEach(() => vi.clearAllMocks());

describe("saveLayer", () => {
  it("大屏不存在 → 401", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(null);
    await expect(saveLayer(1, "admin", { largeId: 9999, moduleId: 75 })).rejects.toThrow();
  });

  it("非动态面板组件：注入 id 到 config，并加入版本 config 数组（镜像到大屏）", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ id: 9001, config: [1, 2], versionCode: "1" } as never);
    vi.mocked(prismaClient.module.findFirst).mockResolvedValue({ javaScript: '{"name":"柱状图"}' } as never);
    vi.mocked(prismaClient.layers.create).mockResolvedValue(layerRow() as never);
    vi.mocked(prismaClient.layers.update).mockResolvedValue(layerRow({ config: { name: "柱状图", id: 100 } }) as never);
    mockVersionConfig([1, 2]);

    const res = await saveLayer(1, "admin", { largeId: 9001, moduleId: 75, status: false }, "1");
    expect(res.success).toBe(true);
    const cfg = JSON.parse(res.result!.config);
    expect(cfg.id).toBe(100);
    // 版本 config 追加了组件 id
    const vUpd = vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data as { config: number[] };
    expect(vUpd.config).toEqual([1, 2, 100]);
    // 当前版本 → 镜像到大屏
    const upd = vi.mocked(prismaClient.largeScreen.update).mock.calls[0][0].data as { config: number[] };
    expect(upd.config).toEqual([1, 2, 100]);
  });

  it("动态面板内组件（status=true）：不进 config 数组", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ id: 9001, config: [], versionCode: "1" } as never);
    vi.mocked(prismaClient.module.findFirst).mockResolvedValue(null);
    vi.mocked(prismaClient.layers.create).mockResolvedValue(layerRow() as never);
    vi.mocked(prismaClient.layers.update).mockResolvedValue(layerRow() as never);

    await saveLayer(1, "admin", { largeId: 9001, moduleId: 75, status: true, config: '{"x":1}' }, "1");
    expect(prismaClient.largeScreenVersion.update).not.toHaveBeenCalled();
    expect(prismaClient.largeScreen.update).not.toHaveBeenCalled();
  });
});

describe("updateLayer", () => {
  it("组件不存在 → 404", async () => {
    vi.mocked(prismaClient.layers.findUnique).mockResolvedValue(null);
    await expect(updateLayer("admin", { id: 999 })).rejects.toThrow();
  });

  it("只更新传入的字段", async () => {
    vi.mocked(prismaClient.layers.findUnique).mockResolvedValue(layerRow() as never);
    vi.mocked(prismaClient.layers.update).mockResolvedValue(layerRow({ config: { a: 2 } }) as never);
    await updateLayer("admin", { id: 100, config: '{"a":2}' });
    const data = vi.mocked(prismaClient.layers.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.config).toEqual({ a: 2 });
    expect(data.dataJson).toBeUndefined();
  });
});

describe("getLayer", () => {
  it("返回 GroupCase 形状，config 字符串化", async () => {
    vi.mocked(prismaClient.layers.findUnique).mockResolvedValue(layerRow() as never);
    const res = await getLayer(100);
    expect(res.result!.id).toBe(100);
    expect(typeof res.result!.config).toBe("string");
    expect(typeof res.result!.minioIds).toBe("string");
  });
});

describe("deleteLayer", () => {
  it("删行并从版本 config 移除（镜像到大屏）", async () => {
    vi.mocked(prismaClient.layers.findUnique).mockResolvedValue(layerRow({ largeId: 9001, versionCode: "1" }) as never);
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ id: 9001, config: [100, 200], versionCode: "1" } as never);
    mockVersionConfig([100, 200]);
    const res = await deleteLayer(100);
    expect(res.success).toBe(true);
    expect(prismaClient.layers.delete).toHaveBeenCalledWith({ where: { id: 100 } });
    const vUpd = vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data as { config: number[] };
    expect(vUpd.config).toEqual([200]);
  });

  it("目标行不存在 → 幂等返回成功，不抛错、不删行", async () => {
    vi.mocked(prismaClient.layers.findUnique).mockResolvedValue(null);
    const res = await deleteLayer(40);
    expect(res.success).toBe(true);
    expect(prismaClient.layers.delete).not.toHaveBeenCalled();
  });
});

describe("copyLayer", () => {
  it("生成新 id 并注入 config；isSaved 时加入 config 数组", async () => {
    vi.mocked(prismaClient.layers.findUnique).mockResolvedValue(
      layerRow({ id: 100, config: { name: "A", id: 100 }, versionCode: "1" }) as never
    );
    vi.mocked(prismaClient.layers.create).mockResolvedValue(layerRow({ id: 101 }) as never);
    vi.mocked(prismaClient.layers.update).mockResolvedValue(
      layerRow({ id: 101, config: { name: "A", id: 101 } }) as never
    );
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ id: 9001, config: [100], versionCode: "1" } as never);
    mockVersionConfig([100]);

    const res = await copyLayer(100, 1, false);
    expect(JSON.parse(res.result!.config).id).toBe(101);
    const vUpd = vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data as { config: number[] };
    expect(vUpd.config).toEqual([100, 101]);
  });
});
