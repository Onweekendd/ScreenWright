import { createApp } from "vue";

import DataVVue3 from "@kjgl77/datav-vue3";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { enableMapSet, setAutoFreeze } from "immer";

import materialRegistry from "@/components/MaterialRegistry";
import { loadDirectives } from "@/directives";
import { setupUsePorts } from "@/setup/usePorts";
import { registerMitt } from "@/utils/registerMitt";

import App from "./App.vue";
import router from "./router";
import store from "./store";

import "element-plus/dist/index.css";
import "@screenwright/ui/dist/index.css";
// 注意：@screenwright/material 的样式按环境区分加载——
// dev 直连 material 源码，scoped 样式由 SFC 编译自动注入，无需 dist；
// prod 才加载构建产物 dist/style.css（见底部挂载逻辑）。
import "@/style/index.scss";

import "@/router/permission";

registerMitt();

// @screenwright/composables / 物料包的端口注入统一收敛到 setupUsePorts（主入口与导出入口共用），
// 必须在挂载前调用一次。
setupUsePorts(router);

enableMapSet();
setAutoFreeze(false);

const app = createApp(App);

// app.config.performance = true;

loadDirectives(app);
app
  .use(ElementPlus, {
    locale: zhCn
  })
  .use(store)
  .use(router)
  .use(DataVVue3)
  .use(materialRegistry);
router.isReady().then(async () => {
  // 仅生产环境加载物料包构建产物样式；dev 由 SFC 源码编译注入。
  // await 确保样式就绪后再挂载，避免首屏闪烁（FOUC）。
  if (import.meta.env.PROD) {
    await import("@screenwright/material/dist/style.css");
  }
  app.mount("#app");
  // 挂载到 window
});
