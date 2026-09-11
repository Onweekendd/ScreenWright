import type { Component } from "vue";

import { component as MaterialExtendsComponentMap } from "@screenwright/material/extends";
import type { ExtendsChildComponentEnum, ExtendsEnum } from "@screenwright/types";

// 扩展组件分发表 —— 现全部来自已物料化的 @screenwright/material/extends
// （UE 串流 / 数字人组件已移除）。
export const ScreenwrightExtendsComponentMap: Record<ExtendsEnum, Component> = {
  ...(MaterialExtendsComponentMap as Record<ExtendsEnum, Component>)
};

export const ScreenwrightExtendsChildComponentMap: Partial<Record<ExtendsChildComponentEnum, Component>> = {};
