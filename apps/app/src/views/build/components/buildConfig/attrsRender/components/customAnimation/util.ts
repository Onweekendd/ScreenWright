import { throttle } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import type {
  ActiveAnimationList,
  AnimationItem,
  AnimationResponseItem,
  AnimationType,
  ComponentSettingItem
} from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

// 需要导入动画数据，暂时注释掉，因为路径不存在
import { separateAnimations } from "./data/animation";

/**
 * 过滤本地属性
 */
function filterLocalProperty(animationList: AnimationItem[]): AnimationResponseItem[] {
  return animationList.map(({ isRename: _isRename, ...animation }) => ({
    ...animation
  }));
}

/**
 * 添加本地属性
 */
function addLocalProperty(animationList: AnimationResponseItem[]): AnimationItem[] {
  return animationList.map((animation) => ({
    ...animation,
    isRename: false
  }));
}

/**
 * 更新远程数据参数
 */
interface UpdateRemoteDataParam {
  screenId: number;
  data: {
    animationList: AnimationResponseItem[];
    activeAnimationList: ActiveAnimationList;
  };
  onSuccess?: (result?: any) => void;
  onError?: (error?: any) => void;
}

/**
 * 更新远程数据
 */
const updateRemoteData = async ({ screenId, data, onSuccess, onError }: UpdateRemoteDataParam) => {
  try {
    const { code } = await updateLargeScreen({
      id: screenId,
      filterType: true,
      aniFrameSet: JSON.stringify(data)
    });
    if (code !== 200) {
      throw new Error("更新失败");
    }
    onSuccess?.(data);
  } catch (error) {
    onError?.(error);
  }
};

/**
 * 节流版本的更新远程数据函数
 */
const updateRemoteDataThrottle: (param: UpdateRemoteDataParam) => void = throttle(
  async (param: UpdateRemoteDataParam) => {
    await updateRemoteData(param);
  },
  700,
  { trailing: true }
);

/**
 * 更新动画列表参数
 */
interface UpdateAnimationListParam {
  animationList: AnimationItem[];
  selectId: string;
  newComponentSetting: ComponentSettingItem;
}

/**
 * 更新动画列表
 */
const updateAnimationList = ({ animationList, selectId, newComponentSetting }: UpdateAnimationListParam) => {
  const newAnimationList = [...animationList];

  const animationIndex = newAnimationList.findIndex((v) => v.id === selectId);
  if (animationIndex === -1) return;

  const newAnimation = {
    ...newAnimationList[animationIndex],
    componentSetting: [...newAnimationList[animationIndex].componentSetting]
  };

  const componentSettingIndex = newAnimation.componentSetting.findIndex((v) => v.id === newComponentSetting.id);
  if (componentSettingIndex === -1) return;

  newAnimation.componentSetting.splice(componentSettingIndex, 1, newComponentSetting);
  newAnimationList.splice(animationIndex, 1, newAnimation);

  return newAnimationList;
};

/**
 * 组件操作参数
 */
interface ComponentOperationParam {
  animationList: AnimationItem[];
  selectId: string;
  componentId: number;
  isAdd?: boolean;
  delay?: number;
}

/**
 * 更新动画列表的辅助函数
 * @returns 更新后的动画列表
 */
function getNewAnimationListAfterComponentOperation({
  animationList,
  selectId,
  componentId,
  isAdd = true,
  delay = 0
}: ComponentOperationParam): AnimationItem[] {
  const newAnimationList = [...animationList];
  const itemIndex = newAnimationList.findIndex((v) => v.id === selectId);
  if (itemIndex === -1) return newAnimationList;

  const item = { ...newAnimationList[itemIndex], componentSetting: [...newAnimationList[itemIndex].componentSetting] };
  const componentIndex = item.componentSetting.findIndex((v) => v.id === componentId);

  if (isAdd) {
    if (componentIndex === -1) {
      item.componentSetting.push({
        id: componentId,
        animationType: "none",
        direction: "none",
        timingFunction: "none",
        delay,
        duration: 0,
        type: "none"
      });
    }
  } else {
    if (componentIndex !== -1) {
      item.componentSetting.splice(componentIndex, 1);
    }
  }

  newAnimationList.splice(itemIndex, 1, item);
  return newAnimationList;
}

/**
 * 删除组件参数
 */
interface RemoveComponentParam {
  animationList: AnimationItem[];
  componentId: number;
}

/**
 * 删除 animationList 中所有与给定 componentId 对应的 componentSetting
 * @returns 更新后的动画列表
 */
function removeComponentIdFromAllAnimations({ animationList, componentId }: RemoveComponentParam): AnimationItem[] {
  return animationList.map((animation) => ({
    ...animation,
    componentSetting: animation.componentSetting.filter((setting) => setting.id !== componentId)
  }));
}

/**
 * 生成动画类
 * @returns CSS 动画样式字符串
 */
function generateAnimationClass(componentSetting: ComponentSettingItem, animationClassName: string): string {
  const { animationType, direction, duration, timingFunction, delay, type } = componentSetting;

  const animationName = animationType.startsWith("opacity-") ? animationType : `${animationType}-${direction}`;

  let animation = `.${animationClassName} { \n`;
  animation += `animation-name : ${animationName}${type === "unload" ? " !important" : ""};\n`;
  animation += `animation-duration : ${duration / 1000}s${type === "unload" ? " !important" : ""};\n`;
  animation += `animation-timing-function : ${timingFunction}${type === "unload" ? " !important" : ""};\n`;
  animation += `animation-delay : ${delay / 1000}s${type === "unload" ? " !important" : ""};\n`;
  animation += `animation-fill-mode : both${type === "unload" ? " !important" : ""};\n`;
  animation += "}\n";

  return animation;
}

/**
 * 动画名->方向
 */
function animation2Direction(animationType: AnimationType): Array<string> {
  return separateAnimations.filter((v) => v.animation === animationType).map((v) => v.direction);
}

/**
 * 方向是否可用
 */
function directionEnable(animationType: AnimationType): boolean {
  const direction = animation2Direction(animationType);
  return direction.length > 0 && direction.some((v) => v !== "none" && v !== "");
}

/**
 * 速率是否可用
 */
function timingFunctionEnable(componentSettingItem: ComponentSettingItem): boolean {
  return componentSettingItem.animationType !== "none" && componentSettingItem.direction !== "none";
}

/**
 * 持续时间是否可用
 */
function durationEnable(componentSettingItem: ComponentSettingItem): boolean {
  return (
    timingFunctionEnable(componentSettingItem) &&
    componentSettingItem.timingFunction !== null &&
    componentSettingItem.timingFunction !== "none"
  );
}

/**
 * 延迟是否可用
 */
function delayEnable(componentSettingItem: ComponentSettingItem): boolean {
  return (
    timingFunctionEnable(componentSettingItem) &&
    componentSettingItem.timingFunction !== null &&
    componentSettingItem.timingFunction !== "none"
  );
}

/**
 * 速率是否可用
 */
function timingFunctionAvailable(componentSettingItem: ComponentSettingItem): boolean {
  return timingFunctionEnable(componentSettingItem) && componentSettingItem.timingFunction !== "none";
}

/**
 * 方向是否可用
 */
function directionAvailable(animationType: AnimationType): boolean {
  const direction = animation2Direction(animationType);
  return direction.length > 0 && direction.some((v) => v !== "none");
}

/**
 * 持续时间是否可用
 */
function durationAvailable(componentSettingItem: ComponentSettingItem): boolean {
  return (
    componentSettingItem.timingFunction !== null &&
    componentSettingItem.timingFunction !== "none" &&
    componentSettingItem.duration > 0
  );
}

/**
 * 判断动画是否可用
 */
function isAnimationAvailable(componentSetting: ComponentSettingItem): boolean {
  return (
    directionAvailable(componentSetting.animationType) &&
    timingFunctionAvailable(componentSetting) &&
    durationAvailable(componentSetting)
  );
}

/**
 * 是否启用播放组件动画
 */
function enablePlayComponentAnimation(component: ComponentType<any>): boolean {
  return component.loadAnimation && component.loadAnimation.type !== "none";
}

function getAnimationWithPanIdAndStatusId<T extends { panelId?: number; statusId?: string }>({
  data,
  panelId,
  statusId
}: {
  data: T[];
  panelId?: number;
  statusId?: string;
}): T[] {
  return data.filter((item) => item.panelId === panelId && item.statusId === statusId);
}

/**
 * @description 时间转换为距离
 */
export function time2Distance({
  time,
  step,
  stepDistance
}: {
  time: number;
  step: number;
  stepDistance: number;
}): number {
  let width = 0;
  if (time > 0) {
    const num = time / step;
    width = num * stepDistance;
  }
  return width;
}

/**
 * @description 距离转换为时间
 */
export function distance2Time({
  distance,
  step,
  stepDistance
}: {
  distance: number;
  step: number;
  stepDistance: number;
}): number {
  return (distance / stepDistance) * step;
}

/**
 * 高亮组件并滚动到指定位置
 * @param componentId 组件ID
 * @param highLightTime 高亮持续时间（毫秒）
 * @param scrollToElement 是否滚动到元素位置
 */
export function highlightComponent(componentId: number, highLightTime = 2000, scrollToElement = true): void {
  const el = document.getElementById(`animation-${componentId}`);
  if (el) {
    // 高亮效果
    el.style.color = "var(--sw-theme-color)";
    setTimeout(() => {
      el.style.color = "#b4b7c1";
    }, highLightTime);

    // 滚动到元素位置
    if (scrollToElement) {
      const animationEditorContent = document.getElementById("animation-editor-content");
      if (animationEditorContent) {
        // 找到该元素在列表中的索引位置
        const animationEditor = document.getElementById("animation-editor");
        if (animationEditor) {
          const allRows = animationEditor.querySelectorAll(".el-row");
          let targetIndex = -1;

          // 查找目标元素所在的行
          allRows.forEach((row, index) => {
            const targetElement = row.querySelector(`#animation-${componentId}`);
            if (targetElement) {
              targetIndex = index;
            }
          });

          // 滚动到目标位置，每行高度为36px
          if (targetIndex !== -1) {
            const rowHeight = 36;
            const scrollTop = targetIndex * rowHeight;
            animationEditorContent.scrollTop = scrollTop;
          }
        }
      }
    }
  }
}

export {
  addLocalProperty,
  animation2Direction,
  delayEnable,
  directionEnable,
  durationEnable,
  enablePlayComponentAnimation,
  filterLocalProperty,
  generateAnimationClass,
  getAnimationWithPanIdAndStatusId,
  getNewAnimationListAfterComponentOperation,
  isAnimationAvailable,
  removeComponentIdFromAllAnimations,
  timingFunctionEnable,
  updateAnimationList,
  updateRemoteData,
  updateRemoteDataThrottle
};
