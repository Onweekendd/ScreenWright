<template>
  <div class="ft-img" :style="getFrostedStyle">
    <div class="imgBox" :style="mergedStyle" ref="imgBoxRef" @click.stop="handleClick">
      <img
        ref="imageRef"
        :src="setMinioUrl(dataChartItem.value)"
        :style="styleImgBoxName"
        preview-teleported
        hide-on-click-modal
        close-on-press-escape
      />
    </div>
    <!--   option.reviewImageWidth 预览图片的缩放大小 -->
    <el-image-viewer
      preview-teleported
      v-if="showPreview"
      @close="closeImageViewer"
      :url-list="[setMinioUrl(dataChartItem.value)]"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { isUndefined } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { useFrostedStyle } from "@screenwright/composables";
import { imgEAnimationType } from "@editor/mediaComponent/ItemComponent/enum";
import type { ComponentType } from "@screenwright/types";

interface CustomizeAnimationFrame {
  name: string;
  keyFrameTime: number;
  keyFrameOpacity: number;
  keyFrameSpeed?: string;
  showKeyFrameRotate: boolean;
  keyFrameRotateX: number;
  keyFrameRotateY: number;
  keyFrameRotateZ: number;
  showKeyFrameScale: boolean;
  keyFrameScaleX: number;
  keyFrameScaleY: number;
  showKeyFrameTranslate: boolean;
  keyFrameTranslateX: number;
  keyFrameTranslateY: number;
}

interface CustomizeKeyframe extends Record<string, string | number | undefined> {
  offset: number;
  opacity: number;
  transform: string;
  easing?: string;
}

const timer = ref<NodeJS.Timeout | null>(null);
const animationDetail = ref<CSSProperties>({});
const dataChartItem = ref<Record<string, any>>({});
const imgBoxRef = ref<HTMLDivElement | null>(null);
const animationDetailStr = ref("");
const imageRef = ref<HTMLImageElement | null>(null);
const showPreview = ref(false);
const customizeAnimationPlayer = ref<Animation | null>(null);
const customizeRunId = ref(0);

const props = defineProps<{ element: ComponentType }>();

const { option, dataChart, isBuild, clickFormatter } = useBaseData(props.element);
const { getFrostedStyle } = useFrostedStyle(props.element);

// 计算属性
const filter = computed(() => {
  const result: string[] = [];
  const filterList = ["contrast", "brightness", "grayscale", "invert", "saturate", "sepia"];
  filterList.forEach((item) => {
    if (option.value[`${item}Show`]) result.push(`${item}(${option.value[item]}%)`);
  });
  if (option.value.gaussianBlurShow) result.push(`blur(${option.value.gaussianBlur}px)`);
  if (option.value.hueShow) result.push(`hue-rotate(${option.value.hue}deg)`);
  if (option.value.shadowShow) {
    result.push(
      `drop-shadow(${option.value.shadowColor} ${option.value.shadowX ? option.value.shadowX + "px" : ""} ${
        option.value.shadowY ? option.value.shadowY + "px" : ""
      } ${option.value.shadowFuzzy ? option.value.shadowFuzzy + "px" : ""} )`
    );
  }
  return result.join(" ");
});

const bgStyle = computed(() => {
  const backgroundImage = props.element.backgroundImage;
  const backgroundImageUrl = setMinioUrl(backgroundImage);
  // 为背景添加默认值，避免初始化时的空白
  const defaultBg = "transparent";
  return {
    background:
      option.value.backgroundType === "color"
        ? option.value.backgroundColor || defaultBg
        : backgroundImage
          ? `url(${backgroundImageUrl}) 50% 50% / ${option.value.backgroundImageType || "contain"} no-repeat`
          : defaultBg
  };
});

const mergedStyle = computed(
  (): CSSProperties => ({
    ...bgStyle.value,
    ...animationDetail.value,
    // 确保容器有最小的透明度，避免完全空白
    minHeight: "100%",
    minWidth: "100%"
  })
);

const styleImgBoxName = computed<CSSProperties>(() => {
  const opacity = option.value.opacity;
  const rotateX = option.value.rotateX;
  const rotateY = option.value.rotateY;
  const rotateZ = option.value.rotateZ;
  const scale = isUndefined(option.value.scale) ? 1 : option.value.scale;
  return {
    mixBlendMode: option.value.mixBlendMode || "normal",
    opacity: opacity,
    position: "absolute",
    top: 0,
    left: 0,
    transform: `${
      option.value.rotateShow ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)` : ""
    } scale(${scale})`,
    filter: filter.value,
    transition: "opacity 0.3s ease-in-out" // 添加平滑过渡效果
  };
});

const resolveAnimationSpeed = (speed: string, speedNum: number) => {
  switch (speed) {
    case "constant":
      return "linear";
    case "slow-fast-slow":
      return `cubic-bezier(0.${25 + speedNum},0.1,0.${25 - speedNum},1)`;
    case "start-slow":
      return `cubic-bezier(0.${42 + speedNum},0,1,1)`;
    case "end-slow":
      return `cubic-bezier(0,0,0.${58 - speedNum},1)`;
    default:
      return "linear";
  }
};

const ensureImageVisible = () => {
  if (imgBoxRef.value && imgBoxRef.value.style.display === "none") {
    imgBoxRef.value.style.display = "";
  }
};

const startAnimate = () => {
  console.log(option.value.animationDelayed, "option.value.animationDelayed");
  ensureImageVisible();
  timer.value = setTimeout(() => {
    animationDetail.value = {
      animation: animationDetailStr.value,
      WebkitAnimation: animationDetailStr.value
    };
    console.log("开始动画", animationDetailStr.value);
  }, option.value.animationDelayed * 1000);
};

const endAnimate = () => {
  // 只在有动画的情况下清空动画样式
  if (option.value.animationShow) {
    animationDetail.value = {};
  }
  if (!option.value.animationLoop) {
    if (option.value.animationendHidden && !isBuild.value && imgBoxRef.value) {
      imgBoxRef.value.style.display = "none";
    }
  } else {
    if (timer.value) clearTimeout(timer.value);
    timer.value = setTimeout(() => {
      startAnimate();
    }, option.value.animationInterval * 1000);
  }
};

const updateChart = () => {
  // 避免在初始化时立即清空样式
  if (!option.value.animationShow) {
    ensureImageVisible();
    animationDetail.value = {};
    animationDetailStr.value = "";
    if (timer.value) clearTimeout(timer.value);
    clearCustomizeAnimation();
  }

  if (option.value.animationShow) {
    ensureImageVisible();
    // 只在有动画时才清空之前的动画样式
    animationDetail.value = {};

    const k = option.value.animationSpeedNum;
    const animationSpeed = resolveAnimationSpeed(option.value.animationSpeed, k);

    if (option.value.animationType !== imgEAnimationType.Customize) {
      clearCustomizeAnimation();
      if (timer.value) clearTimeout(timer.value);
      if (option.value.animationLoop) {
        animationDetailStr.value = `${option.value.animationType} ${option.value.animationTime}s ${animationSpeed} 0s`;
      } else {
        const isHide = !option.value.animationLoop && option.value.animationendHidden && !isBuild.value;
        const type = option.value.animationType;
        animationDetailStr.value = `${type === "opacity" && isHide ? "opacity1To0" : type} ${
          option.value.animationTime
        }s ${animationSpeed} 0s 1`;
      }

      startAnimate();
    } else {
      setCustomizeAnimation(animationSpeed, k);
    }
  }
};
// 自定义动画
const clearCustomizeAnimation = () => {
  if (customizeAnimationPlayer.value) {
    customizeAnimationPlayer.value.cancel();
    customizeAnimationPlayer.value = null;
  }
  customizeRunId.value += 1;
};
// 转换数据
const normalizeOpacity = (value: number) => {
  if (Number.isNaN(value)) return 1;
  if (value > 1) return Math.min(Math.max(value / 100, 0), 1);
  return Math.min(Math.max(value, 0), 1);
};

const normalizeCustomizeFrames = (): CustomizeAnimationFrame[] => {
  const list: unknown[] = Array.isArray(option.value.customizeArray) ? option.value.customizeArray : [];
  return list
    .filter((item: unknown): item is CustomizeAnimationFrame => Boolean(item && typeof item === "object"))
    .map((item: CustomizeAnimationFrame) => ({
      ...item,
      keyFrameTime: Math.min(Math.max(Number(item.keyFrameTime) || 0, 0), 100),
      keyFrameOpacity: normalizeOpacity(Number(item.keyFrameOpacity)),
      keyFrameScaleX: Number(item.keyFrameScaleX) || 100,
      keyFrameScaleY: Number(item.keyFrameScaleY) || 100,
      keyFrameRotateX: Number(item.keyFrameRotateX) || 0,
      keyFrameRotateY: Number(item.keyFrameRotateY) || 0,
      keyFrameRotateZ: Number(item.keyFrameRotateZ) || 0,
      keyFrameTranslateX: Number(item.keyFrameTranslateX) || 0,
      keyFrameTranslateY: Number(item.keyFrameTranslateY) || 0
    }))
    .sort((a: CustomizeAnimationFrame, b: CustomizeAnimationFrame) => a.keyFrameTime - b.keyFrameTime);
};

const buildCustomizeTransform = (frame: CustomizeAnimationFrame) => {
  const transforms: string[] = [];
  if (frame.showKeyFrameTranslate) {
    transforms.push(`translate(${frame.keyFrameTranslateX || 0}px, ${frame.keyFrameTranslateY || 0}px)`);
  }
  if (frame.showKeyFrameRotate) {
    transforms.push(
      `rotateX(${frame.keyFrameRotateX || 0}deg) rotateY(${frame.keyFrameRotateY || 0}deg) rotateZ(${frame.keyFrameRotateZ || 0}deg)`
    );
  }
  if (frame.showKeyFrameScale) {
    const scaleX = (frame.keyFrameScaleX ?? 100) / 100;
    const scaleY = (frame.keyFrameScaleY ?? 100) / 100;
    transforms.push(`scale(${scaleX}, ${scaleY})`);
  }
  return transforms.length > 0 ? transforms.join(" ") : "none";
};

const buildCustomizeKeyframes = (frames: CustomizeAnimationFrame[], speedNum: number): CustomizeKeyframe[] => {
  return frames.map((frame) => {
    const keyframe: CustomizeKeyframe = {
      offset: frame.keyFrameTime / 100,
      opacity: frame.keyFrameOpacity,
      transform: buildCustomizeTransform(frame)
    };
    if (frame.keyFrameSpeed) {
      keyframe.easing = resolveAnimationSpeed(frame.keyFrameSpeed, speedNum);
    }
    return keyframe;
  });
};

const setCustomizeAnimation = (animationSpeed: string, speedNum: number) => {
  const frames = normalizeCustomizeFrames();
  ensureImageVisible();
  clearCustomizeAnimation();
  if (!frames.length) {
    animationDetailStr.value = "";
    animationDetail.value = {};
    return;
  }
  if (!imageRef.value) return;
  const keyframes = buildCustomizeKeyframes(frames, speedNum);
  const duration = Math.max((option.value.animationTime || 0) * 1000, 1);
  const currentRunId = customizeRunId.value;

  const scheduleCustomizePlay = () => {
    if (currentRunId !== customizeRunId.value || !imageRef.value) return;
    customizeAnimationPlayer.value = imageRef.value.animate(keyframes, {
      duration,
      easing: animationSpeed,
      fill: "forwards",
      iterations: 1
    });

    customizeAnimationPlayer.value.onfinish = () => {
      if (currentRunId !== customizeRunId.value) return;
      customizeAnimationPlayer.value = null;
      if (!option.value.animationLoop) {
        if (option.value.animationendHidden && !isBuild.value && imgBoxRef.value) {
          imgBoxRef.value.style.display = "none";
        }
        return;
      }
      if (timer.value) clearTimeout(timer.value);
      timer.value = setTimeout(() => {
        timer.value = setTimeout(scheduleCustomizePlay, option.value.animationDelayed * 1000);
      }, option.value.animationInterval * 1000);
    };
  };

  if (timer.value) clearTimeout(timer.value);
  timer.value = setTimeout(scheduleCustomizePlay, option.value.animationDelayed * 1000);
};

const handleClick = () => {
  const pointerEvents = option.value.pointerEvents;
  const openReview = option.value.openReview;
  if (pointerEvents && openReview) {
    showPreview.value = true;
  }
  if (clickFormatter) {
    clickFormatter({
      data: dataChartItem.value
    });
  }
};

const closeImageViewer = () => {
  showPreview.value = false;
};

// 监听器
watch(
  () => dataChart.value,
  (nv, ov) => {
    const nextItem = Array.isArray(nv) ? (nv.length ? nv[0] : nv) : nv;
    const prevItem = Array.isArray(ov) ? (ov && ov.length ? ov[0] : ov) : ov;

    if (
      nextItem &&
      prevItem &&
      typeof nextItem === "object" &&
      typeof prevItem === "object" &&
      "value" in nextItem &&
      "value" in prevItem &&
      (nextItem as any).value === (prevItem as any).value
    ) {
      return;
    }

    dataChartItem.value = nextItem as any;
  },
  {
    immediate: true
  }
);

// 优化watch deep的问题
const animationWatchSignature = computed(() => {
  const customizeArray = Array.isArray(option.value.customizeArray) ? option.value.customizeArray : [];
  return JSON.stringify({
    animationShow: option.value.animationShow,
    animationLoop: option.value.animationLoop,
    animationendHidden: option.value.animationendHidden,
    animationSpeed: option.value.animationSpeed,
    animationSpeedNum: option.value.animationSpeedNum,
    animationTime: option.value.animationTime,
    animationDelayed: option.value.animationDelayed,
    animationInterval: option.value.animationInterval,
    animationType: option.value.animationType,
    customizeArray
  });
});

watch(
  () => animationWatchSignature.value,
  () => {
    updateChart();
  }
);

// 生命周期钩子
onMounted(async () => {
  // 使用 nextTick 确保DOM完全挂载后再初始化
  await nextTick();
  if (imgBoxRef.value) {
    imgBoxRef.value.addEventListener("animationend", endAnimate);
  }
  updateChart();
});

onBeforeUnmount(() => {
  if (timer.value) clearTimeout(timer.value);
  clearCustomizeAnimation();
  if (imgBoxRef.value) imgBoxRef.value.removeEventListener("animationend", endAnimate);
});
</script>
<style>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes opacity1To0 {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes opacity {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes clockwise {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes counterclockwise {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

@keyframes zoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes backAndForth {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@keyframes upOrDown {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(20%);
  }
  100% {
    transform: translateY(0);
  }
}
</style>

<style lang="scss" scoped>
.ft-img {
  width: 100%;
  height: 100%;

  .imgBox {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
    // cursor: pointer;
    position: relative;

    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
