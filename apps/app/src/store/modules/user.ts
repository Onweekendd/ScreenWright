import { ref } from "vue";

import { defineStore } from "pinia";

import { getCurrentUser, getRouteData, login as loginRequest } from "@/api/login";
import type { LoginReq, TreeResult, User } from "@/model/Login";
import store from "@/store";
import { getActive, setActive, setToken } from "@/utils/auth";
import { clearSession, redirectToLogin } from "@/utils/session";

const modules = import.meta.glob("@/views/**/index.vue");
export interface MenuToRouteProps {
  name: string;
  path: string;
  component: () => Promise<any>;
  meta: {
    title: string;
    hidden: boolean;
  };
}

export const useUserStore = defineStore("User", () => {
  const userInfo = ref<User>(getActive("userInfo") || null);
  const asyncRoute = ref<MenuToRouteProps[]>([]);
  const menuList = ref<TreeResult[]>([]);
  const filterRoute = ["/cityMap", "/map", "/interfaceDebugger", "/pluginLibrary", "/aiReconstruction"];
  // 是否请求过菜单
  const isRequestMenu = ref(false);

  const setUserInfo = (userInfoData: User) => {
    userInfo.value = userInfoData;

    setActive("userInfo", userInfoData);
  };

  /** 用户名密码登录：成功后保存令牌与用户信息；失败抛出带后端提示语的 Error */
  const login = async (form: Pick<LoginReq, "username" | "password">): Promise<User> => {
    let res;
    try {
      res = await loginRequest(form);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(message || "登录失败，请检查网络或稍后重试");
    }
    if (!res.success) {
      throw new Error(res.message || "登录失败");
    }
    // 换账号登录时旧账号的菜单缓存必须作废
    localStorage.removeItem("routeData");
    isRequestMenu.value = false;
    setToken(res.result.token);
    setUserInfo(res.result.userInfo);
    return res.result.userInfo;
  };

  /** 拉取当前用户信息，用于展示用户名/角色及 createdBy 等字段取值 */
  const fetchCurrentUser = async (): Promise<User> => {
    const res = await getCurrentUser();
    if (res.success) {
      setUserInfo(res.result);
    }
    return userInfo.value;
  };

  const getMenuRoute = (routesList: Array<TreeResult>): MenuToRouteProps[] => {
    return routesList
      .map((item: TreeResult) => {
        const componentPath = modules[`/src/views/${item.component}.vue`];
        return {
          name: item.name,
          path: item.path,
          component: componentPath,
          meta: {
            title: item.name,
            hidden: item.hidden
          }
        };
      })
      .filter((item) => !item.meta.hidden)
      .filter((item) => !filterRoute.includes(item.path));
  };

  const getRouteList = async (forceRefresh = false) => {
    const cacheRouteData = localStorage.getItem("routeData") || "[]";
    const parserCacheRouteData = JSON.parse(cacheRouteData) as TreeResult[];
    const hasCacheMenu = parserCacheRouteData.length > 0;

    if (!forceRefresh && hasCacheMenu) {
      menuList.value = parserCacheRouteData;
      asyncRoute.value = getMenuRoute(menuList.value);
    } else {
      const routeData = await getRouteData();
      if (routeData.success) {
        menuList.value = routeData.result;
        asyncRoute.value = getMenuRoute(menuList.value);
        localStorage.setItem("routeData", JSON.stringify(routeData.result));
      }
    }
    isRequestMenu.value = true;
    return asyncRoute.value;
  };

  /** 退出登录：清令牌与用户缓存，整页跳转登录页（刷新同时重置内存里的动态路由 / 菜单状态） */
  const logout = () => {
    clearSession();
    redirectToLogin();
  };

  return {
    userInfo,
    isRequestMenu,
    asyncRoute,
    menuList,
    setUserInfo,
    getRouteList,
    login,
    logout,
    fetchCurrentUser
  };
});

/** 在 setup 外使用 */
export function useUserStoreHook() {
  return useUserStore(store);
}
