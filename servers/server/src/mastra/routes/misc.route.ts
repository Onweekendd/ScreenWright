import { Hono } from "hono";

import { ok } from "@/lib/http/envelope";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * 杂项字典路由，挂在 /bi-system 下。
 *
 * Java 端 `dict/info/:id` 返回一批 app 级文案配置（客服电话、新手引导步骤、
 * 模板轮播间隔等），全部是非核心的展示项。开源版无这张字典表，
 * 统一返回 result: null，三个调用点都按此走空分支：
 *   - layout/PopoverHelp：客服电话留空
 *   - layout/driver：新手引导内容留空
 *   - templateCarousel：intervalInfo.result 为空 → 整个模板轮播不启动
 *     （开源版本无种子模板，轮播本就为空）
 */
export const miscRouter = new Hono<{ Variables: AuthVariables }>();

miscRouter.use("*", authMiddleware);

miscRouter.get("/dict/info/:id", async (c) => {
  return c.json(ok<null>(null));
});
