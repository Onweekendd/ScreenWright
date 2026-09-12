import { beforeEach, describe, expect, it, vi } from "vitest";

// 必须在 import service 之前 mock 掉 prisma 单例，避免触发真实 PrismaClient/DB 连接
vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    biUser: {
      findUnique: vi.fn()
    }
  }
}));

import { getCurrentUser, getMenuTree, isSuperAdmin } from "@/mastra/services/user.server";
import { prismaClient } from "@/mastra/storage/prisma";

/** 构造一个完整的 BiUser 行（用 as never 绕过 Prisma 精确类型） */
const baseUser = () => ({
  id: 1,
  userName: "admin",
  passwordHash: "-",
  type: 0,
  status: 1,
  balance: 0,
  companyId: null,
  email: null,
  phone: null,
  realname: null,
  region: null,
  temporaryCompanyName: null,
  forbidden: false,
  role: 0,
  stockType: 1,
  expirationTime: null,
  createLarge: null,
  createScene: null,
  exportLarge: null,
  exportScene: null,
  createCity: null,
  exportCity: null,
  createdBy: null,
  createdTime: new Date("2025-01-01T00:00:00.000Z"),
  updatedBy: null,
  updatedTime: new Date("2025-01-01T00:00:00.000Z")
});

beforeEach(() => vi.clearAllMocks());

describe("getMenuTree", () => {
  it("静态菜单树包含 /display（前端路由解析依赖）", () => {
    const res = getMenuTree();
    expect(res.success).toBe(true);
    const paths = res.result.map((n: { path: string }) => n.path);
    expect(paths).toContain("/display");
    expect(paths).toContain("/assets");
  });

  it("数据源节点带 本地文件/数据库/API 子页签（前端 tabsList 消费）", () => {
    const source = getMenuTree().result.find((n: { path: string }) => n.path === "/source")!;
    const tabs = (source.children as { name: string; component: string; type: number }[]).filter((c) => c.type === 1);
    expect(tabs.map((t) => t.component)).toEqual(["local", "db", "api"]);
  });
});

describe("getCurrentUser", () => {
  it("返回完整用户资料（前端会用它填充用户态）", async () => {
    vi.mocked(prismaClient.biUser.findUnique).mockResolvedValue(baseUser() as never);
    const res = await getCurrentUser(1);
    expect(res.success).toBe(true);
    expect(res.result.userName).toBe("admin");
    expect(res.result.roleAuthorizationList[0].roleName).toBe("ADMIN");
  });

  it("普通用户 roleAuthorizationList 为 USER", async () => {
    vi.mocked(prismaClient.biUser.findUnique).mockResolvedValue({ ...baseUser(), role: 1 } as never);
    const res = await getCurrentUser(1);
    expect(res.result.roleAuthorizationList[0].roleName).toBe("USER");
  });

  it("用户不存在 → 抛 404", async () => {
    vi.mocked(prismaClient.biUser.findUnique).mockResolvedValue(null);
    await expect(getCurrentUser(999)).rejects.toThrow();
  });
});

describe("isSuperAdmin", () => {
  it("role 0 → true", () => {
    expect(isSuperAdmin(0).result).toBe(true);
  });
  it("非 0 → false", () => {
    expect(isSuperAdmin(1).result).toBe(false);
  });
});
