import type { Component } from "vue";

import { ThirdPartEnum } from "@screenwright/types";

import datav from "./datav/index.vue";
import echartcommon from "./echartcommon/index.vue";
import vuePart from "./vuePart/index.vue";

// 自定义组件（在线代码编辑器 / 代码包）已移除
export const ScreenwrightThirdPartComponentMap: Partial<Record<ThirdPartEnum, Component>> = {
  [ThirdPartEnum.VuePart]: vuePart,
  [ThirdPartEnum.DataV]: datav,
  [ThirdPartEnum.EchartCommon]: echartcommon
};
