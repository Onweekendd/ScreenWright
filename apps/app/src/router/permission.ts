import { ElMessage } from "element-plus";

import { useTitle } from "@/hooks/useTitle";
import router from "@/router";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useUserStoreHook } from "@/store/modules/user";

import { isWhiteList, whiteEquitiesInfo } from "./white-list";

const { setTitle } = useTitle();
const userStore = useUserStoreHook();
const permissionStore = usePermissionStoreHook();
let skipNextDisplayMenuRefresh = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 桌面外壳首启时后端可能还在预热（加载 mastra.db / 建索引），
 * 权益 / 菜单接口会短暂拒绝连接。重试几次，避免守卫抛错把路由永久卡死。
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 6, delay = 1500): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

// 开源单机版：无登录。仍保留菜单/权益初始化 + 独立页（大屏预览/分享/终端）跳过 app 外壳。
router.beforeEach(async (to, from, next) => {
  const shouldRefreshMenu = to.path === "/display";

  // 独立渲染页：不走菜单 / 动态路由那套
  if (isWhiteList(to)) {
    next();
    return;
  }
  // 旧的登录页地址一律回主页
  if (to.path === "/login") {
    next({ path: "/display" });
    return;
  }

  try {
    if (!whiteEquitiesInfo.includes(to.name as string)) {
      await withRetry(() => userStore.getRoleEquitiesInfo());
    }

    if (!userStore.isRequestMenu) {
      await withRetry(() => userStore.getRouteList(shouldRefreshMenu));
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
    // 无论如何都要放行，避免 router.isReady() 永不 resolve、首屏一直卡在加载页
    const message = err instanceof Error ? err.message : "路由初始化失败";
    ElMessage.error(message);
    next();
  }
});

router.afterEach((to) => {
  setTitle(to.meta.title);
});
