import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { isArray } from "lodash-es";

import { MediaEnum as mediaEnum } from "@screenwright/types";
import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { EncodeEventTypeEnum, EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { getVideoBase64, isSupportedFlv, isSupportedHls } from "../../utils";

interface VideoState {
  value?: string | null;
  cover?: string;
  [key: string]: any;
}

interface VideoFunSet {
  flvFun?: typeof isSupportedFlv;
  hlsFun?: typeof isSupportedHls;
  videoExp?: any;
}

// 定义视频信息类型
interface VideoInfo {
  id: string;
  result: string;
}

export const useSwVideo = (element: ComponentType) => {
  const { option, dataChart, isBuild, encodes, events, handleEventAndCallbackEvent, handleEncode } =
    useBaseData(element);
  const { addEvent } = useActionEvent();

  // refs
  const mainRef = ref<HTMLDivElement>();
  const videoRef = ref<HTMLVideoElement>();
  const tipsRef = ref<HTMLDivElement>();

  // state
  const previewUrl = ref("");
  const showPreview = ref(false);
  const visibility = ref(true);
  const dataChartItem = ref<VideoState>({});
  const delayPlayStatus = ref(false);
  const isHidenAnimate = ref(false);
  const delayTimer = ref<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
  const videoFunSet = ref<VideoFunSet>({});
  const tempVideoEndTime = ref<number | null>(null);
  const videoUrl = ref("");

  // computed
  const containerClasses = computed(() => ({
    hidenAnimate: isHidenAnimate.value,
    "component-bind-events": true,
    "has-bind": Boolean(events.value?.length && isBuild.value),
    "has-encode": Boolean(encodes.value?.length && isBuild.value)
  }));

  const containerStyle = computed((): CSSProperties => {
    return {
      pointerEvents: option.value.pointerEvents && !isBuild.value ? "auto" : "none",
      mixBlendMode: option.value.mixBlendMode || "normal"
    };
  });

  const imgUrl = computed(() => setMinioUrl(option.value.cover || previewUrl.value));

  const posterUrl = computed(() => (dataChartItem.value.cover ? setMinioUrl(dataChartItem.value.cover) : ""));

  // const videoUrl = computed(() => {
  //   const value = dataChartItem.value?.value
  //   if (!value) return ""

  //   const url = value.includes("ws") ? value : setMinioUrl(value)
  //   return `${url}?${uuid()}`
  // })

  const bgStyle = computed(
    (): CSSProperties => ({
      background:
        option.value.backgroundType === "color"
          ? option.value.backgroundColor
          : `url(${setMinioUrl(option.value.backgroundImage || option.value.background)}) 50% 50% / ${
              option.value.backgroundImageType
            } no-repeat`
    })
  );

  const videoStyle = computed(
    (): CSSProperties => ({
      objectFit: "fill",
      filter: getFilter(),
      transform: option.value.rotateShow
        ? `rotateX(${option.value.rotateX}deg) rotateY(${option.value.rotateY}deg) rotateZ(${option.value.rotateZ}deg)`
        : ""
    })
  );

  const isAutoPlay = computed((): boolean => {
    if (isBuild.value) return option.value.isBuildPlay;
    if (!option.value.autoPlay && delayPlayStatus.value && !option.value.delayPlayFirst) return true;
    return option.value.autoPlay;
  });

  const setVideoUrl = () => {
    const value = dataChartItem.value?.value;
    if (!value) return "";

    const url = value.includes("ws") ? value : setMinioUrl(value);
    return `${url}`;
  };

  // methods
  function getFilter(): string {
    const filters: string[] = [];
    const filterProps = ["contrast", "brightness", "grayscale", "invert", "saturate", "sepia"];

    filterProps.forEach((item) => {
      if (option.value[`${item}Show`]) {
        filters.push(`${item}(${option.value[item]}%)`);
      }
    });

    if (option.value.gaussianBlurShow) {
      filters.push(`blur(${option.value.gaussianBlur}px)`);
    }
    if (option.value.hueShow) {
      filters.push(`hue-rotate(${option.value.hue}deg)`);
    }
    if (option.value.shadowShow) {
      filters.push(
        `drop-shadow(${option.value.shadowColor} ${option.value.shadowX}px ${option.value.shadowY}px ${option.value.shadowFuzzy}px)`
      );
    }

    return filters.join(" ");
  }

  const handleClick = (data: any, triggerType: EventTypeEnum = EventTypeEnum.Ended) => {
    handleEventAndCallbackEvent({
      throwValue: data,
      triggerType,
      id: element.id,
      events: element.events
    });
  };

  /**
   * 视频播放
   */
  const videoToPlay = async (): Promise<void> => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    try {
      await videoDom.play();
    } catch (error) {
      console.error("视频播放失败:", error);
    }
  };

  /**
   * 视频暂停
   */
  const videoToPause = (): void => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    videoDom.pause();
  };

  /**
   * 视频停止
   */
  const videoToStop = (): void => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    videoDom.pause();
    videoDom.currentTime = 0;
  };

  /**
   * 视频重播
   */
  const videoToRestart = async (): Promise<void> => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    try {
      videoDom.currentTime = 0;
      await videoDom.play();
    } catch (error) {
      console.error("视频重播失败:", error);
    }
  };

  /**
   * 视频静音切换
   */
  const videoToMuted = (value?: boolean): void => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    videoDom.muted = value ?? false;
  };

  /**
   * 视频音量增加
   */
  const videoToAudioUp = (): void => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    // 音量增加 0.1，最大为 1
    videoDom.volume = Math.min(videoDom.volume + 0.1, 1);
  };

  /**
   * 视频音量减少
   */
  const videoToAudioDown = (): void => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    // 音量减少 0.1，最小为 0
    videoDom.volume = Math.max(videoDom.volume - 0.1, 0);
  };

  /**
   * 视频快进
   */
  const videoToFastin = async (timeFastIn: number, info?: { value: number; type?: string }): Promise<void> => {
    console.log(info, "info");
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    if (info?.value && info.type && info.type === "seek") {
      videoDom.currentTime = info.value;
      if (!videoDom.paused) {
        await videoDom.play();
      }

      return;
    }
    console.log("快进", timeFastIn, videoDom.currentTime);
    // 快进 1 秒，不超过视频总时长
    videoDom.currentTime = Math.min(videoDom.currentTime + timeFastIn, videoDom.duration || 0);
  };

  /**
   * 视频快退
   */
  const videoToRewind = (timeRewind: number): void => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }
    console.log("快退", timeRewind, videoDom.currentTime);
    // 快退 1 秒，最小为 0
    videoDom.currentTime = Math.max(videoDom.currentTime - timeRewind, 0);
  };

  /**
   * 视频切换
   */
  const videoToSwitch = async (value: string): Promise<void> => {
    const videoDom = videoRef.value;
    if (!videoDom) {
      console.warn("视频DOM元素未找到");
      return;
    }

    try {
      // 切换视频
      videoDom.pause();
      videoDom.currentTime = 0;

      // 使用现有的 option 变量中的 compositeList
      const videoInfo = option.value.compositeList?.find((v: VideoInfo) => v.id === value);
      if (videoInfo) {
        // 更新 dataChartItem 的值来切换视频
        dataChartItem.value.value = videoInfo.result.slice(1);
        await sleep(500);
        await videoDom.play();
      }
    } catch (error) {
      console.error("视频切换失败:", error);
    }
  };

  const handleEnded = () => {
    if (option.value.autoHidden) {
      setHide();
    }
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Ended,
      events: element.events,
      isExecuteOnlyInViewMod: true,
      throwValue: dataChart.value
    });
  };

  const setHide = () => {
    if (hideTimeout.value) clearTimeout(hideTimeout.value);
    isHidenAnimate.value = true;
    hideTimeout.value = setTimeout(() => {
      visibility.value = false;
    }, 1000);
  };

  const handleDelayPlay = () => {
    if (delayTimer.value) clearTimeout(delayTimer.value);
    delayTimer.value = setTimeout(() => {
      delayPlayStatus.value = true;
    }, option.value.delayPlayTime * 1000);
  };

  const handleDelayPlayFirst = async () => {
    if (option.value.delayPlayFirst) {
      await sleep(option.value.delayLoadTime * 1000);
      if (option.value.delayPlayFirst) {
        if (option.value.autoPlay) {
          videoUrl.value = setVideoUrl();
        } else {
          videoUrl.value = setVideoUrl();
          await nextTick();
          await sleep(option.value.delayPlayTime * 1000);
          videoRef.value?.play();
        }
      }
    } else {
      videoUrl.value = setVideoUrl();
    }
  };

  const handleVideoEnded = () => {
    videoRef.value?.addEventListener("loadedmetadata", onLoadedmetadata);
  };

  const onLoadedmetadata = () => {
    // 视频的总长度
    if (option.value.autoHiden && videoRef.value && videoRef.value.duration) {
      setTimeout(
        () => {
          setHide();
        },
        (videoRef.value.duration - 1) * 1000
      );
    }
  };

  const handlePreviewUrl = () => {
    getVideoBase64(setMinioUrl(dataChartItem.value?.value || ""), "png").then((videoUrl: string) => {
      previewUrl.value = videoUrl as string;
    });
  };

  // 视频基本API结合其他逻辑实现
  const setVideoInit = () => {
    if (isBuild.value) return;
    const videoDom = videoRef.value;
    videoDom?.addEventListener("timeupdate", () => {
      // console.log('视频进度条中...', videoDom.currentTime)
      if (tempVideoEndTime.value && videoDom.currentTime > tempVideoEndTime.value) {
        videoDom.pause();
      }
    });
    // if (!this.main.isTerminalView) return
    if (!option.value.controler) return;
    videoDom?.addEventListener("play", onPlayEvent);
    videoDom?.addEventListener("pause", onPauseEvent);
    videoDom?.addEventListener("volumechange", onVolumeChangeEvent);
    videoDom?.addEventListener("fullscreenchange", onFullscreenChangeEvent);
    // 拖动进度条时
    // videoDom.addEventListener('seeking', (s) => {
    //   console.log('拖动进度条中...', s)
    // });
    // 结束拖动进度条时
    videoDom?.addEventListener("seeked", onSeekedEvent);
  };

  /**
   * 处理播放事件
   */
  const onPlayEvent = () => {
    const info = {
      label: "videoToPlay",
      value: null
    };

    if (element.encodes && element.encodes.find((encode: any) => encode.trigger === EncodeEventTypeEnum.VideoControls)) {
      handleEncode(info);
    }
  };

  /**
   * 处理暂停事件
   */
  const onPauseEvent = () => {
    const videoDom = videoRef.value;

    if (!videoDom) {
      return;
    }

    if (videoDom?.seeking) {
      return;
    }

    const info = {
      label: "videoToPause",
      value: null
    };

    if (element.encodes && element.encodes.find((encode: any) => encode.trigger === EncodeEventTypeEnum.VideoControls)) {
      handleEncode(info);
    }
  };

  /**
   * 处理音量变化事件
   */
  const onVolumeChangeEvent = () => {
    const videoDom = videoRef.value;
    if (!videoDom) return;

    const info = videoDom.muted
      ? {
          label: "videoToMuted",
          value: videoDom.muted
        }
      : {
          label: "videoToAudioUp",
          value: videoDom.volume
        };

    if (element.encodes && element.encodes.find((encode: any) => encode.trigger === EncodeEventTypeEnum.VideoControls)) {
      handleEncode(info);
    }
  };

  /**
   * 处理全屏变化事件
   */
  const onFullscreenChangeEvent = () => {
    const info = {
      label: "videoToFullscreen",
      value: null
    };

    if (element.encodes && element.encodes.find((encode: any) => encode.trigger === EncodeEventTypeEnum.VideoControls)) {
      handleEncode(info);
    }
  };

  /**
   * 处理进度条拖拽结束事件
   */
  const onSeekedEvent = () => {
    const videoDom = videoRef.value;
    if (!videoDom) return;

    if (videoDom.currentTime < 0.5) return;

    const info = {
      label: "videoToFastin",
      value: videoDom.currentTime,
      type: "seek"
    };

    if (element.encodes && element.encodes.find((encode: any) => encode.trigger === EncodeEventTypeEnum.VideoControls)) {
      handleEncode(info);
    }
  };

  const clearVideoInit = () => {
    if (isBuild.value) return;
    const videoDom = videoRef.value;
    if (!videoDom) return;
    videoDom.removeEventListener("loadedmetadata", onLoadedmetadata);
    videoDom.removeEventListener("play", onPlayEvent);
    videoDom.removeEventListener("pause", onPauseEvent);
    videoDom.removeEventListener("volumechange", onVolumeChangeEvent);
    videoDom.removeEventListener("fullscreenchange", onFullscreenChangeEvent);
    videoDom.removeEventListener("seeked", onSeekedEvent);
  };

  const handleVideoUrlChange = async (url: string, oldUrl?: string) => {
    if (oldUrl) {
      videoRef.value?.removeAttribute("src");
      videoRef.value?.load();
    }

    // handleClick(dataChartItem.value)
    handleEventAndCallbackEvent({
      throwValue: dataChartItem.value,
      triggerType: EventTypeEnum.DataChange,
      id: element.id,
      events: element.events
    });

    if (url?.match(/http.*\.(flv|m3u8)$/) || url?.match("^(wss:|ws:)") || url?.match(/.*\.flv$/)) {
      const isFlv = url.includes(".flv");
      videoFunSet.value.flvFun = isSupportedFlv;
      videoFunSet.value.hlsFun = isSupportedHls;

      if (videoFunSet.value.videoExp) {
        videoFunSet.value.videoExp.destroy();
      }

      await nextTick();

      if (url.includes("ws")) {
        const flvFn = videoFunSet.value.flvFun;
        if (typeof flvFn === "function") {
          flvFn(url, tipsRef.value as HTMLElement, videoRef.value as HTMLVideoElement);
        }
      } else {
        const fn = isFlv ? videoFunSet.value.flvFun : videoFunSet.value.hlsFun;
        if (typeof fn === "function") {
          videoFunSet.value.videoExp = fn(
            url.includes("http") ? url : setMinioUrl(url),
            tipsRef.value as HTMLElement,
            videoRef.value as HTMLVideoElement
          );
        }
      }
    } else if (isBuild.value) {
      handlePreviewUrl();
    }
  };

  const videoToFullscreen = () => {
    if (videoRef.value) {
      videoRef.value.requestFullscreen();
    }
  };

  const videoToPlayRange = (videoStartTime: number, videoEndTime: number) => {
    if (videoRef.value) {
      videoRef.value.currentTime = videoStartTime;
      tempVideoEndTime.value = videoEndTime;
      videoRef.value.play();
    }
  };

  // 初始化方法
  const initVideo = () => {
    handleVideoEnded();
    setVideoInit();
    if (isBuild.value) {
      handlePreviewUrl();
      showPreview.value = true;
    } else {
      showPreview.value = false;
    }

    // 是否延迟播放-delayPlayFirst
    if (!option.value.autoPlay && option.value.delayPlayTime && !option.value.delayPlayFirst) {
      handleDelayPlay();
    } else if (option.value.autoPlay && option.value.muted) {
      // video标签初始化后会缺少muted属性（原生问题），需手动播放，否则存在自动播放失败的情况
      videoRef.value?.play();
    }
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,

      throwValue: dataChart.value
    });

    addEvent({
      [`${mediaEnum.SwVideo}-${element.id}`]: {
        handleClick,
        videoToPlay,
        videoToPause,
        videoToStop,
        videoToRestart,
        videoToMuted,
        videoToAudioUp,
        videoToAudioDown,
        videoToFastin,
        videoToRewind,
        videoToSwitch,
        videoToFullscreen,
        videoToPlayRange
      }
    });
  };

  // 生命周期
  onMounted(() => {
    initVideo();
  });

  onBeforeUnmount(() => {
    clearVideoInit();
    if (hideTimeout.value) clearTimeout(hideTimeout.value);
    if (delayTimer.value) clearTimeout(delayTimer.value);
    if (videoFunSet.value.videoExp) {
      videoFunSet.value.videoExp.destroy();
      videoFunSet.value.videoExp = null;
    }
  });

  // watchers
  watch(
    () => option.value,
    (val) => {
      if (!val.autoHiden || val.loopPlay) {
        visibility.value = true;
      }
    },
    { deep: isBuild.value ? true : false }
  );

  watch(
    () => isAutoPlay.value,
    (val) => {
      if (val && videoRef.value) {
        videoRef.value.play();
      }
    }
  );

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
    () => dataChart.value,
    async (nv) => {
      dataChartItem.value = isArray(nv) && nv.length ? nv[0] : nv;
      await handleDelayPlayFirst();
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.DataChange,
        events: element.events,

        throwValue: element
      });
    }
  );

  // 监听直接修改的 URL 变化（如 videoToSwitch 中的修改）
  watch(
    () => dataChartItem.value?.value,
    async (url, oldUrl) => {
      await handleVideoUrlChange(url || "", oldUrl || "");
    }
  );

  return {
    // refs
    mainRef,
    videoRef,
    tipsRef,
    // state
    showPreview,
    visibility,
    // computed
    containerClasses,
    containerStyle,
    imgUrl,
    posterUrl,
    videoUrl,
    bgStyle,
    videoStyle,
    isAutoPlay,
    // methods
    handleClick,
    handleEnded,
    // video controls
    videoToPlay,
    videoToPause,
    videoToStop,
    videoToRestart,
    videoToMuted,
    videoToAudioUp,
    videoToAudioDown,
    videoToFastin,
    videoToRewind,
    videoToSwitch,
    // option
    option
  };
};
