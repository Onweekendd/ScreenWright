import { describe, expect, it } from "vitest";

import { fail, noAuth, ok } from "@/lib/http/envelope";

describe("envelope 信封", () => {
  it("ok 返回成功信封（对齐前端 BaseEntity 结构）", () => {
    const res = ok({ a: 1 });
    expect(res.code).toBe(200);
    expect(res.success).toBe(true);
    expect(res.result).toEqual({ a: 1 });
    expect(res.message).toBe("操作成功");
    expect(typeof res.requestId).toBe("string");
    expect(res.requestId.length).toBeGreaterThan(0);
    expect(res.timestamp).toBeGreaterThan(0);
    expect(res.onlTable).toBeNull();
  });

  it("ok 支持自定义 message", () => {
    expect(ok(null, "登录成功").message).toBe("登录成功");
  });

  it("fail 返回失败信封，默认 code 500", () => {
    const res = fail(null);
    expect(res.code).toBe(500);
    expect(res.success).toBe(false);
    expect(res.result).toBeNull();
    expect(res.message).toBe("操作失败");
  });

  it("fail 支持自定义 code/message", () => {
    const res = fail(null, "参数错误", 422);
    expect(res.code).toBe(422);
    expect(res.message).toBe("参数错误");
  });

  it("noAuth 返回 401 未授权", () => {
    const res = noAuth(null);
    expect(res.code).toBe(401);
    expect(res.success).toBe(false);
    expect(res.message).toBe("未授权");
  });
});
