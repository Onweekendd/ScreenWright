import { describe, expect, it } from "vitest";

import { parseRole, runsAi, runsApi, runsHttp, runsWorker } from "@/entry/role";

describe("parseRole", () => {
  it("未设置时默认 all（本地开发一个进程全跑）", () => {
    expect(parseRole(undefined)).toBe("all");
    expect(parseRole("")).toBe("all");
  });

  it.each(["api", "ai", "worker", "all"] as const)("接受合法角色 %s", (role) => {
    expect(parseRole(role)).toBe(role);
  });

  it("非法值直接抛错，不静默当成 all（拼错角色名会把整套服务带起来）", () => {
    expect(() => parseRole("wroker")).toThrow(/ROLE/);
  });
});

describe("角色能力矩阵", () => {
  it.each([
    ["api", { api: true, ai: false, http: true, worker: false }],
    ["ai", { api: false, ai: true, http: true, worker: false }],
    ["worker", { api: false, ai: false, http: false, worker: true }],
    ["all", { api: true, ai: true, http: true, worker: true }]
  ] as const)("%s", (role, expected) => {
    expect({ api: runsApi(role), ai: runsAi(role), http: runsHttp(role), worker: runsWorker(role) }).toEqual(expected);
  });
});
