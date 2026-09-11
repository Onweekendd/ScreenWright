import { Hono } from "hono";

import { getMenuTree, getRoleEquities, isSuperAdmin } from "@/mastra/services/user.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * 用户模块路由。挂载在 /user 下（见 src/server.ts），故最终路径为：
 *   /user/menu/application/userTree/BI  /user/roleEquities/infoByApplicationCode/BI  /user/user/isSuperAdmin
 * 开源单机版无登录：authMiddleware 直接注入默认超管，这里只提供菜单 / 权益 / 身份查询。
 */
export const userRouter = new Hono<{ Variables: AuthVariables }>();

userRouter.use("*", authMiddleware);

userRouter.post("/menu/application/userTree/BI", async (c) => {
  return c.json(getMenuTree());
});

userRouter.get("/roleEquities/infoByApplicationCode/BI", async (c) => {
  const userId = c.get("userId");
  return c.json(await getRoleEquities(userId));
});

userRouter.get("/user/isSuperAdmin", async (c) => {
  const role = c.get("role");
  return c.json(isSuperAdmin(role));
});
