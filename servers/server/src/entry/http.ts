import { createServer } from "node:http";

import { getRequestListener } from "@hono/node-server";

import { createBaseApp } from "./base-app";
import type { RoleMount } from "./mount";
import { mountAi } from "./mount-ai";
import { mountApi } from "./mount-api";
import { type Role, runsAi, runsApi } from "./role";

export interface Stoppable {
  close(): Promise<void>;
}

/** 按角色把路由挂上并开始监听。api / ai 两个角色可以单独起，也可以（all）同进程起。 */
export async function startHttp(role: Role): Promise<Stoppable> {
  const app = createBaseApp(role);
  const mounts: RoleMount[] = [];

  // 顺序沿用拆分前：先 Mastra 初始化（ai），再业务路由（api）
  if (runsAi(role)) {
    mounts.push(await mountAi(app));
  }
  if (runsApi(role)) {
    mounts.push(mountApi(app));
  }

  const port = Number(process.env.PORT ?? process.env.DEV_PORT) || 4111;
  const honoRequestListener = getRequestListener(app.fetch);
  const httpServer = createServer((request, response) => {
    if (mounts.some((m) => m.handleRequest?.(request, response))) {
      return;
    }
    void honoRequestListener(request, response);
  });

  httpServer.on("upgrade", (request, socket, head) => {
    if (mounts.some((m) => m.handleUpgrade?.(request, socket, head))) {
      return;
    }
    socket.destroy();
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      console.log(`Server running on http://localhost:${port} (role=${role})`);
      resolve();
    });
  });

  return {
    close: async () => {
      await Promise.all(mounts.map((m) => m.close()));
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
