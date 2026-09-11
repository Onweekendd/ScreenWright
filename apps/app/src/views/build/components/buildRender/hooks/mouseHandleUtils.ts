/**
 * 鼠标处理工具函数集
 *
 * 包含所有从 useMouseHandle 中提取的纯函数，提供可测试的工具集
 */
import type { ComponentType } from "../type";
import { FolderType } from "../type";

// ============ 类型定义 ============
export interface ComponentPosition {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ============ DOM 操作函数 ============
/**
 * 获取组件 DOM 元素
 */
export function getComponentElement(id: string): HTMLElement | null {
  const renderContainer = document.getElementById("render-container");
  const renderedComponent = Array.from(renderContainer?.querySelectorAll<HTMLElement>("[data-id]") ?? []).find(
    (element) => element.dataset.id === id
  );

  // `data-id` 指向 EditShapeBox 的真实根节点；优先限制在当前画布中，避免
  // Transition、分组嵌套或页面其他区域的重复 id 让拖拽写入错误的 DOM。
  return renderedComponent ?? document.getElementById(id);
}

/**
 * 设置组件位置样式
 * @param options 位置配置选项
 * @param options.dom DOM元素
 * @param options.left 左侧位置
 * @param options.top 顶部位置
 */
export function setComponentPosition(options: { dom: HTMLElement; left: number; top: number }): void {
  const { dom, left, top } = options;
  dom.style.left = `${left}px`;
  dom.style.top = `${top}px`;
}

/**
 * 设置组件数据属性
 * @param options 数据属性配置选项
 * @param options.dom DOM元素
 * @param options.left 左侧位置
 * @param options.top 顶部位置
 */
export function setComponentDataAttrs(options: { dom: HTMLElement; left: number; top: number }): void {
  const { dom, left, top } = options;
  dom.setAttribute("data-left", `${left}`);
  dom.setAttribute("data-top", `${top}`);
}

/**
 * 切换拖拽样式类
 */
export function toggleDragClass(dom: HTMLElement | null, isDragging: boolean): void {
  if (!dom) {
    return;
  }
  if (isDragging) {
    dom.classList.add("is-drag-select");
  } else {
    dom.classList.remove("is-drag-select");
  }
}

/**
 * 设置分组组件的 pointer-events
 */
export function setGroupPointerEvents(componentList: ComponentType[]): void {
  const groupComponents = componentList.filter((v) => v.component.prop === FolderType.group);
  groupComponents.forEach((g) => {
    const dom = document.getElementById(`shape-modal-${g.id}`);
    if (dom) {
      dom.style.pointerEvents = "auto";
    }
  });
}

// ============ 位置计算函数 ============
/**
 * 计算拖拽偏移量（考虑缩放）
 * @param options 偏移量计算配置
 * @param options.currentPos 当前位置
 * @param options.startPos 起始位置
 * @param options.scale 缩放比例
 */
export function calculateDragOffset(options: { currentPos: number; startPos: number; scale: number }): number {
  const { currentPos, startPos, scale } = options;
  return (currentPos - startPos) / scale;
}

/**
 * 计算新位置（四舍五入）
 */
export function calculateNewPosition(originalPos: number, offset: number): number {
  return Math.round(originalPos + offset);
}

/**
 * 计算相对于父元素的位置
 */
export function calculateRelativePosition(absolutePos: number, parentPos: number): number {
  return absolutePos - parentPos;
}

// ============ 拖拽辅助函数 ============
/**
 * 收集组件列表的初始位置（纯函数版本）
 * @param components 组件列表
 * @returns 位置映射表
 */
export function collectComponentPositions(components: ComponentType[]): Map<string, ComponentPosition> {
  const positionMap = new Map<string, ComponentPosition>();

  components.forEach((component) => {
    positionMap.set(`${component.id}`, {
      id: `${component.id}`,
      x: component.left,
      y: component.top,
      w: component.component.width,
      h: component.component.height
    });
  });

  return positionMap;
}

/**
 * 计算组件应该使用的显示坐标（纯函数）
 * @param options 计算配置
 * @returns 计算后的显示坐标和是否使用绝对定位
 */
export function calculateComponentDisplayPosition(options: {
  component: ComponentType;
  newX: number;
  newY: number;
  hasGroupSelected: boolean;
  parentComponent?: ComponentType;
}): { displayX: number; displayY: number; useAbsolute: boolean } {
  const { component, newX, newY, hasGroupSelected, parentComponent } = options;

  // 无父元素：使用绝对坐标
  if (!component.parent) {
    return { displayX: newX, displayY: newY, useAbsolute: true };
  }

  // 有父元素但父组件不存在
  if (!parentComponent) {
    return { displayX: newX, displayY: newY, useAbsolute: false };
  }

  // 选中了分组：子组件使用绝对坐标（避免抽搐）
  if (hasGroupSelected) {
    return { displayX: newX, displayY: newY, useAbsolute: true };
  }

  // 正常情况：使用相对坐标
  const relativeX = calculateRelativePosition(newX, parentComponent.left);
  const relativeY = calculateRelativePosition(newY, parentComponent.top);
  return { displayX: relativeX, displayY: relativeY, useAbsolute: false };
}

/**
 * 计算分组及其子组件的最终位置（纯函数）
 * @param options 计算配置
 * @returns 分组和子组件的最终位置数据
 */
export function calculateGroupFinalPositions(options: {
  component: ComponentType;
  targetDistanceMap: Record<string, { x: number; y: number }>;
}) {
  const { component, targetDistanceMap } = options;

  return targetDistanceMap[`${component.id}`] || null;
}

/**
 * 获取组件的最终位置（纯函数）
 * @param options 配置
 * @returns 最终位置或null
 */
export function getComponentFinalPosition(options: {
  componentId: string;
  targetDistanceMap: Record<string, { x: number; y: number }>;
}): { x: number; y: number } | null {
  const { componentId, targetDistanceMap } = options;
  return targetDistanceMap[componentId] || null;
}

/**
 * 分类组件类型（纯函数）
 * @param components 组件列表
 * @returns 分类后的组件
 */
export function categorizeComponents(components: ComponentType[]): {
  groupComponents: ComponentType[];
  childComponents: ComponentType[];
  standaloneComponents: ComponentType[];
} {
  const groupComponents: ComponentType[] = [];
  const childComponents: ComponentType[] = [];
  const standaloneComponents: ComponentType[] = [];

  components.forEach((component) => {
    if (component.children && component.children.length > 0) {
      groupComponents.push(component);
    } else if (component.parent) {
      childComponents.push(component);
    } else {
      standaloneComponents.push(component);
    }
  });

  return { groupComponents, childComponents, standaloneComponents };
}

// ============ 框选辅助函数 ============
/**
 * 计算框选矩形区域（支持四个方向）
 * @param options 框选计算配置
 * @param options.startOffsetX 起始偏移X坐标
 * @param options.startOffsetY 起始偏移Y坐标
 * @param options.currentScreenX 当前屏幕X坐标
 * @param options.currentScreenY 当前屏幕Y坐标
 * @param options.startScreenX 起始屏幕X坐标
 * @param options.startScreenY 起始屏幕Y坐标
 * @param options.scale 缩放比例
 */
export function calculateSelectBox(options: {
  startOffsetX: number;
  startOffsetY: number;
  currentScreenX: number;
  currentScreenY: number;
  startScreenX: number;
  startScreenY: number;
  scale: number;
}): Rectangle {
  const { startOffsetX, startOffsetY, currentScreenX, currentScreenY, startScreenX, startScreenY, scale } = options;

  const currX = startOffsetX + currentScreenX - startScreenX;
  const currY = startOffsetY + currentScreenY - startScreenY;

  const deltaX = (currentScreenX - startScreenX) / scale;
  const deltaY = (currentScreenY - startScreenY) / scale;

  // 根据方向计算选框
  if (currX > startOffsetX && currY > startOffsetY) {
    // 右下方向
    return {
      x1: startOffsetX,
      y1: startOffsetY,
      x2: Math.round(startOffsetX + deltaX),
      y2: Math.round(startOffsetY + deltaY)
    };
  } else if (currX > startOffsetX && currY < startOffsetY) {
    // 右上方向
    return {
      x1: startOffsetX,
      y1: Math.round(startOffsetY - (startScreenY - currentScreenY) / scale),
      x2: Math.round(startOffsetX + deltaX),
      y2: startOffsetY
    };
  } else if (currX < startOffsetX && currY > startOffsetY) {
    // 左下方向
    return {
      x1: Math.round(startOffsetX - (startScreenX - currentScreenX) / scale),
      y1: startOffsetY,
      x2: startOffsetX,
      y2: Math.round(startOffsetY + deltaY)
    };
  } else {
    // 左上方向
    return {
      x1: Math.round(startOffsetX - (startScreenX - currentScreenX) / scale),
      y1: Math.round(startOffsetY - (startScreenY - currentScreenY) / scale),
      x2: startOffsetX,
      y2: startOffsetY
    };
  }
}

/**
 * 检查组件是否在选框内（AABB 碰撞检测）
 */
export function isComponentInBox(component: ComponentType, selectBox: Rectangle): boolean {
  const componentBox: Rectangle = {
    x1: component.left,
    y1: component.top,
    x2: component.left + component.component.width,
    y2: component.top + component.component.height
  };

  return (
    selectBox.x1 < componentBox.x2 &&
    selectBox.x2 > componentBox.x1 &&
    selectBox.y1 < componentBox.y2 &&
    selectBox.y2 > componentBox.y1
  );
}

// ============ 分组相关函数 ============
/**
 * 根据点击位置查找分组中的子组件
 */
export function findChildByClickPosition(event: MouseEvent, parent: ComponentType): ComponentType | null {
  if (!parent.children) {
    return null;
  }

  const x = event.offsetX;
  const y = event.offsetY;

  for (const child of parent.children) {
    // 计算子元素相对于父元素的位置
    const childX = child.left - parent.left;
    const childY = child.top - parent.top;

    // 检查点击位置是否在子元素边界内
    if (x >= childX && x <= childX + child.component.width && y >= childY && y <= childY + child.component.height) {
      return child;
    }
  }

  return null;
}
