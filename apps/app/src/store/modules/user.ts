import { ref } from "vue";

import { defineStore } from "pinia";

import { getCurrentUser, getRouteData } from "@/api/login";
import type { TreeResult, User } from "@/model/Login";
import { resetRouter } from "@/router/index";
import store from "@/store";
import { getActive, removeToken, setActive } from "@/utils/auth";

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

  /** 拉取当前用户信息（开源单机版恒为默认超管），用于展示用户名/角色及 createdBy 等字段取值 */
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

  const resetCache = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("routeData");
  };

  const logout = () => {
    removeToken();
    resetRouter();
    resetCache();
  };

  return {
    userInfo,
    isRequestMenu,
    asyncRoute,
    menuList,
    setUserInfo,
    getRouteList,
    logout,
    fetchCurrentUser
  };
});

/** 在 setup 外使用 */
export function useUserStoreHook() {
  return useUserStore(store);
}
