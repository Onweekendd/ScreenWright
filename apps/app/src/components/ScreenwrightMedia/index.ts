import type { Component } from "vue";

import { ScreenwrightMediaMap as MaterialScreenwrightMediaMap } from "@screenwright/material";
import { MediaEnum } from "@screenwright/types";

import ftIframe from "./components/ftiframe/index.vue";

/**
 * 媒体类物料渲染组件映射。
 * 绝大多数已迁移至 @screenwright/material，此处直接复用其 ScreenwrightMediaMap；
 * 仅 FtIframe 因深度耦合大屏编辑器能力（EditShapeBox/EditGroup 等）未物料化，实现留在 app 本地并在此合并。
 */
export const ScreenwrightMediaMap: Partial<Record<MediaEnum, Component>> = {
  ...MaterialScreenwrightMediaMap,
  [MediaEnum.FtIframe]: ftIframe
};
