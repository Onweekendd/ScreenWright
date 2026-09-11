import { ref } from "vue";
import { type RouteRecordRaw } from "vue-router";

import { defineStore } from "pinia";

import { asyncRoutes, constantRoutes, settingsRoute } from "@/router/router.config";
import store from "@/store";
import { useUserStoreHook } from "@/store/modules/user";

export const usePermissionStore = defineStore("permission", () => {
  const routes = ref<RouteRecordRaw[]>([]);
  const dynamicRoutes = ref<RouteRecordRaw[]>([]);

  const getDynamicRoute: () => RouteRecordRaw[] = () => {
    const Layout = () => import(/* @vite-ignore */ "@/layout/index.vue");
    const userStore = useUserStoreHook();
    const layout = {
      name: "layout",
      path: "/",
      component: Layout,
      children: [settingsRoute()] as RouteRecordRaw[]
    };
    userStore.asyncRoute.forEach((item: any) => {
      layout.children.push(item);
    });
    return [layout];
  };
  const setRoutes = () => {
    const accessedRoutes = getDynamicRoute();
    routes.value = constantRoutes.concat(accessedRoutes);
    dynamicRoutes.value = accessedRoutes.concat(asyncRoutes);
  };

  return { routes, dynamicRoutes, setRoutes };
});

/** 在 setup 外使用 */
export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
