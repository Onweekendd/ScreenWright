/**
 * `configureComponentData` 的校验分支。
 *
 * 测的重点是**报错时有没有把可选项列出来**——这个工具的全部价值就在于「不让 agent 猜」：
 * 猜数据源、猜接口路径、猜字段名。报错只说「不存在」而不给可选项，agent 就会退回老路
 * 去列 api-registry 目录、满 skills 目录 grep（b8 实测两者都出现过）。
 *
 * 写盘那一段不在这里测（要真实大屏树 + core，已由 b8 端到端覆盖）。
 */
import { mkdirSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// 工具本身每次现读这个 env（不定格），但 `getSwaggerIndex` 那条路同样现读，
// 两边都指到这里才对得上。ESM 的 import 会提升，所以这一行实际早于赋值执行——
// 也正因如此，工具里绝不能把工作区根缓存成模块级常量：最初那版就是这么写的，
// 症状是「index.json 读得到、paths/*.json 读不到」，下面三条方法相关的用例全红。
const OUTPUT_DIR = path.resolve(__dirname, "output-configure-data");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { configureComponentData } from "@/mastra/tools/configure-component-data";

const DATASOURCE_ID = 901;
const registryDir = path.join(OUTPUT_DIR, "api-registry", String(DATASOURCE_ID));

/** 一份最小的注册表：一条只声明了 get 的路径，一条声明了 get + post 的 */
const seedRegistry = () => {
  mkdirSync(path.join(registryDir, "paths"), { recursive: true });
  writeFileSync(
    path.join(registryDir, "index.json"),
    JSON.stringify({
      datasourceId: DATASOURCE_ID,
      baseUrl: "http://localhost:3100",
      swaggerUrl: "http://localhost:3100/docs-json",
      title: "测试 Mock API",
      version: "1.0.0",
      fetchedAt: new Date().toISOString(),
      paths: ["/api/production/lines", "/api/orders"]
    }),
    "utf-8"
  );
  writeFileSync(
    path.join(registryDir, "paths", "api_production_lines.json"),
    JSON.stringify({
      path: "/api/production/lines",
      get: {
        summary: "获取所有生产线实时状态",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "integer" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          output: { type: "integer", description: "当日已产（件）" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }),
    "utf-8"
  );
  writeFileSync(
    path.join(registryDir, "paths", "api_orders.json"),
    JSON.stringify({ path: "/api/orders", get: {}, post: {} }),
    "utf-8"
  );
};

/** probe 一律关掉：这些用例测的是校验，不该依赖有没有接口在 3100 上跑着 */
const run = (args: Record<string, unknown>) =>
  (
    configureComponentData.execute as unknown as (input: Record<string, unknown>, context?: unknown) => Promise<unknown>
  )({ componentRef: "9001_1/900001", sourceType: "api", probe: false, ...args }, { agent: {} });

beforeAll(() => {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  seedRegistry();
});

afterAll(() => {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
});

describe("configureComponentData 的校验", () => {
  it("不给 datasourceId 时列出可用数据源，而不是只说一句必填", async () => {
    await expect(run({})).rejects.toThrow(/901\(测试 Mock API\)/u);
  });

  // 库里没有这条数据源（测试环境本来就没有），注册表目录里有——工具该按目录兜底，
  // 否则 eval 和离线环境下它整个不可用
  it("库里没有但注册表目录里有的数据源，照样认", async () => {
    await expect(run({ datasourceId: DATASOURCE_ID })).rejects.toThrow(/apiPath 必填/u);
  });

  it("不给 apiPath 时列出该数据源全部已注册路径", async () => {
    await expect(run({ datasourceId: DATASOURCE_ID })).rejects.toThrow(/\/api\/production\/lines、\/api\/orders/u);
  });

  // 本工具存在的头号理由：编一个看着很合理的路径，磁盘上完全合法，只有真发请求才 404
  it("路径编得再像，不在注册表里就报错并列出真实路径", async () => {
    await expect(run({ datasourceId: DATASOURCE_ID, apiPath: "/api/production/list" })).rejects.toThrow(
      /「\/api\/production\/list」在 测试 Mock API 里不存在.*\/api\/production\/lines/su
    );
  });

  it("路径对、方法错也拦住，并列出它支持的方法", async () => {
    await expect(
      run({ datasourceId: DATASOURCE_ID, apiPath: "/api/production/lines", method: "post" })
    ).rejects.toThrow(/没有声明 post 方法.*get/su);
  });

  it("只声明了一种方法时不必传 method", async () => {
    // 组件不存在会走到「找不到组件」，说明方法这一关已经过了
    await expect(run({ datasourceId: DATASOURCE_ID, apiPath: "/api/production/lines" })).rejects.toThrow(/找不到组件/u);
  });

  it("声明了多个方法却不指明时，报错点名让你选", async () => {
    await expect(run({ datasourceId: DATASOURCE_ID, apiPath: "/api/orders" })).rejects.toThrow(
      /声明了多个方法（get、post）/u
    );
  });

  it("不存在的数据源列出可选项", async () => {
    await expect(run({ datasourceId: 12345, apiPath: "/api/orders" })).rejects.toThrow(/可选：901\(测试 Mock API\)/u);
  });
});
