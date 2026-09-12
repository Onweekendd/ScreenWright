import type { App, Component } from "vue";

import {
  ScreenwrightEchartsMap,
  ScreenwrightTextComponent as ScreenwrightTextComponentMap,
  ScreenwrightExhibitComponentMap,
  ScreenwrightIndicatorMap,
  ScreenwrightInteractiveMap
} from "@screenwright/material";
import type { AllComponentType } from "@screenwright/types";

import { ScreenwrightExtendsChildComponentMap, ScreenwrightExtendsComponentMap } from "@/components/ScreenwrightExtendsComponent/index";
// FtIframe 未物料化，ScreenwrightMediaMap 在本地合并了 @screenwright/material 的其余媒体组件与本地 ftiframe
import { ScreenwrightMediaMap } from "@/components/ScreenwrightMedia/index";
import { ScreenwrightSceneComponentMap } from "@/components/ScreenwrightSceneComponent/index";
import { ScreenwrightThirdPartComponentMap } from "@/components/ScreenwrightThirdPartComponent/index";
import { SystemComponentMap } from "@/components/SystemComponent/index";

export interface componentsOptions {
  type: string;
  component: Component;
}

/**
 * 低代码编辑器物料注册表
 * 管理和注册所有物料组件,支持作为 Vue 插件使用
 */
class MaterialRegistry {
  renderComponent: any[] = [];
  private static _instance: MaterialRegistry | null = null;
  private static componentMap: Map<AllComponentType, Component> | null = null;

  constructor() {
    if (MaterialRegistry._instance) {
      return MaterialRegistry._instance;
    }
    this.renderComponent = [];
    MaterialRegistry._instance = this; // 修复：确保实例被赋值
  }

  registerComponents(options: componentsOptions) {
    if (this.renderComponent.length === 0) {
      this.renderComponent.push(options);
    } else {
      const isHasComponent = this.renderComponent.some((item) => item.type === options.type);
      if (!isHasComponent) {
        this.renderComponent.push(options);
      }
    }
    MaterialRegistry.componentMap = null;
  }

  /**
   * 获取所有组件映射
   * @returns 返回所有组件的映射对象，key 为组件标识，value 为组件
   */
  getAllComponentMaps(): Partial<Record<AllComponentType, Component>> {
    return {
      ...ScreenwrightEchartsMap,
      ...ScreenwrightExtendsComponentMap,
      ...ScreenwrightExtendsChildComponentMap,
      ...ScreenwrightTextComponentMap,
      ...ScreenwrightExhibitComponentMap,
      ...ScreenwrightIndicatorMap,
      ...ScreenwrightInteractiveMap,
      ...ScreenwrightMediaMap,
      ...ScreenwrightSceneComponentMap,
      ...ScreenwrightThirdPartComponentMap,
      ...SystemComponentMap
    };
  }

  /**
   * 注册所有组件映射到 Vue 实例
   * @param app Vue 应用实例
   * @description 将所有组件以其枚举值作为名称注册到 Vue 实例中，方便使用 <component :is="xxx"> 动态渲染
   */
  registerAllComponentsToVue(app: App) {
    const allComponents = this.getAllComponentMaps();
    Object.entries(allComponents).forEach(([name, component]) => {
      app.component(name, component);
    });
  }

  /**
   * Vue 插件 install 方法
   * @param app Vue 应用实例
   * @description 实现 Vue 插件接口，支持使用 app.use(materialRegistry) 的方式注册组件
   */
  install(app: App) {
    this.registerAllComponentsToVue(app);
  }

  // 新增：获取单个组件（O(1) 查找）
  getComponent(type: AllComponentType): Component | undefined {
    if (!MaterialRegistry.componentMap) {
      // 首次调用时构建 Map
      const allComponents = this.getAllComponentMaps();
      MaterialRegistry.componentMap = new Map(Object.entries(allComponents) as [AllComponentType, Component][]);
    }
    return MaterialRegistry.componentMap.get(type);
  }
}

export default new MaterialRegistry();
