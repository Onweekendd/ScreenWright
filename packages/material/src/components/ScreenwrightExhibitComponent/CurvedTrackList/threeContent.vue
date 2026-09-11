<template>
  <canvas ref="canvasRef" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { CurvedTrackRenderer } from "./classes";
// @ts-ignore
import imageFragmentShader from "./shaders/image/fragment.glsl?raw";
// 通过 Vite 的 `?raw` 加载 GLSL 源码字符串
// @ts-ignore
import rawImageVertexShader from "./shaders/image/vertex.glsl?raw";
import type { CarouselConfig, ImageItem } from "./types";

// Trois 中的 vertex.glsl 自己声明了 `attribute vec2 uv;`，
// 但在 Three.js 的 ShaderMaterial 中这个 attribute 已经由引擎注入，
// 会导致 "uv redefinition" 编译错误，这里在运行时移除这一行。
const imageVertexShader: string = (rawImageVertexShader as string).replace(/^\s*attribute\s+vec2\s+uv\s*;\s*/m, "");

// Shader 配置
const shaderConfig = {
  vertexShader: imageVertexShader,
  fragmentShader: imageFragmentShader
};

const canvasRef = ref<HTMLCanvasElement | null>(null);

/**
 * 组件对外暴露的配置项
 * 注意：这里只处理「单条弧形轨道」，并让轨道整体居中在画布中
 */
const props = defineProps<{
  /** 图片列表，每个元素包含 defaultImage 和 activeImage */
  images?: ImageItem[];
  /** 单个图片在世界坐标中的尺寸 [宽, 高] */
  imageSize?: [number, number];
  /** 相邻图片之间的间距（沿轨道方向的距离） */
  gap?: number;
  /**
   * 弧形方向：
   *  1  : 轨道向相机"外凸"（默认）
   * -1 : 轨道向相机"内凹"
   */
  curveDirection?: 1 | -1;
  /** 弧形弧度强度，绝对值越大弯曲越明显 */
  curveStrength?: number;
  /** 弧形频率，控制波动的"周期感" */
  curveFrequency?: number;
  /**
   * 滚轮方向：
   *  1  : 鼠标向下滚动，图片向下移动
   * -1 : 鼠标向下滚动，图片向上移动
   */
  wheelDirection?: 1 | -1;
  /** 滚轮速度系数（影响每次滚动产生的速度大小） */
  wheelFactor?: number;
  /** 是否禁止滚动，为 true 时鼠标滚轮无法滚动图片 */
  disabledScroll?: boolean;
}>();
const emit = defineEmits(["onImageClick"]);
// ==================== Vue 组件逻辑 ====================
let rendererInstance: CurvedTrackRenderer | null = null;

// 创建 Carousel 配置的辅助函数
const createCarouselConfig = (): CarouselConfig => {
  return {
    position: [0, 0, 0],
    imageSize: props.imageSize ?? [1.8, 0.6],
    gap: props.gap ?? 0.1,
    wheelFactor: props.wheelFactor ?? 0.5,
    wheelDirection: props.wheelDirection ?? -1,
    curveFrequency: props.curveFrequency ?? 0.3,
    curveStrength: (props.curveStrength ?? 1.2) * (props.curveDirection ?? 1),
    onImageClick: (imagesItem: any, index: number) => {
      console.log("onImageClick 点击了图片:", { imagesItem, index });

      emit("onImageClick", { ...imagesItem, index: index });
    }
  };
};

onMounted(async () => {
  if (!canvasRef.value) return;

  // 创建渲染器实例
  rendererInstance = new CurvedTrackRenderer(canvasRef.value, shaderConfig, props.disabledScroll ?? false);
  await rendererInstance.init(createCarouselConfig(), props.images);
});

// 监听 images 变化，重新加载图片
watch(
  () => props.images,
  async (newImages) => {
    if (rendererInstance) {
      await rendererInstance.updateImages(newImages);
    }
  },
  { deep: true }
);

// 监听 imageSize 和 gap 变化，更新图片尺寸
watch(
  () => [props.imageSize, props.gap] as const,
  async ([newImageSize, newGap]) => {
    if (rendererInstance && newImageSize && newGap !== undefined) {
      await rendererInstance.updateImageSize(newImageSize, newGap);
    }
  }
);

// 监听其他配置属性变化
watch(
  () => ({
    curveDirection: props.curveDirection,
    curveStrength: props.curveStrength,
    curveFrequency: props.curveFrequency,
    wheelDirection: props.wheelDirection,
    wheelFactor: props.wheelFactor
  }),
  (newConfig) => {
    if (rendererInstance) {
      const carouselConfig: Partial<CarouselConfig> = {};

      if (newConfig.curveStrength !== undefined && newConfig.curveDirection !== undefined) {
        carouselConfig.curveStrength = newConfig.curveStrength * newConfig.curveDirection;
      } else if (newConfig.curveStrength !== undefined) {
        carouselConfig.curveStrength = newConfig.curveStrength * (props.curveDirection ?? 1);
      } else if (newConfig.curveDirection !== undefined) {
        carouselConfig.curveStrength = (props.curveStrength ?? 1.2) * newConfig.curveDirection;
      }

      if (newConfig.curveFrequency !== undefined) {
        carouselConfig.curveFrequency = newConfig.curveFrequency;
      }

      if (newConfig.wheelFactor !== undefined) {
        carouselConfig.wheelFactor = newConfig.wheelFactor;
      }

      if (newConfig.wheelDirection !== undefined) {
        carouselConfig.wheelDirection = newConfig.wheelDirection;
      }

      rendererInstance.updateConfig(carouselConfig);
    }
  },
  { deep: true }
);

// 监听 disabledScroll 变化
watch(
  () => props.disabledScroll,
  (newValue) => {
    if (rendererInstance) {
      rendererInstance.updateDisabledScroll(newValue ?? false);
    }
  }
);

onBeforeUnmount(() => {
  if (rendererInstance) {
    rendererInstance.dispose();
    rendererInstance = null;
  }
});
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
  /* 确保 canvas 可以接收点击事件 */
  pointer-events: auto;
  cursor: pointer;
  /* 去除 iOS/iPad 点击时的蓝色高亮 */
  -webkit-tap-highlight-color: transparent;
  /* 禁止选中与长按菜单 */
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  /* 避免触摸时浏览器的默认动作（例如双击缩放） */
  touch-action: manipulation;
}
</style>
