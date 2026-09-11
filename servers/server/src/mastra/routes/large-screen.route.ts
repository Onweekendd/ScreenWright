import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { ok } from "@/lib/http/envelope";
import { pageOf } from "@/lib/http/page";
import {
  createGroup,
  createScreen,
  deleteGroup,
  deleteScreen,
  getScreen,
  getScreenMeta,
  listGroups,
  listScreens,
  quoteInfo,
  updateGroup,
  updateScreen
} from "@/mastra/services/large-screen.server";
import {
  IdParamSchema,
  LargeGroupSaveSchema,
  LargeGroupUpdateSchema,
  ScreenListReqSchema,
  ScreenSaveSchema,
  ScreenUpdateSchema
} from "@/mastra/types/large-screen";
import type { AuthVariables } from "@/middleware/auth";
import { authMiddleware } from "@/middleware/auth";

/**
 * 大屏 CRUD 路由。挂载在 /bi-system 下（见 src/server.ts），最终路径如：
 *   /bi-system/largeScreen/list  /bi-system/largeScreen/info/:id
 *   /bi-system/largeScreen/save  /bi-system/largeScreen/update  /bi-system/largeScreen/delete/:id
 *   /bi-system/largeScreen/group/{list,save,update,delete/:id/:deleted}
 */
export const largeScreenRouter = new Hono<{ Variables: AuthVariables }>();

largeScreenRouter.use("*", authMiddleware);

// 列表
largeScreenRouter.post("/largeScreen/list", zValidator("json", ScreenListReqSchema), async (c) => {
  const { userId, role } = { userId: c.get("userId"), role: c.get("role") };
  const body = c.req.valid("json");
  return c.json(await listScreens(userId, role, body));
});

// 详情（含 layers）
largeScreenRouter.get("/largeScreen/info/:id", async (c) => {
  const { userId, role } = { userId: c.get("userId"), role: c.get("role") };
  const { id } = IdParamSchema.parse({ id: c.req.param("id") });
  return c.json(await getScreen(userId, role, id, c.req.header("Version-Code")));
});

// 大屏基本信息（不含 layers 及各类重 JSON）—— 前端 getScreenMeta / 缓存时间比对
largeScreenRouter.get("/largeScreen/meta/:id", async (c) => {
  const { userId, role } = { userId: c.get("userId"), role: c.get("role") };
  const { id } = IdParamSchema.parse({ id: c.req.param("id") });
  return c.json(await getScreenMeta(userId, role, id, c.req.header("Version-Code")));
});

// 新增
largeScreenRouter.post("/largeScreen/save", zValidator("json", ScreenSaveSchema), async (c) => {
  const { userId, userName } = { userId: c.get("userId"), userName: c.get("userName") };
  const body = c.req.valid("json");
  return c.json(await createScreen(userId, userName, body));
});

// 更新
largeScreenRouter.put("/largeScreen/update", zValidator("json", ScreenUpdateSchema), async (c) => {
  const { userId, role, userName } = {
    userId: c.get("userId"),
    role: c.get("role"),
    userName: c.get("userName")
  };
  const body = c.req.valid("json");
  return c.json(await updateScreen(userId, role, userName, body, c.req.header("Version-Code")));
});

// 删除
largeScreenRouter.delete("/largeScreen/delete/:id", async (c) => {
  const { userId, role } = { userId: c.get("userId"), role: c.get("role") };
  const { id } = IdParamSchema.parse({ id: c.req.param("id") });
  return c.json(await deleteScreen(userId, role, id));
});

// 分组列表
largeScreenRouter.get("/largeScreen/group/list", async (c) => {
  const { userId, role } = { userId: c.get("userId"), role: c.get("role") };
  return c.json(await listGroups(userId, role));
});

// 分组新增
largeScreenRouter.post("/largeScreen/group/save", zValidator("json", LargeGroupSaveSchema), async (c) => {
  const { userId, userName } = { userId: c.get("userId"), userName: c.get("userName") };
  const body = c.req.valid("json");
  return c.json(await createGroup(userId, userName, body));
});

// 分组更新
largeScreenRouter.put("/largeScreen/group/update", zValidator("json", LargeGroupUpdateSchema), async (c) => {
  const { userId, role, userName } = {
    userId: c.get("userId"),
    role: c.get("role"),
    userName: c.get("userName")
  };
  const body = c.req.valid("json");
  return c.json(await updateGroup(userId, role, userName, body));
});

// 分组删除：:deleted=true 连带删除子大屏
largeScreenRouter.delete("/largeScreen/group/delete/:id/:deleted", async (c) => {
  const { userId, role } = { userId: c.get("userId"), role: c.get("role") };
  const { id } = IdParamSchema.parse({ id: c.req.param("id") });
  const deleted = c.req.param("deleted") === "true";
  return c.json(await deleteGroup(userId, role, id, deleted));
});

/**
 * 模板 / 示例大屏（开源版无种子模板，统一返回空）
 *   /largeScreen/group/examples/list —— “从模板新建”对话框的示例分组
 *   /largeScreen/queryModel          —— 模板轮播分页
 * 需要「从模板新建」时再补种子数据与真实实现。
 */
// 引用面板：取被引用大屏的 config + layers（quoteInfo = 编辑态，openQuote = 发布态，同逻辑）
largeScreenRouter.on("POST", ["/largeScreen/quoteInfo", "/largeScreen/openQuote"], async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { quoteId?: number | string; versionCode?: string };
  return c.json(await quoteInfo(Number(body.quoteId), body.versionCode ?? c.req.header("Version-Code")));
});

largeScreenRouter.get("/largeScreen/group/examples/list", (c) => c.json(ok<unknown[]>([])));
largeScreenRouter.post("/largeScreen/queryModel", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { current?: number; size?: number };
  return c.json(ok(pageOf([], 0, Number(body.current ?? 1), Number(body.size ?? 20))));
});
