import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";

/**
 * 某个角色挂到 HTTP 服务上之后留下的「原生层」钩子。
 * Hono 路由之外，有些东西必须在 Node http 层先接手（预览代理、WebSocket 升级）。
 */
export interface RoleMount {
  /** 先于 Hono 处理请求；返回 true 表示已接管，Hono 不再处理 */
  handleRequest?(request: IncomingMessage, response: ServerResponse): boolean;
  /** WebSocket 升级；返回 true 表示已接管 */
  handleUpgrade?(request: IncomingMessage, socket: Duplex, head: Buffer): boolean;
  close(): Promise<void> | void;
}
