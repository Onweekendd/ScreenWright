import { throttle } from "lodash-es";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import type { ComponentType, direction } from "../type";
import { handleGroupByParent, saveParentGroupData } from "../utils";
import { getComponentElement } from "./mouseHandleUtils";
import { DualAxisSnapManager } from "./snapState";
import { useAction } from "./useAction";
import { useAlignmentWasm } from "./useAlignmentWasm";
import { useEditStore } from "./useEditStore";

// ============ 常量定义 ============
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
const MOUSEMOVE_THROTTLE_MS = 10;

// ============ 类型定义 ============
/**
 * 容器尺寸
 */
interface ContainerSize {
  width: number;
  height: number;
}

/**
 * 位置信息
 */
interface Position {
  left: number;
  top: number;
}

/**
 * 尺寸信息
 */
interface Size {
  width: number;
  height: number;
}

/**
 * 完整的位置和尺寸信息
 */
interface Dimensions extends Position, Size {}

/**
 * 调整方向
 */
interface ResizeDirection {
  isTop: boolean;
  isBottom: boolean;
  isLeft: boolean;
  isRight: boolean;
}

// ============ 纯函数（不依赖响应式数据）============

/**
 * 百分比转像素值
 */
const percentToPixel = (percent: number, containerSize: number): number => {
  return (percent / 100) * containerSize;
};

/**
 * 像素值转百分比
 */
const pixelToPercent = (pixel: number, containerSize: number): number => {
  return parseFloat(((pixel / containerSize) * 100).toFixed(2));
};

/**
 * 获取组件初始像素尺寸（如果是百分比单位则转换为像素）
 */
const getInitialPixelSize = (component: ComponentType, isPercentUnit: boolean, containerSize: ContainerSize): Size => {
  if (isPercentUnit) {
    return {
      width: percentToPixel(component.component.width, containerSize.width),
      height: percentToPixel(component.component.height, containerSize.height)
    };
  }
  return {
    width: component.component.width,
    height: component.component.height
  };
};

/**
 * 解析调整方向
 */
const parseResizeDirection = (point: direction): ResizeDirection => {
  return {
    isTop: /t/.test(point),
    isBottom: /b/.test(point),
    isLeft: /l/.test(point),
    isRight: /r/.test(point)
  };
};

/**
 * 计算鼠标移动增量（考虑缩放比例）
 */
const calculateMouseDelta = (
  currentX: number,
  currentY: number,
  startX: number,
  startY: number,
  scale: number
): { deltaX: number; deltaY: number } => {
  return {
    deltaX: Math.round((currentX - startX) / scale),
    deltaY: Math.round((currentY - startY) / scale)
  };
};

/**
 * 计算调整后的新尺寸和位置
 */
const calculateNewDimensions = (
  initialDimensions: Dimensions,
  delta: { deltaX: number; deltaY: number },
  direction: ResizeDirection
): Dimensions => {
  let newWidth = initialDimensions.width;
  let newHeight = initialDimensions.height;
  let newLeft = initialDimensions.left;
  let newTop = initialDimensions.top;

  // 处理水平方向调整
  if (direction.isLeft) {
    newWidth = Math.max(initialDimensions.width - delta.deltaX, 0);
    newLeft = initialDimensions.left + delta.deltaX;
  } else if (direction.isRight) {
    newWidth = Math.max(initialDimensions.width + delta.deltaX, 0);
  }

  // 处理垂直方向调整
  if (direction.isTop) {
    newHeight = Math.max(initialDimensions.height - delta.deltaY, 0);
    newTop = initialDimensions.top + delta.deltaY;
  } else if (direction.isBottom) {
    newHeight = Math.max(initialDimensions.height + delta.deltaY, 0);
  }

  return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
};

/**
 * 更新DOM元素样式
 */
const updateElementStyle = (element: HTMLElement, dimensions: Dimensions): void => {
  element.style.left = `${dimensions.left}px`;
  element.style.top = `${dimensions.top}px`;
  element.style.width = `${dimensions.width}px`;
  element.style.height = `${dimensions.height}px`;
};

/**
 * 从DOM样式中提取数值（去除单位）
 */
const extractNumberFromStyle = (styleValue: string): number => {
  return parseFloat(styleValue) || 0;
};

/**
 * 从DOM元素获取最终尺寸
 */
const getFinalDimensionsFromElement = (element: HTMLElement): Dimensions => {
  return {
    left: extractNumberFromStyle(element.style.left || "0"),
    top: extractNumberFromStyle(element.style.top || "0"),
    width: extractNumberFromStyle(element.style.width || "0"),
    height: extractNumberFromStyle(element.style.height || "0")
  };
};

/**
 * 更新组件属性数据
 */
const updateComponentAttributes = (
  component: ComponentType,
  dimensions: Dimensions,
  isPercentUnit: boolean,
  containerSize: ContainerSize
): void => {
  if (!component.parent) {
    // 不是分组内的组件情况
    component.left = dimensions.left;
    component.top = dimensions.top;
  }

  if (isPercentUnit) {
    component.component.width = pixelToPercent(dimensions.width, containerSize.width);
    component.component.height = pixelToPercent(dimensions.height, containerSize.height);
  } else {
    component.component.width = dimensions.width;
    component.component.height = dimensions.height;
  }
};

// ============ 主函数 ============

/**
 * 鼠标拖拽调整组件尺寸的主函数
 */
export const useMousePointHandle = (
  e: MouseEvent,
  resizePoint: direction,
  option: { isDynamicPanel: boolean; editConfig?: LargeScreenDetailInfo } = { isDynamicPanel: false }
) => {
  const editor = useScreenEditor();
  const { selectTargetData, editConfig: globalEditConfig, selectTargetDataId } = useEditStore();
  const editConfig = option.editConfig ?? globalEditConfig.value;
  const selectedComponent = selectTargetData.value[0];

  e.stopPropagation();
  e.preventDefault();

  // 如果组件已锁定，直接返回
  if (selectedComponent.isLock) {
    return;
  }

  const { updateComponentLayers } = useAction({ isDynamicPanel: option.isDynamicPanel });
  const { allComponentMap } = useGlobalComponentData();
  // 对齐相关能力：复用移动拖拽的对齐链路（WASM 实例 + 吸附状态机）
  const { biAlignmentInstance, tolerance, updateAlignmentLine, onMoveEnd } = useAlignmentWasm();
  const snapManager = new DualAxisSnapManager(tolerance.value);

  /**
   * 将从 DOM 获取到的最终像素坐标写回组件数据（将相对父容器的坐标转换为画布绝对坐标）
   *
   * 说明：在拖拽过程中我们为实时预览可能会把元素的 left/top 设置为相对于父容器的值（即 handleGroupByChildren 返回的相对坐标）。
   * 当用户松手时，需要把这个相对值转换回画布坐标并保存到组件模型中，避免保存后组件回跳到旧的位置。
   *
   * 规则：
   * - 如果组件存在 parent，则尝试读取父组件的画布坐标 parent.left/top（如果不存在则退回使用 finalDims 作为画布坐标）；
   * - 如果组件没有 parent，则直接把 finalDims 作为画布坐标写回；
   *
   * @param component 要写回的组件对象（selectedComponent）
   * @param finalDims 从 DOM 读取到的最终像素尺寸与位置（left/top/width/height）
   */
  const applyFinalPositionToComponent = (component: ComponentType, finalDims: Dimensions): void => {
    if (component.parent) {
      const parentComponent = allComponentMap.value.get(`${component.parent}`);
      if (parentComponent) {
        // parentComponent.left/top 为画布坐标
        component.left = (parentComponent.left || 0) + finalDims.left;
        component.top = (parentComponent.top || 0) + finalDims.top;
      } else {
        // 没有找到父组件则直接使用 finalDims（作为画布坐标）
        component.left = finalDims.left;
        component.top = finalDims.top;
      }
    } else {
      // 非分组内组件，直接写入画布坐标
      component.left = finalDims.left;
      component.top = finalDims.top;
    }
  };

  // ============ 依赖响应式数据的函数（在hooks内部定义）============

  /**
   * 获取画布容器尺寸
   */
  const getContainerSize = (): ContainerSize => {
    return {
      width: parseInt(editConfig.width) || DEFAULT_CANVAS_WIDTH,
      height: parseInt(editConfig.height) || DEFAULT_CANVAS_HEIGHT
    };
  };

  /**
   * 处理父级分组的尺寸更新
   */
  const updateParentGroup = (component: ComponentType): void => {
    if (!component.parent) {
      return;
    }

    const parentComponent = allComponentMap.value.get(`${component.parent}`);
    if (!parentComponent || !parentComponent.children) {
      return;
    }

    // 缩放改的是成员自己的尺寸，不经 core，父分组包围盒得在这里收口
    editor.component.reflowGroup(parentComponent);
    saveParentGroupData(parentComponent);
  };

  /**
   * 处理组件分组逻辑
   */
  const handleComponentGroup = (
    component: ComponentType,
    point: direction,
    newWidth: number,
    newHeight: number
  ): void => {
    // 如果组件本身是分组（有子元素）
    if (component.children && component.children.length > 0) {
      // 注意：这里需要在组件属性更新前调用，传入新的宽高
      handleGroupByParent({ attr: component, point, newWidth, newHeight });
      saveParentGroupData(component);
      return;
    }
    if (component.parent) {
      // 是分组内的组件情况,需同步宽度高度
      component.component.width = newWidth;
      component.component.height = newHeight;
    }

    // 如果组件属于某个分组，更新父分组
    updateParentGroup(component);
  };

  // 处理分组内子元素拖拽宽度高度
  const handleGroupByChildren = (component: ComponentType, newDimensions: Dimensions) => {
    const parentComponent = allComponentMap.value.get(`${component.parent}`);
    if (!parentComponent) {
      return newDimensions;
    }

    // 计算相对于父容器的坐标；允许负值以支持超出父容器的情况
    const relLeft = newDimensions.left - (parentComponent.left || 0);
    const relTop = newDimensions.top - (parentComponent.top || 0);

    // 允许子元素超出父容器边界：不对 relLeft/relTop 做非负约束，也不限制宽高
    const groupNewDimensions = selectedComponent.parent
      ? {
          left: relLeft,
          top: relTop,
          width: newDimensions.width,
          height: newDimensions.height
        }
      : newDimensions;

    return groupNewDimensions;
  };

  // ============ 初始化数据 ============

  // 获取组件单位类型和容器尺寸
  const isPercentUnit = selectedComponent.unitPavenType === "percent";
  const containerSize = getContainerSize();

  // 获取初始数据
  const initialPixelSize = getInitialPixelSize(selectedComponent, isPercentUnit, containerSize);
  const initialPosition: Position = {
    left: selectedComponent.left,
    top: selectedComponent.top
  };
  const initialDimensions: Dimensions = { ...initialPosition, ...initialPixelSize };

  const canvasScale = editConfig.scale || 1;
  const mouseStartX = e.clientX;
  const mouseStartY = e.clientY;

  // 与拖拽同一套解析（画布内按 data-id 找），避免物料内部的裸数字 id 撞上组件 id
  const componentElement = getComponentElement(`${selectedComponent.id}`);
  if (!componentElement) {
    return;
  }

  const resizeDirection = parseResizeDirection(resizePoint);

  // 拖拽开始时缓存参考形状：将画布内除当前组件外的所有组件作为对齐参考线来源
  if (biAlignmentInstance.value) {
    biAlignmentInstance.value.cache_reference_shapes(
      0,
      0,
      Number(editConfig.width),
      Number(editConfig.height),
      selectTargetDataId.value
    );
  }

  // ============ 事件处理函数 ============

  /**
   * 对锚点拖拽应用对齐吸附
   *
   * 与移动拖拽不同，resize 时只有"被拖拽的那条边"在移动，对边保持静止。
   * 因此构造一个"退化 bbox"（min=max=正在拖拽的边）传给 WASM，
   * 让其只对该边返回对齐偏移；再用 snapManager 处理粘滞吸附；
   * 最后反推 left/top/width/height，保持对边不动。
   */
  const applyResizeAlignment = (dims: Dimensions, moveEvent: MouseEvent): Dimensions => {
    if (!biAlignmentInstance.value) {
      return dims;
    }

    const curLeft = dims.left;
    const curTop = dims.top;
    const curRight = dims.left + dims.width;
    const curBottom = dims.top + dims.height;

    // 构造查询 bbox：拖拽轴"退化"为单条边（min=max=正在拖拽的边），确保 WASM 只对该边
    // 计算对齐偏移；非拖拽轴保留真实范围，使对齐线能覆盖组件的真实边界（避免渲染为 0 高度）。
    const queryMinX = resizeDirection.isLeft ? curLeft : resizeDirection.isRight ? curRight : curLeft;
    const queryMaxX = resizeDirection.isLeft ? curLeft : resizeDirection.isRight ? curRight : curRight;
    const queryMinY = resizeDirection.isTop ? curTop : resizeDirection.isBottom ? curBottom : curTop;
    const queryMaxY = resizeDirection.isTop ? curTop : resizeDirection.isBottom ? curBottom : curBottom;

    // 被拖拽边的位置（吸附状态机据此锁定该边的对齐目标）
    const draggedEdgeX = resizeDirection.isLeft ? curLeft : curRight;
    const draggedEdgeY = resizeDirection.isTop ? curTop : curBottom;

    // 第一次：用退化 bbox 精确计算"被拖拽边"的对齐偏移（避免静止边污染吸附目标）
    const result = biAlignmentInstance.value.update_ref_line(queryMinX, queryMinY, queryMaxX, queryMaxY);

    // 使用状态管理器处理粘滞吸附（避免在对齐线附近抖动）
    const { finalX, finalY } = snapManager.processAlignment({
      alignmentResult: result || { offset_x: 0, offset_y: 0 },
      currentX: moveEvent.screenX,
      currentY: moveEvent.screenY,
      draggedX: draggedEdgeX,
      draggedY: draggedEdgeY
    });

    // 第二次：用"对齐后的真实组件 bbox"重新生成对齐线数据，使对齐线范围与移动拖拽一致
    // （覆盖组件与参考形状的完整区间）。退化 bbox 会让线条只在拖拽边附近显示一小段，
    // 这里覆盖掉第一次的退化结果，仅用于渲染（其偏移量已丢弃，吸附位置以上面 snapManager 为准）
    const alignedLeft = resizeDirection.isLeft ? finalX : curLeft;
    const alignedRight = resizeDirection.isRight ? finalX : curRight;
    const alignedTop = resizeDirection.isTop ? finalY : curTop;
    const alignedBottom = resizeDirection.isBottom ? finalY : curBottom;
    biAlignmentInstance.value.update_ref_line(alignedLeft, alignedTop, alignedRight, alignedBottom);

    // 更新对齐线显示
    updateAlignmentLine();

    // 反推尺寸：保持对边不动
    let newLeft = curLeft;
    let newTop = curTop;
    let newWidth = dims.width;
    let newHeight = dims.height;

    if (resizeDirection.isLeft) {
      // 左边对齐到 finalX，右边不动
      newLeft = finalX;
      newWidth = Math.max(curRight - finalX, 0);
    } else if (resizeDirection.isRight) {
      // 右边对齐到 finalX，左边不动
      newWidth = Math.max(finalX - curLeft, 0);
    }

    if (resizeDirection.isTop) {
      newTop = finalY;
      newHeight = Math.max(curBottom - finalY, 0);
    } else if (resizeDirection.isBottom) {
      newHeight = Math.max(finalY - curTop, 0);
    }

    return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
  };

  /**
   * 鼠标移动处理函数（节流）
   */
  const handleMouseMove = throttle((moveEvent: MouseEvent) => {
    const mouseDelta = calculateMouseDelta(moveEvent.clientX, moveEvent.clientY, mouseStartX, mouseStartY, canvasScale);

    const rawDimensions = calculateNewDimensions(initialDimensions, mouseDelta, resizeDirection);
    // 应用对齐吸附（在转换为分组相对坐标之前，使用画布坐标计算）
    const newDimensions = applyResizeAlignment(rawDimensions, moveEvent);
    const groupNewDimensions = handleGroupByChildren(selectedComponent, newDimensions);
    // 只更新DOM样式进行实时预览，不修改数据
    updateElementStyle(componentElement, groupNewDimensions);
  }, MOUSEMOVE_THROTTLE_MS);

  /**
   * 鼠标释放处理函数
   */
  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // 重置吸附状态并清除对齐线显示
    snapManager.reset();
    onMoveEnd();

    // 从DOM获取最终尺寸（像素值）
    const finalDimensions = getFinalDimensionsFromElement(componentElement);

    // 计算最终的宽高（根据单位类型转换）
    const finalWidth = isPercentUnit
      ? pixelToPercent(finalDimensions.width, containerSize.width)
      : finalDimensions.width;

    const finalHeight = isPercentUnit
      ? pixelToPercent(finalDimensions.height, containerSize.height)
      : finalDimensions.height;

    // 将最终 DOM 坐标应用到组件模型（会把相对父容器坐标转换为画布绝对坐标）
    applyFinalPositionToComponent(selectedComponent, finalDimensions);

    // 重要：先处理分组逻辑（此时组件数据还是旧的，可以正确计算 oldRect）
    // 传入新的宽高，让 handleGroupByParent 使用旧数据计算缩放比例
    handleComponentGroup(selectedComponent, resizePoint, finalWidth, finalHeight);
    // 然后更新组件数据
    updateComponentAttributes(selectedComponent, finalDimensions, isPercentUnit, containerSize);

    // 更新组件图层
    updateComponentLayers(selectedComponent);
  };

  // ============ 注册事件监听 ============

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};
