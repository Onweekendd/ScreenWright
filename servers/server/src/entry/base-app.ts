import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import { fail } from "@/lib/http/envelope";

import type { Role } from "./role";

// CORS_ORIGIN 支持逗号分隔多个源（B/S 部署时填前端公网域名，如 https://bi.example.com）；
// 同域（ingress 反代）部署时浏览器不发跨域请求，可不填。
const corsAllowList = [
  ...(process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  "http://localhost:3000"
];

const isDevPrivateOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);

/** api / ai 两种 HTTP 角色共用的底座：错误信封、CORS、健康检查。 */
export function createBaseApp(role: Role): Hono {
  const app = new Hono();

  // 全局错误处理：把异常统一包装成前端期望的 BaseEntity 信封（用于 /user 与 /bi-system 回落路由）
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json(fail(null, error.message, error.status === 401 ? 401 : 500), error.status);
    }
    console.error("[Screenwright onError]", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return c.json(fail(null, message, 500), 500);
  });

  app.use(
    "/*",
    cors({
      origin: (origin) => {
        if (!origin) {
          return null;
        }
        if (corsAllowList.includes(origin) || isDevPrivateOrigin(origin)) {
          return origin;
        }
        return null;
      },
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Access-Token",
        "Version-Code",
        "X-Custom-Header",
        "Upgrade-Insecure-Requests",
        "x-mastra-dev-playground",
        "x-mastra-client-type"
      ],
      allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
      exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
      maxAge: 600,
      credentials: true
    })
  );

  // 存活探针：只说明进程在响应，不探测依赖
  app.get("/healthz", (c) => c.json({ status: "ok", role }));

  return app;
}
