<template>
  <div class="preview-background" ref="signatureImageBackGroundRef">
    <div class="signature-image-container" ref="signatureImageContainerRef" :style="containerStyle">
      <img
        :src="imageUrl"
        v-show="showImage"
        :style="{ width: (imageWidth ?? 250) + 'px', height: (imageHeight ?? 250) + 'px' }"
        alt="signature"
        class="signature-image"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

/** @description 动画完成事件类型 */
interface AnimationCompleteEvent {
  /** @description 图片URL */
  imageUrl: string;
}

/** @description 组件属性定义 */
interface Props {
  /** @description 图片URL */
  imageUrl?: string;
  /** @description 缩放动画结束高度 */
  zoomOutTargetHeight?: number;
  /** @description 组件ID */
  id?: number;
  /** @description 图片宽度 */
  imageWidth?: number;
  /** @description 图片高度 */
  imageHeight?: number;
  /** @description 缩放比例 */
  scaleRatio?: number;
}

/** @description 组件事件定义 */
interface Emits {
  (e: "signature-animation-complete", event: AnimationCompleteEvent): void;
}

// 定义props和emits
const props = withDefaults(defineProps<Props>(), {
  imageUrl: "",
  zoomOutTargetHeight: 0,
  id: 0,
  imageWidth: 0,
  imageHeight: 0,
  scaleRatio: 0
});

const emit = defineEmits<Emits>();

// 响应式数据 (原data字段转换为ref)
/** @description 样式元素 */
const styleEl = ref<HTMLStyleElement | null>(null);

/** @description 是否显示图片 */
const showImage = ref<boolean>(false);

// 模板引用
const signatureImageBackGroundRef = ref<HTMLDivElement>();
const signatureImageContainerRef = ref<HTMLDivElement>();

// 计算属性
/** @description 容器样式，设置CSS变量 */
const containerStyle = computed(() => {
  return {
    animation: showImage.value ? `animation-${props.id} 5s linear forwards` : "none"
  };
});

// 监听器
watch(
  () => props.imageUrl,
  (newVal) => {
    if (newVal) {
      updateZoomOutKeyframes();

      // 重置显示状态
      showImage.value = true;
    }
  }
);

// 方法定义 (原methods转换为函数)
/**
 * 动画完成事件
 */
const onAnimationComplete = (): void => {
  showImage.value = false;

  emit("signature-animation-complete", { imageUrl: props.imageUrl || "" });
};

/**
 * 更新缩放动画关键帧
 */
const updateZoomOutKeyframes = (): void => {
  if (!styleEl.value) return;

  const parentWidth = signatureImageBackGroundRef.value?.clientWidth || 0;

  const imageWidth = props.imageWidth || 250;

  const translateDistance = parentWidth / 2 + imageWidth;

  const keyframes = `
    @keyframes animation-${props.id} {
      0% {
        opacity: 0;
        transform: translate(-50%, 0) scale(0);
      }

      30% {
        opacity: 100;
        transform: translate(-50%, 0) scale(${props.scaleRatio});
      }

      40% {
        opacity: 100;
        transform: translate(-50%, 0) scale(${props.scaleRatio});
      }

      50% {
        opacity: 100;
        transform: translate(-50%, 0) scale(${1});
      }
      
      100% {
        opacity: 100;
        transform: translate(${-translateDistance}px, 0) scale(${1});
      }
    }
  `;

  styleEl.value.textContent = keyframes;
};

// 生命周期hooks
onMounted(() => {
  // 创建样式元素
  styleEl.value = document.createElement("style");
  styleEl.value.type = "text/css";
  document.head.appendChild(styleEl.value as Node);

  // 初始化keyframes
  updateZoomOutKeyframes();

  nextTick(() => {
    const container = signatureImageContainerRef.value;
    if (container) {
      container.addEventListener("animationend", onAnimationComplete);
    }
  });
});

onBeforeUnmount(() => {
  // 移除事件监听器
  const container = signatureImageContainerRef.value;
  if (container) {
    container.removeEventListener("animationend", onAnimationComplete);
  }

  // 组件销毁时移除样式元素
  if (styleEl.value && styleEl.value.parentNode) {
    styleEl.value.parentNode.removeChild(styleEl.value as Node);
  }
});
</script>

<style lang="scss" scoped>
.preview-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  .signature-image-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;

    .signature-image {
      object-fit: contain;
      border-radius: 4px;
    }
  }
}
</style>
