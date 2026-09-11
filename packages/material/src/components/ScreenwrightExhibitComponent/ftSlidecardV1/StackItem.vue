<template>
  <div
    class="stack-item"
    :style="style"
    :data-direction="scrollDirection"
    v-if="relativeIndex === 0 && isLoading"
    :class="{ animating }"
    @click.capture="handleClick"
    @touchend.capture="handleTouchEnd"
    :id="galleryId"
  >
    <a
      :style="{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
      :key="imageSrc"
      :href="imageSrc"
      :data-pswp-width="imageDimensions.width"
      :data-pswp-height="imageDimensions.height"
      target="_blank"
      rel="noreferrer"
      @click.prevent
      @touchend.prevent
    >
      <img :src="imageSrc" :alt="imageTitle" :style="imageStyle" @error="handleImageError" />
    </a>
  </div>
  <div class="stack-item" :style="style" :data-direction="scrollDirection" @click="handleClick" v-else>
    <img :src="imageSrc" :alt="imageTitle" :style="imageStyle" @error="handleImageError" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { setMinioUrl } from "@screenwright/composables";

interface Props {
  images: Array<any>;
  item: Record<string, any>;
  index: number;
  maxDisplay: number;
  animating: boolean;
  scrollDirection: string;
  slideWidth: number;
  slideHeight: number;
  isPreviewMode: boolean;
  galleryId: string;
  option: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {
  animating: false,
  scrollDirection: "none",
  slideWidth: 0,
  slideHeight: 0,
  isPreviewMode: false,
  galleryId: ""
});
const emits = defineEmits(["touchend", "click"]);
const isLoading = ref(false);
const imageDimensions = ref({
  width: 0,
  height: 0
});

const imageSrc = computed(() => {
  return setMinioUrl(props.images[props.item.sourceIndex].src);
});

const imageTitle = computed(() => {
  return props.images[props.item.sourceIndex].title;
});

const relativeIndex = computed(() => {
  const activeIndex = Math.floor(props.maxDisplay / 2);
  return props.index - activeIndex;
});

const componentOption = computed(() => {
  return props.option;
});

const style = computed(() => {
  const { width, height } = getImageSize.value;
  const { mainTransform, zTransform, xTransform } = getTransform.value;
  const zIndex = getZIndex.value;
  const opacity = getOpacity.value;

  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `${xTransform} ${mainTransform}  ${zTransform} `,
    zIndex,
    opacity
  };
});

const imageStyle = computed(() => {
  const { activeImageSetting, defaultImageSetting } = componentOption.value;

  const boxShadow = getBoxShadow.value;

  const isActive = relativeIndex.value === 0;

  // 根据状态选择合适的 fitType
  const fitType = isActive ? activeImageSetting.fitType : defaultImageSetting.fitType;

  return {
    boxShadow,
    objectFit: fitType
  };
});

const getImageSize = computed(() => {
  const { activeImageSetting, defaultImageSetting } = props.option;

  const isActive = relativeIndex.value === 0;

  if (isActive && props.isPreviewMode) {
    return {
      width: activeImageSetting.previewWidth,
      height: activeImageSetting.previewHeight
    };
  }

  if (isActive) {
    return {
      width: activeImageSetting.width,
      height: activeImageSetting.height
    };
  }

  return {
    width: defaultImageSetting.width,
    height: defaultImageSetting.height
  };
});

const getTransform = computed(() => {
  const {
    activeImageSetting,
    defaultImageSetting: { width: defaultWidth, height: defaultHeight, gap, rotate, gapZ }
  } = componentOption.value;
  const relativeIndexStatic = relativeIndex.value;

  // 根据状态确定宽高
  let width, height;
  if (relativeIndexStatic === 0) {
    if (props.isPreviewMode) {
      width = activeImageSetting.previewWidth;
      height = activeImageSetting.previewHeight;
    } else {
      width = activeImageSetting.width;
      height = activeImageSetting.height;
    }
  } else {
    width = defaultWidth;
    height = defaultHeight;
  }

  const translateHeight = typeof props.slideHeight === "number" ? props.slideHeight : parseFloat(props.slideHeight);
  const translateX = typeof props.slideWidth === "number" ? props.slideWidth : parseFloat(props.slideWidth);
  const translateY = gap * relativeIndexStatic + translateHeight / 2 - (props.maxDisplay % 2 === 0 ? 0 : height / 2);
  const translateZ = relativeIndexStatic === 0 ? 0 : -gapZ;

  const rotateX = relativeIndexStatic === 0 ? 0 : rotate * Math.sign(relativeIndexStatic);

  const finalTranslateX = translateX / 2 - width / 2;

  // 将变换拆分为两部分
  return {
    // 需要过渡的变换
    mainTransform: `
          translateY(${translateY}px)
          rotateX(${rotateX}deg)
        `,
    // 立即变化的 Z 轴变换
    xTransform: `translateX(${finalTranslateX}px)`,
    zTransform: `translateZ(${translateZ}px)`
  };
});

const getZIndex = computed(() => {
  const relativeIndexStatic = relativeIndex.value;
  return 50 - Math.abs(relativeIndexStatic);
});

const getOpacity = computed(() => {
  const relativeIndexStatic = Math.abs(relativeIndex.value);
  const visibleRange = Math.floor(props.maxDisplay * 0.2); // 计算可见范围（20%）
  const fadeStart = Math.floor(props.maxDisplay / 2) - visibleRange;

  // 当处于中间区域时保持完全不透明
  if (relativeIndexStatic <= fadeStart) {
    return 1;
  }

  // 计算透明度衰减曲线（使用二次曲线实现平滑过渡）
  const progress = (relativeIndexStatic - fadeStart) / visibleRange;
  // 调整透明度范围到[0.3, 1]
  const opacity = 0.3 + 0.7 * (1 - Math.pow(progress, 2));

  // 使用clamp确保值在指定范围内
  return Math.min(Math.max(opacity, 0.3), 1);
});

const getBoxShadow = computed(() => {
  const relativeIndexStatic = relativeIndex.value;
  const { width, height } = getImageSize.value;
  const size = Math.max(width, height);

  if (relativeIndexStatic === 0) {
    // 根据图片尺寸动态计算阴影大小
    const shadowY = Math.round(size * 0.08); // 垂直偏移约为尺寸的 8%
    const shadowBlur = Math.round(size * 0.12); // 模糊半径约为尺寸的 12%
    const shadowSpread = Math.round(size * 0.02); // 扩散半径约为尺寸的 2%
    // 创建上下两个阴影
    return `0 ${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, 0.15),
                0 -${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, 0.15)`;
  }

  // 根据位置决定阴影投射方向
  // 使用当前组件尺寸计算阴影参数
  const nonActiveShadowY = Math.round(size * 0.05); // 非激活状态阴影偏移约为尺寸的 5%
  const nonActiveShadowBlur = Math.round(size * 0.06); // 非激活状态模糊半径约为尺寸的 6%

  if (relativeIndexStatic < 0) {
    // 在元素上方的只投射上方阴影
    return `0 -${nonActiveShadowY}px ${nonActiveShadowBlur}px rgba(0, 0, 0, 0.1)`;
  } else {
    // 在元素下方的保持双向阴影
    return `0 ${nonActiveShadowY}px ${nonActiveShadowBlur}px rgba(0, 0, 0, 0.1),
                0 -${nonActiveShadowY}px ${nonActiveShadowBlur}px rgba(0, 0, 0, 0.1)`;
  }
});

const handleTouchEnd = (e: TouchEvent) => {
  e.stopPropagation();
  emits("touchend", e, true);
};
const handleImageError = (e: Event) => {
  if (e.target instanceof HTMLImageElement) {
    e.target.src = "";
  }
};
const handleClick = () => {
  emits("click", props.item, relativeIndex.value);
};

const getImageDimensions = (src: string) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 返回图片的实际尺寸
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = (error) => {
      // 如果加载失败，使用默认尺寸
      console.warn("[!WARNING] 图片加载失败，使用默认尺寸", src, error);
      resolve({
        width: 1200,
        height: 800
      });
    };
    img.src = src;
  });
};

onMounted(() => {
  getImageDimensions(imageSrc.value).then((dimensions: any) => {
    imageDimensions.value = dimensions;
    isLoading.value = true;
  });
});
</script>
<style scoped>
.stack-item {
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  /* 分解过渡属性 */
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
    height 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;

  contain: strict layout paint;
  backface-visibility: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}

.stack-item img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  image-rendering: crisp-edges;
  transform: translateZ(0);
  backface-visibility: hidden;

  /* 新增高精度渲染设置 */
  -webkit-font-smoothing: subpixel-antialiased;
  shape-rendering: geometricPrecision;
  text-rendering: optimizeLegibility;
}
</style>
