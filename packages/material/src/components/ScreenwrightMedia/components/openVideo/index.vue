<template>
  <div v-if="visibility" class="ft-open-video">
    <img v-if="showPreview && !isAutoPlay" class="previewImg" :src="setMinioUrl(previewUrl)" alt="" />
    <video
      v-else
      ref="compVideo"
      :controls="option.controler"
      :autoplay="isAutoPlay"
      :loop="option.loopPlay"
      :muted="option.muted"
      :style="videoStyle"
      :poster="setMinioUrl(dataChartItem.cover || option.cover)"
      :src="setMinioUrl(dataChartItem.value || option.url)"
      @ended="handleEnded"
      crossorigin="anonymous"
    />
    <div class="video-tips" ref="videoTips" />
    <div
      v-if="showButton"
      class="video-btn flex flex-center fading-ease-in"
      :style="buttonStyle"
      @click.stop="gotoSystem"
    >
      <span v-if="option.buttonType === 'icon'" :style="buttonIconStyle" />
      <span v-else :style="buttonTextStyle">
        {{ option.buttonContent }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { isArray } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { getVideoBase64, isSupportedFlv, isSupportedHls } from "../../utils";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

interface VideoState {
  value?: string;
  cover?: string;
  url?: string;
}

interface TextShadow {
  color: string;
  x: number;
  y: number;
  blur: number;
}
defineOptions({
  name: "ftOpenVideo"
});
const props = defineProps<{ element: ComponentType }>();
const { option, dataChart, isBuild, handleEventAndCallbackEvent } = useBaseData(props.element);

// refs
const compVideo = ref<HTMLVideoElement | null>(null);
const videoTips = ref<HTMLDivElement | null>(null);

// state
const previewUrl = ref("");
const showPreview = ref(false);
const visibility = ref(true);
const showButton = ref(false);
const dataChartItem = ref<VideoState>({});
const delayPlayStatus = ref(false);
const isHidenAnimate = ref(false);
const delayTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const hideTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const btnHideTime = ref<NodeJS.Timeout | null>(null);
const videoFunSet = ref<Record<string, any>>({});

// const pointerEventsStyle = computed(() => (visibility.value ? "visible" : "none"))

const videoStyle = computed(
  (): CSSProperties => ({
    objectFit: "fill",
    mixBlendMode: option.value.mixBlendMode || "normal",
    filter: filter.value,
    transform: option.value.rotateShow
      ? `rotateX(${option.value.rotateX}deg) rotateY(${option.value.rotateY}deg) rotateZ(${option.value.rotateZ}deg)`
      : ""
  })
);

const isAutoPlay = computed((): boolean => {
  if (!option.value.autoPlay && delayPlayStatus.value) return true;
  if (!option.value.autoPlay) return false;
  if (isBuild.value) return option.value.isBuildPlay;
  return true;
});

const filter = computed((): string => {
  const result: string[] = [];
  const filterProps = ["contrast", "brightness", "grayscale", "invert", "saturate", "sepia"];

  filterProps.forEach((item) => {
    if (option.value[`${item}Show`]) {
      result.push(`${item}(${option.value[item]}%)`);
    }
  });

  if (option.value.gaussianBlurShow) {
    result.push(`blur(${option.value.gaussianBlur}px)`);
  }
  if (option.value.hueShow) {
    result.push(`hue-rotate(${option.value.hue}deg)`);
  }
  if (option.value.shadowShow) {
    result.push(
      `drop-shadow(${option.value.shadowColor} ${option.value.shadowX}px ${option.value.shadowY}px ${option.value.shadowFuzzy}px)`
    );
  }
  return result.join(" ");
});

const buttonIconStyle = computed(
  (): CSSProperties => ({
    width: `${option.value.buttonIconWidth || 104}px`,
    height: `${option.value.buttonIconHeight || 20}px`,
    background: `url(${setMinioUrl(option.value.buttonIcon)}) 50% 50% / ${option.value.buttonIconType} no-repeat`
  })
);

const buttonTextStyle = computed((): CSSProperties => {
  const textShadow = option.value.buttonTextShadow as TextShadow;
  return {
    color: option.value.buttonFontColor,
    fontSize: `${option.value.buttonFontSize || 12}px`,
    letterSpacing: `${option.value.buttonLetterSpacing || 0}px`,
    fontWeight: option.value.buttonFontWeight,
    fontFamily: option.value.buttonFontFamily,
    fontStyle: option.value.buttonFontStyle,
    textShadow: option.value.isButtonTextShadow
      ? `${textShadow.color} ${textShadow.x || 0}px ${textShadow.y || 0}px ${textShadow.blur}px`
      : "none",
    transform: `translate(${option.value.buttonTextTranslateX || 0}px, ${option.value.buttonTextTranslateY || 0}px)`
  };
});

const buttonStyle = computed(
  (): CSSProperties => ({
    width: `${option.value.buttonWidth || 140}px`,
    height: `${option.value.buttonHeight || 40}px`,
    lineHeight: `${option.value.buttonHeight || 40}px`,
    background: `url(${setMinioUrl(option.value.buttonImage)}) 50% 50% / ${option.value.buttonImageType} no-repeat`,
    transform: `translate(calc(-50% + ${option.value.buttonTranslateX || 0}px), ${
      option.value.buttonTranslateY || 0
    }px)`
  })
);

// methods
const setHide = () => {
  if (hideTimeout.value) clearTimeout(hideTimeout.value);
  isHidenAnimate.value = true;
  hideTimeout.value = setTimeout(() => {
    visibility.value = false;
    const hasMask = document.querySelector("#screenwright-loading-mask");
    if (hasMask) {
      // this.main.$refs.container.showLoadingMask(true, hasMask.dataset.progress > 0 ? hasMask.dataset.progress : 1, 9999)
    }
  }, 1000);
};

// TODO: 播放时发出事件，开始延迟加载
// const onVideoPlay = () => {}

const handleEnded = () => {
  console.log("Video ended");

  try {
    if (option.value.autoHidden) {
      setHide();
    }
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.Ended,
      events: props.element.events,

      throwValue: props.element
    });
  } catch (error) {
    console.log(error, "r");
  }
};

const gotoSystem = () => {
  setHide();
};

const handlePreviewUrl = async () => {
  if (!option.value.url) return;
  try {
    const videoUrl = await getVideoBase64(setMinioUrl(dataChartItem.value.value || option.value.url), "png");
    previewUrl.value = videoUrl as string;
  } catch (error) {
    console.error("Failed to get video preview:", error);
  }
};

const handleDelayPlay = () => {
  if (delayTimer.value) {
    clearTimeout(delayTimer.value);
  }
  delayTimer.value = setTimeout(() => {
    delayPlayStatus.value = true;
    if (compVideo.value) {
      compVideo.value.play();
    }
  }, option.value.delayPlayTime * 1000);
};

const handleVideoEnded = () => {
  if (!compVideo.value) return;

  compVideo.value.addEventListener("loadedmetadata", () => {
    console.log("Video metadata loaded");
    if (!option.value.autoPlay && option.value.delayPlayTime > 0) {
      return;
    }
    if (option.value.autoHidden && compVideo.value?.duration) {
      setTimeout(
        () => {
          if (!option.value.loopPlay) {
            setHide();
          }
        },
        (compVideo.value.duration - 1) * 1000
      );
    }
  });

  compVideo.value.addEventListener("ended", () => {
    if (option.value.autoHidden && !option.value.loopPlay) {
      setHide();
    }
  });
};

const initRest = () => {
  // 重置所有状态
  showPreview.value = false;
  showButton.value = false;
  delayPlayStatus.value = false;
  isHidenAnimate.value = false;
  visibility.value = true;

  // 清除所有定时器
  if (delayTimer.value) {
    clearTimeout(delayTimer.value);
    delayTimer.value = null;
  }
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }

  if (btnHideTime.value) {
    clearTimeout(btnHideTime.value);
    btnHideTime.value = null;
  }

  // 重置视频元素
  if (compVideo.value) {
    compVideo.value.pause();
    compVideo.value.currentTime = 0;
    compVideo.value.load();
  }

  // 根据构建状态设置预览
  if (isBuild.value) {
    handlePreviewUrl();
    showPreview.value = true;
  }

  // 处理延迟播放
  if (!option.value.autoPlay && option.value.delayPlayTime) {
    handleDelayPlay();
  }

  // 处理按钮显示
  const buttonDelay = option.value.openDelayLoading ? option.value.delayLoadingTime * 1000 : 2000;
  btnHideTime.value = setTimeout(() => {
    showButton.value = true;
  }, buttonDelay);
};

// 生命周期钩子
onMounted(async () => {
  await nextTick();
  handleVideoEnded();

  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: props.element
  });
  initRest();
});

onBeforeUnmount(() => {
  delayTimer.value && clearTimeout(delayTimer.value);
  hideTimeout.value && clearTimeout(hideTimeout.value);
  if (videoFunSet.value.videoExp) {
    videoFunSet.value.videoExp.destroy();
    videoFunSet.value.videoExp = null;
  }
});

// watchers
watch(
  () => option.value.isBuildPlay,
  () => {
    visibility.value = false;
    setTimeout(() => {
      visibility.value = true;
    }, 50);
  }
);

watch(
  () => option.value,
  () => {
    if (!option.value.autoHidden || option.value.loopPlay) {
      visibility.value = true;
    }
    // 当 option 改变时重置所有状态
    // initRest()
  },
  { deep: true }
);

watch(
  () => dataChart.value,
  (nv) => {
    dataChartItem.value = isArray(nv) && nv.length ? nv[0] : nv;
  },
  { immediate: true }
);

watch(
  () => dataChartItem.value?.value,
  (url, oldUrl) => {
    if (oldUrl) {
      compVideo.value?.removeAttribute("src");
      compVideo.value?.load();
    }

    if (url?.match(/http.*\.(flv|m3u8)$/)) {
      videoFunSet.value.flvFun = isSupportedFlv;
      videoFunSet.value.hlsFun = isSupportedHls;
      const funName = url.includes(".flv") ? "flvFun" : "hlsFun";
      if (videoFunSet.value.videoExp) videoFunSet.value.videoExp.destroy(); // 销毁实例
      nextTick(() => {
        videoFunSet.value.videoExp = videoFunSet.value[funName](url, videoTips.value, compVideo.value);
      });
    }
  }
);
</script>

<style lang="scss" scoped>
.ft-open-video {
  width: 100% !important;
  height: 100% !important;
  position: relative;

  &.hidenAnimate {
    animation: hidenAnimate 1s ease-in 1;
  }

  video {
    width: 100%;
    height: 100%;
    zoom: var(--unscale);
  }

  .previewImg {
    width: 100%;
    height: 100%;
  }

  .video-btn {
    position: absolute;
    bottom: 20%;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    span {
      display: inline-block;
    }
  }
}

@keyframes hidenAnimate {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
