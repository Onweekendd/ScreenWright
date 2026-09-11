import SwaggerParser from "@apidevtools/swagger-parser";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

const getRegistryDir = (datasourceId: number) =>
  path.join(getAgentWorkspacePath(), "api-registry", String(datasourceId));

const ensureDir = (dirPath: string) => mkdirSync(dirPath, { recursive: true });

const writeJson = (filePath: string, data: unknown) => {
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

export const pathToFileName = (apiPath: string) => apiPath.replace(/^\//, "").replace(/\//g, "_") + ".json";

/**
 * SwaggerParser 接受的入参（`string | OpenAPI.Document`）。
 *
 * 从它自己的签名里取，而不是 `import type { OpenAPI } from "openapi-types"`——那个包在本仓
 * 只是传递依赖，pnpm 的严格 node_modules 下从这里 import 不一定解析得到。
 */
type SwaggerSource = Parameters<typeof SwaggerParser.parse>[0];

export interface SwaggerIndex {
  datasourceId: number;
  baseUrl: string;
  swaggerUrl: string;
  title: string;
  version: string;
  fetchedAt: string;
  paths: string[];
}

/**
 * 把一份已经拿到手的 OpenAPI 规格落成 agent 能读的注册表。
 *
 * 与 {@link registerSwagger} 拆开是为了让**不联网的调用方**（eval 种数据、离线导入、单测）
 * 走的是同一段写盘逻辑，而不是各自照着目录结构再实现一遍。同一个理由在 eval 的
 * `seedWorkspace` 那里已经用过一次：它种屏走的是 `syncScreenData`，也就是前端整屏保存
 * 用的那个写入器——种出来的目录跟真实环境一个字节不差，磁盘格式演进时也不会悄悄分叉。
 *
 * @param spec 原始 OpenAPI 文档；内部会先尝试展开 $ref，失败则退回只解析
 */
export const registerSwaggerSpec = async (
  datasourceId: number,
  spec: SwaggerSource,
  meta: { swaggerUrl: string; baseUrl: string }
): Promise<SwaggerIndex> => {
  let api: Awaited<ReturnType<typeof SwaggerParser.dereference>>;
  try {
    api = await SwaggerParser.dereference(spec, { dereference: { circular: "ignore" } });
  } catch {
    api = (await SwaggerParser.parse(spec)) as typeof api;
  }

  const info = api.info ?? {};
  const paths = Object.keys(api.paths ?? {});

  const registryDir = getRegistryDir(datasourceId);
  const pathsDir = path.join(registryDir, "paths");
  ensureDir(pathsDir);

  const index: SwaggerIndex = {
    datasourceId,
    baseUrl: meta.baseUrl,
    swaggerUrl: meta.swaggerUrl,
    title: info.title ?? "",
    version: info.version ?? "",
    fetchedAt: new Date().toISOString(),
    paths
  };

  writeJson(path.join(registryDir, "index.json"), index);

  for (const [apiPath, pathItem] of Object.entries(api.paths ?? {})) {
    writeJson(path.join(pathsDir, pathToFileName(apiPath)), { path: apiPath, ...(pathItem as object) });
  }

  return index;
};

export const registerSwagger = async (
  datasourceId: number,
  swaggerUrl: string,
  baseUrl: string
): Promise<SwaggerIndex> => {
  const fetched = await fetch(swaggerUrl);
  if (!fetched.ok) {
    throw new Error(`获取 swagger 失败: ${fetched.status} ${fetched.statusText}`);
  }
  return registerSwaggerSpec(datasourceId, await fetched.json(), { swaggerUrl, baseUrl });
};

/**
 * 工作区里已经注册过接口文档的数据源 id。
 *
 * 存在的理由是**离线可用**：`DataSource` 表才是数据源的权威清单，但注册表目录是 agent
 * 直接看得见、也确实能拿来校验路径的那一份。eval 与本地离线场景里常常只有目录没有库行
 * （`seedApiRegistry` 就只种目录），这时按目录兜底，比直接报「没有可用数据源」有用。
 */
export const listRegisteredDatasourceIds = (): number[] => {
  const root = path.join(getAgentWorkspacePath(), "api-registry");
  if (!existsSync(root)) {
    return [];
  }
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d+$/u.test(entry.name))
      .map((entry) => Number(entry.name))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
};

export const getSwaggerIndex = (datasourceId: number): SwaggerIndex | null => {
  const indexPath = path.join(getRegistryDir(datasourceId), "index.json");
  if (!existsSync(indexPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(indexPath, "utf-8")) as SwaggerIndex;
  } catch {
    return null;
  }
};
