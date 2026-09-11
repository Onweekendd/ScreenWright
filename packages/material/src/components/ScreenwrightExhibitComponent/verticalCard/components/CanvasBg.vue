<template>
  <div ref="containerRef" class="canvas-image-slider-container">
    <!-- Canvas 绘制区域 -->
    <canvas ref="canvasRef" class="canvas-slider" @error="handleCanvasError" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

// ========== TS 类型定义 ==========
interface Props {
  /** 图片列表（必填） */
  imageList: string[];
  /** 图片加载失败提示文字（可选） */
  errorText?: string;
}

/** 预加载的图片类型 */
type PreloadedImage = HTMLImageElement | null;

// ========== Props 定义（仅保留核心） ==========
const props = defineProps<Props>();

// ========== 响应式数据 ==========
/** Canvas 容器 Ref（用于获取父容器实际尺寸） */
const containerRef = ref<HTMLDivElement | null>(null);
/** Canvas 元素 Ref */
const canvasRef = ref<HTMLCanvasElement | null>(null);
/** 当前显示的图片索引 */
const currentIndex = ref(0);
/** 预加载完成的图片数组 */
const preloadedImages = ref<PreloadedImage[]>([]);
/** 是否所有图片加载完成 */
const isAllLoaded = ref(false);
/** 容器尺寸（完全从父容器读取，无默认值） */
const containerSize = ref({
  width: 0,
  height: 0
});
/** 尺寸监听实例（用于清理） */
let resizeObserver: ResizeObserver | null = null;

// ========== 核心方法 ==========
/**
 * 初始化 Canvas 尺寸（完全读取父容器实际尺寸）
 */
const initCanvasSize = () => {
  if (!canvasRef.value || !containerRef.value) return;

  // 仅从父容器读取实际显示尺寸（核心：自适应父容器）
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  // 父容器无尺寸时不处理（避免Canvas尺寸为0）
  if (width === 0 || height === 0) return;

  containerSize.value = { width, height };

  // 同步Canvas绘图缓冲区尺寸（关键：避免拉伸）
  const canvas = canvasRef.value;
  canvas.width = width;
  canvas.height = height;
};

/**
 * 预加载所有图片（核心：避免切换时加载）
 */
const preloadAllImages = (list: string[]) => {
  if (list.length === 0) {
    isAllLoaded.value = true;
    console.warn("图片列表为空");
    return;
  }

  // 重置状态
  preloadedImages.value = [];
  isAllLoaded.value = false;
  currentIndex.value = 0;
  let loadedCount = 0;

  list.forEach((url, index) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // 跨域配置
    img.src = url;

    // 单张加载完成
    img.onload = () => {
      preloadedImages.value[index] = img;
      loadedCount++;
      checkAllLoaded(list.length, loadedCount);
    };

    // 单张加载失败
    img.onerror = () => {
      console.error(`图片加载失败：${url}`);
      preloadedImages.value[index] = null;
      loadedCount++;
      checkAllLoaded(list.length, loadedCount);
    };
  });
};

/**
 * 检查是否所有图片加载完成
 */
const checkAllLoaded = (total: number, loaded: number) => {
  if (loaded === total) {
    isAllLoaded.value = true;
    initCanvasSize(); // 加载完成后初始化尺寸（确保父容器已渲染）
    drawImage(currentIndex.value);
  }
};

/**
 * Canvas 绘制图片（无拉伸，cover 效果）
 */
const drawImage = (index: number) => {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || preloadedImages.value.length === 0) return;

  const { width: containerW, height: containerH } = containerSize.value;
  // 父容器无尺寸时不绘制
  if (containerW === 0 || containerH === 0) return;

  // 清空画布
  ctx.clearRect(0, 0, containerW, containerH);

  const img = preloadedImages.value[index];
  // 图片加载失败处理（使用传入的提示文字或默认值）
  if (!img) {
    const errorText = props.errorText || "图片加载失败";
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, containerW, containerH);
    ctx.fillStyle = "#ff4444";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(errorText, containerW / 2, containerH / 2);
    return;
  }

  // 计算缩放比例（保持宽高比，cover 效果）
  const imgW = img.width;
  const imgH = img.height;
  const scale = Math.max(containerW / imgW, containerH / imgH);
  const scaledW = imgW * scale;
  const scaledH = imgH * scale;
  const offsetX = (containerW - scaledW) / 2;
  const offsetY = (containerH - scaledH) / 2;

  // 绘制图片
  ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, scaledW, scaledH);
};

/**
 * 上一张（循环）
 */
const prevImage = () => {
  if (!isAllLoaded.value || props.imageList.length === 0) return;
  currentIndex.value = (currentIndex.value - 1 + props.imageList.length) % props.imageList.length;
  drawImage(currentIndex.value);
};

/**
 * 下一张（循环）
 */
const nextImage = () => {
  if (!isAllLoaded.value || props.imageList.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % props.imageList.length;
  drawImage(currentIndex.value);
};

/**
 * 跳转到指定索引（暴露给父组件）
 * @param index 目标索引（超出范围则取模）
 */
const goToIndex = (index: number) => {
  if (!isAllLoaded.value || props.imageList.length === 0) return;
  // 处理索引越界
  const validIndex = ((index % props.imageList.length) + props.imageList.length) % props.imageList.length;
  currentIndex.value = validIndex;
  drawImage(currentIndex.value);
};

/**
 * Canvas 错误处理
 */
const handleCanvasError = (e: Event) => {
  console.error("Canvas 渲染错误", e);
};

// ========== 生命周期 & 监听 ==========
onMounted(async () => {
  await nextTick(); // 等待父容器渲染完成，确保能获取到尺寸
  // 预加载图片
  preloadAllImages(props.imageList);

  // 监听父容器尺寸变化（核心：自适应父容器尺寸变化）
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (isAllLoaded.value) {
        initCanvasSize(); // 重新获取父容器尺寸
        drawImage(currentIndex.value); // 重新绘制图片
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  // 清理尺寸监听
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value);
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  // 清空预加载图片（释放内存）
  preloadedImages.value = [];
});

// 监听图片列表变化，重新预加载
watch(
  () => props.imageList,
  (newList) => {
    preloadAllImages(newList);
  },
  { deep: true, immediate: true }
);

// ========== 暴露方法给父组件 ==========
defineExpose({
  prevImage, // 上一张
  nextImage, // 下一张
  goToIndex, // 跳转到指定索引
  getCurrentIndex: () => currentIndex.value // 获取当前索引
});
</script>

<style scoped>
/* 容器完全填满父元素，Canvas 也完全填满容器 */
.canvas-image-slider-container {
  width: 100%;
  height: 100%;
  position: relative; /* 确保Canvas绝对定位生效 */
  overflow: hidden;
}

.canvas-slider {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  will-change: contents; /* GPU 加速，提升绘制性能 */
}
</style>
