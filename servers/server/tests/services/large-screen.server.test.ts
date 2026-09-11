import { beforeEach, describe, expect, it, vi } from "vitest";

// mock 掉 prisma 单例，覆盖 service 用到的所有 model 方法
vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    largeScreen: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn()
    },
    largeGroup: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    largeScreenVersion: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn()
    },
    layers: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn()
    },
    module: {
      findMany: vi.fn().mockResolvedValue([])
    },
    $transaction: vi.fn((arr: Promise<unknown>[]) => Promise.all(arr))
  }
}));

import {
  createGroup,
  createScreen,
  deleteGroup,
  deleteScreen,
  getScreen,
  listGroups,
  listScreens,
  openCheck,
  openScreen,
  quoteInfo,
  updateScreen
} from "@/mastra/services/large-screen.server";
import { prismaClient } from "@/mastra/storage/prisma";

/** 构造一条 LargeScreen 行；config/detail 为对象，用于验证读取时的字符串化 */
const screenRow = () => ({
  id: 10,
  userId: 1,
  moduleId: null,
  config: { layers: [] },
  name: "测试大屏",
  detail: { x: 1 },
  backgroundUrl: null,
  sceneInfo: null,
  type: 1,
  stockType: 1,
  groupId: 0,
  password: null,
  invitationCode: "abc-123",
  status: false,
  expirationTime: null,
  sort: 0,
  versionCode: null,
  versionDesc: null,
  minioIds: null,
  dataFilterArr: null,
  aniFrameSet: null,
  newApplication: false,
  encodedControl: null,
  publishInfo: null,
  path: "",
  createdBy: "admin",
  createdTime: new Date("2025-01-01T00:00:00.000Z"),
  updatedBy: "admin",
  updatedTime: new Date("2025-01-01T00:00:00.000Z"),
  statusAnimation: null
});

/** 版本行：版本作用域字段与 screenRow 一致，versionCode "1" */
const versionRow = (over: Record<string, unknown> = {}) => ({
  id: 500,
  largeId: 10,
  versionCode: "1",
  versionDesc: null,
  config: { layers: [] },
  detail: { x: 1 },
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
  createdBy: "admin",
  createdTime: new Date("2025-01-01T00:00:00.000Z"),
  updatedBy: "admin",
  updatedTime: new Date("2025-01-01T00:00:00.000Z"),
  ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(versionRow() as never);
  vi.mocked(prismaClient.largeScreenVersion.create).mockResolvedValue(versionRow() as never);
  vi.mocked(prismaClient.largeScreenVersion.update).mockResolvedValue(versionRow() as never);
  vi.mocked(prismaClient.largeScreenVersion.findMany).mockResolvedValue([versionRow()] as never);
  vi.mocked(prismaClient.layers.findMany).mockResolvedValue([] as never);
});

describe("listScreens", () => {
  it("返回完整 MyBatis-Plus 分页形状，且 config 被字符串化", async () => {
    vi.mocked(prismaClient.largeScreen.count).mockResolvedValue(1);
    vi.mocked(prismaClient.largeScreen.findMany).mockResolvedValue([screenRow() as never]);
    const res = await listScreens(1, 1, { current: 1, size: 10 });
    expect(res.success).toBe(true);
    expect(res.result.total).toBe(1);
    expect(res.result.records).toHaveLength(1);
    expect(res.result.size).toBe(10);
    expect(res.result.current).toBe(1);
    expect(res.result.pages).toBe(1);
    expect(res.result.orders).toEqual([]);
    expect(res.result.optimizeCountSql).toBe(true);
    expect(res.result.searchCount).toBe(true);
    expect(res.result.maxLimit).toBeNull();
    expect(res.result.countId).toBeNull();
    // 对象 config → JSON 字符串
    const first = res.result.records[0] as { config: string };
    expect(typeof first.config).toBe("string");
    expect(JSON.parse(first.config)).toEqual({ layers: [] });
  });

  it("total 为 0 时 pages 为 0", async () => {
    vi.mocked(prismaClient.largeScreen.count).mockResolvedValue(0);
    vi.mocked(prismaClient.largeScreen.findMany).mockResolvedValue([]);
    const res = await listScreens(1, 1, { current: 1, size: 10 });
    expect(res.result.pages).toBe(0);
  });

  it("超管（role 0）不按 userId 过滤", async () => {
    vi.mocked(prismaClient.largeScreen.count).mockResolvedValue(0);
    vi.mocked(prismaClient.largeScreen.findMany).mockResolvedValue([]);
    await listScreens(1, 0, { current: 1, size: 10 });
    const where = vi.mocked(prismaClient.largeScreen.count).mock.calls[0][0]?.where;
    expect(where).toEqual({});
  });

  it("普通用户按 userId 过滤", async () => {
    vi.mocked(prismaClient.largeScreen.count).mockResolvedValue(0);
    vi.mocked(prismaClient.largeScreen.findMany).mockResolvedValue([]);
    await listScreens(5, 1, { current: 1, size: 10 });
    const where = vi.mocked(prismaClient.largeScreen.count).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ userId: 5 });
  });
});

describe("getScreen", () => {
  it("非 owner 且非超管 → 401", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), userId: 2 } as never);
    await expect(getScreen(1, 1, 10)).rejects.toThrow();
  });

  it("owner → 返回详情", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screenRow() as never);
    const res = await getScreen(1, 1, 10);
    expect(res.success).toBe(true);
    expect(res.result.name).toBe("测试大屏");
    expect(res.result.layers).toEqual([]);
  });

  it("超管可访问他人大屏", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), userId: 2 } as never);
    const res = await getScreen(1, 0, 10);
    expect(res.success).toBe(true);
  });

  it("versionCode 为空时回落 '1'（前端版本组件依赖非空版本号）", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screenRow() as never);
    const res = await getScreen(1, 1, 10);
    expect(res.result.versionCode).toBe("1");
  });

  it("不存在 → 抛错", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(null);
    await expect(getScreen(1, 1, 99)).rejects.toThrow();
  });

  it("组装 layers：把 Layers.config 作为组件对象数组返回", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screenRow() as never);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([
      { config: { id: 1, name: "A" } },
      { config: { id: 2, name: "B" } }
    ] as never);
    const res = await getScreen(1, 1, 10);
    expect(res.result.layers).toEqual([
      { id: 1, name: "A" },
      { id: 2, name: "B" }
    ]);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([]);
  });
});

describe("openScreen / openCheck", () => {
  it("openScreen 返回带 layers 的详情，无鉴权门槛", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), userId: 999 } as never);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([{ config: { id: 5 } }] as never);
    const res = await openScreen(10);
    expect(res.success).toBe(true);
    expect(res.result.layers).toEqual([{ id: 5 }]);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([]);
  });
  it("openCheck 恒为 true", async () => {
    const res = await openCheck(10);
    expect(res.result).toBe(true);
  });
  it("quoteInfo 返回被引用大屏的 config + layers", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), id: 7 } as never);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([{ config: { id: 9 } }] as never);
    const res = await quoteInfo(7);
    expect(res.result.id).toBe(7);
    expect(res.result.layers).toEqual([{ id: 9 }]);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([]);
  });
  it("quoteInfo 大屏不存在 → 抛", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(null);
    await expect(quoteInfo(999)).rejects.toThrow();
  });

  it("动态面板 panelData[].config 的子 id 回填成完整 config", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), id: 1, config: [2] } as never);
    vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(versionRow({ config: [2] }) as never);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([
      { id: 2, moduleId: 69, config: { id: 2, panelData: [{ id: "s1", name: "状态1", config: [3] }] } },
      { id: 3, moduleId: 1, config: { id: 3, name: "柱状图", component: { prop: "echartbar" } } }
    ] as never);
    vi.mocked(prismaClient.module.findMany).mockResolvedValue([
      { moduleId: 69, name: "动态面板" },
      { moduleId: 1, name: "柱状图" }
    ] as never);
    const res = await getScreen(1, 1, 1);
    expect(res.result.layers).toHaveLength(1); // 只顶层：面板本身
    const panel = res.result.layers[0] as { panelData: Array<{ config: unknown[] }> };
    expect(panel.panelData[0].config).toEqual([{ id: 3, name: "柱状图", component: { prop: "echartbar" } }]);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([]);
    vi.mocked(prismaClient.module.findMany).mockResolvedValue([]);
  });

  it("分组成员即使残留在大屏 config 顶层，也只通过 children 回填一次（不重复渲染）", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(
      { ...screenRow(), id: 1, config: [43, 2, 40] } as never
    );
    vi.mocked(prismaClient.largeScreenVersion.findUnique).mockResolvedValue(versionRow({ config: [43, 2, 40] }) as never);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([
      { id: 2, moduleId: 1, config: { id: 2, name: "柱状图" } },
      { id: 40, moduleId: 75, config: { id: 40, name: "分组", children: [43, 2] } },
      { id: 43, moduleId: 1, config: { id: 43, name: "折线柱形图" } }
    ] as never);
    vi.mocked(prismaClient.module.findMany).mockResolvedValue([
      { moduleId: 1, name: "柱状图" },
      { moduleId: 75, name: "分组" }
    ] as never);
    const res = await getScreen(1, 1, 1);
    expect(res.result.layers).toHaveLength(1); // 只剩分组本身
    const group = res.result.layers[0] as { id: number; children: Array<{ id: number }> };
    expect(group.id).toBe(40);
    expect(group.children.map((c) => c.id)).toEqual([43, 2]);
    vi.mocked(prismaClient.layers.findMany).mockResolvedValue([]);
    vi.mocked(prismaClient.module.findMany).mockResolvedValue([]);
  });
});

describe("createScreen", () => {
  it("生成 invitationCode，userId 取当前用户", async () => {
    vi.mocked(prismaClient.largeScreen.create).mockResolvedValue(screenRow() as never);
    const res = await createScreen(1, "admin", { name: "新大屏" });
    expect(res.success).toBe(true);
    const data = vi.mocked(prismaClient.largeScreen.create).mock.calls[0][0]?.data as Record<string, unknown>;
    expect(data.userId).toBe(1);
    expect(data.invitationCode).toBeTruthy();
    expect(typeof data.invitationCode).toBe("string");
  });
});

describe("updateScreen", () => {
  it("非 owner → 401", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), userId: 2 } as never);
    await expect(updateScreen(1, 1, "admin", { id: 10, name: "改名" })).rejects.toThrow();
  });

  it("owner → 版本作用域字段写版本行，身份字段写大屏", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screenRow() as never);
    vi.mocked(prismaClient.largeScreen.update).mockResolvedValue(screenRow() as never);
    const res = await updateScreen(1, 1, "admin", { id: 10, name: "改名", config: { a: 1 } });
    expect(res.success).toBe(true);
    // config → 版本行
    const vData = vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(vData.config).toEqual({ a: 1 });
    // name → 大屏身份行
    const sData = vi.mocked(prismaClient.largeScreen.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(sData.name).toBe("改名");
    expect(sData.config).toBeUndefined();
  });

  it("忽略前端惯例携带的 filterType（已废弃字段，不入库不报错）", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screenRow() as never);
    vi.mocked(prismaClient.largeScreen.update).mockResolvedValue(screenRow() as never);
    await updateScreen(1, 1, "admin", {
      id: 10,
      filterType: true,
      aniFrameSet: JSON.stringify({ animationList: [] })
    } as never);
    const vData = vi.mocked(prismaClient.largeScreenVersion.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(vData).not.toHaveProperty("filterType");
    expect(vData.aniFrameSet).toEqual({ animationList: [] });
  });
});

describe("deleteScreen", () => {
  it("非 owner → 401 且不删除", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue({ ...screenRow(), userId: 2 } as never);
    await expect(deleteScreen(1, 1, 10)).rejects.toThrow();
    expect(prismaClient.largeScreen.delete).not.toHaveBeenCalled();
  });

  it("owner → 删除成功", async () => {
    vi.mocked(prismaClient.largeScreen.findUnique).mockResolvedValue(screenRow() as never);
    vi.mocked(prismaClient.largeScreen.delete).mockResolvedValue(screenRow() as never);
    const res = await deleteScreen(1, 1, 10);
    expect(res.success).toBe(true);
  });
});

describe("groups", () => {
  it("listGroups 返回 {allCount, unCount, list}，每组附带大屏数量", async () => {
    vi.mocked(prismaClient.largeGroup.findMany).mockResolvedValue([
      { id: 5, userId: 1, name: "G1", type: 0, sort: 0 } as never
    ]);
    vi.mocked(prismaClient.largeScreen.count).mockResolvedValue(3);
    const res = await listGroups(1, 1);
    expect(res.success).toBe(true);
    expect(res.result.allCount).toBe(3);
    expect(res.result.unCount).toBe(3);
    expect(res.result.list[0].count).toBe(3);
  });

  it("createGroup 重名 → 抛 400", async () => {
    vi.mocked(prismaClient.largeGroup.findFirst).mockResolvedValue({ id: 5 } as never);
    await expect(createGroup(1, "admin", { name: "G1" })).rejects.toThrow();
  });

  it("createGroup 成功", async () => {
    vi.mocked(prismaClient.largeGroup.findFirst).mockResolvedValue(null);
    vi.mocked(prismaClient.largeGroup.create).mockResolvedValue({ id: 6, name: "G2", userId: 1 } as never);
    const res = await createGroup(1, "admin", { name: "G2" });
    expect(res.result.id).toBe(6);
  });

  it("deleteGroup(deleted=true) 连带删除子大屏", async () => {
    vi.mocked(prismaClient.largeGroup.findUnique).mockResolvedValue({ id: 5, userId: 1 } as never);
    vi.mocked(prismaClient.largeScreen.deleteMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(prismaClient.largeGroup.delete).mockResolvedValue({ id: 5 } as never);
    const res = await deleteGroup(1, 1, 5, true);
    expect(res.success).toBe(true);
    expect(prismaClient.largeScreen.deleteMany).toHaveBeenCalledWith({ where: { groupId: 5 } });
  });

  it("deleteGroup(deleted=false) 子大屏 groupId 归 0", async () => {
    vi.mocked(prismaClient.largeGroup.findUnique).mockResolvedValue({ id: 5, userId: 1 } as never);
    vi.mocked(prismaClient.largeScreen.updateMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(prismaClient.largeGroup.delete).mockResolvedValue({ id: 5 } as never);
    await deleteGroup(1, 1, 5, false);
    expect(prismaClient.largeScreen.updateMany).toHaveBeenCalledWith({
      where: { groupId: 5 },
      data: { groupId: 0 }
    });
  });
});
