import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    dataGroup: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    dataSource: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn()
    },
    dataLocal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/execute", () => ({
  testConnection: vi.fn(),
  runQuery: vi.fn()
}));

import { runQuery, testConnection } from "@/lib/db/execute";
import {
  addDataGroup,
  apiConnect,
  createSource,
  executeSql,
  listDataGroups,
  listSources,
  testDbConnection
} from "@/mastra/services/data-source.server";
import { prismaClient } from "@/mastra/storage/prisma";

const now = new Date("2025-01-01T00:00:00.000Z");
const sourceRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  userId: 1,
  type: 1,
  name: "本地库",
  description: null,
  config: { url: "jdbc:mysql://h:3306/d", username: "u", password: "p" },
  dataGroupId: null,
  layerIds: [],
  createdBy: "admin",
  createdTime: now,
  updatedBy: "admin",
  updatedTime: now,
  ...over
});

beforeEach(() => vi.clearAllMocks());

describe("数据分组", () => {
  it("重名 → 400", async () => {
    vi.mocked(prismaClient.dataGroup.findFirst).mockResolvedValue({ id: 1 } as never);
    await expect(addDataGroup(1, "admin", "G1")).rejects.toThrow();
  });
  it("新建成功", async () => {
    vi.mocked(prismaClient.dataGroup.findFirst).mockResolvedValue(null);
    vi.mocked(prismaClient.dataGroup.create).mockResolvedValue({ id: 5, name: "G1", userId: 1 } as never);
    const res = await addDataGroup(1, "admin", "G1");
    expect(res.result.id).toBe(5);
  });

  it("列表返回 {list, groupedCount, allCount, unGroupedCount}（对齐 Java）", async () => {
    vi.mocked(prismaClient.dataGroup.findMany).mockResolvedValue([{ id: 5, name: "G1", userId: 1 } as never]);
    // 全量：source 3 + local 2；分组 5 内：source 1 + local 1
    vi.mocked(prismaClient.dataSource.count).mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    vi.mocked(prismaClient.dataLocal.count).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const res = await listDataGroups(1);
    expect(res.result.allCount).toBe(5);
    expect(res.result.list[0].count).toBe(2);
    expect(res.result.groupedCount).toBe(2);
    expect(res.result.unGroupedCount).toBe(3);
  });
});

describe("数据源列表 / 新建", () => {
  it("list 返回 MyBatis 分页形状，config 字符串化，type 转字符串", async () => {
    vi.mocked(prismaClient.dataSource.count).mockResolvedValue(1);
    vi.mocked(prismaClient.dataSource.findMany).mockResolvedValue([sourceRow() as never]);
    const res = await listSources(1, 1, { current: 1, size: 10 });
    expect(res.result.total).toBe(1);
    expect(res.result.pages).toBe(1);
    expect(typeof res.result.records[0].config).toBe("string");
    expect(res.result.records[0].type).toBe("1");
  });
  it("create 存 config 对象", async () => {
    vi.mocked(prismaClient.dataSource.create).mockResolvedValue(sourceRow() as never);
    await createSource(1, "admin", 1, { name: "x", config: '{"url":"jdbc:mysql://h/d"}' });
    const data = vi.mocked(prismaClient.dataSource.create).mock.calls[0][0].data as { config: unknown };
    expect(data.config).toEqual({ url: "jdbc:mysql://h/d" });
  });
});

describe("testDbConnection / executeSql", () => {
  it("testConnection 用 url 字段", async () => {
    vi.mocked(testConnection).mockResolvedValue(undefined);
    const res = await testDbConnection({ url: "jdbc:mysql://h:3306/d", username: "u", password: "p" });
    expect(res.success).toBe(true);
    expect(testConnection).toHaveBeenCalledWith({ jdbcUrl: "jdbc:mysql://h:3306/d", username: "u", password: "p" });
  });
  it("executeSql 缺 baseInfoSource → 400", async () => {
    await expect(executeSql({ sql: "select 1" })).rejects.toThrow();
  });
  it("executeSql 返回行数组（result 直接是数组）", async () => {
    vi.mocked(runQuery).mockResolvedValue([{ a: 1 }, { a: 2 }]);
    const res = await executeSql({
      baseInfoSource: { jdbcUrl: "jdbc:mysql://h/d", username: "u", password: "p" },
      sql: "select a from t",
      limit: 100
    });
    expect(res.result).toEqual([{ a: 1 }, { a: 2 }]);
  });
});

describe("apiConnect", () => {
  it("GET 拼 query 并按 dataSite 取值，返回 {headers, values}", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: { list: [{ x: 1, y: "a" }] } }) });
    vi.stubGlobal("fetch", fetchMock);
    const res = await apiConnect({ url: "http://api.test/list", method: "get", dataSite: "data.list" });
    expect(res.result.values).toEqual([{ x: 1, y: "a" }]);
    expect(res.result.headers).toEqual([
      { name: "x", type: "number" },
      { name: "y", type: "string" }
    ]);
    vi.unstubAllGlobals();
  });
});
