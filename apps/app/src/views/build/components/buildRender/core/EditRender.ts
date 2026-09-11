import { createVNode, nextTick, render } from "vue";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import type { componentsOptions } from "../../../../../components/MaterialRegistry";
import materialRegistry from "../../../../../components/MaterialRegistry";
import buildRenderConstructor from "../buildRender.vue";

interface Props {
  el: string;
  editConfig: LargeScreenDetailInfo;
  data: any[];
  renderComponent?: any[];
}

export type EditRenderInstance = EditRender;
class EditRender {
  private static _instance: EditRender | null = null;
  el: string | undefined;
  editConfig: LargeScreenDetailInfo | undefined;
  data: any[] | undefined;
  isRender = false;
  // renderComponent: any[] = []

  constructor(props: Props) {
    this.el = props.el;
    this.editConfig = props.editConfig;
    this.data = props.data;
    // this.renderComponent = props.renderComponent || []
    this.createEditByElement();
    EditRender._instance = this;
    this.isRender = true;
  }

  static get instance(): EditRender {
    if (!EditRender._instance) {
      throw new Error("EditRender 类的实例还未创建，请先调用构造函数");
    }
    return EditRender._instance;
  }

  registerComponents(options: componentsOptions) {
    // this.renderComponent.push(options)
    materialRegistry.registerComponents(options);
  }

  _setElStyle(el: HTMLElement) {
    if (!this.editConfig) {
      throw new Error("editConfig is undefined");
    }
    const scale = this.editConfig.scale ? this.editConfig.scale : 0.6;
    el.style.width = `${Number(this.editConfig.width) * scale}px`;
    el.style.height = `${Number(this.editConfig.height) * scale}px`;
    el.style.overflow = `hidden`;
    el.style.boxShadow = "0 8px 10px rgb(30 30 30 / 12%)";
  }

  async createEditByElement() {
    await nextTick();
    console.log(this.el, "this.el");
    if (!this.el) {
      throw new Error("Element selector is undefined");
    }
    const el = document.querySelector(this.el) as HTMLElement;
    const container = document.createElement("div");
    console.log(this.data, " this.data");
    if (!el) {
      return;
    }
    const vnode = createVNode(buildRenderConstructor, {
      modelValue: this.data,
      editConfig: this.editConfig
    });
    render(vnode, container);
    el.appendChild(container.firstElementChild!);
  }
}

export { EditRender };
