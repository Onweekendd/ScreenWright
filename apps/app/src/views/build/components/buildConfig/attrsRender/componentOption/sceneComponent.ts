import { sceneComponentType, sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";

import type { SingleOption } from "./ComponentOptions";
import { ComponentOptions } from "./ComponentOptions";

export enum optionType {
  global = "Global"
}
// 场景模板
export const defaultOption = [{ label: "全局", value: optionType.global, hidden: true }];
export const defaultShowOption = [{ label: "全局", value: optionType.global }];

class SceneComponentOptions extends ComponentOptions<sceneEnumType> {
  constructor() {
    const defaultOptions: { [key: string]: SingleOption[] } = {
      [sceneEnumType.EchartcommonMap]: defaultShowOption,
      [sceneEnumType.EchartGlmap]: defaultShowOption
    };
    const importPath = "sceneComponent/scene";
    super(optionType, defaultOptions, sceneComponentType, importPath);
  }
}
export const sceneComponentOptions = new SceneComponentOptions().getComponentOptions();
