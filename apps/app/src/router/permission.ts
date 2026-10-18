import { ElMessage } from "element-plus";

import { useTitle } from "@/hooks/useTitle";
import router from "@/router";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useUserStoreHook } from "@/store/modules/user";
import { getToken } from "@/utils/auth";
import { safeRedirectTarget } from "@/utils/session";

import { isPublicRoute, isWhiteList, whiteUserFetchList } from "./white-list";

const { setTitle } = useTitle();
const userStore = useUserStoreHook();
const permissionStore = usePermissionStoreHook();
let skipNextDisplayMenuRefresh = false;

router.beforeEach(async (to, from, next) => {
  const shouldRefreshMenu = to.path === "/display";
  const token = getToken();

  // 独立渲染页：不走菜单 / 动态路由那套
  if (isWhiteList(to)) {
    next();
    return;
  }

  // 登录页：已登录直接回到来源页 / 主页，未登录放行
  if (to.name === "login") {
    if (token) {
      next({ path: safeRedirectTarget(to.query.redirect), replace: true });
    } else {
      next();
    }
    return;
  }

  // 分享预览页：匿名可看；已登录则照常走下面的初始化，拿到完整的用户 / 菜单上下文
  if (isPublicRoute(to) && !token) {
    next();
    return;
  }

  // 其余页面必须登录，带上目标地址以便登录后回跳
  if (!token) {
    next({ name: "login", query: { redirect: to.fullPath }, replace: true });
    return;
  }

  try {
    if (!whiteUserFetchList.includes(to.name as string)) {
      await userStore.fetchCurrentUser();
    }

    if (!userStore.isRequestMenu) {
      await userStore.getRouteList(shouldRefreshMenu);
      permissionStore.setRoutes();
      permissionStore.dynamicRoutes.forEach((route) => {
        router.addRoute(route);
      });
      if (to.path === "/") {
        next({ path: "/display" });
        return;
      }
      skipNextDisplayMenuRefresh = true;
      next({ ...to, replace: true });
      return;
    }

    if (to.path === "/") {
      next({ path: "/display" });
      return;
    }
    // 仅在进入 /display 时强制拉取最新菜单，其余路由使用缓存
    if (shouldRefreshMenu) {
      if (skipNextDisplayMenuRefresh) {
        skipNextDisplayMenuRefresh = false;
      } else {
        await userStore.getRouteList(true);
      }
    }
    next();
  } catch (err: unknown) {
    // 401 已由请求层统一处理（清登录态 + 跳登录页），这里只提示其余错误；
    // 无论如何都要放行，避免 router.isReady() 永不 resolve、首屏一直卡在加载页
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 401) {
      const message = err instanceof Error ? err.message : "路由初始化失败";
      ElMessage.error(message);
    }
    next();
  }
});

router.afterEach((to) => {
  setTitle(to.meta.title);
});
