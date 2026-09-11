import { Hono } from "hono";

import { getCurrentUser, getMenuTree, isSuperAdmin } from "@/mastra/services/user.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * 用户模块路由。挂载在 /user 下（见 src/server.ts），故最终路径为：
 *   /user/menu/application/userTree/BI  /user/current/BI  /user/user/isSuperAdmin
 * 开源单机版无登录：authMiddleware 直接注入默认超管，这里只提供菜单 / 当前用户 / 身份查询。
 */
export const userRouter = new Hono<{ Variables: AuthVariables }>();

userRouter.use("*", authMiddleware);

userRouter.post("/menu/application/userTree/BI", async (c) => {
  return c.json(getMenuTree());
});

userRouter.get("/current/BI", async (c) => {
  const userId = c.get("userId");
  return c.json(await getCurrentUser(userId));
});

userRouter.get("/user/isSuperAdmin", async (c) => {
  const role = c.get("role");
  return c.json(isSuperAdmin(role));
});
