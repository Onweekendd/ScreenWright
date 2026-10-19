import { swaggerUI } from "@hono/swagger-ui";
import type { Hono } from "hono";

import { encodedControlRelay } from "@/mastra/realtime/encoded-control-relay";
import { assetsRouter } from "@/mastra/routes/assets.route";
import { blobRouter } from "@/mastra/routes/blob.route";
import { dataSourceRouter } from "@/mastra/routes/data-source.route";
import { largeScreenRouter } from "@/mastra/routes/large-screen.route";
import { layersRouter } from "@/mastra/routes/layers.route";
import { miscRouter } from "@/mastra/routes/misc.route";
import { moduleRouter } from "@/mastra/routes/module.route";
import { onlineRouter } from "@/mastra/routes/online.route";
import { userRouter } from "@/mastra/routes/user.route";
import { versionRouter } from "@/mastra/routes/version.route";
import { swaggerSpec } from "@/swagger-spec";

import type { RoleMount } from "./mount";

/**
 * api 角色：业务接口。刻意不引入 Mastra / agent / 队列，保证 api 进程轻量、启动快，
 * 也让「api 不依赖 AI 栈」这件事能被构建产物检查（见 tests/entry/api-isolation.test.ts）。
 */
export function mountApi(app: Hono): RoleMount {
  app.route("/", blobRouter); // → GET /blobs/<key> 静态素材，不鉴权

  // 从 Java bi-backend 回落的顶层路由（保持原路径，前端改动最小）
  app.route("/user", userRouter); // → /user/login、/user/current/BI 等
  app.route("/bi-system", largeScreenRouter); // → /bi-system/largeScreen/list 等
  app.route("/bi-system", moduleRouter); // → /bi-system/module/list 等
  app.route("/bi-system", layersRouter); // → /bi-system/layers/* 等
  app.route("/bi-system", dataSourceRouter); // → /bi-system/data/* 等
  app.route("/bi-system", assetsRouter); // → /bi-system/minio/* 等
  app.route("/bi-system", versionRouter); // → /bi-system/largeScreen/version/*、/largeScreen/publish
  app.route("/bi-system", miscRouter); // → /bi-system/dict/info/:id（空兜底）
  app.route("/online", onlineRouter); // → /online/layersAgg/save、/online/minioAgg/* 等

  app.get("/swagger-spec", (c) => c.json(swaggerSpec));
  app.get("/swagger", swaggerUI({ url: "/swagger-spec" }));

  return {
    // 终端控制中继：按 screenId 分房间，房间状态在进程内存里 → api 目前只能单副本
    handleUpgrade: (request, socket, head) => {
      if (!encodedControlRelay.matches(request.url)) {
        return false;
      }
      encodedControlRelay.handleUpgrade(request, socket, head);
      return true;
    },
    close: () => encodedControlRelay.close()
  };
}
