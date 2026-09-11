import type { ApiClient } from "@screenwright/server/rpc";
import { hc } from "hono/client";

import "server-only";

/**
 * Screenwright 后端基地址。默认指向本地 mastra 服务端口，容器内通过 FUNAI_API_BASE 覆盖。
 */
const serverApiBase = process.env.FUNAI_API_BASE ?? "http://localhost:4111";

/**
 * 复用 servers/server 导出的 hono RPC 客户端类型（`Screenwright/rpc`），不再在前端重复手写请求。
 *
 * 直接实例化 `hc(base)` 并断言为 Screenwright 的 `apiClient` 类型：
 * 运行时只依赖 `hono/client`，类型来自 Screenwright 预构建的 `dist/rpcClient.d.ts`，
 * 避免在 Next 侧重新推导 `hc<AppType>` 的深层递归类型（会拖慢/拖垮 tsc）。
 */
export const serverRpc = hc(serverApiBase) as unknown as ApiClient;
