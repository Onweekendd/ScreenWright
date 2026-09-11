import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

// 单机版：中间件从 DB 解析默认用户，mock 掉 prisma 单例避免真实连接
vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: {
    biUser: {
      findFirst: vi.fn().mockResolvedValue({ id: 7, userName: "admin", role: 0 })
    }
  }
}));

import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

function buildApp() {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", authMiddleware);
  app.get("/bi-system/largeScreen/list", (c) =>
    c.json({ userId: c.get("userId"), userName: c.get("userName"), role: c.get("role") })
  );
  return app;
}

describe("authMiddleware 单机版（无登录，注入默认用户）", () => {
  const app = buildApp();

  it("无 token 也放行，注入默认用户 id/userName/role", async () => {
    const res = await app.request("/bi-system/largeScreen/list");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ userId: 7, userName: "admin", role: 0 });
  });

  it("带任意 token 同样放行，身份仍是默认用户（token 被忽略）", async () => {
    const res = await app.request("/bi-system/largeScreen/list", {
      headers: { "X-Access-Token": "whatever" }
    });
    expect(res.status).toBe(200);
    expect((await res.json()).userId).toBe(7);
  });
});
