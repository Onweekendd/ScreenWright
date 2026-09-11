import { createMiddleware } from "hono/factory";

import { prismaClient } from "@/mastra/storage/prisma";

/** 鉴权后注入到上下文的变量 */
export interface AuthVariables {
  userId: number;
  userName: string;
  role: number;
}

type Identity = { userId: number; userName: string; role: number };

const FALLBACK: Identity = { userId: 1, userName: "admin", role: 0 };
let cached: Identity | null = null;

/**
 * 开源单机版没有登录：解析出「默认用户」——库里第一个超管（role=0），
 * 没有就退回任意一个用户，再没有就用内置兜底。结果缓存一次。
 */
async function resolveDefaultIdentity(): Promise<Identity> {
  if (cached) {
    return cached;
  }
  try {
    const user =
      (await prismaClient.biUser.findFirst({ where: { role: 0 }, orderBy: { id: "asc" } })) ??
      (await prismaClient.biUser.findFirst({ orderBy: { id: "asc" } }));
    cached = user ? { userId: user.id, userName: user.userName, role: user.role } : FALLBACK;
  } catch {
    cached = FALLBACK;
  }
  return cached;
}

/**
 * 单机版鉴权中间件：不校验 token，直接把默认用户的 userId/userName/role 注入上下文，
 * 保持下游 service 拿 `c.get("userId")` 的用法不变。
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const identity = await resolveDefaultIdentity();
  c.set("userId", identity.userId);
  c.set("userName", identity.userName);
  c.set("role", identity.role);
  await next();
});
