// 处理组件移入移出操作
import { unref, type MaybeRef } from "vue";
import { useRoute } from "vue-router";

import { throttle } from "lodash-es";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { sleep } from "@/utils/utils";
import { useCustomAnimation } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimation";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import { useGlobalComponentData } from "../../../useGlobalComponentData";
import { EditCanvasTypeEnum, FolderType, MouseEventButton } from "../type";
// 导入纯函数工具
import {
  calculateComponentDisplayPosition,
  calculateDragOffset,
  calculateGroupFinalPositions,
  calculateNewPosition,
  calculateSelectBox,
  categorizeComponents,
  collectComponentPositions,
  type ComponentPosition,
  findChildByClickPosition,
  getComponentElement,
  getComponentFinalPosition,
  isComponentInBox,
  setComponentDataAttrs,
  setComponentPosition,
  setGroupPointerEvents,
  toggleDragClass
} from "./mouseHandleUtils";
// 导入状态管理
import { DualAxisSnapManager } from "./snapState";
import { useAction } from "./useAction";
import { useAddKeyboard } from "./useAddKeyboard";
import { useAlignmentWasm } from "./useAlignmentWasm";
import { useEditStore } from "./useEditStore";
import { useFtTextEdit } from "./useFtTextEdit";

// ============ 常量定义 ============
const DRAG_THROTTLE_MS = 5;
const BOX_SELECT_THROTTLE_MS = 30;

// ============ 类型定义 ============
/**
 * 处理拖拽移动的参数接口
 */
interface HandleDragMoveParams {
  moveEvent: MouseEvent;
  startX: number;
  startY: number;
  scale: number;
  initialPositions: Map<string, ComponentPosition>;
}

interface MouseHandleOptions {
  isDynamicPanel?: boolean;
  editConfig?: MaybeRef<LargeScreenDetailInfo>;
}

export const useMouseHandle = (props: MouseHandleOptions = {}) => {
  const editor = useScreenEditor();
  const { KeyboardActiveMap } = useAddKeyboard();
  const { updateComponentLayers } = useAction({ isDynamicPanel: props.isDynamicPanel ?? false });
  const { resetTextEdit } = useFtTextEdit();
  const { allComponentMap } = useGlobalComponentData();
  const { biAlignmentInstance, tolerance, updateAlignmentLine, onMoveEnd, searchPointComponentIds } =
    useAlignmentWasm();
  const snapManager = new DualAxisSnapManager(tolerance.value);

  // const { calculateAlignment, clearAlignmentGuides, updateSpatialIndex } = useAlignmentGuides();
  const {
    targetChart,
    editConfig: globalEditConfig,
    editCanvas,
    componentList,
    selectTargetData,
    selectTargetDataId,
    setEditCanvas,
    setTargetSelectChart,
    setMousePosition,
    setTargetHoverChart
  } = useEditStore();

  const getEditConfig = () => unref(props.editConfig) ?? globalEditConfig.value;

  // 获取动画相关的 hooks
  const { onComponentAddToCustomAnimation } = useCustomAnimation();
  const { handleComponentAddToStatusAnimation } = useStatusAnimation();

  // 记录图表移动 - 修复拼写错误: targetDisTanceMap -> targetDistanceMap
  const targetDistanceMap: Record<string, { x: number; y: number }> = {};
  const route = useRoute();

  /**
   * 处理多选逻辑（从 mouseClickHandle 提取）
   */
  const handleMultiSelect = (item: ComponentType) => {
    const selectId = targetChart.value.selectId;

    if (selectId.includes(`${item.id}`)) {
      // 取消选中
      const newSelectList = selectId.filter((id) => id !== `${item.id}`);
      setTargetSelectChart(newSelectList);
    } else {
      // 添加到选中列表
      setTargetSelectChart(`${item.id}`, true);
    }
  };

  let drillDownState: { key: string; selectedId: string } | null = null;

  /**
   * 获取鼠标在 canvas 上的位置
   * @param event
   * @returns 相对于 组件位置 的鼠标坐标
   */
  const getCanvasPoint = (event: MouseEvent) => {
    const renderDom = document.getElementById("render-container");
    if (!renderDom) {
      return null;
    }

    const rect = renderDom.getBoundingClientRect();
    const renderWidth = Number(getEditConfig().width) || rect.width;
    const renderHeight = Number(getEditConfig().height) || rect.height;
    const scaleX = rect.width / renderWidth || 1;
    const scaleY = rect.height / renderHeight || 1;

    return {
      x: (event.clientX - rect.left) / scaleX,
      y: (event.clientY - rect.top) / scaleY
    };
  };

  const getPointComponentsByLayer = (event: MouseEvent) => {
    const canvasPoint = getCanvasPoint(event);
    if (!canvasPoint) {
      return [];
    }

    const ids = searchPointComponentIds(canvasPoint.x, canvasPoint.y);
    const components: ComponentType[] = [];

    ids.forEach((id) => {
      const component = allComponentMap.value.get(id) as ComponentType | undefined;
      if (component?.display) {
        components.push(component);
      }
    });

    return components.sort((a, b) => b.zIndex - a.zIndex);
  };

  const selectNextComponentByPoint = (event: MouseEvent, item: ComponentType) => {
    const pointComponents = getPointComponentsByLayer(event);
    if (pointComponents.length <= 1) {
      return;
    }

    const candidateKey = pointComponents.map((component) => component.id).join(",");
    let currentId = targetChart.value.selectId[0] ?? `${item.id}`;
    if (drillDownState?.key === candidateKey) {
      currentId = drillDownState.selectedId;
    }

    const currentIndex = pointComponents.findIndex((component) => `${component.id}` === `${currentId}`);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % pointComponents.length : 0;
    const nextComponent = pointComponents[nextIndex];
    if (!nextComponent) {
      return;
    }

    drillDownState = {
      key: candidateKey,
      selectedId: `${nextComponent.id}`
    };
    setTargetSelectChart(`${nextComponent.id}`);
    setTargetHoverChart(nextComponent.id);
    return nextComponent;
  };

  const getDragTargetComponent = (event: MouseEvent, item: ComponentType) => {
    const [selectedId] = targetChart.value.selectId;
    if (!selectedId || targetChart.value.selectId.length !== 1 || `${item.id}` === selectedId) {
      return item;
    }

    const selectedComponent = allComponentMap.value.get(selectedId) as ComponentType | undefined;
    if (!selectedComponent) {
      return item;
    }

    const isSelectedComponentHit = getPointComponentsByLayer(event).some(
      (component) => `${component.id}` === selectedId
    );
    return isSelectedComponentHit ? selectedComponent : item;
  };

  /**
   * 处理拖拽移动（从 mousemove 提取）
   */
  const handleDragMove = (params: HandleDragMoveParams): boolean => {
    const { moveEvent, startX, startY, scale, initialPositions } = params;

    setMousePosition(moveEvent.screenX, moveEvent.screenY);

    // 计算基础偏移量（拖拽距离）
    const offsetX = calculateDragOffset({ currentPos: moveEvent.screenX, startPos: startX, scale });
    const offsetY = calculateDragOffset({ currentPos: moveEvent.screenY, startPos: startY, scale });
    const hasMoved = offsetX !== 0 || offsetY !== 0;

    const allDragComponentLength = initialPositions.size;

    // 真正被移动的顶层项（父在选区里的子项跟着父走，不单独处理）
    const movers = Array.from(initialPositions.entries()).filter(([id]) => {
      const c = allComponentMap.value.get(id);
      return Boolean(c) && !(c!.parent && initialPositions.has(`${c!.parent}`));
    });

    // 「分组 + 它的全部子元素」被整体选中：仍走单体对齐（按分组自身的包围盒）
    const isGroupWholeSelect =
      movers.length === 1 &&
      (() => {
        const c = allComponentMap.value.get(movers[0]?.[0] ?? "");
        return c?.component.prop === FolderType.group && (c.children ?? []).length + 1 === allDragComponentLength;
      })();

    // 多选（>1 个顶层项）：整体拖动时按「选区并集框」求一次对齐吸附，同一偏移套给所有成员
    const multiSelect = movers.length > 1 && !isGroupWholeSelect;
    const unionSnap = multiSelect ? computeUnionAlignmentSnap(movers, offsetX, offsetY, moveEvent) : null;

    movers.forEach(([id, initialPos]) => {
      const component = allComponentMap.value.get(id);
      if (!component) {
        return;
      }

      const draggedX = calculateNewPosition(initialPos.x, offsetX);
      const draggedY = calculateNewPosition(initialPos.y, offsetY);

      let finalX: number;
      let finalY: number;
      if (unionSnap) {
        finalX = draggedX + unionSnap.dx;
        finalY = draggedY + unionSnap.dy;
      } else {
        const enableAlignment = allDragComponentLength === 1 || Boolean(isGroupWholeSelect);
        ({ finalX, finalY } = updatePositionWithAlignment({
          draggedX,
          draggedY,
          component,
          moveEvent,
          enableAlignment
        }));
      }

      // 记录最终位置
      targetDistanceMap[id] = { x: finalX, y: finalY };

      // 更新 DOM（副作用函数在hooks中定义）
      updateComponentDomPosition(component, finalX, finalY);
    });

    return hasMoved;
  };

  /**
   * 多选整体拖动的对齐吸附：用「选区初始并集框 + 本次位移」查一次 WASM，
   * 得到的吸附偏移同样套给选区里每个成员。
   */
  const computeUnionAlignmentSnap = (
    movers: Array<[string, ComponentPosition]>,
    offsetX: number,
    offsetY: number,
    moveEvent: MouseEvent
  ): { dx: number; dy: number } => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [, p] of movers) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }

    const ux = minX + offsetX;
    const uy = minY + offsetY;
    const uw = maxX - minX;
    const uh = maxY - minY;

    const result = biAlignmentInstance.value?.update_ref_line(ux, uy, ux + uw, uy + uh);
    const { finalX, finalY } = snapManager.processAlignment({
      alignmentResult: result || { offset_x: 0, offset_y: 0 },
      currentX: moveEvent.screenX,
      currentY: moveEvent.screenY,
      draggedX: ux,
      draggedY: uy
    });
    updateAlignmentLine();

    return { dx: finalX - ux, dy: finalY - uy };
  };

  const updatePositionWithAlignment = ({
    draggedX,
    draggedY,
    component,
    moveEvent,
    enableAlignment = true
  }: {
    draggedX: number;
    draggedY: number;
    component: ComponentType;
    moveEvent: MouseEvent;
    enableAlignment?: boolean;
  }) => {
    if (!enableAlignment) {
      return {
        finalX: draggedX,
        finalY: draggedY
      };
    }

    // 调用 WASM 获取对齐结果
    const result = biAlignmentInstance.value?.update_ref_line(
      draggedX,
      draggedY,
      draggedX + component.component.width,
      draggedY + component.component.height
    );

    // 使用状态管理器处理吸附逻辑
    const { finalX, finalY } = snapManager.processAlignment({
      alignmentResult: result || { offset_x: 0, offset_y: 0 },
      currentX: moveEvent.screenX, // 当前鼠标 X 位置
      currentY: moveEvent.screenY, // 当前鼠标 Y 位置
      draggedX,
      draggedY
    });

    // 更新对齐线
    updateAlignmentLine();

    return {
      finalX,
      finalY
    };
  };

  /**
   * 更新单个组件的DOM位置（副作用）
   */
  const updateComponentDomPosition = (component: ComponentType, newX: number, newY: number) => {
    const dom = getComponentElement(`${component.id}`);
    if (!dom) {
      return;
    }

    const parentComponent = component.parent ? allComponentMap.value.get(`${component.parent}`) : undefined;
    const hasGroupSelected = selectTargetData.value.some((v) => v.component.prop === FolderType.group);

    // 使用纯函数计算显示位置
    const { displayX, displayY, useAbsolute } = calculateComponentDisplayPosition({
      component,
      newX,
      newY,
      hasGroupSelected,
      parentComponent
    });

    // 副作用：更新DOM
    setComponentDataAttrs({ dom, left: newX, top: newY });
    setComponentPosition({ dom, left: displayX, top: displayY });

    if (useAbsolute) {
      dom.classList.add("is-drag-select");
    }
  };

  /**
   * 应用分组组件的最终位置（副作用）
   */
  const applyGroupComponentPositions = (
    component: ComponentType,
    targetDistanceMap: Record<string, { x: number; y: number }>
  ) => {
    // 使用纯函数计算位置
    const position = calculateGroupFinalPositions({
      component,
      targetDistanceMap
    });

    // 副作用：清除拖拽样式
    const dom = getComponentElement(`${component.id}`);
    toggleDragClass(dom, false);

    // 副作用：更新分组位置
    if (!position) {
      return;
    }

    const distanceX = position.x - component.left;
    const distanceY = position.y - component.top;

    component.left = position.x;
    component.top = position.y;

    if (component.children && component.component.prop == FolderType.group) {
      component.children.forEach((child) => {
        child.left += distanceX;
        child.top += distanceY;
      });
    }

    // 副作用：调用更新回调
    updateComponentLayers(component, { fullUpdateGroup: true });
  };

  /**
   * 应用子组件的最终位置（副作用）
   */
  const applyChildComponentPosition = (
    component: ComponentType,
    targetDistanceMap: Record<string, { x: number; y: number }>
  ) => {
    const childPosition = targetDistanceMap[`${component.id}`];

    // 副作用：清除拖拽样式
    const dom = getComponentElement(`${component.id}`);
    toggleDragClass(dom, false);

    // 副作用：更新组件位置
    if (childPosition) {
      component.left = childPosition.x;
      component.top = childPosition.y;
    }

    const parentComponent = component.parent ? allComponentMap.value.get(`${component.parent}`) : undefined;
    if (!parentComponent) {
      return;
    }
    // 拖拽是在 core 之外直接改成员 left/top 的，core 无从得知，只能在这里显式收口一次。
    // 是不是分组由 reflowGroup 自己判（非分组是 no-op），不必再守一遍。
    editor.component.reflowGroup(parentComponent);
    updateComponentLayers(parentComponent);
  };

  /**
   * 应用独立组件的最终位置（副作用）
   */
  const applyStandaloneComponentPosition = (
    component: ComponentType,
    targetDistanceMap: Record<string, { x: number; y: number }>
  ) => {
    // 使用纯函数获取位置
    const finalPos = getComponentFinalPosition({
      componentId: `${component.id}`,
      targetDistanceMap
    });

    // 副作用：清除拖拽样式
    const dom = getComponentElement(`${component.id}`);
    toggleDragClass(dom, false);

    // 副作用：更新组件位置
    if (finalPos) {
      component.left = finalPos.x;
      component.top = finalPos.y;
    }

    // 副作用：调用更新回调
    updateComponentLayers(component);
  };

  /**
   * 应用最终位置到所有选中组件（副作用）
   */
  const applyFinalPositions = (targetDistanceMap: Record<string, { x: number; y: number }>) => {
    // 使用纯函数分类组件
    const { groupComponents, childComponents, standaloneComponents } = categorizeComponents(selectTargetData.value);

    // 副作用：应用位置
    groupComponents.forEach((component) => applyGroupComponentPositions(component, targetDistanceMap));
    childComponents.forEach((component) => applyChildComponentPosition(component, targetDistanceMap));
    standaloneComponents.forEach((component) => applyStandaloneComponentPosition(component, targetDistanceMap));
  };

  /**
   * 清理拖拽样式（副作用）
   */
  const cleanupDragStyles = () => {
    selectTargetData.value.forEach((component) => {
      const dom = getComponentElement(`${component.id}`);
      toggleDragClass(dom, false);
    });
  };

  /**
   * 处理拖拽结束（从 mouseup 提取）
   */
  const handleDragEnd = (hasMoved: boolean) => {
    try {
      setMousePosition(0, 0, 0, 0);
      setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);

      // 重置吸附状态
      snapManager.reset();

      onMoveEnd();
      if (hasMoved) {
        applyFinalPositions(targetDistanceMap);
      } else {
        cleanupDragStyles();
      }
    } catch (err) {
      console.error("Drag end error:", err);
    }
  };

  /**
   * 开始拖拽操作（从 mousedownHandle 提取）
   */
  const startDrag = (e: MouseEvent, clickTarget?: ComponentType) => {
    const editConfig = getEditConfig();
    const scale = editConfig.scale || 0.6;
    setEditCanvas(EditCanvasTypeEnum.IS_DRAG, true);

    // 收集初始位置（使用纯函数）
    const targetSelect = selectTargetDataId.value;
    const targetComponents = targetSelect.map((id) => allComponentMap.value.get(id)).filter((c) => c !== undefined);
    const initialPositions = collectComponentPositions(targetComponents as ComponentType[]);

    // 记录起始位置
    const startX = e.screenX;
    const startY = e.screenY;
    setMousePosition(undefined, undefined, startX, startY);

    if (biAlignmentInstance.value) {
      biAlignmentInstance.value.cache_reference_shapes(
        0,
        0,
        Number(editConfig.width),
        Number(editConfig.height),
        selectTargetDataId.value
      );
    }

    // 跟踪是否移动
    let hasMoved = false;

    // 移动处理（节流）
    const mousemove = throttle((moveEvent: MouseEvent) => {
      hasMoved = handleDragMove({
        moveEvent,
        startX,
        startY,
        scale,
        initialPositions
      });
    }, DRAG_THROTTLE_MS);

    // 抬起处理
    const mouseup = () => {
      handleDragEnd(hasMoved);
      if (!hasMoved && clickTarget) {
        setTargetSelectChart(`${clickTarget.id}`);
      }
      cleanup();
    };

    // 清理函数
    const cleanup = () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    };

    // 注册事件
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  /**
   * 处理框选移动（从 mousemove 提取）
   */
  const handleBoxSelectMove = (
    moveEvent: MouseEvent,
    startOffsetX: number,
    startOffsetY: number,
    startScreenX: number,
    startScreenY: number,
    scale: number
  ) => {
    // 清除当前选择
    setTargetSelectChart();
    setEditCanvas(EditCanvasTypeEnum.IS_SELECT, true);

    // 更新鼠标位置
    const currX = startOffsetX + moveEvent.screenX - startScreenX;
    const currY = startOffsetY + moveEvent.screenY - startScreenY;
    setMousePosition(currX, currY);

    // 计算选框
    const selectBox = calculateSelectBox({
      startOffsetX,
      startOffsetY,
      currentScreenX: moveEvent.screenX,
      currentScreenY: moveEvent.screenY,
      startScreenX,
      startScreenY,
      scale
    });

    // 检测碰撞并选中
    componentList.value.forEach((component) => {
      if (targetChart.value.selectId.includes(`${component.id}`)) {
        return;
      }

      if (isComponentInBox(component, selectBox)) {
        setTargetSelectChart(`${component.id}`, true);
      }
    });
  };

  /**
   * 处理框选结束（从 mouseup 提取）
   */
  const handleBoxSelectEnd = (mousemove: { cancel: () => void }) => {
    // 取消节流
    mousemove.cancel();
    setEditCanvas(EditCanvasTypeEnum.IS_SELECT, false);
    setMousePosition(0, 0, 0, 0);
  };

  /**
   * 鼠标位置 → 画布坐标（未缩放，相对画布左上角）。
   *
   * 不依赖事件目标是画布本身：无论 mousedown 落在画布上还是画布外的编辑区空白处，
   * 都按 `#go-chart-edit-content` 的位置换算，因此框选可以从画布外任意位置发起。
   * 画布外会得到负值或越界值，框选矩形照常工作。
   */
  const resolveCanvasStartPoint = (e: MouseEvent, scale: number) => {
    const canvasEl = document.getElementById("go-chart-edit-content");
    if (!canvasEl) {
      return { startOffsetX: e.offsetX, startOffsetY: e.offsetY };
    }
    const rect = canvasEl.getBoundingClientRect();
    return {
      startOffsetX: (e.clientX - rect.left) / scale,
      startOffsetY: (e.clientY - rect.top) / scale
    };
  };

  /**
   * 开始框选操作（从 mousedownBoxSelect 提取）
   */
  const startBoxSelect = (e: MouseEvent) => {
    const scale = getEditConfig().scale || 0.6;

    // 记录起始位置
    const { startOffsetX, startOffsetY } = resolveCanvasStartPoint(e, scale);
    const startScreenX = e.screenX;
    const startScreenY = e.screenY;

    setMousePosition(undefined, undefined, startOffsetX, startOffsetY);

    // 移动处理（节流）
    const mousemove = throttle((moveEvent: MouseEvent) => {
      handleBoxSelectMove(moveEvent, startOffsetX, startOffsetY, startScreenX, startScreenY, scale);
    }, BOX_SELECT_THROTTLE_MS);

    // 抬起处理
    const mouseup = () => {
      handleBoxSelectEnd(mousemove);
      cleanup();
    };

    // 清理函数
    const cleanup = () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    };

    // 注册事件
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  // ============ 导出的事件处理函数 ============

  /**
   * 点击处理
   */
  const mouseClickHandle = (e: MouseEvent, item: ComponentType) => {
    setGroupPointerEvents(componentList.value);

    if (route.name === "build") {
      resetTextEdit(e);
    }

    // 处理 CTRL 多选
    if (KeyboardActiveMap.value.ctrl) {
      handleMultiSelect(item);
    }
  };

  /**
   * 画布点击处理（取消选中）
   * 别名：handleCanvasClick
   */
  const mousedownHandleUnStop = async (e: MouseEvent, item?: ComponentType) => {
    setGroupPointerEvents(componentList.value);
    resetTextEdit(e);

    if (item) {
      setTargetSelectChart(`${item.id}`);
      return;
    }

    if ((e.target as HTMLElement).contentEditable === "true") {
      return;
    }
    await sleep(50);
    setTargetSelectChart(undefined);
  };

  // 向后兼容的别名
  const handleCanvasClick = mousedownHandleUnStop;

  /**
   * 按下事件（包含移动事件）- 已重构
   */
  const mousedownHandle = (e: MouseEvent, item: ComponentType, isMove = true) => {
    // 处理可编辑元素
    if ((e.target as HTMLElement).contentEditable === "true") {
      setTargetSelectChart(`${item.id}`);
      return;
    }

    if (isMove) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 处理 CTRL + 左键：添加到动画
    if (e.buttons === MouseEventButton.LEFT && KeyboardActiveMap.value.ctrl) {
      onComponentAddToCustomAnimation({ component: item });
      handleComponentAddToStatusAnimation({ component: item });
      return;
    }

    // 处理右键多选
    const selectId = targetChart.value.selectId;
    if (e.buttons === MouseEventButton.RIGHT && selectId.length > 1 && selectId.includes(`${item.id}`)) {
      return;
    }

    const dragTarget = getDragTargetComponent(e, item);
    setTargetSelectChart(`${dragTarget.id}`);

    // 不需要移动则返回
    if (!isMove || dragTarget.isLock || e.buttons === MouseEventButton.RIGHT) {
      return;
    }

    // 开始拖拽
    startDrag(e, dragTarget === item ? undefined : item);
  };

  /**
   * 框选处理 - 已重构
   */
  const mousedownBoxSelect = (e: MouseEvent) => {
    // 中键或右键不处理
    if (e.which === 2 || e.which === 3) {
      return;
    }
    // 按下空格键时不处理
    if (KeyboardActiveMap.value.space) {
      return;
    }

    // 清除选择并准备框选
    mousedownHandleUnStop(e);
    startBoxSelect(e);
  };

  /**
   * 鼠标进入事件
   */
  const mouseenterHandle = (e: MouseEvent, item: ComponentType) => {
    e.preventDefault();
    e.stopPropagation();
    setTargetHoverChart(item.id);
  };

  /**
   * 鼠标离开事件
   */
  const mouseleaveHandle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTargetHoverChart(undefined);
  };

  /**
   * 分组选择处理
   */
  const handleSelectByGroup = (event: MouseEvent, item: ComponentType, isSelectNew: boolean) => {
    event.stopPropagation();

    const dom = document.getElementById(`shape-modal-${item.id}`);
    if (!dom) {
      return;
    }

    dom.style.pointerEvents = "none";

    const clickedElement = findChildByClickPosition(event, item);
    if (clickedElement && isSelectNew) {
      setTargetSelectChart(`${clickedElement.id}`);
      setTargetHoverChart(clickedElement.id);
    }
  };

  /**
   * 拖动「当前选区」——供 SelectionTransformer 的框体使用。
   *
   * 与 `mousedownHandle` 不同：不重新设定选中项（`startDrag` 不传 clickTarget，松手也不反选），
   * 只按当前 `selectTargetData` 整体移动。守卫：非左键 / 选区为空 / 全部锁定 / 已在拖动中 → 直接返回。
   */
  const dragCurrentSelection = (e: MouseEvent) => {
    if (e.button !== 0) {
      return;
    }
    const items = selectTargetData.value;
    if (!items.length || items.every((c) => c.isLock) || editCanvas.value.isDrag) {
      return;
    }
    startDrag(e);
  };

  /**
   * 双击处理
   */
  const handleDbClick = (event: MouseEvent, item: ComponentType) => {
    event.stopPropagation();
    const selectedComponent = selectNextComponentByPoint(event, item);
    if (!selectedComponent) {
      handleSelectByGroup(event, item, true);
    }

    const targetComponent = selectedComponent ?? item;
    return targetComponent;
  };
  // ============ 返回导出（保持向后兼容）============
  return {
    // 原有导出（保持不变）
    mouseClickHandle,
    mouseenterHandle,
    mouseleaveHandle,
    mousedownHandle,
    mousedownBoxSelect,
    mousedownHandleUnStop,
    handleDbClick,
    handleSelectByGroup,

    // 新增别名（更清晰的命名）
    handleCanvasClick,

    // 供 SelectionTransformer 使用
    startDrag,
    dragCurrentSelection,
    getDragTargetComponent,
    getPointComponentsByLayer,
    selectNextComponentByPoint
  };
};
