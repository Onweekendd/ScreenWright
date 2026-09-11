<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <canvas ref="canvasRef" class="canvas-cover" @error="handleCanvasError" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

// ========== 1. 事件定义 ==========
interface Emits {
  (e: "load", payload: { img: HTMLImageElement; width: number; height: number }): void;
  (e: "error", payload: { src: string; message: string }): void;
  (e: "canvas-error", payload: Event): void;
}
const emit = defineEmits<Emits>();

// ========== 2. Props定义 ==========
interface Props {
  src: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
  errorText?: string;
  animateExpand?: boolean;
  animateDuration?: number;
  // 预设Canvas最大尺寸（根据业务场景配置，建议大于父元素最大可能尺寸）
  presetCanvasWidth?: number;
  presetCanvasHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  crossOrigin: "anonymous",
  errorText: "图片加载失败",
  animateExpand: false,
  animateDuration: 2000,
  presetCanvasWidth: 1920, // 覆盖大部分桌面端宽度
  presetCanvasHeight: 1080 // 覆盖大部分桌面端高度
});

// ========== 3. 响应式数据 ==========
const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);
const imgInstance = ref<HTMLImageElement | null>(null);
let animationFrameId: number | null = null;
let animationStart = 0;
let animationFrom = { w: 0, h: 0 };
let animationTo = { w: 0, h: 0 };

// ========== 4. 动画逻辑（基于固定Canvas尺寸，无需修改） ==========
const startCenterExpandAnimation = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  duration = 2000
) => {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetW = Math.min(Math.round(props.presetCanvasWidth * dpr), img.width);
  const targetH = Math.min(Math.round(props.presetCanvasHeight * dpr), img.height);

  const startW = Math.max(50, Math.round(Math.min(img.width, img.height) * 0.1));
  const targetRatio = targetW / targetH || 1;
  let startH = Math.round(startW / targetRatio);
  if (startH < 1) startH = 1;

  animationFrom = { w: startW, h: startH };
  animationTo = { w: targetW, h: targetH };
  animationStart = performance.now();

  const step = (now: number) => {
    const elapsed = now - animationStart;
    let t = Math.min(1, elapsed / duration);
    t = 1 - Math.pow(1 - t, 3);

    const curW = Math.round(animationFrom.w + (animationTo.w - animationFrom.w) * t);
    const curH = Math.round(animationFrom.h + (animationTo.h - animationFrom.h) * t);

    const sx = Math.round((img.width - curW) / 2);
    const sy = Math.round((img.height - curH) / 2);

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, sx, sy, curW, curH, 0, 0, canvasW, canvasH);

    if (t < 1) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      animationFrameId = null;
    }
  };

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(step);
};

// ========== 5. 核心方法 ==========
const initCanvas = async () => {
  const canvas = canvasRef.value;
  const wrapper = wrapperRef.value;
  if (!canvas || !wrapper) return;

  await nextTick();
  // 1. 设置固定Canvas尺寸（仅初始化一次，不再动态修改）
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const fixedCanvasWidth = props.presetCanvasWidth * dpr;
  const fixedCanvasHeight = props.presetCanvasHeight * dpr;

  canvas.width = fixedCanvasWidth;
  canvas.height = fixedCanvasHeight;

  // 2. 初始化绘制上下文
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 3. 加载图片并绘制
  loadImage();
};

const loadImage = () => {
  const canvas = canvasRef.value;
  if (!canvas || !props.src) return;

  // 销毁旧图片实例
  if (imgInstance.value) {
    imgInstance.value.onload = null;
    imgInstance.value.onerror = null;
  }

  const img = new Image();
  img.crossOrigin = props.crossOrigin;
  img.src = props.src;

  img.onload = () => {
    imgInstance.value = img;
    emit("load", {
      img,
      width: img.width,
      height: img.height
    });

    const ctx = canvas.getContext("2d");
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    if (ctx) {
      if (props.animateExpand) {
        startCenterExpandAnimation(ctx, img, canvasW, canvasH, props.animateDuration);
      } else {
        drawImageCover(ctx, img, canvasW, canvasH);
      }
    }
  };

  img.onerror = () => {
    const errorMsg = `图片加载失败：${props.src}`;
    console.error(errorMsg);
    emit("error", { src: props.src, message: errorMsg });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawErrorText(ctx, canvas.width, canvas.height);
    }
  };
};

const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvasW: number, canvasH: number) => {
  ctx.clearRect(0, 0, canvasW, canvasH);

  const imgW = img.width;
  const imgH = img.height;

  // 中心裁剪覆盖逻辑（基于固定Canvas尺寸）
  if (imgW >= canvasW && imgH >= canvasH) {
    const sWidth = canvasW;
    const sHeight = canvasH;
    const sx = (imgW - sWidth) / 2;
    const sy = (imgH - sHeight) / 2;
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvasW, canvasH);
    return;
  }

  const targetRatio = canvasW / canvasH;
  const imgRatio = imgW / imgH;

  let sx = 0;
  let sy = 0;
  let sWidth = imgW;
  let sHeight = imgH;

  if (imgRatio > targetRatio) {
    sHeight = imgH;
    sWidth = imgH * targetRatio;
    sx = (imgW - sWidth) / 2;
    sy = 0;
  } else if (imgRatio < targetRatio) {
    sWidth = imgW;
    sHeight = imgW / targetRatio;
    sx = 0;
    sy = (imgH - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvasW, canvasH);
};

const drawErrorText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ff4444";
  ctx.font = `${20 * window.devicePixelRatio}px Arial`; // 适配高DPI文字
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(props.errorText, width / 2, height / 2);
};

const handleCanvasError = (e: Event) => {
  console.error("Canvas 渲染错误", e);
  emit("canvas-error", e);
};

// ========== 6. 监听 & 生命周期 ==========
watch(
  () => props.src,
  () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    loadImage();
  }
);

onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  if (imgInstance.value) {
    imgInstance.value.onload = null;
    imgInstance.value.onerror = null;
    imgInstance.value = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 隐藏Canvas超出部分 */
}

.canvas-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 关键：用object-fit实现自适应覆盖，无抖动 */
  object-fit: cover;
  user-select: none;
  -webkit-user-select: none;
  /* 开启GPU加速，让缩放更流畅 */
  transform: translateZ(0);
}
</style>
