<template>
  <div
    id="edit-screens"
    ref="$app"
    class="edit-screens"
    :class="{ 'is-panning': isPanning }"
    @wheel="onWheel"
    @mousedown.capture="startPan"
  >
    <div
      ref="targetElementRef"
      class="edit-screen-container"
      tabindex="10"
      :style="{ pointerEvents: isReadyToPan ? 'none' : 'auto' }"
      @mousedown="forwardMarqueeStart"
    >
      <div ref="worldRef" class="world" :style="worldStyle">
        <slot />
      </div>
    </div>

    <div class="zoom-bar" @mousedown.stop @wheel.stop>
      <button type="button" title="缩小" @click="zoomByStep(1 / ZOOM_STEP)">−</button>
      <button type="button" class="zoom-value" title="重置为 100%" @click="resetZoom">{{ zoomPercent }}%</button>
      <button type="button" title="放大" @click="zoomByStep(ZOOM_STEP)">+</button>
      <button type="button" title="复原视角：按大屏宽高适配并居中" @click="fitToFrame()">复原</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, type PropType, ref, shallowRef, watch } from "vue";
import { nextTick } from "vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";

import { type CameraState, Viewport } from "@screenwright/core";

import { useAddKeyboard } from "@/views/build/components/buildRender/hooks/useAddKeyboard";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useKeyBoardAction } from "@/views/build/components/buildRender/hooks/useKeyBoardAction";

const { targetElementRef, initEventListener } = useKeyBoardAction();
const { setSpaceActive, KeyboardActiveMap } = useAddKeyboard();
const { editConfig } = useEditStore();

// 画板（渲染区）宽高：面板场景由父组件传入（面板自身宽高），大屏场景缺省回退到 editConfig（大屏宽高）
const props = defineProps({
  editWidth: {
    type: [String, Number] as PropType<string | number | undefined>,
    default: undefined
  },
  editHeight: {
    type: [String, Number] as PropType<string | number | undefined>,
    default: undefined
  }
});

const effectiveWidth = computed(() => Number(props.editWidth ?? editConfig.value.width) || 0);
const effectiveHeight = computed(() => Number(props.editHeight ?? editConfig.value.height) || 0);

const ZOOM_STEP = 1.2;
// Ctrl/触控板捏合缩放的灵敏度：指数缩放，鼠标一格滚轮约 ±5%，捏合时随手势连续变化
const WHEEL_ZOOM_SENSITIVITY = 0.0005;
const WHEEL_LINE_HEIGHT = 16;
const FIT_FILL = 0.8;

const $app = ref<HTMLDivElement>();
const worldRef = ref<HTMLDivElement>();

// 相机是纯视图状态，不进文档；editConfig.scale 只做镜像，供既有的拖拽/框选/缩放手柄换算使用
const viewport = new Viewport({ minZoom: 0.05, maxZoom: 8 });
const camera = shallowRef<CameraState>(viewport.getCamera());
const isPanning = ref(false);
// 用户手动平移/缩放过之后，窗口尺寸变化不再自动适配，避免抢走视角
let userMovedCamera = false;

const mirrorZoom = (zoom: number) => {
  if (editConfig.value.scale !== zoom) {
    editConfig.value.scale = zoom;
  }
};

const offCamera = viewport.subscribe((next) => {
  camera.value = next;
  mirrorZoom(next.zoom);
});
mirrorZoom(camera.value.zoom);

const worldStyle = computed(() => {
  const { x, y, zoom } = camera.value;
  return { transform: `translate(${x}px, ${y}px) scale(${zoom})` };
});

const zoomPercent = computed(() => Math.round(camera.value.zoom * 100));

const isReadyToPan = computed(() => KeyboardActiveMap.value.space || isPanning.value);

const cursorStyle = computed(() => {
  if (isPanning.value) {
    return "grabbing";
  }
  return KeyboardActiveMap.value.space ? "grab" : "auto";
});

/** 鼠标事件坐标 → 视口内坐标（以画布容器左上角为原点） */
const toViewportPoint = (e: { clientX: number; clientY: number }) => {
  const rect = $app.value!.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const markUserMoved = () => {
  userMovedCamera = true;
};

/** 把画板适配进视口并居中 */
const fitToFrame = (width = effectiveWidth.value, height = effectiveHeight.value) => {
  userMovedCamera = false;
  viewport.fitRect({ x: 0, y: 0, width, height }, { fill: FIT_FILL });
};

const resetZoom = () => {
  const { width, height } = viewport.getSize();
  markUserMoved();
  viewport.zoomAt({ x: width / 2, y: height / 2 }, 1);
};

const zoomByStep = (factor: number) => {
  const { width, height } = viewport.getSize();
  markUserMoved();
  viewport.zoomBy({ x: width / 2, y: height / 2 }, factor);
};

const onWheel = (e: WheelEvent) => {
  if (!$app.value) {
    return;
  }
  e.preventDefault();
  markUserMoved();

  const unit = e.deltaMode === 1 ? WHEEL_LINE_HEIGHT : 1;
  let deltaX = e.deltaX * unit;
  const deltaY = e.deltaY * unit;

  // Ctrl/Cmd+滚轮、触控板捏合（浏览器合成为 ctrlKey 的 wheel）：以光标为锚点缩放
  if (e.ctrlKey || e.metaKey) {
    viewport.zoomBy(toViewportPoint(e), Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY));
    return;
  }

  // 普通滚轮/触控板双指：平移。Shift+滚轮在部分平台不会换轴，这里补上。
  if (e.shiftKey && deltaX === 0) {
    deltaX = deltaY;
    viewport.panBy(-deltaX, 0);
    return;
  }
  viewport.panBy(-deltaX, -deltaY);
};

/** 空格+左键 / 中键拖动画布 */
const startPan = (e: MouseEvent) => {
  const wantsPan = e.button === 1 || (e.button === 0 && KeyboardActiveMap.value.space);
  if (!wantsPan) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();

  markUserMoved();
  isPanning.value = true;
  let lastX = e.clientX;
  let lastY = e.clientY;

  const stopMove = useEventListener(window, "mousemove", (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    viewport.panBy(moveEvent.clientX - lastX, moveEvent.clientY - lastY);
    lastX = moveEvent.clientX;
    lastY = moveEvent.clientY;
  });

  const stopUp = useEventListener(window, "mouseup", () => {
    stopMove();
    stopUp();
    isPanning.value = false;
  });
};

/**
 * 画板外的空白处按下也能发起框选。
 *
 * 框选处理器绑定在画板内的 `#render-container` 上，只有落在画板矩形内的 mousedown 才会命中。
 * 这里把「画板外空白区域」的左键按下转交给它——坐标用 clientX/Y，框选侧按画板位置换算，
 * 因此起点在画板外也能正确起框。画板内的按下由 `#render-container` 自己处理，不重复转发。
 */
const forwardMarqueeStart = (e: MouseEvent) => {
  if (e.button !== 0 || isReadyToPan.value) {
    return;
  }
  const target = e.target as HTMLElement;
  const isBlankArea = target === targetElementRef.value || target === worldRef.value;
  if (!isBlankArea) {
    return;
  }
  const renderContainer = document.getElementById("render-container");
  if (!renderContainer) {
    return;
  }
  renderContainer.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: false,
      cancelable: true,
      button: e.button,
      buttons: e.buttons,
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey
    })
  );
};

const syncViewportSize = () => {
  if (!$app.value) {
    return;
  }
  viewport.setSize($app.value.clientWidth, $app.value.clientHeight);
};

useResizeObserver($app, () => {
  syncViewportSize();
  // 布局稳定前（侧栏展开、首次测量）视口尺寸会多次变化；用户动手之前一直跟随适配
  if (!userMovedCamera) {
    fitToFrame();
  }
});

watch([effectiveWidth, effectiveHeight], () => {
  nextTick(() => fitToFrame());
});

let initTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
  await nextTick();
  syncViewportSize();
  fitToFrame();

  initTimer = setTimeout(() => {
    initEventListener();
    setSpaceActive(targetElementRef.value as HTMLElement);
  }, 500);
});

onBeforeUnmount(() => {
  clearTimeout(initTimer);
  offCamera();
});

defineExpose({
  fitToFrame
});
</script>

<style lang="scss" scoped>
.edit-screens {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  // 阻止浏览器把触控板手势当成页面缩放/回退
  overscroll-behavior: contain;
  touch-action: none;

  .edit-screen-container {
    position: absolute;
    inset: 0;
    outline: none;
  }

  .world {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
  }

  .zoom-bar {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border-radius: 8px;
    background: rgba(32, 32, 38, 0.92);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);

    button {
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #e5e5e5;
      font-size: 13px;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .zoom-value {
      min-width: 52px;
      font-variant-numeric: tabular-nums;
    }
  }
}
</style>

<style lang="scss">
.edit-screen-container {
  cursor: v-bind("cursorStyle") !important;
}
</style>
