import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { verifyToken } from "@/lib/auth/token";

/** 鉴权后注入到上下文的变量 */
export interface AuthVariables {
  userId: number;
  userName: string;
  role: number;
}

/** 匿名访问时注入的身份：role=-1 不对应任何真实角色 */
const ANONYMOUS = { userId: 0, userName: "anonymous", role: -1 } as const;

/**
 * 无需登录即可访问的接口：已发布大屏的分享预览（/view/:id 页面会调用）。
 * 只放行「读」，且这些 service 都不依赖 userId。
 */
const PUBLIC_PATHS = [
  /^\/online\/largeScreenAgg\/(open|openCheck|openCheckEquities)$/,
  /^\/bi-system\/largeScreen\/openQuote$/
];

/** 令牌来源：优先 X-Access-Token（前端既有约定），其次 Authorization: Bearer。 */
export function extractToken(c: Context): string | null {
  const direct = c.req.header("X-Access-Token");
  if (direct) {
    return direct;
  }
  const auth = c.req.header("Authorization");
  const m = auth?.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/**
 * 鉴权中间件：校验 JWT，把 userId/userName/role 注入上下文，下游 service 拿 `c.get("userId")` 的用法不变。
 * - 令牌有效 → 放行；
 * - 无/无效令牌且命中 PUBLIC_PATHS → 以匿名身份放行；
 * - 其余 → 401。
 * 多个 router 会各自 `use("*", authMiddleware)` 叠在同一请求上，已鉴权则直接跳过，避免重复验签。
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (c.get("userId") !== undefined) {
    await next();
    return;
  }
  const token = extractToken(c);
  const identity = token ? await verifyToken(token) : null;
  if (identity) {
    c.set("userId", identity.userId);
    c.set("userName", identity.userName);
    c.set("role", identity.role);
    await next();
    return;
  }
  if (PUBLIC_PATHS.some((re) => re.test(c.req.path))) {
    c.set("userId", ANONYMOUS.userId);
    c.set("userName", ANONYMOUS.userName);
    c.set("role", ANONYMOUS.role);
    await next();
    return;
  }
  throw new HTTPException(401, { message: token ? "登录已过期，请重新登录" : "未登录" });
});
