import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { getCurrentUser, getMenuTree, isSuperAdmin, login } from "@/mastra/services/admin/user.server";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * 用户模块路由。挂载在 /user 下（见 src/server.ts），故最终路径为：
 *   POST /user/login  /user/menu/application/userTree/BI  /user/current/BI  /user/user/isSuperAdmin
 * /login 免鉴权，其余接口需携带有效令牌。
 */
export const userRouter = new Hono<{ Variables: AuthVariables }>();

// 前端 LoginReq 用 username，库字段叫 userName，两种写法都收
const LoginSchema = z
  .object({
    username: z.string().trim().min(1).optional(),
    userName: z.string().trim().min(1).optional(),
    password: z.string().min(1)
  })
  .refine((v) => v.username ?? v.userName, { message: "用户名不能为空" });

// 必须注册在 authMiddleware 之前：命中后直接返回，不会进入后面的鉴权
userRouter.post("/login", zValidator("json", LoginSchema), async (c) => {
  const body = c.req.valid("json");
  return c.json(await login((body.username ?? body.userName)!, body.password));
});

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
