import type { ComponentType } from "@screenwright/types";

import { buildIdNameBase } from "../../tools/file/utils";
import type { ComponentFileReference } from "./types";

/** 容器只保存直属子组件的身份与文件引用，完整配置仍独立落盘。 */
export const buildComponentReference = (component: ComponentType): ComponentFileReference => ({
  id: component.id,
  name: component.name ?? component.title ?? "",
  type: component.title ?? "",
  prop: component.component.prop,
  file: `${buildIdNameBase(component.id, component.name ?? component.title ?? "")}.json`
});
