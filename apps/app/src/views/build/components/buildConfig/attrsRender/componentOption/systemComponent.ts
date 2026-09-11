import type { Component } from "vue";
import { defineAsyncComponent, markRaw } from "vue";

import { PanelType } from "../../../buildRender/core/SystemComponent/type";

export const enum optionType {
  global = "Global",
  transform = "Transform",
  frostedGlass = "FrostedGlass"
}

export const defaultOptions = [{ label: "全局", value: optionType.global }];

/**
 * @description 将蛇形命名转换为驼峰命名
 * @param snakeCase 蛇形命名
 * @returns 驼峰命名
 */
function snakeToCamel(snakeCase: string): string {
  return snakeCase
    .split("-")
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

export const ftDynamicPanelOptions = [
  { label: "全局", value: optionType.global },
  { label: "3D变化", value: optionType.transform },
  { label: "毛玻璃", value: optionType.frostedGlass }
];

export const ftEncodePanelOptions = [{ label: "全局", value: optionType.global }];

interface SystemComponentOption {
  label: string;
  value: string;
  component?: Component;
}

// 面板判别值（阶段3-5b：ft-panel→sw-panel、ft-quote→sw-quote）与 systemComponent/system*/ 下
// 的 .vue 文件名解耦：判别值已改名，但文件名仍是历史命名（CSS/文件名本次不改），
// 直接 snakeToCamel(判别值) 会拼出不存在的 swPanelGlobal.vue，导致拖拽时动态 import 失败。
const panelFileBaseName: Record<PanelType, string> = {
  [PanelType.dynamicPanel]: "ftPanel",
  [PanelType.encodePanel]: "terminalControl",
  [PanelType.quotePanel]: "ftQuote",
  [PanelType.artifactAppPreview]: "artifactAppPreview"
};

const getAsyncComponentByProps = (component: PanelType, preFix: string) => {
  const componentName = (panelFileBaseName[component] ?? snakeToCamel(component)) + preFix;
  return defineAsyncComponent(() => import(`../../systemComponent/system${preFix}/${componentName}.vue`));
};

const getOptionComponent = (options: SystemComponentOption[], type: PanelType): SystemComponentOption[] => {
  return options.map((item) => {
    return {
      label: item.label,
      value: item.value,
      component: markRaw(getAsyncComponentByProps(type, item.value))
    };
  });
};

export const systemComponentOptions: Record<PanelType, SystemComponentOption[]> = {
  [PanelType.artifactAppPreview]: getOptionComponent(defaultOptions, PanelType.artifactAppPreview),
  [PanelType.dynamicPanel]: getOptionComponent(ftDynamicPanelOptions, PanelType.dynamicPanel),
  [PanelType.encodePanel]: getOptionComponent(ftEncodePanelOptions, PanelType.encodePanel),
  [PanelType.quotePanel]: getOptionComponent(ftEncodePanelOptions, PanelType.quotePanel)
};
