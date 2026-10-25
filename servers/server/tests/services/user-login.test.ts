import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// 必须在 import service 之前 mock 掉 prisma 单例，避免触发真实 PrismaClient/DB 连接
vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    biUser: {
      findUnique: vi.fn()
    }
  }
}));

import { hashPassword } from "@/lib/auth/password";
import { verifyToken } from "@/lib/auth/token";
import { fail } from "@/lib/http/envelope";
import { userRouter } from "@/mastra/routes/user.route";
import { login } from "@/mastra/services/admin/user.server";
import { prismaClient } from "@/mastra/storage/prisma";

const findUnique = vi.mocked(prismaClient.biUser.findUnique);

let passwordHash: string;

const userRow = (over: Record<string, unknown> = {}) =>
  ({
    id: 5,
    userName: "alice",
    passwordHash,
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
    role: 1,
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
    updatedTime: new Date("2025-01-01T00:00:00.000Z"),
    ...over
  }) as never;

beforeAll(async () => {
  vi.stubEnv("JWT_SECRET", "unit-test-secret");
  passwordHash = await hashPassword("correct-horse");
});

beforeEach(() => vi.clearAllMocks());

describe("login", () => {
  it("口令正确 → 返回可验证的 token 与用户信息", async () => {
    findUnique.mockResolvedValueOnce(userRow());
    const res = await login("alice", "correct-horse");

    expect(res.success).toBe(true);
    expect(res.result.userInfo.userName).toBe("alice");
    expect(await verifyToken(res.result.token)).toEqual({ userId: 5, userName: "alice", role: 1 });
  });

  it("口令错误 → 401", async () => {
    findUnique.mockResolvedValueOnce(userRow());
    await expect(login("alice", "wrong")).rejects.toMatchObject({ status: 401 });
  });

  it("用户不存在 → 同样 401，且提示与口令错误一致（不泄露账号是否存在）", async () => {
    findUnique.mockResolvedValueOnce(null);
    const err = await login("ghost", "whatever").catch((e: HTTPException) => e);
    expect(err).toMatchObject({ status: 401, message: "用户名或密码错误" });
  });

  it("历史占位口令 '-' 的账号无法登录", async () => {
    findUnique.mockResolvedValueOnce(userRow({ passwordHash: "-" }));
    await expect(login("alice", "-")).rejects.toMatchObject({ status: 401 });
  });

  it.each([
    ["被禁用", { forbidden: true }],
    ["未审核", { status: 3 }],
    ["状态为到期", { status: 2 }],
    ["过期时间已过", { expirationTime: new Date("2020-01-01T00:00:00.000Z") }]
  ])("账号%s → 403", async (_label, over) => {
    findUnique.mockResolvedValueOnce(userRow(over));
    await expect(login("alice", "correct-horse")).rejects.toMatchObject({ status: 403 });
  });
});

describe("POST /login 路由", () => {
  const app = new Hono();
  app.onError((e, c) =>
    e instanceof HTTPException ? c.json(fail(null, e.message, e.status), e.status) : c.text("err", 500)
  );
  app.route("/user", userRouter);

  const post = (body: unknown) =>
    app.request("/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

  it("免鉴权即可调用，username / userName 两种字段名都接受", async () => {
    findUnique.mockResolvedValue(userRow());
    expect((await post({ username: "alice", password: "correct-horse" })).status).toBe(200);
    expect((await post({ userName: "alice", password: "correct-horse" })).status).toBe(200);
  });

  it("缺少口令 → 400", async () => {
    expect((await post({ username: "alice" })).status).toBe(400);
  });

  it("口令错误 → 401 信封", async () => {
    findUnique.mockResolvedValue(userRow());
    const res = await post({ username: "alice", password: "nope" });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ success: false, code: 401 });
  });

  it("其余 /user 接口仍需令牌", async () => {
    const res = await app.request("/user/current/BI");
    expect(res.status).toBe(401);
  });
});
