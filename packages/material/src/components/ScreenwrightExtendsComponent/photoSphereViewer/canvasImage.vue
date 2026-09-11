<template>
  <div class="images-loading flex flex-center fullWidth" style="height: 100%" v-if="loadingImg && isImageLoad">
    <img :src="loadingImg" alt="Loading..." />
  </div>
  <canvas id="myCanvas" ref="canvasRef" v-if="!isImageLoad" />
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useParentElement, useResizeObserver } from "@vueuse/core";

interface Props {
  src: string;
  loadingImg?: string;
}
const props = defineProps<Props>();

// 存储已加载的图片对象和当前Canvas
const loadedImage = ref<HTMLImageElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isImageLoad = ref<boolean>(false);
const parentEl = useParentElement();
let resizeInstance: ReturnType<typeof useResizeObserver> | null = null;

// 加载图片（支持重复调用，会覆盖旧图片）
const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    isImageLoad.value = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImage.value = img;
      isImageLoad.value = false;
      resolve(img);
    };
    img.onerror = (err) => {
      console.error("图片加载失败:", err);
      isImageLoad.value = false;
      reject(err);
    };
    img.src = src;
  });
};

// 绘制图片到Canvas
const drawImage = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制图片（自适应Canvas尺寸）
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

// 初始化或更新图片（统一处理初始加载和src变化）
const initOrUpdateImage = async (src: string) => {
  console.log("初始化或更新图片:", canvasRef.value, parentEl.value);
  if (!canvasRef.value || !parentEl.value) return;

  try {
    const img = await loadImage(src);
    // 更新尺寸并绘制新图片
    canvasRef.value.width = parentEl.value.clientWidth;
    canvasRef.value.height = parentEl.value.clientHeight;
    drawImage(canvasRef.value as HTMLCanvasElement, img as HTMLImageElement);
  } catch (err) {
    console.error("图片更新失败:", err);
  }
};

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value || !parentEl.value) return;
  //   initWorker()
  // 初始化图片加载
  initOrUpdateImage(props.src);

  // 监听父元素尺寸变化（只重绘不重新加载）
  resizeInstance = useResizeObserver(parentEl.value, () => {
    if (!canvasRef.value || !parentEl.value || !loadedImage.value) return;

    console.log("Canvas resized - 仅重绘图片");
    // 更新Canvas尺寸
    canvasRef.value.width = parentEl.value.clientWidth;
    canvasRef.value.height = parentEl.value.clientHeight;
    // 使用当前加载的图片重新绘制
    drawImage(canvasRef.value as HTMLCanvasElement, loadedImage.value as HTMLImageElement);
  });
});

// 监听src变化，自动重新加载图片
watch(
  () => props.src,
  (newSrc, oldSrc) => {
    if (newSrc !== oldSrc) {
      initOrUpdateImage(newSrc);
    }
  }
);

onBeforeUnmount(() => {
  // 停止尺寸监听
  if (resizeInstance) {
    resizeInstance.stop();
  }
  // 清除图片引用（避免内存泄漏）
  loadedImage.value = null;
  canvasRef.value = null;
});
</script>
<style scoped>
#myCanvas {
  width: 100%;
  height: 100%;
  display: block; /* 消除默认inline元素的间距 */
}
</style>
