/**
 * eval 的 API 注册表种数据。
 *
 * 值得单测的理由：种数据这一步**跑在 agent 之前**，它悄悄失败的话，b8 会红在
 * 「路径不是注册表里真实存在的接口」——那句断言会把锅指向 agent 编了路径，
 * 而真相是注册表压根没种出来。一次 case 是几十秒到几分钟的真钱，
 * 这种归因错位比失败本身更贵，所以先用不花钱的方式把它钉死。
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SwaggerIndex } from "@/mastra/services/swagger-registry";

import {
  methodsOf,
  MOCK_API_BASE_URL,
  MOCK_DATASOURCE_ID,
  registeredPaths,
  seedApiRegistry
} from "../../evals/harness/api-registry";

let workspace: string;
let previous: string | undefined;

beforeAll(async () => {
  previous = process.env.MASTRA_WORKSPACE_PATH;
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "sw-api-registry-"));
  // getAgentWorkspacePath() 是懒读的，所以在这里改 env 就够了，不必在 import 之前
  process.env.MASTRA_WORKSPACE_PATH = workspace;
  await seedApiRegistry();
});

afterAll(() => {
  process.env.MASTRA_WORKSPACE_PATH = previous;
  fs.rmSync(workspace, { recursive: true, force: true });
});

const registryDir = () => path.join(workspace, "api-registry", String(MOCK_DATASOURCE_ID));

describe("eval 的 API 注册表", () => {
  it("落成 agent 实际会读的那套目录结构", () => {
    const index = JSON.parse(fs.readFileSync(path.join(registryDir(), "index.json"), "utf-8")) as SwaggerIndex;

    expect(index.datasourceId).toBe(MOCK_DATASOURCE_ID);
    expect(index.baseUrl).toBe(MOCK_API_BASE_URL);
    expect(index.paths.length).toBeGreaterThan(0);
  });

  it("index.json 声明的每条路径都有对应的详情文件", () => {
    const index = JSON.parse(fs.readFileSync(path.join(registryDir(), "index.json"), "utf-8")) as SwaggerIndex;

    // 文件名规则：/api/production/lines → api_production_lines.json
    const missing = index.paths.filter(
      (p) => !fs.existsSync(path.join(registryDir(), "paths", p.replace(/^\//, "").replace(/\//g, "_") + ".json"))
    );

    expect(missing).toEqual([]);
  });

  // 断言侧读的是快照、agent 侧读的是落盘结果，两者必须是同一份，否则 b8 会用一张
  // 对不上的路径表去判 agent 编没编接口
  it("断言用的路径表与落盘的一致", () => {
    const index = JSON.parse(fs.readFileSync(path.join(registryDir(), "index.json"), "utf-8")) as SwaggerIndex;

    expect(registeredPaths().sort()).toEqual([...index.paths].sort());
  });

  it("methodsOf 取到的是小写 HTTP 方法", () => {
    expect(methodsOf("/api/production/lines")).toEqual(["get"]);
    expect(methodsOf("/不存在的路径")).toEqual([]);
  });
});
