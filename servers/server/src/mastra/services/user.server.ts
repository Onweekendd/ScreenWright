import { HTTPException } from "hono/http-exception";

import { ok } from "@/lib/http/envelope";
import { prismaClient } from "@/mastra/storage/prisma";

type BiUserRow = Awaited<ReturnType<typeof prismaClient.biUser.findUnique>> & object;

/** DB Json/数组字段 → 前端期望的 JSON 字符串 */
const jsonField = (v: unknown): string => {
  if (v == null) {
    return "[]";
  }
  if (typeof v === "string") {
    return v;
  }
  return JSON.stringify(v);
};

const FAR_FUTURE = "2099-12-31T23:59:59.000Z";

/** BiUser 行 → 前端 src/model/Login.ts 的 User 形状 */
function toUser(row: BiUserRow) {
  const isAdmin = row.role === 0;
  return {
    id: row.id,
    userName: row.userName,
    type: row.type,
    status: row.status,
    balance: row.balance,
    companyId: row.companyId ?? 0,
    email: row.email ?? "",
    phone: row.phone ?? "",
    realname: row.realname ?? "",
    region: row.region ?? "",
    temporaryCompanyName: row.temporaryCompanyName ?? "",
    forbidden: row.forbidden,
    role: row.role,
    stockType: row.stockType,
    expirationTime: row.expirationTime ? row.expirationTime.toISOString() : "",
    createLarge: jsonField(row.createLarge),
    createScene: jsonField(row.createScene),
    exportLarge: jsonField(row.exportLarge),
    exportScene: jsonField(row.exportScene),
    createCity: jsonField(row.createCity),
    exportCity: jsonField(row.exportCity),
    createdBy: row.createdBy ?? row.userName,
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? row.userName,
    updatedTime: row.updatedTime.toISOString(),
    // 角色权益列表：超管给 ADMIN，其余给 USER（路由守卫据此放行）
    roleAuthorizationList: [{ applicationCode: "BI", roleName: isAdmin ? "ADMIN" : "USER", endTime: FAR_FUTURE }]
  };
}

/**
 * 静态默认 BI 菜单树（getRouteData）。
 * 前端 store/modules/user.ts 的 getMenuRoute 仅消费 name/path/component/hidden，
 * component 须命中 views 下的 index.vue（拼成 /src/views/<component>.vue）。
 * 注意：display 不在 constantRoutes 与 asyncRoutes 中，必须由此返回，否则登录后路由解析失败。
 */
export function getMenuTree() {
  const node = (id: number, name: string, path: string, component: string, children: unknown[] = []) => ({
    id,
    parentId: null as number | null,
    name,
    path,
    component,
    perms: null,
    type: 1,
    hidden: false,
    sortValue: id,
    applicationId: 1,
    createdBy: "system",
    updatedBy: "system",
    createdTime: "",
    updatedTime: "",
    applicationName: "BI",
    children,
    check: true
  });

  // 数据源页的子菜单：这些 type=1 的子项被 useSourceList.ts 的 tabsList 消费成「本地文件/数据库/API」页签，
  // component 即 DataSourceType（local/db/api）。开源后端只回落了这三类（见 data-source.route.ts），
  // 不含 WebSocket/TCP-UDP。
  const sourceTabs = [
    node(31, "本地文件", "/source", "local"),
    node(32, "数据库", "/source", "db"),
    node(33, "API", "/source", "api")
  ];

  // 开源单机版已取消角色/菜单级权限控制，菜单树不再下发按钮级权限子节点。
  const tree = [
    node(1, "大屏管理", "/display", "display/index"),
    node(2, "我的资源", "/assets", "assets/index"),
    node(3, "数据源", "/source", "source/index", sourceTabs)
  ];
  return ok(tree);
}

/**
 * 当前用户信息（getCurrentUser）。开源单机版没有付费套餐/容量限额概念，
 * 只返回真实用户资料，供前端展示用户名/角色，以及 createdBy 等字段取值。
 */
export async function getCurrentUser(userId: number) {
  const user = await prismaClient.biUser.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HTTPException(404, { message: "用户不存在" });
  }
  return ok(toUser(user));
}

export function isSuperAdmin(role: number) {
  return ok(role === 0);
}
