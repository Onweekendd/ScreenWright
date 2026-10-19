import { describe, expect, it } from "vitest";

import { DEV_API_BASE_URL, resolveApiBase } from "@/utils/apiBase";

const origin = "https://bi.example.com";

describe("resolveApiBase", () => {
  it("没配置 → 本机开发默认地址", () => {
    expect(resolveApiBase(undefined, origin)).toBe(DEV_API_BASE_URL);
  });

  it("配成空串 → 同源（生产环境由网关分流）", () => {
    expect(resolveApiBase("", origin)).toBe(origin);
  });

  it("配了地址 → 用配置值，去掉末尾斜杠", () => {
    expect(resolveApiBase("http://10.0.0.5:4111/", origin)).toBe("http://10.0.0.5:4111");
    expect(resolveApiBase("http://10.0.0.5:4111", origin)).toBe("http://10.0.0.5:4111");
  });
});
