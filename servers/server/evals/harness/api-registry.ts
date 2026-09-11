/**
 * 给 eval 工作区种一份 API 注册表。
 *
 * ## 为什么是离线快照，不是把 mock-server 拉起来
 *
 * 真实的注册路径是 `POST /register-swagger` → `registerSwagger` → `fetch(swaggerUrl)`，
 * 数据源是 `servers/mock-server`（:3100）。但 eval 不能依赖它跑着：
 *
 * - 一个 case 是几十秒到几分钟的真钱，不该因为某个端口没人起而红
 * - mock-server 的模拟数据在 `src/data/mock-data.ts`，需要验证实际取数时可单独启动服务
 *
 * 所以这里存一份规格快照（{@link SPEC_FIXTURE}，由 `swagger-jsdoc` 直接从路由的 `@swagger`
 * 注释生成，生成过程本身也不需要服务在跑），种屏时灌进工作区。
 *
 * **落盘走的是生产同一段代码**（`registerSwaggerSpec`），不是照着目录结构再实现一遍——
 * 与 `seedWorkspace` 用 `syncScreenData` 种屏是同一条纪律：注册表的磁盘格式将来怎么演进，
 * eval 种出来的都跟真实环境一致，不会悄悄分叉成第二套。
 *
 * ## 代价要认
 *
 * 这条路验证的是**「配得对不对」**：agent 有没有读注册表、有没有挑到一条真实存在的路径、
 * 方法和 baseUrl 对不对得上。它验证不了**「请求真能通」**——那需要服务真的在跑。
 * 两者是不同的东西，别拿这里的绿灯去替另一件事背书。
 */

import fs from "node:fs";
import path from "node:path";

import { registerSwaggerSpec, type SwaggerIndex } from "@/mastra/services/swagger-registry";

/**
 * 数据源 id。真实环境里它来自平台的数据源表，eval 里取一个固定值即可——
 * agent 是通过列 `api-registry/` 目录发现它的，不靠猜这个数字。
 */
export const MOCK_DATASOURCE_ID = 501;

/** 与 `servers/mock-server/src/index.ts` 的 `PORT` 一致 */
export const MOCK_API_BASE_URL = "http://localhost:3100";

/** 真实注册时 `registerSwagger` 拉的就是这个地址，快照里原样记着，便于回溯 */
const MOCK_SWAGGER_URL = `${MOCK_API_BASE_URL}/docs-json`;

const SPEC_FIXTURE = path.resolve(import.meta.dirname, "..", "fixtures", "mock-api-swagger.json");

/**
 * 把快照灌进当前 eval 工作区的 `api-registry/{MOCK_DATASOURCE_ID}/`。
 *
 * 幂等：同一份快照重复种只是覆盖同样的内容。放在 `beforeEach` 里种而不是整轮种一次，
 * 是因为 `clearRunArtifacts` 只保留基础设施白名单，注册表属于本轮产物、跑完即弃；
 * 也因此**只有声明了 `setup` 的 case 才有注册表**，其余 case 的环境一个字节不变。
 */
export const seedApiRegistry = async (): Promise<SwaggerIndex> => {
  const spec = JSON.parse(fs.readFileSync(SPEC_FIXTURE, "utf-8")) as Parameters<typeof registerSwaggerSpec>[1];
  return registerSwaggerSpec(MOCK_DATASOURCE_ID, spec, {
    swaggerUrl: MOCK_SWAGGER_URL,
    baseUrl: MOCK_API_BASE_URL
  });
};

/** 快照里注册了哪些路径。断言「agent 挑的这条是真实存在的」用它，不在 case 里手抄一份路径表。 */
export const registeredPaths = (): string[] => {
  const spec = JSON.parse(fs.readFileSync(SPEC_FIXTURE, "utf-8")) as { paths?: Record<string, unknown> };
  return Object.keys(spec.paths ?? {});
};

/**
 * 某条路径声明了哪些 HTTP 方法（小写）。
 *
 * 用来抓「路径挑对了、方法写错了」——这一类在磁盘上完全合法，只有真发请求时才 405/404。
 */
export const methodsOf = (apiPath: string): string[] => {
  const spec = JSON.parse(fs.readFileSync(SPEC_FIXTURE, "utf-8")) as {
    paths?: Record<string, Record<string, unknown>>;
  };
  return Object.keys(spec.paths?.[apiPath] ?? {}).map((m) => m.toLowerCase());
};
