import { describe, expect, it } from "vitest";

import { getQueueMode, getQueuePrefix, requireRedisUrl } from "@/queue/config";

describe("getQueueMode", () => {
  it("配了 REDIS_URL 默认走 redis", () => {
    expect(getQueueMode({ REDIS_URL: "redis://x:6379" })).toBe("redis");
  });

  it("没配 REDIS_URL 默认 inline（本地开发免装 Redis）", () => {
    expect(getQueueMode({})).toBe("inline");
  });

  it("QUEUE_MODE 显式指定优先于自动判断", () => {
    expect(getQueueMode({ REDIS_URL: "redis://x", QUEUE_MODE: "inline" })).toBe("inline");
    expect(getQueueMode({ QUEUE_MODE: "redis" })).toBe("redis");
  });

  it("QUEUE_MODE 写错直接抛错", () => {
    expect(() => getQueueMode({ QUEUE_MODE: "kafka" })).toThrow(/QUEUE_MODE/);
  });
});

describe("requireRedisUrl", () => {
  it("返回配置的地址", () => {
    expect(requireRedisUrl({ REDIS_URL: "redis://h:1" })).toBe("redis://h:1");
  });

  it("没配时报错而不是悄悄连本机", () => {
    expect(() => requireRedisUrl({})).toThrow(/REDIS_URL/);
  });
});

describe("getQueuePrefix", () => {
  it("默认 funbi，可用 QUEUE_PREFIX 覆盖", () => {
    expect(getQueuePrefix({})).toBe("funbi");
    expect(getQueuePrefix({ QUEUE_PREFIX: "staging" })).toBe("staging");
  });
});
