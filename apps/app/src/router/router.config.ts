// import Login from "@/views/login/index.vue"
// import Layout from "@/layout/index.vue"
import { type RouteRecordRaw } from "vue-router";

import Exception from "@/views/exception/index.vue";

/**
 * 基础路由
 * @type { *[] }
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    // 开源单机版无登录：旧地址重定向到主页
    path: "/login",
    redirect: "/display",
    meta: {
      hidden: true
    }
  },
  {
    name: "layout",
    path: "/",
    component: () => import("@/layout/index.vue"),
    children: [settingsRoute()]
  },
  {
    path: "/build/:id",
    name: "build",
    component: () => import("@/views/build/index.vue"),
    meta: {
      title: "编辑应用"
    }
  },
  {
    path: "/build/:id/panel_:cid",
    name: "panel",
    component: () => import("@/views/build/components/panelEditor/index.vue"),
    meta: {
      title: "编辑动态面板"
    }
  },
  {
    path: "/build/:id/encode_:cid",
    name: "encode",
    component: () => import("@/views/build/components/encodeEditor/index.vue"),
    meta: {
      title: "编辑终端交互"
    }
  },
  {
    path: "/view/:id",
    name: "view",
    component: () => import("@/views/view/index.vue"),
    meta: {
      title: "预览"
    }
  },
  {
    path: "/view/:id/panel_:cid",
    name: "panelView",
    component: () => import("@/views/view/index.vue"),
    meta: {
      title: "动态面板预览"
    }
  },
  {
    path: "/shareScreen/:id",
    name: "shareScreen",
    component: () => import("@/views/shareScreen/index.vue"),
    meta: {
      title: "发布预览"
    }
  },
  {
    path: "/invalid",
    name: "invalid",
    component: () => import("@/views/invalid/index.vue"),
    meta: {
      title: "无效页面"
    }
  }
  // {
  //   path: "/staticPrview",
  //   name: "staticPrview",
  //   component: () => import("@/views/view/staticPrview.vue"),
  //   meta: {
  //     title: "测试本地文件"
  //   }
  // }
];

/**
 * 「设置」页：作为 layout 的子路由，渲染在右侧内容区，一级侧边栏保持不动。
 * 动态菜单加载时会用同名 layout 路由覆盖静态那份（见 permission store），
 * 所以那边的 children 也要带上它 —— 用工厂函数保证两处是同一份定义。
 */
export function settingsRoute(): RouteRecordRaw {
  return {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/settings/index.vue"),
    meta: { title: "模型设置" }
  };
}

export const asyncRoutes = [
  {
    name: "404",
    path: "/404",
    component: Exception
  }
];
