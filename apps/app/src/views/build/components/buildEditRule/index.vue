<template>
  <div class="go-sketch-rule" @wheel="onWheel">
    <sketch-rule
      v-if="sketchRuleReDraw"
      :thick="THICK"
      :scale="scale"
      :width="canvasBoxSize.width"
      :height="canvasBoxSize.height"
      :startX="startX"
      :startY="startY"
      :lines="lines"
      :palette="paletteStyle"
    />
    <div
      ref="$app"
      class="edit-screens"
      @scroll="calculateRulerStart"
      id="edit-screens"
      @mousedown.capture="dragCanvas"
    >
      <div
        ref="targetElementRef"
        class="edit-screen-container"
        tabindex="10"
        :style="{ width: containerWidth, height: containerHeight, pointerEvents: isReadyToDragMove ? 'none' : 'auto' }"
        @mousedown="forwardMarqueeStart"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, type PropType, reactive, ref, watch } from "vue";
import { nextTick } from "vue";
import SketchRule from "vue3-sketch-ruler";
import { useEventListener, useResizeObserver } from "@vueuse/core";

import { useAddKeyboard } from "@/views/build/components/buildRender/hooks/useAddKeyboard";
import { useKeyBoardAction } from "@/views/build/components/buildRender/hooks/useKeyBoardAction";

import { useEditStore } from "../buildRender/hooks/useEditStore";

import "vue3-sketch-ruler/lib/style.css";

const { targetElementRef, initEventListener } = useKeyBoardAction();

const { setSpaceActive } = useAddKeyboard();

const { KeyboardActiveMap } = useAddKeyboard();
const { editConfig } = useEditStore();

// 画布宽高：面板场景由父组件传入（面板自身宽高），大屏场景缺省回退到 editConfig（大屏宽高）
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

const effectiveWidth = computed(() => props.editWidth ?? editConfig.value.width);
const effectiveHeight = computed(() => props.editHeight ?? editConfig.value.height);

const THICK = 20;
const DEFAULT_SCALE = 0.8;
const MIN_SCALE = 0.1;
const MAX_SCALE = 2;
let prevMoveXValue = [0, 0];
let prevMoveYValue = [0, 0];

const $app = ref<HTMLDivElement>();

const sketchRuleReDraw = ref(true);
const isPressSpace = ref(false);

const startX = ref(0);
const startY = ref(0);
const lines = reactive({ h: [], v: [] });

// 缓存画布尺寸
const canvasBoxSize = ref({ width: 0, height: 0 });

const normalizeScale = (value: unknown) => {
  const nextScale = Number(value);
  if (!Number.isFinite(nextScale)) {
    return DEFAULT_SCALE;
  }

  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(nextScale.toFixed(2))));
};

// 用于 CSS v-bind 的 computed 属性
const canvasWidth = computed(() => canvasBoxSize.value.width);
const canvasHeight = computed(() => canvasBoxSize.value.height);

// 更新画布尺寸的函数
const updateCanvasBoxSize = () => {
  if ($app.value) {
    canvasBoxSize.value = {
      width: $app.value.clientWidth,
      height: $app.value.clientHeight
    };
  }
};

useResizeObserver($app, async () => {
  updateCanvasBoxSize();

  sketchRuleReDraw.value = false;
  await nextTick();
  sketchRuleReDraw.value = true;

  resizeCanvasAndRuler(Number(effectiveWidth.value), Number(effectiveHeight.value));
});

const scale = computed(() => {
  return normalizeScale(editConfig.value.scale);
});

// 滚动条拖动的宽度
const containerWidth = computed(() => {
  const canvasWidth = Number(effectiveWidth.value) || 0;
  const viewportWidth = canvasBoxSize.value.width || window.innerWidth;
  const scaledCanvasWidth = canvasWidth * scale.value;
  const scrollWidth = Math.max(viewportWidth * 2, canvasWidth + viewportWidth, scaledCanvasWidth + viewportWidth);

  return `${Math.ceil(scrollWidth)}px`;
});

// 滚动条拖动的高度
const containerHeight = computed(() => {
  const canvasHeight = Number(effectiveHeight.value) || 0;
  const viewportHeight = canvasBoxSize.value.height || window.innerHeight;
  const scaledCanvasHeight = canvasHeight * scale.value;
  const scrollHeight = Math.max(viewportHeight * 2, canvasHeight + viewportHeight, scaledCanvasHeight + viewportHeight);

  return `${Math.ceil(scrollHeight)}px`;
});

const isReadyToDragMove = computed(() => {
  return KeyboardActiveMap.value.space || isPressSpace.value;
});

const cursorStyle = computed(() => {
  return isReadyToDragMove.value ? "crosshair" : "auto";
});

// 主题
const paletteStyle = computed(() => {
  const isDarkTheme = true;
  return isDarkTheme
    ? {
        bgColor: "#18181c",
        longfgColor: "#4d4d4d",
        shortfgColor: "#4d4d4d",
        fontColor: "#fff",
        shadowColor: "#18181c",
        borderColor: "#18181c",
        cornerActiveColor: "#18181c"
      }
    : {};
});

// 颜色
const themeColor = computed(() => {
  return "#5e62fb";
});

watch([effectiveWidth, effectiveHeight], ([newWidth, newHeight]) => {
  if (!$app.value) {
    return;
  }

  const { width, height } = $app.value.getBoundingClientRect();

  const rate = Math.min(width / Number(newWidth), height / Number(newHeight));
  editConfig.value.scale = normalizeScale(rate * DEFAULT_SCALE);
  nextTick(() => {
    canvasPosCenter();
  });
});

watch(
  () => editConfig.value.scale,
  (nextScale) => {
    const normalizedScale = normalizeScale(nextScale);
    if (nextScale !== normalizedScale) {
      editConfig.value.scale = normalizedScale;
    }
  }
);

// 处理鼠标拖动
const onWheel = (e: WheelEvent) => {
  // 检查 Ctrl 键是否被按下
  if (!e.ctrlKey || !$app.value) {
    return;
  }

  if (!targetElementRef.value) {
    return;
  }

  const containerRect = targetElementRef.value.getBoundingClientRect();
  const isPointerInCanvas =
    e.clientX >= containerRect.left &&
    e.clientX <= containerRect.right &&
    e.clientY >= containerRect.top &&
    e.clientY <= containerRect.bottom;

  // 只在鼠标进入画布容器区域时缩放，避免标尺区域触发导致视图漂移。
  if (!isPointerInCanvas) {
    return;
  }

  e.preventDefault(); // 阻止默认的滚动行为

  const contentDom = document.getElementById("go-chart-edit-content") as HTMLElement | null;
  if (!contentDom) {
    return;
  }

  const contentRect = contentDom.getBoundingClientRect();
  const prevScale = normalizeScale(editConfig.value.scale);
  const anchorXInCanvas = (e.clientX - contentRect.left) / prevScale;
  const anchorYInCanvas = (e.clientY - contentRect.top) / prevScale;

  const { deltaY } = e;
  let scaleRatio = prevScale;
  // 根据滚轮方向调整缩放比例
  if (deltaY < 0) {
    scaleRatio += 0.1; // 向上滚动，放大
  } else {
    scaleRatio -= 0.1; // 向下滚动，缩小
  }

  scaleRatio = normalizeScale(scaleRatio);

  if (scaleRatio === prevScale) {
    return;
  }

  // 应用缩放样式
  editConfig.value.scale = scaleRatio;

  nextTick(() => {
    if (!$app.value) {
      return;
    }

    const nextContentRect = contentDom.getBoundingClientRect();
    const nextAnchorClientX = nextContentRect.left + anchorXInCanvas * scaleRatio;
    const nextAnchorClientY = nextContentRect.top + anchorYInCanvas * scaleRatio;
    const deltaX = nextAnchorClientX - e.clientX;
    const deltaY = nextAnchorClientY - e.clientY;

    const nextScrollLeft = $app.value.scrollLeft + deltaX;
    const nextScrollTop = $app.value.scrollTop + deltaY;

    const maxScrollLeft = Math.max(0, $app.value.scrollWidth - $app.value.clientWidth);
    const maxScrollTop = Math.max(0, $app.value.scrollHeight - $app.value.clientHeight);

    $app.value.scrollLeft = Math.min(maxScrollLeft, Math.max(0, nextScrollLeft));
    $app.value.scrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
  });
};
watch(
  () => scale.value,
  () => {
    calculateRulerStart();
  }
);

// 滚动条处理
const calculateRulerStart = () => {
  if (!$app.value) {
    return;
  }
  nextTick(() => {
    const screensRect = $app.value!.getBoundingClientRect();
    const contentDom = document.getElementById("go-chart-edit-content");
    if (!contentDom) {
      return;
    }
    const canvasRect = contentDom.getBoundingClientRect();

    startX.value = Number(((screensRect.left + THICK - canvasRect.left) / scale.value).toFixed(2));
    startY.value = Number(((screensRect.top + THICK - canvasRect.top) / scale.value).toFixed(2));
  });
};

/**
 * 画布外的编辑区空白处按下也能发起框选。
 *
 * 框选处理器绑定在画布内的 `#render-container` 上，只有落在画布矩形内的 mousedown 才会命中。
 * 这里把「画布外空白区域」的左键按下转交给它——坐标用 clientX/Y，框选侧按画布位置换算，
 * 因此起点在画布外也能正确起框。画布内的按下由 `#render-container` 自己处理，不重复转发。
 */
const forwardMarqueeStart = (e: MouseEvent) => {
  if (e.button !== 0 || isReadyToDragMove.value) {
    return;
  }
  const target = e.target as HTMLElement;
  const isBlankArea = target === targetElementRef.value || target.id === "edit-screens";
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

// 拖拽处理
const dragCanvas = (e: MouseEvent) => {
  if (!$app.value) {
    return;
  }

  if (e.button === 1) {
    isPressSpace.value = true;
    e.preventDefault();
    e.stopPropagation();
  } else if (!KeyboardActiveMap.value.space) {
    return;
  }

  if (KeyboardActiveMap.value.space) {
    e.preventDefault();
    e.stopPropagation();
  }

  const startX = e.pageX;
  const startY = e.pageY;

  const listenMousemove = useEventListener(window, "mousemove", (e: MouseEvent) => {
    if (!$app.value) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const nx = e.pageX - startX;
    const ny = e.pageY - startY;

    const [prevMoveX1, prevMoveX2] = prevMoveXValue;
    const [prevMoveY1, prevMoveY2] = prevMoveYValue;

    prevMoveXValue = [prevMoveX2, nx];
    prevMoveYValue = [prevMoveY2, ny];

    $app.value.scrollLeft -= prevMoveX2 - prevMoveX1;
    $app.value.scrollTop -= prevMoveY2 - prevMoveY1;
  });

  const listenMouseup = useEventListener(window, "mouseup", () => {
    listenMousemove();
    listenMouseup();
    prevMoveXValue = [0, 0];
    prevMoveYValue = [0, 0];
    isPressSpace.value = false;
  });
};

// 滚动居中
const canvasPosCenter = () => {
  if (!$app.value || !targetElementRef.value) {
    return;
  }

  const { width: containerWidth, height: containerHeight } = targetElementRef.value.getBoundingClientRect();
  const targetScrollLeft = containerWidth / 2 - $app.value.clientWidth / 2;
  const targetScrollTop = containerHeight / 2 - $app.value.clientHeight / 2;

  const maxScrollLeft = Math.max(0, $app.value.scrollWidth - $app.value.clientWidth);
  const maxScrollTop = Math.max(0, $app.value.scrollHeight - $app.value.clientHeight);

  $app.value.scrollLeft = Math.min(maxScrollLeft, Math.max(0, targetScrollLeft));
  $app.value.scrollTop = Math.min(maxScrollTop, Math.max(0, targetScrollTop));
};

const resizeCanvasAndRuler = (newWidth: number, newHeight: number) => {
  if (!$app.value) {
    return;
  }

  const { width, height } = $app.value.getBoundingClientRect();

  const rate = Math.min(width / Number(newWidth), height / Number(newHeight));
  editConfig.value.scale = normalizeScale(rate * DEFAULT_SCALE);

  nextTick(() => {
    canvasPosCenter();
    calculateRulerStart();
  });
};

onMounted(async () => {
  // 等待 DOM 完成渲染
  await nextTick();

  // 初始化画布尺寸
  updateCanvasBoxSize();
  resizeCanvasAndRuler(Number(effectiveWidth.value), Number(effectiveHeight.value));

  setTimeout(() => {
    initEventListener();
    setSpaceActive(targetElementRef.value as HTMLElement);
  }, 500);
});

defineExpose({
  resizeCanvasAndRuler
});
</script>

<style>
/* 使用 SCSS 会报错，直接使用最基础的 CSS 进行修改，
  此库有计划 Vue3 版本，但是开发的时候还没发布 */
#mb-ruler {
  top: 0;
  left: 0;
}

/* 横线 */
#mb-ruler .v-container .lines .line {
  /* 最大缩放 200% */
  width: 200vw !important;
  border-top: 1px dashed v-bind("themeColor") !important;
}

#mb-ruler .v-container .indicator {
  border-bottom: 1px dashed v-bind("themeColor") !important;
}

/* 竖线 */
#mb-ruler .h-container .lines .line {
  /* 最大缩放 200% */
  height: 200vh !important;
  border-left: 1px dashed v-bind("themeColor") !important;
}

#mb-ruler .h-container .indicator {
  border-left: 1px dashed v-bind("themeColor") !important;
}

/* 坐标数值背景颜色 */
#mb-ruler .indicator .value {
  background-color: #ddd;
}

/* 删除按钮 */
#mb-ruler .line .del {
  padding: 0;
  color: v-bind("themeColor");
  font-size: 26px;
  font-weight: bolder;
}

#mb-ruler .corner {
  border-width: 0 !important;
}
</style>

<style lang="scss" scoped>
:deep(.ruler) {
  height: v-bind(canvasHeight) !important;
  width: v-bind(canvasWidth) !important;
}

.go-sketch-rule {
  overflow: hidden;
  width: 100%;
  height: 100%;

  .edit-screens {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    user-select: none;
    padding-bottom: 0px;

    /* firefox */
    scrollbar-color: rgba(144, 146, 152, 0.3) transparent;
    scrollbar-width: thin;

    /* chrome */
    &::-webkit-scrollbar,
    &::-webkit-scrollbar-track-piece {
      background-color: transparent;
    }

    &::-webkit-scrollbar {
      width: 7px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      background-color: rgba(144, 146, 152, 0.3);
    }
    // 修复右下角白点用的
    &::-webkit-scrollbar-corner {
      background-color: transparent;
    }
  }

  .fix-edit-screens-block {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background-color: red;
  }

  .edit-screen-container {
    position: relative;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>

<style lang="scss">
.edit-screen-container {
  cursor: v-bind("cursorStyle") !important;
}
</style>
