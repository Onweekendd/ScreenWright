<template>
  <div class="stack" v-on="touchSupported ? touchEventHandlers : clickEventHandlers">
    <transition-group
      name="stack-transition"
      tag="div"
      class="stack-group"
      :style="{ perspective: `${perspectiveDistance}px` }"
    >
      <stack-item
        v-for="(item, index) in displayImages"
        :key="item.uniqueId"
        :item="item"
        :index="index"
        :max-display="actualMaxDisplay"
        :animating="isAnimating"
        :scroll-direction="scrollDirection"
        :images="images"
        :slide-width="slideWidth"
        :slide-height="slideHeight"
        :option="option"
        :is-preview-mode="isPreviewMode"
        :gallery-id="galleryId"
        @click="handleStackItemClick"
        @touchend="handleTouchEnd"
      />
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated } from "vue";
import { onMounted, ref } from "vue";
import { watch } from "vue";
import { onBeforeUnmount } from "vue";

// @ts-ignore
import PhotoSwipeLightbox from "photoswipe/lightbox";

import { smoothTransitionUtils } from "../utils/index";
import StackItem from "./StackItem.vue";

import "photoswipe/dist/photoswipe.css";

interface Props {
  images: Array<any>;
  option: Record<string, any>;
  id: string;
  width: number;
  height: number;
}
const props = defineProps<Props>();
// 变量
const autoPlayTimer = ref<ReturnType<typeof setInterval> | null>(null);
const previewTimer = ref<ReturnType<typeof setInterval> | null>(null);
const isAnimating = ref(false);
const scrollDirection = ref("none");
const touchSupported = ref(false);
const touchStartTime = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);
const isTouchMove = ref(false);
const touchMoveY = ref(0);
const targetIndex = ref(0);
const activeIndex = ref(0);
const isTransitioning = ref(false);
const isPreviewMode = ref(false);
const isPageVisible = ref(true);
let lightboxInstance: any = null;
const galleryId = ref(`pswp-gallery-${props.id}`);

const emits = defineEmits(["click"]);
// 计算属性
const slideWidth = computed(() => {
  return Number(props.width);
});

const slideHeight = computed(() => {
  return Number(props.height);
});

const actualMaxDisplay = computed(() => {
  return Math.min(props.images.length, props.option.maxDisplay);
});

const perspectiveDistance = computed(() => {
  return props.option.perspectiveDistance;
});

const normalizedImages = computed(() => {
  const length = props.images.length;
  const requiredLength = Math.ceil(actualMaxDisplay.value * 2);
  const baseImages = props.images.map((img, index) => ({
    ...img,
    virtualId: `${img.src}-${index}`,
    sourceIndex: index
  }));
  if (length >= requiredLength) {
    return baseImages;
  }
  const copyTimes = Math.ceil(requiredLength / length);
  const result = [];
  for (let i = 0; i < copyTimes; i++) {
    const copiedImages = baseImages.map((img, index) => ({
      ...img,
      virtualId: i === 0 ? img.virtualId : `${img.src}-copy-${i}-${index}`,
      sourceIndex: index
    }));
    result.push(...copiedImages);
  }

  return result;
});

const displayImages = computed(() => {
  const totalImageCount = normalizedImages.value.length;
  if (!totalImageCount) return [];

  const maxAllowedDisplay = actualMaxDisplay.value;
  const baseIndex = isTransitioning.value ? activeIndex.value : targetIndex.value;

  if (isNaN(baseIndex)) {
    console.warn("baseIndex is NaN, resetting to 0");
    return [];
  }

  const startIndex = baseIndex - Math.floor(maxAllowedDisplay / 2);
  return Array.from({ length: maxAllowedDisplay }, (_, i) => {
    const index = (((startIndex + i) % totalImageCount) + totalImageCount) % totalImageCount;
    return {
      uniqueId: normalizedImages.value[index].virtualId,
      normalizedIndex: index,
      sourceIndex: normalizedImages.value[index].sourceIndex
    };
  });
});

const touchEventHandlers = computed(() => {
  return {
    touchstart: handleTouchStart,
    touchmove: handleTouchMove,
    touchend: handleTouchEnd
  };
});

const clickEventHandlers = computed(() => {
  return {};
});
// 方法
const clearPreviewTimer = () => {
  if (previewTimer.value) {
    clearTimeout(previewTimer.value);
    previewTimer.value = null;
  }
};

const startPreviewTimer = () => {
  clearPreviewTimer();
  const duration = props.option.activeImageSetting.previewDuration;

  // 如果设置了有效的预览时间（大于0），则启动定时器
  if (duration > 0) {
    previewTimer.value = setTimeout(() => {
      isPreviewMode.value = false;
      if (props.option.autoPlay) {
        startAutoPlay();
      }
    }, duration);
  }
};

const smoothTransition = (start: number, end: number) => {
  if (isNaN(start) || isNaN(end)) {
    console.warn("Invalid parameters in smoothTransition", { start, end });
    return;
  }

  smoothTransitionUtils({
    start,
    end,
    totalCount: normalizedImages.value.length,
    onProgress: (current) => {
      if (isNaN(current)) {
        console.warn("current is NaN in onProgress");
        return;
      }
      activeIndex.value = current;
    },
    onComplete: () => {
      isAnimating.value = false;
      isTransitioning.value = false;
      scrollDirection.value = "none";
      if (props.option.autoPlay) {
        startAutoPlay();
      }
    }
  });
};

const startAutoPlay = () => {
  // 检查是否有可用的图片资源
  if (!normalizedImages.value.length) {
    console.warn("No images available for auto play");
    return;
  }

  // 检查页面可见性和其他条件
  if (!isPageVisible.value || isPreviewMode.value) {
    return;
  }

  pauseAutoPlay();
  autoPlayTimer.value = setInterval(() => {
    // 在定时器回调中再次检查所有条件
    if (!normalizedImages.value.length || !isPageVisible.value || isPreviewMode.value) {
      console.warn("Conditions changed during auto play, stopping");
      pauseAutoPlay();
      return;
    }

    if (!isAnimating.value) {
      scrollDirection.value = props.option.autoPlayDirection;
      let nextIndex = 0;

      if (scrollDirection.value === "up") {
        nextIndex = (activeIndex.value + 1) % normalizedImages.value.length;
      } else if (scrollDirection.value === "down") {
        nextIndex = (activeIndex.value - 1 + normalizedImages.value.length) % normalizedImages.value.length;
      }

      switchToImage(nextIndex);
    }
  }, props.option.autoPlayInterval);
};

const switchToImage = (originIndex: number) => {
  if (isAnimating.value || isTransitioning.value) return;

  if (isNaN(originIndex)) {
    console.warn("originIndex is NaN in switchToImage");
    return;
  }

  const currentIndex = targetIndex.value;
  const totalImageCount = normalizedImages.value.length;

  if (totalImageCount === 0) {
    console.warn("No images available");
    return;
  }

  const normalizedIndex = ((originIndex % totalImageCount) + totalImageCount) % totalImageCount;

  if (isNaN(normalizedIndex)) {
    console.warn("normalizedIndex calculation resulted in NaN");
    return;
  }

  targetIndex.value = normalizedIndex;
  isAnimating.value = true;
  scrollDirection.value = originIndex > currentIndex ? "up" : "down";

  const distance = Math.abs(normalizedIndex - currentIndex);

  if (distance > 1) {
    isTransitioning.value = true;
    smoothTransition(currentIndex, normalizedIndex);
  } else {
    activeIndex.value = normalizedIndex;
    setTimeout(() => {
      isAnimating.value = false;
      scrollDirection.value = "none";
      if (props.option.autoPlay) {
        startAutoPlay();
      }
    }, 300);
  }
};

const openPhotoSwipe = () => {
  lightboxInstance.value = new PhotoSwipeLightbox({
    gallery: `#${galleryId.value}`,
    children: "a",
    pswpModule: () => import("photoswipe"),
    initialZoomLevel: "fit",
    secondaryZoomLevel: 2,
    maxZoomLevel: 4
  });

  if (lightboxInstance.value) {
    lightboxInstance.value.on("close", () => {
      if (props.option.autoPlay) {
        startAutoPlay();
      }
    });

    lightboxInstance.value.init();

    lightboxInstance.value.loadAndOpen(0);
  }
};

const pauseAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
};

const handleStackItemClick = (item: any, relativeIndex: number) => {
  const { normalizedIndex, sourceIndex } = item;

  // [!WARNING] 当 sourceIndex 为 0 时，启动 PhotoSwipe 预览模式
  if (relativeIndex === 0) {
    openPhotoSwipe();
    return;
  }

  if (isPreviewMode.value) {
    if (normalizedIndex === targetIndex.value) {
      isPreviewMode.value = false;
      clearPreviewTimer();
      if (props.option.autoPlay) {
        startAutoPlay();
      }
    }
    return;
  }
  if (normalizedIndex === targetIndex.value) {
    isPreviewMode.value = true;
    pauseAutoPlay();
    startPreviewTimer();
    return;
  }
  if (isAnimating.value || isTransitioning.value) {
    return;
  }
  pauseAutoPlay();
  const currentIndex = targetIndex.value;
  //   const targetIndex = normalizedIndex
  const distance = Math.abs(targetIndex.value - currentIndex);

  targetIndex.value = normalizedIndex;
  isAnimating.value = true;
  scrollDirection.value = targetIndex.value > currentIndex ? "up" : "down";

  if (distance > 1) {
    isTransitioning.value = true;
    smoothTransition(currentIndex, targetIndex.value);
  } else {
    activeIndex.value = targetIndex.value;
    setTimeout(() => {
      isAnimating.value = false;
      scrollDirection.value = "none";
      if (props.option.autoPlay) {
        startAutoPlay();
      }
    }, 300);
  }

  /** @type {Image & {index : number}} */
  const targetImage = {
    src: props.images[sourceIndex].src,
    title: props.images[sourceIndex].title,
    index: sourceIndex
  };

  emits("click", targetImage);
};

const resetTouchState = () => {
  touchStartTime.value = 0;
  touchStartX.value = 0;
  touchStartY.value = 0;
  touchMoveY.value = 0;
  isTouchMove.value = false;
};

const handleTouchStart = (e: TouchEvent) => {
  if (isPreviewMode.value) return;
  e.preventDefault();
  touchStartTime.value = Date.now();
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
  isTouchMove.value = false;
  touchMoveY.value = touchStartY.value;

  pauseAutoPlay();
};

const handleTouchMove = (e: TouchEvent) => {
  if (isPreviewMode.value) return;
  e.preventDefault();
  const moveX = e.touches[0].clientX - touchStartX.value;
  const moveY = e.touches[0].clientY - touchStartY.value;

  if (Math.abs(moveX) > 10 || Math.abs(moveY) > 10) {
    isTouchMove.value = true;
  }

  touchMoveY.value = e.touches[0].clientY;
};

const handleTouchEnd = (e: TouchEvent, isGalleryPreview = false) => {
  if (isPreviewMode.value) return;
  if (isGalleryPreview) {
    openPhotoSwipe();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  const touchEndTime = Date.now();
  const touchDuration = touchEndTime - touchStartTime.value;

  if (!isTouchMove.value && touchDuration < 300) {
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const stackItem = element.closest(".stack-item");
      if (stackItem && stackItem.parentNode) {
        const index = Array.from(stackItem.parentNode.children).indexOf(stackItem);
        const item = displayImages.value[index];
        if (item) {
          // 计算相对索引，与 StackItem 组件保持一致
          const activeIndex = Math.floor(actualMaxDisplay.value / 2);
          const relativeIndex = index - activeIndex;

          if (relativeIndex === 0) {
            openPhotoSwipe();
            e.stopPropagation();
            return;
          }
          // 使用正确的参数调用 handleStackItemClick
          handleStackItemClick(item, relativeIndex);
        }
      }
    }
    return;
  }

  const diff = touchStartY.value - touchMoveY.value;
  if (Math.abs(diff) > 50) {
    const isForward = diff > 0;
    const totalImageCount = normalizedImages.value.length;
    const nextIndex = isForward
      ? (targetIndex.value + 1) % totalImageCount
      : (targetIndex.value - 1 + totalImageCount) % totalImageCount;

    if (nextIndex !== targetIndex.value) {
      scrollDirection.value = isForward ? "up" : "down";
      switchToImage(nextIndex);
    }
  } else {
    if (props.option.autoPlay && !isAnimating.value && !isTransitioning.value) {
      startAutoPlay();
    }
  }

  resetTouchState();
};

/**
 * 处理自动播放恢复
 */
const handleAutoPlayResume = () => {
  // 重置状态
  isAnimating.value = false;
  isTransitioning.value = false;
  scrollDirection.value = "none";

  // 检查是否应该恢复自动播放
  if (props.option.autoPlay && !isPreviewMode.value && isPageVisible.value) {
    startAutoPlay();
  }
};
watch(
  () => props.option.autoPlay,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;
    if (newVal) {
      // 确保有图片资源时才开启自动播放
      if (normalizedImages.value.length) {
        startAutoPlay();
      } else {
        console.warn("Cannot start auto play: no images available");
      }
    } else {
      pauseAutoPlay();
    }
  },
  { immediate: true }
);
watch(
  () => props.images,
  (newImages) => {
    if (!newImages.length && autoPlayTimer.value) {
      // 当图片变为空数组时，停止自动播放
      console.warn("Images became empty, stopping auto play");
      pauseAutoPlay();
      // 重置相关状态
      activeIndex.value = 0;
      targetIndex.value = 0;
      isAnimating.value = false;
      isTransitioning.value = false;
      scrollDirection.value = "none";
    } else if (newImages.length && props.option.autoPlay && !autoPlayTimer.value) {
      // 当图片从空变为有值，且 autoPlay 为 true 时，重新开始自动播放
      startAutoPlay();
    }
  },
  { immediate: true }
);
const handleVisibilityChange = () => {
  if (document.hidden) {
    isPageVisible.value = false;
    pauseAutoPlay();
  } else {
    isPageVisible.value = true;
    handleAutoPlayResume();
  }
};

onActivated(() => {
  handleAutoPlayResume();
});
onBeforeUnmount(() => {
  pauseAutoPlay();
  clearPreviewTimer();
  // 移除页面可见性监听
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   offEvent(`onSlidecardPageChange-${this.id}`)

  // 清理 PhotoSwipe 资源
  if (lightboxInstance) {
    lightboxInstance.destroy();
    lightboxInstance = null;
  }
});
onMounted(() => {
  touchSupported.value = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  document.addEventListener("visibilitychange", handleVisibilityChange);
});
defineExpose({
  handlePrevClick: () => {
    switchToImage((activeIndex.value - 1 + normalizedImages.value.length) % normalizedImages.value.length);
  },
  handleNextClick: () => {
    switchToImage((activeIndex.value + 1) % normalizedImages.value.length);
  }
});
</script>
<style scoped>
.stack {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.stack-group {
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.stack-transition-enter-active,
.stack-transition-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.stack-transition-enter,
.stack-transition-leave-to {
  opacity: 0;
}
</style>
