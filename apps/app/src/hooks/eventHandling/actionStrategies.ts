import { EventTypeEnum, type TotalPanelEventMap } from "@screenwright/types";

import { mediaEnum } from "@/components/componentEntry/type";
import { ActionTypeEnum } from "@/views/build/components/buildConfig/constants/action";
import { extendsEnumType } from "@/views/build/components/buildRender/core/ExtendsComponents/type";
import { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { AnimationTrigger } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import type { Action, ComponentType } from "@/views/build/components/buildRender/type";

import {
  setAnimationOnDynamicPanelStateChange,
  setComponentScaling,
  setComponentShowAndHide,
  setMovingInDoms,
  updateComponentConfig
} from "../animation/animationAction";

/**
 * 异步延迟函数
 * 用于替代 setTimeout 实现异步延迟
 * @param ms 延迟时间(毫秒)
 * @returns Promise<void> 延迟完成后resolve的Promise
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getValueByPath = (data: unknown, field: string) => {
  const source = Array.isArray(data) ? data[0] : data;
  if (!field || source == null || typeof source !== "object") {
    return undefined;
  }
  return field.split(".").reduce((target: any, key) => (target == null ? undefined : target[key]), source as any);
};

/**
 * 动作处理策略接口
 */
export abstract class ActionStrategy<T extends ActionExecutionParams = ActionExecutionParams> {
  /**
   * 执行动作
   * @param params 动作执行参数
   * @returns Promise<void> 动作执行完成的Promise
   */
  abstract execute(params: T): Promise<void> | void;
}

/**
 * 动作执行参数接口
 */
export interface ActionExecutionParams extends Partial<Action> {
  /** 组件DOM元素列表 */
  componentRootDoms: NodeListOf<HTMLElement>;
  /** 组件ID列表 */
  componentIds: number[];
  /** 条件是否满足 */
  isConditionSatisfied: boolean;
  /** 事件列表 */
  eventList: TotalPanelEventMap;
  /** 全局组件配置 */
  globalComponentMap: Map<string, ComponentType>;
  /** 组件抛出值 */
  info: Record<string, any> | null;
  /**  触发组件ID */
  sourceComponentId: number | undefined;
  /** 全局动画触发器 */
  globalAnimationTriggers: Map<string, AnimationTrigger>;
}

/**
 * 显示动作策略
 */
export class ShowStrategy extends ActionStrategy<
  ActionExecutionParams & { updateComponentDisplayCallback: (id: string, isDisplay?: boolean) => void }
> {
  async execute({
    componentRootDoms,
    animation,
    isConditionSatisfied,
    globalComponentMap,
    globalAnimationTriggers
  }: ActionExecutionParams & {
    updateComponentDisplayCallback: (id: string, isDisplay?: boolean) => void;
  }): Promise<void> {
    if (!animation) {
      return;
    }

    await delay(animation.delay || 0);

    setComponentShowAndHide({
      componentRootDoms,
      animation,
      isHidden: !isConditionSatisfied,
      globalComponentMap,
      globalAnimationTriggers
    });
  }
}

/**
 * 隐藏动作策略
 */
export class HideStrategy extends ActionStrategy<
  ActionExecutionParams & { updateComponentDisplayCallback: (id: string, isDisplay?: boolean) => void }
> {
  async execute({
    componentRootDoms,
    animation,
    isConditionSatisfied,
    globalComponentMap,
    globalAnimationTriggers
  }: ActionExecutionParams): Promise<void> {
    if (!animation) {
      return;
    }

    await delay(animation.delay || 0);

    setComponentShowAndHide({
      componentRootDoms,
      animation: {
        ...animation,
        delay: 0
      },
      isHidden: isConditionSatisfied,
      globalComponentMap,
      globalAnimationTriggers
    });
  }
}

/**
 * 显隐切换动作策略
 */
export class ShowHideStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    animation,
    isConditionSatisfied,
    globalComponentMap,
    globalAnimationTriggers
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    if (!animation) {
      return;
    }

    await delay(animation?.delay || 0);

    // 显隐切换时不需要指定isHidden 根据组件当前状态判断
    setComponentShowAndHide({
      componentRootDoms,
      animation: {
        ...animation,
        delay: 0
      },
      isToggle: true,
      globalComponentMap,
      globalAnimationTriggers
    });
  }
}

/**
 * 缩放动作策略
 */
export class ScalingStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    animation,
    scale,
    action,
    isConditionSatisfied,
    globalAnimationTriggers,
    globalComponentMap
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    if (!animation) {
      return;
    }
    if (!scale) {
      return;
    }

    await delay(animation.delay || 0);
    setComponentScaling({
      componentRootDoms,
      animation: {
        ...animation,
        delay: 0
      },
      scale,
      action: action as ActionTypeEnum.Scaling | ActionTypeEnum.ScalingHide,
      globalAnimationTriggers,
      globalComponentMap
    });
  }
}

/**
 * 移动动作策略
 */
export class MovingStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    animation,
    translate,
    isConditionSatisfied,
    globalComponentMap,
    globalAnimationTriggers
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    if (!animation) {
      return;
    }
    if (!translate) {
      return;
    }

    await delay(animation.delay || 0);

    setMovingInDoms({
      componentRootDoms,
      animation: {
        ...animation,
        delay: 0
      },
      translate,
      globalComponentMap,
      globalAnimationTriggers
    });
  }
}

/**
 * 更新配置动作策略
 */
export class UpdateConfigStrategy extends ActionStrategy<
  ActionExecutionParams & {
    updateComponentConfigCallback: (params: Pick<Action, "componentConfig">["componentConfig"]) => void;
  }
> {
  async execute(
    params: ActionExecutionParams & {
      updateComponentConfigCallback: (params: Pick<Action, "componentConfig">["componentConfig"]) => void;
    }
  ): Promise<void> {
    const { componentConfig, animation, isConditionSatisfied, updateComponentConfigCallback } = params;
    if (!isConditionSatisfied) {
      return;
    }

    if (!animation) {
      return;
    }

    if (!componentConfig) {
      return;
    }

    await delay(animation.delay || 0);

    updateComponentConfig({
      componentConfig,
      delay: animation.delay,
      updateComponentConfigCallback
    });
  }
}

/**
 * 切换状态动作策略
 */
export class SwitchStateStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    animation,
    stateId,
    componentIds,
    isConditionSatisfied,
    eventList,
    globalComponentMap,
    globalAnimationTriggers
  }: ActionExecutionParams): Promise<void> {
    if (componentRootDoms.length === 0) {
      return;
    }
    // 目标组件不在当前作用域（globalComponentMap）内：跳过，不切换状态
    if (!globalComponentMap.has(`${componentIds[0]}`)) {
      return;
    }

    if (!isConditionSatisfied) {
      return;
    }
    if (!animation) {
      return;
    }
    if (!stateId) {
      return;
    }

    await delay(animation?.delay || 0);

    const event = eventList[`${PanelType.dynamicPanel}-${componentIds[0]}`];

    if (!event.changeStatus) {
      return;
    }

    try {
      await event.changeStatus(stateId);
      setAnimationOnDynamicPanelStateChange({
        componentRootDoms,
        animation: {
          ...animation,
          delay: 0
        },
        globalAnimationTriggers
      });
    } catch (error) {
      console.warn(error);
    }
  }
}

export class HandleApiInstructionStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    apiInstructionDetail,
    componentIds,
    animation,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);
    const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
    event?.handleSceneFunction(apiInstructionDetail ?? "");
  }
}

/**
 * 切换场景状态动作策略
 */
export class SwitchSceneStateStrategy implements ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    animation,
    sceneStatusName,
    componentIds,
    isConditionSatisfied,
    eventList,
    globalComponentMap
  }: ActionExecutionParams): Promise<void> {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    // if (!animation) {
    //   return
    // }
    if (!sceneStatusName) {
      return;
    }
    const currentCptConfig = globalComponentMap.get(String(componentIds[0])) as ComponentType;
    const stateIndex = currentCptConfig.option.simplifySceneList?.findIndex(
      (item: any) => item.name == sceneStatusName
    );

    if (stateIndex >= 0) {
      await delay(animation?.delay || 0);

      const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
      event?.updateSceneStatusIndex(stateIndex);
    }
  }
}
/**
 * 切换场景视角动作策略
 * */
export class SwitchSceneRoamStrategy implements ActionStrategy<ActionExecutionParams> {
  private parseRoamIndex(sceneStatusName: string, max: number): number {
    const raw = String(sceneStatusName).trim();
    if (!raw) {
      return -1;
    }

    // 1) 纯数字：优先按 0-based 命中，否则按 1-based 兼容
    if (/^\d+$/.test(raw)) {
      const num = Number.parseInt(raw, 10);
      if (num >= 0 && num < max) {
        return num;
      }
      if (num >= 1 && num <= max) {
        return num - 1;
      }
      return -1;
    }

    // 2) "视角N" / "视角 N"
    const match = raw.match(/视角\s*(\d+)/);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (Number.isFinite(num) && num >= 1 && num <= max) {
        return num - 1;
      }
    }

    // 3) 兜底：取末尾数字
    const tail = raw.match(/(\d+)\s*$/);
    if (tail) {
      const num = Number.parseInt(tail[1], 10);
      if (Number.isFinite(num) && num >= 1 && num <= max) {
        return num - 1;
      }
      if (Number.isFinite(num) && num >= 0 && num < max) {
        return num;
      }
    }

    return -1;
  }

  async execute({
    componentRootDoms,
    animation,
    sceneStatusName,
    componentIds,
    isConditionSatisfied,
    eventList,
    globalComponentMap
  }: ActionExecutionParams): Promise<void> {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!sceneStatusName) {
      return;
    }
    if (!componentIds || componentIds.length === 0) {
      return;
    }

    const componentId = componentIds[0];
    const currentCptConfig = globalComponentMap.get(String(componentId)) as ComponentType | undefined;
    const roams = currentCptConfig?.option?.simplifySceneRoams;
    if (!Array.isArray(roams) || roams.length === 0) {
      return;
    }

    const roamIndex = this.parseRoamIndex(sceneStatusName, roams.length);
    if (roamIndex < 0) {
      return;
    }

    await delay(animation?.delay || 0);

    const event = eventList[`${sceneEnumType.Maptalks}-${componentId}`];
    event?.switchSceneRoamIndex?.(roamIndex);
  }
}
/**
 * 切换场景状态动作策略
 */
export class SwitchSceneLevelStrategy implements ActionStrategy<ActionExecutionParams> {
  async execute({
    componentRootDoms,
    animation,
    sceneLevelId,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!animation) {
      return;
    }
    if (!sceneLevelId) {
      return;
    }

    const event = eventList[`${sceneEnumType.IndustryScene}-${componentIds[0]}`];
    event?.switchSceneLevel(sceneLevelId);
  }
}

/**
 * 切换场景模板组件场景对象显隐状态动作策略
 */
export class SwitchSceneObjVisibleStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    // animation,
    sceneObject,
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!sceneObject) {
      return;
    }
    let indexList = [];
    const index = sceneObject.objInfoList || sceneObject.name; // 兼容旧字段name
    if (Array.isArray(index)) {
      indexList = index.filter((item) => !item.children).map((item) => item.value);
    } else {
      indexList = [index];
    }
    const visible = sceneObject.visible === "show";
    const obj = globalComponentMap.get(String(componentIds[0])) as ComponentType;
    // const sceneType = obj.title === "场景模板" ? sceneEnumType.ThreeScene : sceneEnumType.Maptalks
    let sceneType = sceneEnumType.ThreeScene;
    switch (obj.title) {
      case "场景模板":
        sceneType = sceneEnumType.ThreeScene;
        break;
      case "工业场景模板":
        sceneType = sceneEnumType.IndustryScene;
        break;
      case "城市模板":
        sceneType = sceneEnumType.Maptalks;
        break;
      default:
        break;
    }
    const event = eventList[`${sceneType}-${componentIds[0]}`];
    event?.updateSceneObjectVisible?.(indexList, isConditionSatisfied ? visible : !visible);
  }
}

/**
 * 切换场景模板组件场景对象爆炸图状态动作策略
 */
export class HandleSceneObjExplosionStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    // animation,
    sceneObjectExplosion,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!sceneObjectExplosion) {
      return;
    }
    const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
    event?.handleSceneObjectExplosion?.(sceneObjectExplosion);
  }
}

/**
 * 聚焦倾斜摄影动作策略
 */
export class FocusBIMLayer implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    componentIds,
    isConditionSatisfied,
    eventList,
    layerInfo
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!layerInfo) {
      return;
    }
    const event = eventList[`${sceneEnumType.Maptalks}-${componentIds[0]}`];
    event?.updateFocusBIMLayer(layerInfo);
  }
}

/**
 * 切换场景模板组件场景子组件显隐状态动作策略
 */
export class SwitchSceneChildComponentVisibleStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    sceneChildComponent,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!sceneChildComponent) {
      return;
    }
    const { childComponentInfoList, visible } = sceneChildComponent;
    const isVisible = visible === "show";
    // 符合条件则显示/隐藏，否则反选
    const visibleRes = isConditionSatisfied ? isVisible : !isVisible;
    const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
    event?.updateSceneChildComponentVisible(childComponentInfoList, visibleRes);
  }
}

/**
 * 切换地图模板组件地图子组件显隐状态动作策略
 */
export class SwitchMapChildComponentVisibleStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    mapChildComponent,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!mapChildComponent) {
      return;
    }
    const { childComponentInfoList, visible } = mapChildComponent;
    const isVisible = visible === "show";
    // 符合条件则显示/隐藏，否则反选
    const visibleRes = isConditionSatisfied ? isVisible : !isVisible;
    const event = eventList[`${sceneEnumType.EchartGlmap}-${componentIds[0]}`];
    event?.updateMapChildComponentVisible(childComponentInfoList, visibleRes);
  }
}

export class GlMapRegionLiftStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    glMapRegionLift,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }

    const adcode = String(glMapRegionLift?.adcode || glMapRegionLift?.regionId || "");
    const height = Number(glMapRegionLift?.height ?? 1);
    const duration = Number(glMapRegionLift?.duration ?? 300);
    const event = eventList[`${sceneEnumType.EchartGlmap}-${componentIds[0]}`];
    event?.liftRegionByAdcode?.(adcode, {
      height: Number.isFinite(height) ? height : 1,
      duration: Number.isFinite(duration) ? duration : 300
    });
  }
}

export class GlMapSceneRoamStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    glMapSceneRoam,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }

    const sceneId = String(glMapSceneRoam?.sceneId || "");
    if (!sceneId) {
      return;
    }

    const event = eventList[`${sceneEnumType.EchartGlmap}-${componentIds[0]}`];
    void event?.playSceneRoam?.(sceneId);
  }
}

export class GlMapIconActiveStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    glMapIconActive,
    componentIds,
    isConditionSatisfied,
    eventList,
    info
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!glMapIconActive) {
      return;
    }

    const action = ["select", "unselect", "toggle"].includes(glMapIconActive.action)
      ? glMapIconActive.action
      : "select";
    const value =
      glMapIconActive.matchValueSource === "event"
        ? getValueByPath(info, glMapIconActive.eventField || "name")
        : glMapIconActive.matchValue;

    const event = eventList[`${sceneEnumType.EchartGlmap}-${componentIds[0]}`];
    event?.setMapGlIconActive?.({
      childId: String(glMapIconActive.childId || ""),
      field: String(glMapIconActive.matchField || "name"),
      value,
      action,
      exclusive: glMapIconActive.exclusive !== false,
      clearWhenMiss: Boolean(glMapIconActive.clearWhenMiss)
    });
  }
}

export class SetAnimationPlayStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    keyframesName,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!keyframesName) {
      return;
    }
    const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
    event?.setAnimationPlay(keyframesName);
  }
}

export class SetAnimationPauseStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    keyframesName,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!keyframesName) {
      return;
    }
    const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
    event?.setAnimationPause(keyframesName);
  }
}
export class SetStateAnimationPlayStrategy implements ActionStrategy<ActionExecutionParams> {
  execute({
    componentRootDoms,
    stateAnimationName,
    animationState,
    componentIds,
    isConditionSatisfied,
    eventList
  }: ActionExecutionParams): void {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!stateAnimationName || animationState === undefined) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    const event = eventList[`${sceneEnumType.ThreeScene}-${componentIds[0]}`];
    event?.setStateAnimationPlay(stateAnimationName, animationState);
  }
}

/**
 * 事件的动作的 ref实例-弹出跟随图标面板操作
 */
export class FollowIconStrategy
  implements
    ActionStrategy<
      ActionExecutionParams & {
        updateComponentTopLeftCallback: () => void;
      }
    >
{
  async execute({
    componentRootDoms,
    mapBox,
    isConditionSatisfied,
    eventList,
    globalComponentMap,
    info,
    componentIds,
    sourceComponentId,
    updateComponentTopLeftCallback
  }: ActionExecutionParams & {
    updateComponentTopLeftCallback: () => void;
  }): Promise<void> {
    if (componentRootDoms.length === 0) {
      return;
    }
    if (!isConditionSatisfied) {
      return;
    }
    if (!mapBox) {
      return;
    }
    if (!info) {
      return;
    }

    await delay(50);

    const componentProp = globalComponentMap.get(String(sourceComponentId))?.component.prop || "";

    if (!componentProp) {
      return;
    }

    const componentType = componentProp === "echart-glmap" ? sceneEnumType.EchartGlmap : sceneEnumType.ThreeScene;

    const event = eventList[`${componentType}-${sourceComponentId || componentIds[0]}`];
    const { boxOffsetX, boxOffsetY } = mapBox;

    event?.setMapBoxBom(componentRootDoms[0], info.id || info.componentId, boxOffsetX, boxOffsetY);
    updateComponentTopLeftCallback();
  }
}

/**
 * 视频播放动作策略
 */
export class VideoToPlayStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToPlay?.();
    });
  }
}

// 视频全屏
export class videoToFullscreenStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToFullscreen?.();
    });
  }
}
// 视频播放区间
export class VideoToPlayRangeStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({
    componentIds,
    isConditionSatisfied,
    eventList,
    videoStartTime,
    videoEndTime
  }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      console.log(event, "event");
      console.log(videoStartTime, "info", videoEndTime);
      event?.videoToPlayRange(videoStartTime as number, videoEndTime as number);
    });
  }
}

/**
 * 视频暂停动作策略
 */
export class VideoToPauseStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToPause?.();
    });
  }
}

/**
 * 视频停止动作策略
 */
export class VideoToStopStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToStop?.();
    });
  }
}

/**
 * 视频重播动作策略
 */
export class VideoToRestartStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToRestart?.();
    });
  }
}

/**
 * 视频静音动作策略
 */
export class VideoToMutedStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToMuted?.(true);
    });
  }
}

/**
 * 视频取消静音动作策略
 */
export class VideoToUnmutedStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToMuted?.(false);
    });
  }
}

/**
 * 视频音量增加动作策略
 */
export class VideoToAudioUpStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToAudioUp?.();
    });
  }
}

/**
 * 视频音量减少动作策略
 */
export class VideoToAudioDownStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToAudioDown?.();
    });
  }
}

/**
 * 视频快进动作策略
 */
export class VideoToFastinStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList, info, timeFastIn }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToFastin?.(timeFastIn as number, info as { value: number } | undefined);
    });
  }
}

/**
 * 视频快退动作策略
 */
export class VideoToRewindStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList, timeRewind }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      event?.videoToRewind?.(timeRewind as number);
    });
  }
}

/**
 * 视频快退动作策略
 */
export class SwitchVideoStrategy extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, isConditionSatisfied, eventList, info }: ActionExecutionParams): void {
    if (!isConditionSatisfied) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${mediaEnum.FtVideo}-${componentId}`];
      if (event.videoToFastin && info) {
        event.videoToFastin(0, {
          value: info.time,
          type: "seek"
        } as any);
      }
    });
  }
}

export class sendUE4MessageStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    ue4Config,
    info,
    animation,
    action,
    eventList
  }: ActionExecutionParams & {
    info: Record<string, any> | null;
  }): Promise<void> {
    if (!isConditionSatisfied || action === undefined) {
      return;
    }

    const ue4Info = action === ActionTypeEnum.SendUe4Msg ? info : null;

    const targetComponentId = componentIds[0];

    /**
     * @description 获取组件类型
     * @returns "PixelStreaming" | "PeerStreaming" | "" | null
     */
    const getComponentType = () => {
      const targetComponent = globalComponentMap.get(String(targetComponentId));
      if (!targetComponent) {
        return null;
      }

      const propMap: Record<string, "PixelStreaming" | "PeerStreaming" | "ue-vessel" | "sw-unreal-engine"> = {
        [extendsEnumType.UePixelStreaming]: "PixelStreaming",
        [extendsEnumType.UePeerStreaming]: "PeerStreaming",
        [extendsEnumType.UeVessel]: "ue-vessel",
        [extendsEnumType.FtUnrealEngine]: "sw-unreal-engine"
      };

      if (!propMap[targetComponent.component.prop]) {
        return "";
      }

      return propMap[targetComponent.component.prop];
    };

    /**
     * @description 处理消息数据
     */
    const processMessageData = (messageContent: any, messageType: string, info?: any) => {
      if (info) {
        return messageType === "string" ? JSON.stringify(info) : { ...info };
      }

      switch (messageType) {
        case "string":
          return messageContent;
        case "json":
          return typeof messageContent === "string" ? JSON.parse(messageContent) : { data: messageContent };
        default:
          return messageContent;
      }
    };

    /**
     * @description 发送UE消息
     */
    const sendUEMessage = () => {
      console.log("sendUEMessage", window, (window as any).pixelStreaming, window.ue4);
      if (!window.ue4 || !ue4Config) {
        return;
      }

      const { messageName, messageContent, messageType } = ue4Config;

      if (!messageName) {
        return;
      }

      const componentType = getComponentType();
      console.log("sendUEMessage22", componentType);
      if (!componentType) {
        return;
      }

      const data = processMessageData(messageContent, messageType, ue4Info);

      // 根据组件类型发送消息
      switch (componentType) {
        case "PeerStreaming":
          if (window.funPS) {
            window.funPS.emitMessage({ name: messageName, data });
          }
          return;

        case "PixelStreaming":
          console.log("PixelStreaming", { name: messageName, data }, (window as any).pixelStreaming);
          if (window.playerStream) {
            (window as any).playerStream.emitUIInteraction({ name: messageName, data });
          }
          return;

        case "ue-vessel":
          console.log("window.ue4.v2", messageName, data);
          window.ue4?.v2?.(messageName, data);
          return;
        case "sw-unreal-engine":
          componentIds.forEach((componentId) => {
            const event = eventList[`${extendsEnumType.FtUnrealEngine}-${componentId}`];
            event.sendMessageToUe(messageName, data);
          });
          break;
        default:
          return;
      }
    };

    await delay(animation?.delay || 0);
    sendUEMessage();
  }
}

export class SwitchBlueprintTab extends ActionStrategy<ActionExecutionParams> {
  execute({ componentIds, blueprintKey, eventList, info }: ActionExecutionParams): void {
    if (!blueprintKey) {
      return;
    }

    componentIds.forEach((componentId) => {
      const event = eventList[`${extendsEnumType.FtUnrealEngine}-${componentId}`];
      event.switchBlueprintTab(blueprintKey, info);
    });
  }
}

export class sendAIManMsgStaticStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    eventList,
    animation,
    info
  }: ActionExecutionParams & {
    info: Record<string, any> | null;
  }): Promise<void> {
    console.log("receiveWSMessage 触发数字人方法", info, isConditionSatisfied);
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);
    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.sendMsgToHuman) {
        return;
      }
      event.sendMsgToHuman(info);
    });
  }
}

export class SetIndexStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    eventList,
    animation
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }

    if (!animation) {
      return;
    }

    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.handleClick) {
        return;
      }

      const triggerItem = (component.data as Array<Record<string, any>>).find((item) => {
        // 如果 animation.idxValue 可以转为 Number 类型，则先转为 Number 再比较
        const numValue = Number(animation.idxValue);
        const itemNumValue = Number(item.value);
        if (
          !isNaN(numValue) &&
          !isNaN(itemNumValue) &&
          animation.idxValue !== null &&
          animation.idxValue !== undefined &&
          item.value !== "" &&
          item.value !== null &&
          item.value !== undefined
        ) {
          return itemNumValue === numValue;
        }
        // 否则使用原始值比较（转换为字符串确保类型一致）
        return String(item.value) === String(animation.idxValue);
      });

      if (typeof animation.idxValue === "string" && animation.idxValue.includes(",")) {
        event.handleClick(animation.idxValue, {
          isExecuteOnlyConditionSatisfied: false,
          triggerType: EventTypeEnum.DataChange
        });
      } else {
        event.handleClick(triggerItem, {
          isExecuteOnlyConditionSatisfied: false,
          triggerType: EventTypeEnum.DataChange
        });
      }
    });
  }
}

export class JumpPageStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    eventList,
    animation,
    currentpage
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);
    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.handlePageChange) {
        return;
      }
      event.handlePageChange(currentpage);
    });
  }
}

export class prevPageStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.handlePrevClick) {
        return;
      }
      event.handlePrevClick();
    });
  }
}

export class nextPageStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.handleNextClick) {
        return;
      }
      event.handleNextClick();
    });
  }
}

export class swiperCardChangeIndexStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    swiperCardTabsName,
    eventList
  }: ActionExecutionParams): Promise<void> {
    console.log("1123");
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.handleEvensChangeActiveSpinnerIndex) {
        return;
      }
      event.handleEvensChangeActiveSpinnerIndex(swiperCardTabsName);
    });
  }
}

export class onExportStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.onExport) {
        return;
      }
      event.onExport();
    });
  }
}

export class onClearStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }
      console.log(component, "component");
      console.log(eventList, "eventList");

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.onClear) {
        return;
      }
      event.onClear();
    });
  }
}

export class onRedoStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.onRedo) {
        return;
      }
      event.onRedo();
    });
  }
}

export class onUndoStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.onUndo) {
        return;
      }
      event.onUndo();
    });
  }
}

export class onTranslateImageStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.onTranslateImage) {
        return;
      }
      event.onTranslateImage();
    });
  }
}

export class turnOnPatrolStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.setupPatrolAction) {
        return;
      }
      event.setupPatrolAction("turnOnPatrol");
    });
  }
}
export class pausePatrolStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.setupPatrolAction) {
        return;
      }
      event.setupPatrolAction("pausePatrol");
    });
  }
}

export class restartPatrolStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.setupPatrolAction) {
        return;
      }
      event.setupPatrolAction("restartPatrol");
    });
  }
}

export class pauseScrollStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.setupPatrolAction) {
        return;
      }
      event.setupPatrolAction("pauseScroll");
    });
  }
}

export class startScrollStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({
    componentIds,
    isConditionSatisfied,
    globalComponentMap,
    animation,
    eventList
  }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }
    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const component = globalComponentMap.get(`${id}`);
      if (!component) {
        return;
      }

      const event = (eventList as Record<string, any>)[`${component.component.prop}-${id}`];
      if (!event.setupPatrolAction) {
        return;
      }
      event.setupPatrolAction("startScroll");
    });
  }
}

/**
 * 切换到上一个状态策略
 */
export class ToPrevStatusStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({ componentIds, isConditionSatisfied, animation, eventList }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }

    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const event = eventList[`${PanelType.dynamicPanel}-${id}`];
      if (!event?.toPrevStatus) {
        return;
      }

      event.toPrevStatus().catch((error) => {
        console.error(`动态面板 ${id} 切换到上一个状态失败:`, error);
      });
    });
  }
}

/**
 * 切换到下一个状态策略
 */
export class ToNextStatusStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute({ componentIds, isConditionSatisfied, animation, eventList }: ActionExecutionParams): Promise<void> {
    if (!isConditionSatisfied) {
      return;
    }

    await delay(animation?.delay || 0);

    componentIds.forEach((id) => {
      const event = eventList[`${PanelType.dynamicPanel}-${id}`];
      if (!event?.toNextStatus) {
        return;
      }

      event.toNextStatus().catch((error) => {
        console.error(`动态面板 ${id} 切换到下一个状态失败:`, error);
      });
    });
  }
}

/**
 * 动作策略工厂
 */
export class ActionStrategyFactory {
  private static strategies = {
    [ActionTypeEnum.Show]: new ShowStrategy(),
    [ActionTypeEnum.Hide]: new HideStrategy(),
    [ActionTypeEnum.ShowHide]: new ShowHideStrategy(),
    [ActionTypeEnum.Scaling]: new ScalingStrategy(),
    [ActionTypeEnum.ScalingHide]: new ScalingStrategy(),
    [ActionTypeEnum.Moving]: new MovingStrategy(),
    [ActionTypeEnum.UpdateConfig]: new UpdateConfigStrategy(),
    [ActionTypeEnum.SwitchState]: new SwitchStateStrategy(),
    [ActionTypeEnum.SwitchSceneStatus]: new SwitchSceneStateStrategy(),
    [ActionTypeEnum.SwitchSceneRoam]: new SwitchSceneRoamStrategy(),
    [ActionTypeEnum.SwitchSceneLevel]: new SwitchSceneLevelStrategy(),
    [ActionTypeEnum.SetIndex]: new SetIndexStrategy(),
    [ActionTypeEnum.HandleApiInstruction]: new HandleApiInstructionStrategy(),
    [ActionTypeEnum.SwitchSceneChildComponentVisible]: new SwitchSceneChildComponentVisibleStrategy(),
    [ActionTypeEnum.SwitchMapChildComponentVisible]: new SwitchMapChildComponentVisibleStrategy(),
    [ActionTypeEnum.GlMapRegionLift]: new GlMapRegionLiftStrategy(),
    [ActionTypeEnum.GlMapSceneRoam]: new GlMapSceneRoamStrategy(),
    [ActionTypeEnum.GlMapIconActive]: new GlMapIconActiveStrategy(),
    [ActionTypeEnum.SetAnimationPlay]: new SetAnimationPlayStrategy(),
    [ActionTypeEnum.SetAnimationPause]: new SetAnimationPauseStrategy(),
    [ActionTypeEnum.SetStateAnimationPlay]: new SetStateAnimationPlayStrategy(),
    [ActionTypeEnum.FollowIcon]: new FollowIconStrategy(),
    [ActionTypeEnum.SwitchSceneObjVisible]: new SwitchSceneObjVisibleStrategy(),
    [ActionTypeEnum.HandleSceneObjExplosion]: new HandleSceneObjExplosionStrategy(),
    [ActionTypeEnum.FocusLayer]: new FocusBIMLayer(),
    [ActionTypeEnum.VideoToPlay]: new VideoToPlayStrategy(),
    [ActionTypeEnum.VideoToPause]: new VideoToPauseStrategy(),
    [ActionTypeEnum.VideoToFullscreen]: new videoToFullscreenStrategy(),
    [ActionTypeEnum.VideoToPlayRange]: new VideoToPlayRangeStrategy(),
    [ActionTypeEnum.VideoToStop]: new VideoToStopStrategy(),
    [ActionTypeEnum.VideoToRestart]: new VideoToRestartStrategy(),
    [ActionTypeEnum.VideoToMuted]: new VideoToMutedStrategy(),
    [ActionTypeEnum.VideoToUnmuted]: new VideoToUnmutedStrategy(),
    [ActionTypeEnum.VideoToAudioUp]: new VideoToAudioUpStrategy(),
    [ActionTypeEnum.VideoToAudioDown]: new VideoToAudioDownStrategy(),
    [ActionTypeEnum.VideoToFastin]: new VideoToFastinStrategy(),
    [ActionTypeEnum.VideoToRewind]: new VideoToRewindStrategy(),
    [ActionTypeEnum.SwitchVideoProgress]: new SwitchVideoStrategy(),
    [ActionTypeEnum.SendUe4Msg]: new sendUE4MessageStrategy(),
    [ActionTypeEnum.SendUe4MsgStatic]: new sendUE4MessageStrategy(),
    [ActionTypeEnum.SendAIManMsgStatic]: new sendAIManMsgStaticStrategy(),
    [ActionTypeEnum.SwitchBlueprintTab]: new SwitchBlueprintTab(),
    [ActionTypeEnum.JumpPage]: new JumpPageStrategy(),
    [ActionTypeEnum.nextPage]: new nextPageStrategy(),
    [ActionTypeEnum.prevPage]: new prevPageStrategy(),
    [ActionTypeEnum.SwiperCardChangeIndex]: new swiperCardChangeIndexStrategy(),
    [ActionTypeEnum.OnExport]: new onExportStrategy(),
    [ActionTypeEnum.OnClear]: new onClearStrategy(),
    [ActionTypeEnum.OnRedo]: new onRedoStrategy(),
    [ActionTypeEnum.OnUndo]: new onUndoStrategy(),
    [ActionTypeEnum.OnTranslateImage]: new onTranslateImageStrategy(),
    [ActionTypeEnum.TurnOnPatrol]: new turnOnPatrolStrategy(),
    [ActionTypeEnum.PausePatrol]: new pausePatrolStrategy(),
    [ActionTypeEnum.RestartPatrol]: new restartPatrolStrategy(),
    [ActionTypeEnum.PauseScroll]: new pauseScrollStrategy(),
    [ActionTypeEnum.StartScroll]: new startScrollStrategy(),
    [ActionTypeEnum.toPrevStatus]: new ToPrevStatusStrategy(),
    [ActionTypeEnum.toNextStatus]: new ToNextStatusStrategy()
    // 其他动作策略可以在这里添加
  };

  /**
   * 获取动作策略
   * @param actionType 动作类型
   * @returns 对应的动作策略
   */
  static getStrategy(actionType: ActionTypeEnum): ActionStrategy<ActionExecutionParams & Record<string, any>> | null {
    return this.strategies[actionType as keyof typeof this.strategies] || null;
  }
}
