import { computed, inject, onBeforeUnmount, watch } from "vue";

import { collectSubtreeIds, isRectVisible } from "@screenwright/core";

import { editingComponentIds } from "@/hooks/useEditingComponents";

import { VISIBLE_WORLD_RECT_KEY } from "../../buildInfiniteCanvas/canvasViewportContext";
import { PanelType } from "../core/SystemComponent/type";
import type { ComponentType } from "../type";
import { culledCounts, suspendCount } from "./cullingSuspend";
import { useEditStore } from "./useEditStore";

/**
 * 画布裁剪：移出可视窗口的顶层组件就隐藏（display: none），参考 tldraw 的 culling。
 *
 * 无限画布上组件可以离视口很远，全部保持渲染既费 CPU 也费内存（图表、视频、iframe 都在跑）。
 * 隐藏用 CSS 类而不是 v-show：EditShapeBox 的 v-show 在 Transition 里，切换会触发进入/离开动画，
 * 一滚动画布各组件就轮流播一遍入场动画。
 */

/** 可视窗口向外多留的比例（按长边算）：刚滑出的组件先不隐藏，也兜住发光、阴影这类画在包围盒外的内容 */
const CULL_MARGIN_RATIO = 0.1;

const EMPTY: ReadonlySet<string> = new Set<string>();

interface BoxSize {
  width: number;
  height: number;
}

/** 组件在画布上的包围盒（世界坐标）；带旋转/倾斜的按最长边向外扩，宁可少隐藏 */
const boundsOf = (component: ComponentType, renderSize: BoxSize) => {
  const isPercent = component.unitPavenType === "percent";
  const width = isPercent ? (component.component.width / 100) * renderSize.width : component.component.width;
  const height = isPercent ? (component.component.height / 100) * renderSize.height : component.component.height;
  const left = isPercent ? (component.left / 100) * renderSize.width : component.left;
  const top = isPercent ? (component.top / 100) * renderSize.height : component.top;

  const option = (component.option ?? {}) as Record<string, unknown>;
  const transformed = ["rotateX", "rotateY", "rotateZ", "skewX", "skewY"].some(
    (key) => Number(option[key]) !== 0 && option[key] != null
  );
  const pad = transformed ? Math.max(width, height) : 0;

  return { x: left - pad, y: top - pad, width: width + pad * 2, height: height + pad * 2 };
};

/**
 * 算出当前画布里该隐藏的顶层组件 id。
 *
 * 不会隐藏：选中的（以及内部有成员被选中的容器）、agent 正在改的、终端交互面板。
 * 不在无限画布里（拿不到可视窗口）时一个都不隐藏。
 *
 * @param list 这个渲染器的顶层组件列表
 * @param enabled 返回 false 时不裁剪（比如只读预览）
 * @param renderSize 画板（大屏 / 面板）尺寸，百分比单位的组件要靠它换算
 */
export const useCanvasCulling = (list: () => ComponentType[], enabled: () => boolean, renderSize: () => BoxSize) => {
  const visibleRect = inject(VISIBLE_WORLD_RECT_KEY, null);
  const { targetChart } = useEditStore();
  const id = Symbol("culling");

  /** 必须保留的顶层组件：自己被选中、内部有成员被选中、或在被 agent 编辑 */
  const keepIds = computed(() => {
    const keep = new Set<string>(editingComponentIds);
    const selected = new Set(targetChart.value.selectId ?? []);
    if (selected.size === 0) {
      return keep;
    }
    for (const component of list()) {
      const topId = `${component.id}`;
      if (selected.has(topId)) {
        keep.add(topId);
        continue;
      }
      const hasMembers =
        Boolean(component.children?.length) || Boolean((component as { panelData?: unknown[] }).panelData?.length);
      if (hasMembers && collectSubtreeIds(component).some((memberId) => selected.has(`${memberId}`))) {
        keep.add(topId);
      }
    }
    return keep;
  });

  const culledIds = computed<ReadonlySet<string>>(() => {
    const visible = visibleRect?.value;
    if (!visible || !enabled() || suspendCount.value > 0 || visible.width <= 0 || visible.height <= 0) {
      return EMPTY;
    }

    const margin = Math.max(visible.width, visible.height) * CULL_MARGIN_RATIO;
    const size = renderSize();
    const keep = keepIds.value;
    const culled = new Set<string>();
    for (const component of list()) {
      const topId = `${component.id}`;
      if (keep.has(topId) || component.component.prop === PanelType.encodePanel) {
        continue;
      }
      if (!isRectVisible(boundsOf(component, size), visible, margin)) {
        culled.add(topId);
      }
    }
    return culled;
  });

  watch(
    () => culledIds.value.size,
    (count) => {
      culledCounts.set(id, count);
    },
    { immediate: true }
  );
  onBeforeUnmount(() => culledCounts.delete(id));

  return { culledIds };
};
