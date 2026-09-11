import type { ComponentType } from "@screenwright/types";

/**
 * 由树结构唯一决定的派生数值（纯函数，无状态）。
 *
 * 这些不是"渲染的事"——它们决定组件落盘后的真实字段值。前后端各存一份必然漂移：
 * 后端重演出来结构对、数字错（分组包围盒是旧的、zIndex 对不上），比结构错更难查，
 * 因为看着像是对的。判据不是"这算不算渲染"，而是"这个数值是不是由树结构唯一决定的"。
 *
 * 本模块是 app 侧 buildRender/utils.ts 中同名函数的框架无关版本，逐字逐句搬运、行为不变。
 */

/**
 * 取一组组件里最高的层级。
 *
 * 与 app 侧 getMaxIndex 逐字一致（含 Math.max 展开写法）：这是"把组件顶到最上层"的依据，
 * 前端移动 / 粘贴组件时用它算新 zIndex，改写法等于改行为。
 */
export const getMaxIndex = (arr: ComponentType[]): number => {
  if (arr.length === 0) {
    return 0;
  }
  const indexArr = arr.map((v) => v.zIndex);
  return Math.max(...indexArr);
};

/**
 * 求一组组件的包围盒。
 *
 * 与 app 侧 calculateGroupDimensions 逐字一致：分组的 left/top/宽高就是这个值，
 * 它不是可独立编辑的属性，而是由成员位置唯一决定的**派生值**。
 *
 * 空数组返回全 0（不是"保持原样"）——沿用 app 行为，改这里等于改行为。
 */
export const calculateGroupDimensions = (elements: ComponentType[]) => {
  if (elements.length === 0) {
    return {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
  }

  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  elements.forEach((element) => {
    const elementLeft = element.left;
    const elementTop = element.top;
    const elementRight = element.left + element.component.width;
    const elementBottom = element.top + element.component.height;

    minLeft = Math.min(minLeft, elementLeft);
    minTop = Math.min(minTop, elementTop);
    maxRight = Math.max(maxRight, elementRight);
    maxBottom = Math.max(maxBottom, elementBottom);
  });

  const width = maxRight - minLeft;
  const height = maxBottom - minTop;

  return {
    left: minLeft,
    top: minTop,
    width,
    height
  };
};

/**
 * 把一份包围盒写回组件。
 *
 * 位置与尺寸分存两处（left/top 在节点上、width/height 在 component 上），
 * 拆开写四次很容易只改一半——尤其是改了尺寸忘了改 left/top，表现为分组框大小对、位置偏。
 * 它是 calculateGroupDimensions 的写入配对，两者一起搬，中间不留缝。
 */
export const assignComponentAttrs = (
  item: ComponentType,
  attrs: {
    width: number;
    height: number;
    left: number;
    top: number;
  }
) => {
  item.left = attrs.left;
  item.top = attrs.top;
  item.component.width = attrs.width;
  item.component.height = attrs.height;
};
