import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

import materialRegistry from "@/components/MaterialRegistry";
import { setupUsePorts } from "@/setup/usePorts";
import Exception from "@/views/exception/index.vue";

import ScreenwrightApp from "./App.vue";
import ScreenwrightView from "./ScreenView.vue";

import "@/style/animationOut.scss";
import "@/style/box.scss";
import "@/style/common.scss";
import "@/style/element/index.scss";
import "@/style/iconfont/iconfont.css";
import "@/style/theme.scss";
// 物料包（@screenwright/material）SFC 的 scoped 样式在其 dist/style.css 单独产物里，JS 不会自动带上。
// 导出入口只经 vite.lib.config.ts 构建、恒定消费 material dist，故在此静态引入；
// 配合 lib 配置的 cssCodeSplit:false + assetFileNames，会合并进最终 screenwright.css。
// （main.ts 因 dev 直连 material 源码由 SFC 自动注入样式，才需 PROD 分支，本入口无此分支。）
import "@screenwright/material/dist/style.css";
// import "@/style/index.scss";
// import "@/style/common.scss";
// import "@/style/box.scss";
// import "@/style/common.scss";
import "@/style/normalize.css";

// 导出真正的 hooks 实现（供二次开发使用）
export * from "./sdk/hooks";

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "largeScreen",
    component: ScreenwrightView,
    meta: {
      title: "Screenwright"
    }
  },
  {
    path: "/:encodeId",
    component: ScreenwrightView,
    name: "encodePanel",
    meta: {
      title: "Screenwright 终端预览"
    }
  },
  {
    path: "/404",
    component: Exception
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
});

export { router, ScreenwrightApp, ScreenwrightView };

export const install = (app: App) => {
  // 安装主入口组件
  app.component(ScreenwrightApp.name || "ScreenwrightApp", ScreenwrightApp);
  // 安装路由
  app.use(router);

  // @screenwright/composables / 物料包的端口注入（router/http/业务端口），与主入口 main.ts 共用同一份实现，
  // 否则物料组件运行时会抛 "[@screenwright/composables] router 尚未初始化"。用本入口自己的 router。
  setupUsePorts(router);

  app.use(materialRegistry);
};

export default {
  install
};
