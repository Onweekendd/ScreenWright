import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { signToken } from "@/lib/auth/token";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

function buildApp() {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.onError((e, c) => (e instanceof HTTPException ? c.json({ message: e.message }, e.status) : c.text("err", 500)));
  // 与真实服务一致：多个 router 各自挂一次中间件
  app.use("*", authMiddleware);
  app.use("*", authMiddleware);
  app.get("/bi-system/largeScreen/list", (c) =>
    c.json({ userId: c.get("userId"), userName: c.get("userName"), role: c.get("role") })
  );
  app.post("/online/largeScreenAgg/open", (c) => c.json({ userId: c.get("userId") }));
  app.post("/online/largeScreenAgg/save", (c) => c.json({ userId: c.get("userId") }));
  return app;
}

describe("authMiddleware（JWT 鉴权）", () => {
  const app = buildApp();
  let token: string;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", "unit-test-secret");
    token = await signToken({ userId: 7, userName: "admin", role: 0 });
  });
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("无令牌访问受保护接口 → 401", async () => {
    const res = await app.request("/bi-system/largeScreen/list");
    expect(res.status).toBe(401);
  });

  it("无效令牌 → 401", async () => {
    const res = await app.request("/bi-system/largeScreen/list", { headers: { "X-Access-Token": "garbage" } });
    expect(res.status).toBe(401);
  });

  it("X-Access-Token 有效 → 放行并注入身份", async () => {
    const res = await app.request("/bi-system/largeScreen/list", { headers: { "X-Access-Token": token } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: 7, userName: "admin", role: 0 });
  });

  it("Authorization: Bearer 同样有效", async () => {
    const res = await app.request("/bi-system/largeScreen/list", { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    expect((await res.json()).userId).toBe(7);
  });

  it("分享预览接口无令牌也放行，身份为匿名", async () => {
    const res = await app.request("/online/largeScreenAgg/open", { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: 0 });
  });

  it("同属 /online 但非公开的写接口仍要登录", async () => {
    const res = await app.request("/online/largeScreenAgg/save", { method: "POST" });
    expect(res.status).toBe(401);
  });
});
