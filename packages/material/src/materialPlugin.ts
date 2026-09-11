import type { App } from "vue";

import { ScreenwrightTextComponent } from "./components/ScreenwrightText";
import { ScreenwrightTextConfigComponent } from "./editor-ui/textComponent/index";

export const materialPlugin = {
  install(app: App) {
    // 注册渲染组件
    for (const [key, component] of Object.entries(ScreenwrightTextComponent)) {
      app.component(`ScreenwrightText_${key}`, component);
    }

    // 注册配置面板组件（每个 tab 独立注册，名称唯一）
    for (const [textType, tabs] of Object.entries(ScreenwrightTextConfigComponent)) {
      for (const tab of tabs) {
        const name = `ScreenwrightTextConfig_${textType}_${tab.value}`;
        app.component(name, tab.component);
      }
    }
  },
};
