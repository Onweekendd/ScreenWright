import { sign } from "hono/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getJwtSecret, signToken, verifyToken } from "@/lib/auth/token";

const payload = { userId: 3, userName: "alice", role: 1 };

describe("token", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "unit-test-secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("签发后可解出同样的身份", async () => {
    const token = await signToken(payload);
    expect(await verifyToken(token)).toEqual(payload);
  });

  it("篡改令牌 / 乱码令牌返回 null", async () => {
    const token = await signToken(payload);
    expect(await verifyToken(token.slice(0, -2) + "xx")).toBeNull();
    expect(await verifyToken("not-a-jwt")).toBeNull();
  });

  it("换密钥后旧令牌失效", async () => {
    const token = await signToken(payload);
    vi.stubEnv("JWT_SECRET", "another-secret");
    expect(await verifyToken(token)).toBeNull();
  });

  it("过期令牌返回 null", async () => {
    vi.stubEnv("JWT_EXPIRES_IN_SECONDS", "60");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = await signToken(payload);
    vi.setSystemTime(new Date("2026-01-01T00:02:00Z"));
    expect(await verifyToken(token)).toBeNull();
  });

  it("载荷缺少必要字段时返回 null", async () => {
    const bad = await sign({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, "unit-test-secret", "HS256");
    expect(await verifyToken(bad)).toBeNull();
  });

  it("生产环境未配置 JWT_SECRET 直接抛错", () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
  });
});
