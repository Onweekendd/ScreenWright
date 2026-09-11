import type { component2DType as OtherComponentType } from "@/components/componentEntry/type";
import type { ComponentType as ElementType } from "@/views/build/components/buildRender/type";

import type { componentType as BaseComponentType } from "../../buildRender/core/BaseComponent/type";
import type { ComponentType as SystemComponentType } from "../../buildRender/core/SystemComponent/type";
import { componentOption } from "./componentOption";

// import { Component, markRaw } from "vue"
// 默认的组件配置
// const defaultRenderConfig = (key: string, type: string, component: Component) => {
//   if (key.includes(type)) {
//     return markRaw(component)
//   }
//   return null
// }
interface Props {
  component: BaseComponentType;
  element: ElementType;
}
// 往这里加组件配置组件的映射
// export const mapComponent = {
//   [renderEchartComponentType.join(",")]: (key: string, type: string) => defaultRenderConfig(key, type, echartsConfig)
// }
class BaseAttrsRender {
  options: Array<{
    label: string;
    value: string;
    component?: null;
  }>;
  element: ElementType;
  renderComponent: null;
  activeTab: string;
  component: BaseComponentType | SystemComponentType | OtherComponentType;
  constructor(props: Props) {
    this.component = props.component;
    this.element = props.element;
    this.options = [];
    this.activeTab = "";
    this.renderComponent = null;
    this.getOptionByComponent(this.component);
  }

  getOptionByComponent(component: BaseComponentType | SystemComponentType | OtherComponentType) {
    this.options = (componentOption as Record<string, any>)[component] || [];

    if (!this.options || this.options.length === 0) {
      return;
    }
    if ((this.component as string) === "swtext" && this.element.title !== "文本框") {
      // 只保留第一个
      this.options = this.options.slice(0, 1);
    }

    this.activeTab = this.options[0].value;
    this.renderComponent = this.getRenderComponent(this.activeTab);
  }

  getRenderComponent(activeTab: string) {
    if (!this.options) {
      return null;
    }
    const option = this.options.find((item) => item.value === activeTab);
    return option?.component || null;
  }
}

export { BaseAttrsRender as baseAttrsRender };
