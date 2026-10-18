import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("哈希后能用原口令校验通过", async () => {
    const hash = await hashPassword("s3cret!");
    expect(await verifyPassword("s3cret!", hash)).toBe(true);
  });

  it("错误口令校验失败", async () => {
    const hash = await hashPassword("s3cret!");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("同一口令两次哈希结果不同（随机盐）", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it.each(["-", "", "scrypt$zz", "bcrypt$a$b", "scrypt$00$00"])(
    "非法/占位哈希 %j 一律校验失败而不抛错",
    async (stored) => {
      await expect(verifyPassword("anything", stored)).resolves.toBe(false);
    }
  );
});
