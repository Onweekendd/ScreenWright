/**
 * 具体的动画处理器实现
 */
import type { ComponentSettingItem } from "@screenwright/types";

import { LARGE_SCREEN_ANIMATION_FLAG } from "../../../../../buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import type { Animation } from "../../../../type";
import { BaseHandler } from "./BaseHandler";

// 动画触发函数类型
export type TriggerAnimationFunction = (params: {
  animation: Animation;
  triggerType: "enter" | "preview";
  needImportant?: boolean;
}) => void;

// 面板动画数据获取函数类型
export type GetPanelAnimationDataFunction = () => Map<
  string,
  {
    load: ComponentSettingItem[];
    unload: ComponentSettingItem[];
  }
>;

/**
 * 进入动画处理器
 */
export class EnterAnimationHandler extends BaseHandler {
  constructor(
    private enterActiveAnimation: Animation,
    private triggerAnimation: TriggerAnimationFunction,
    private isPreview?: boolean
  ) {
    super();
  }

  canHandle(): boolean {
    return this.enterActiveAnimation.type !== "none";
  }

  doHandle(): boolean {
    this.triggerAnimation({
      animation: this.enterActiveAnimation,
      triggerType: this.isPreview ? "preview" : "enter"
    });
    return true;
  }
}

/**
 * 面板动画处理器
 */
export class PanelAnimationHandler extends BaseHandler {
  constructor(
    private panelId: number | undefined,
    private statusId: string | undefined,
    private componentId: string | number,
    private getPanelAnimationData: GetPanelAnimationDataFunction,
    private triggerAnimation: TriggerAnimationFunction
  ) {
    super();
  }

  canHandle(): boolean {
    // 检查 panelId 和 statusId 是否存在
    if (!this.panelId || !this.statusId) {
      return false;
    }

    // 检查是否存在面板动画数据
    const key = `${this.panelId}-${this.statusId}`;
    const panelIdAndStatusIdToAnimationMap = this.getPanelAnimationData();
    const componentSettingList = panelIdAndStatusIdToAnimationMap.get(key);

    if (!componentSettingList) {
      return false;
    }

    // 检查是否存在当前组件的动画配置
    const loadAnimation = componentSettingList.load.find(
      (componentSetting) => `${componentSetting.id}` === this.componentId
    );

    return !!loadAnimation;
  }

  doHandle(): boolean {
    const key = `${this.panelId}-${this.statusId}`;
    return this.executeAnimation(key);
  }

  private executeAnimation(key: string): boolean {
    const panelIdAndStatusIdToAnimationMap = this.getPanelAnimationData();
    const componentSettingList = panelIdAndStatusIdToAnimationMap.get(key);
    if (!componentSettingList) {
      return false;
    }

    const loadAnimation = componentSettingList?.load.find(
      (componentSetting) => `${componentSetting.id}` === this.componentId
    );

    if (loadAnimation) {
      this.triggerAnimation({
        animation: {
          ...loadAnimation,
          type: loadAnimation.animationType
        },
        triggerType: "enter",
        needImportant: loadAnimation.type === "unload"
      });
      return true;
    }
    return false;
  }
}

/**
 * 大屏动画处理器
 */
export class ScreenAnimationHandler extends BaseHandler {
  constructor(
    private componentId: string | number,
    private getPanelAnimationData: GetPanelAnimationDataFunction,
    private triggerAnimation: TriggerAnimationFunction
  ) {
    super();
  }

  canHandle(): boolean {
    // 检查是否存在大屏动画数据
    const panelIdAndStatusIdToAnimationMap = this.getPanelAnimationData();
    const componentSettingList = panelIdAndStatusIdToAnimationMap.get(LARGE_SCREEN_ANIMATION_FLAG);

    if (!componentSettingList) {
      return false;
    }

    // 检查是否存在当前组件的动画配置
    const loadAnimation = componentSettingList.load.find(
      (componentSetting) => `${componentSetting.id}` === this.componentId
    );

    return !!loadAnimation;
  }

  doHandle(): boolean {
    const key = LARGE_SCREEN_ANIMATION_FLAG;
    const panelIdAndStatusIdToAnimationMap = this.getPanelAnimationData();
    const componentSettingList = panelIdAndStatusIdToAnimationMap.get(key);
    if (!componentSettingList) {
      return false;
    }

    const loadAnimation = componentSettingList?.load.find(
      (componentSetting) => `${componentSetting.id}` === this.componentId
    );

    if (loadAnimation) {
      this.triggerAnimation({
        animation: {
          ...loadAnimation,
          type: loadAnimation.animationType
        },
        triggerType: "enter",
        needImportant: loadAnimation.type === "unload"
      });
      return true;
    }
    return false;
  }
}
