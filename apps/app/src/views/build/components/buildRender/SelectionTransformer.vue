<template>
  <div v-if="visible" ref="frameEl" class="sw-transform" :style="frameStyle">
    <div
      v-if="bodyEnabled"
      class="sw-transform__body"
      @mousedown="onBodyMouseDown"
      @dblclick="onBodyDblClick"
      @contextmenu="onBodyContextMenu"
    />
    <template v-if="anchorsEnabled">
      <div
        v-for="(pt, i) in ANCHOR_POINTS"
        :key="pt"
        class="sw-transform__handle"
        :style="{ cursor: `${ANCHOR_CURSORS[i]}-resize`, ...anchorStyles[pt] }"
        @mousedown="onHandleMouseDown($event, pt)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { PanelType } from "./core/SystemComponent/type";
import { ANCHOR_CURSORS, ANCHOR_POINTS, computeAnchorStyles } from "./hooks/anchorGeometry";
import { getComponentElement } from "./hooks/mouseHandleUtils";
import { useAction } from "./hooks/useAction";
import { useAddKeyboard } from "./hooks/useAddKeyboard";
import { useEditStore } from "./hooks/useEditStore";
import { useMenuAction } from "./hooks/useMenuAction";
import { useMouseHandle } from "./hooks/useMouseHandle";
import { useMousePointHandle } from "./hooks/useMousePointHandle";
import type { ComponentType, direction } from "./type";
import { EditCanvasTypeEnum } from "./type";

const props = withDefaults(
  defineProps<{
    isDynamicPanel?: boolean;
    disabled?: boolean;
    /** 透传 useBuildRender/useBaseRender 的 handleDbClick（文本编辑 / 进面板路由在那儿） */
    onDbClick?: (e: MouseEvent, item: ComponentType) => void;
  }>(),
  { isDynamicPanel: false, disabled: false }
);

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const { selectTargetData, targetChart, editCanvas, editConfig, setTargetSelectChart } = useEditStore();
const { KeyboardActiveMap } = useAddKeyboard();
const { handleContextMenu } = useMenuAction();
const { updateComponentLayers } = useAction({ isDynamicPanel: props.isDynamicPanel });
const { dragCurrentSelection, getPointComponentsByLayer, selectNextComponentByPoint, mouseClickHandle } =
  useMouseHandle({
    isDynamicPanel: props.isDynamicPanel
  });

const RENDER_CONTAINER_ID = "render-container";
const renderW = () => Number(editConfig.value.width) || 1920;
const renderH = () => Number(editConfig.value.height) || 1080;

const frameEl = ref<HTMLElement | null>(null);
/** 交互期间由 rAF / resize 逻辑写入的实时框，优先于 frameRect */
const liveRect = ref<Rect | null>(null);
/** 变换框自己在驱动 move/resize（拖动期间不隐藏，靠 rAF 跟手） */
const isSelfInteracting = ref(false);
/** 文本编辑态：让点击穿透到 contenteditable，隐藏整框 */
const textEditing = ref(false);

const selectedItems = computed(() => selectTargetData.value.filter(Boolean) as ComponentType[]);
const primary = computed(() => selectedItems.value[0]);
const isMulti = computed(() => (targetChart.value.selectId?.length ?? 0) > 1);
const isEncodeSys = computed(() => primary.value?.component?.prop === PanelType.encodePanel);

/** 单个组件的画布 px 矩形（percent 单位换算成 px；left/top 永远是画布 px） */
function itemPxRect(item: ComponentType): Rect {
  const pct = item.unitPavenType === "percent";
  const w = pct ? (Number(item.component.width) / 100) * renderW() : Number(item.component.width);
  const h = pct ? (Number(item.component.height) / 100) * renderH() : Number(item.component.height);
  return { left: item.left, top: item.top, width: w || 0, height: h || 0 };
}

/** 空闲态：选中项并集框 */
const frameRect = computed<Rect | null>(() => {
  const items = selectedItems.value;
  if (!items.length) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const it of items) {
    const r = itemPxRect(it);
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.left + r.width);
    maxY = Math.max(maxY, r.top + r.height);
  }
  return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
});

const displayRect = computed<Rect | null>(() => liveRect.value ?? frameRect.value);

const frameStyle = computed<Record<string, string>>(() => {
  const r = displayRect.value;
  if (!r) {
    return {} as Record<string, string>;
  }
  return { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` };
});

const isDragging = computed(() => editCanvas.value[EditCanvasTypeEnum.IS_DRAG]);

const visible = computed(() => {
  if (!displayRect.value || props.disabled || textEditing.value) {
    return false;
  }
  if (editCanvas.value[EditCanvasTypeEnum.IS_SELECT]) {
    return false; // 正在框选
  }
  return true; // 拖动期间也显示，靠 rAF 跟手
});

const bodyEnabled = computed(() => !props.disabled && !isEncodeSys.value);

const anchorsEnabled = computed(() => {
  if (props.disabled || isEncodeSys.value || !frameRect.value || isDragging.value) {
    return false; // 移动拖拽期间不显示锚点
  }
  const items = selectedItems.value;
  if (!items.length || items.some((it) => it.isLock)) {
    return false;
  }
  // 多选含分组：v1 仅移动，不给锚点
  if (isMulti.value && items.some((it) => (it.children?.length ?? 0) > 0)) {
    return false;
  }
  return true;
});

const anchorStyles = computed(() => {
  const r = displayRect.value ?? { width: 100, height: 100, left: 0, top: 0 };
  return computeAnchorStyles(r.width, r.height);
});

/* ---------------- 交互期间的框跟手（rAF） ---------------- */

let rafId = 0;

function canvasScaleFromDom(): { crr: DOMRect; sx: number; sy: number } | null {
  const cr = document.getElementById(RENDER_CONTAINER_ID);
  if (!cr) {
    return null;
  }
  const crr = cr.getBoundingClientRect();
  return { crr, sx: crr.width / renderW(), sy: crr.height / renderH() };
}

function elCanvasRect(id: string, ctx: { crr: DOMRect; sx: number; sy: number }): Rect | null {
  // 与拖拽写位置同一套解析（画布内按 data-id 找），避免物料内部的裸数字 id 撞上组件 id
  const el = getComponentElement(id);
  if (!el) {
    return null;
  }
  const r = el.getBoundingClientRect();
  return {
    left: (r.left - ctx.crr.left) / ctx.sx,
    top: (r.top - ctx.crr.top) / ctx.sy,
    width: r.width / ctx.sx,
    height: r.height / ctx.sy
  };
}

/** 从 DOM 实时求 ids 的并集框写进 liveRect（单帧） */
function syncUnionRect(ids: string[]) {
  const ctx = canvasScaleFromDom();
  if (!ctx || !ids.length) {
    return;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const id of ids) {
    const r = elCanvasRect(id, ctx);
    if (!r) {
      continue;
    }
    any = true;
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.left + r.width);
    maxY = Math.max(maxY, r.top + r.height);
  }
  if (any) {
    liveRect.value = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }
}

/** 变换框自己驱动的交互（move/resize）：rAF 跟手，直到 mouseup 后一拍释放 */
function startFrameSync(ids: string[]) {
  const loop = () => {
    syncUnionRect(ids);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  const stop = () => {
    cancelAnimationFrame(rafId);
    rafId = 0;
    document.removeEventListener("mouseup", stop);
    // 等下游 hook 的 mouseup 提交模型 + Vue flush 之后再释放，避免闪回
    setTimeout(() => {
      liveRect.value = null;
      isSelfInteracting.value = false;
    }, 0);
  };
  document.addEventListener("mouseup", stop);
}

/**
 * 外部拖动（从组件 .shape-modal 发起的 mousedownHandle → startDrag）：
 * 变换框没参与，但要跟手不消失。监听全局 isDrag，起一个 rAF 循环，isDrag 落下即停。
 */
watch(
  isDragging,
  (dragging) => {
    if (!dragging || isSelfInteracting.value || rafId) {
      return;
    }
    const ids = selectedItems.value.map((it) => String(it.id));
    const loop = () => {
      if (!editCanvas.value[EditCanvasTypeEnum.IS_DRAG]) {
        rafId = 0;
        setTimeout(() => {
          liveRect.value = null;
        }, 0);
        return;
      }
      syncUnionRect(ids);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  },
  { flush: "sync" }
);

/* ---------------- 缩放锚点 ---------------- */

const dirFlags = (p: direction) => ({
  isLeft: /l/.test(p),
  isRight: /r/.test(p),
  isTop: /t/.test(p),
  isBottom: /b/.test(p)
});

/** 多选等比缩放：以并集框为基准，固定被拖边的对边，逐成员等比改 left/top/width/height */
function startMultiResize(e: MouseEvent, point: direction) {
  const base = frameRect.value;
  if (!base) {
    return;
  }
  const dir = dirFlags(point);
  const scale = Number(editConfig.value.scale) || 1;
  const startX = e.clientX;
  const startY = e.clientY;
  const rw = renderW();
  const rh = renderH();

  const members = selectedItems.value.map((it) => ({
    it,
    el: getComponentElement(String(it.id)),
    rect: itemPxRect(it),
    percent: it.unitPavenType === "percent"
  }));

  // 固定参考点：被拖边的对边
  const ax = dir.isLeft ? base.left + base.width : base.left;
  const ay = dir.isTop ? base.top + base.height : base.top;

  const move = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / scale;
    const dy = (ev.clientY - startY) / scale;
    let sx = 1;
    let sy = 1;
    if (dir.isLeft) {
      sx = base.width ? Math.max(base.width - dx, 1) / base.width : 1;
    } else if (dir.isRight) {
      sx = base.width ? Math.max(base.width + dx, 1) / base.width : 1;
    }
    if (dir.isTop) {
      sy = base.height ? Math.max(base.height - dy, 1) / base.height : 1;
    } else if (dir.isBottom) {
      sy = base.height ? Math.max(base.height + dy, 1) / base.height : 1;
    }

    for (const m of members) {
      if (!m.el) {
        continue;
      }
      m.el.style.left = `${ax + (m.rect.left - ax) * sx}px`;
      m.el.style.top = `${ay + (m.rect.top - ay) * sy}px`;
      m.el.style.width = `${m.rect.width * sx}px`;
      m.el.style.height = `${m.rect.height * sy}px`;
    }

    liveRect.value = {
      left: ax + (base.left - ax) * sx,
      top: ay + (base.top - ay) * sy,
      width: base.width * sx,
      height: base.height * sy
    };
  };

  const up = () => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);

    for (const m of members) {
      if (!m.el) {
        continue;
      }
      const fl = parseFloat(m.el.style.left) || 0;
      const ft = parseFloat(m.el.style.top) || 0;
      const fw = parseFloat(m.el.style.width) || 0;
      const fh = parseFloat(m.el.style.height) || 0;
      m.it.left = Math.round(fl);
      m.it.top = Math.round(ft);
      if (m.percent) {
        m.it.component.width = Number(((fw / rw) * 100).toFixed(2));
        m.it.component.height = Number(((fh / rh) * 100).toFixed(2));
      } else {
        m.it.component.width = Math.round(fw);
        m.it.component.height = Math.round(fh);
      }
      updateComponentLayers(m.it); // 300ms 内自动并成一步 undo
    }

    setTimeout(() => {
      liveRect.value = null;
      isSelfInteracting.value = false;
    }, 0);
  };

  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
}

const onHandleMouseDown = (e: MouseEvent, point: direction) => {
  e.stopPropagation();
  if (e.button !== 0) {
    return;
  }
  isSelfInteracting.value = true;
  if (isMulti.value) {
    startMultiResize(e, point);
  } else {
    // 单选：复用现有 resize（对齐吸附 / 分组 reflow / percent / 提交都在里面）
    useMousePointHandle(e, point, { isDynamicPanel: props.isDynamicPanel });
    startFrameSync(primary.value ? [String(primary.value.id)] : []);
  }
};

/* ---------------- 框体：移动 / 点击钻取 ---------------- */

function handleBodyClick(ev: MouseEvent) {
  if (KeyboardActiveMap.value.ctrl) {
    if (primary.value) {
      mouseClickHandle(ev, primary.value);
    }
    return;
  }
  const hits = getPointComponentsByLayer(ev);
  if (hits.length <= 1) {
    return;
  }
  const topId = String(hits[0].id);
  const selId = targetChart.value.selectId;
  if (selId.length === 1 && selId[0] === topId && primary.value) {
    selectNextComponentByPoint(ev, primary.value); // 向下钻取
  } else {
    setTargetSelectChart(topId);
  }
}

const onBodyMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) {
    return;
  }
  e.stopPropagation();
  const downX = e.clientX;
  const downY = e.clientY;
  let moved = false;

  const onMove = (ev: MouseEvent) => {
    if (moved || Math.hypot(ev.clientX - downX, ev.clientY - downY) <= 3) {
      return;
    }
    moved = true;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    e.preventDefault();
    isSelfInteracting.value = true;
    dragCurrentSelection(e); // 用捕获到的原始按下事件（startDrag 只读 screenX/Y）
    startFrameSync(selectedItems.value.map((it) => String(it.id)));
  };
  const onUp = (ev: MouseEvent) => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (!moved) {
      handleBodyClick(ev);
    }
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

const onBodyDblClick = (e: MouseEvent) => {
  if (primary.value) {
    props.onDbClick?.(e, primary.value);
  }
};

const onBodyContextMenu = (e: MouseEvent) => {
  if (primary.value) {
    handleContextMenu(e, primary.value);
  }
};

/* ---------------- 文本编辑态探测 ---------------- */

let mo: MutationObserver | null = null;
onMounted(() => {
  const sync = () => {
    textEditing.value = !!document.querySelector('[data-contenteditable="true"]');
  };
  sync();
  mo = new MutationObserver(sync);
  mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-contenteditable"] });
});

onBeforeUnmount(() => {
  mo?.disconnect();
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<style lang="scss" scoped>
.sw-transform {
  position: absolute;
  z-index: 8;
  box-sizing: border-box;
  border: 2px solid var(--sw-theme-color);
  pointer-events: none;

  &__body {
    position: absolute;
    inset: 0;
    cursor: move;
    pointer-events: auto;
  }

  &__handle {
    position: absolute;
    box-sizing: border-box;
    pointer-events: auto;
  }
}
</style>
