<template>
  <div class="video-hls">
    <!-- html2cnavas 截图不到视频的问题，预留video封面 -->
    <img
      v-if="showPreview && !option.autoPlay && videoCover"
      :style="styleCover"
      :src="videoCover"
      alt=""
      crossorigin=""
    />
    <video
      v-show="isVideoShow"
      ref="compVideo"
      :id="videoId"
      :poster="videoCover"
      :src="setMinioUrl(videoData.url)"
      :controls="option.controler"
      :autoplay="option.autoPlay"
      :loop="option.loopPlay"
      muted
      :style="`width:100%; height: 100%;position: relative;object-fit: ${objectFit || 'fill'};mix-blend-mode: ${
        option.mixBlendMode || 'normal'
      };filter:${filter}`"
      @ended="handleEnded"
      :data-translate="videoTips"
    >
      {{ videoTips }}
    </video>
    <!-- <div class="video-tips" ref="videoTips" :style="styleTips">
      {{ videoTips }}
    </div> -->
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import Flv from "flv.js";
import type { ErrorData } from "hls.js";
import Hls from "hls.js";

import { setMinioUrl } from "@screenwright/composables";

import type { VideoItem } from "../../types";

const VIDEO_MESSAGE = {
  LOADING: "正在载入视频...",
  FAILED: "视频载入失败",
  RETRY: "正在尝试重新载入...",
  NOT_SUPPORTED: "当前浏览器不支持播放",
  NO_SOURCE: "无视频源"
} as const;

const props = defineProps<{
  videoData: VideoItem;
  option: any;
  objectFit?: string;
  videoId: string;
  isBuild: boolean;
}>();

const emit = defineEmits<{
  (e: "video-end", info: VideoItem): void;
}>();

// 响应式状态
const compVideo = ref<HTMLVideoElement>();
const showPreview = ref(false);
const hlsjs = ref<Hls | null>(null);
const flvPlayer = ref<Flv.Player | null>(null);
const videoTips = ref("");
const videoCover = ref("");

// 计算属性
const isVideoShow = computed(() => {
  if (props.isBuild) {
    if (showPreview.value && !props.option.autoPlay && videoCover.value) {
      return false;
    }
    return true;
  }
  return true;
});

const styleCover = computed<CSSProperties>(() => ({
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  mixBlendMode: props.option.mixBlendMode || "normal"
}));

const filter = computed(() => {
  const result: string[] = [];

  const filterProps = ["contrast", "brightness", "grayscale", "invert", "saturate", "sepia"];
  filterProps.forEach((item) => {
    if (props.option[`${item}Show`]) {
      result.push(`${item}(${props.option[item]}%)`);
    }
  });

  if (props.option.gaussianBlurShow) {
    result.push(`blur(${props.option.gaussianBlur}px)`);
  }
  if (props.option.hueShow) {
    result.push(`hue-rotate(${props.option.hue}deg)`);
  }
  if (props.option.shadowShow) {
    result.push(
      `drop-shadow(${props.option.shadowColor} ${props.option.shadowX ? props.option.shadowX + "px" : ""} ${
        props.option.shadowY ? props.option.shadowY + "px" : ""
      } ${props.option.shadowFuzzy ? props.option.shadowFuzzy + "px" : ""})`
    );
  }

  return result.join(" ");
});

// 方法
const handleEnded = () => {
  emit("video-end", { ...props.videoData });
};

const isMp4 = (url: string) => {
  const videoDom = compVideo.value;
  if (!videoDom) return;

  videoDom.src = url;
  const playPromise = props.option.autoPlay ? videoDom.play() : videoDom.pause();

  if (playPromise) {
    playPromise
      .then(() => {
        videoTips.value = "";
      })
      .catch(() => {});
  }
};

const hlsManifestParsedCB = () => {
  const videoDom = compVideo.value;
  if (!videoDom) return;

  nextTick(() => {
    if (props.option.autoPlay) {
      videoDom.play();
    } else {
      videoDom.pause();
    }
    videoTips.value = "";
  });
};

const hlsErrorCB = (_event: any, data: ErrorData) => {
  if (data.fatal) {
    videoTips.value = "设备离线";
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        if (
          data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
          data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
          data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR
        ) {
          hlsjs.value?.loadSource(props.videoData.url);
        } else {
          hlsjs.value?.startLoad();
        }
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        hlsjs.value?.recoverMediaError();
        break;
      default:
        hlsjs.value?.destroy();
        break;
    }
  }
};

const isSupported = (url: string) => {
  const videoDom = compVideo.value;
  if (!videoDom) return;

  if (hlsjs.value) {
    hlsjs.value.destroy();
    hlsjs.value.off(Hls.Events.MANIFEST_PARSED, hlsManifestParsedCB);
    hlsjs.value.off(Hls.Events.ERROR, hlsErrorCB);
  }

  hlsjs.value = new Hls();
  hlsjs.value.loadSource(url);
  hlsjs.value.attachMedia(videoDom);

  hlsjs.value.on(Hls.Events.MANIFEST_PARSED, hlsManifestParsedCB);
  hlsjs.value.on(Hls.Events.ERROR, hlsErrorCB);
};

const isSupportedFlv = (url: string, isSync?: boolean) => {
  videoTips.value = "";
  const videoDom = compVideo.value;
  if (!videoDom) return;

  if (isSync) {
    if (props.option.autoPlay) {
      flvPlayer.value?.play();
    } else {
      flvPlayer.value?.pause();
    }
    return;
  }

  if (flvPlayer.value) {
    flvPlayer.value.destroy();
  }

  flvPlayer.value = Flv.createPlayer({ type: "flv", url });
  flvPlayer.value.attachMediaElement(videoDom);
  flvPlayer.value.load();

  if (props.option.autoPlay) {
    flvPlayer.value.play();
  } else {
    flvPlayer.value.pause();
  }
};

const playerVideo = (isSync?: boolean, url = props.videoData.url) => {
  videoTips.value = VIDEO_MESSAGE.LOADING;
  const initUrl = setMinioUrl(url);

  const urlType = url.split(".").pop();
  const isIncludeDeFaultType = urlType && /mp4|webm|ogg/gi.test(urlType);

  if (url && isIncludeDeFaultType) {
    isMp4(initUrl);
  } else if (url.includes(".flv")) {
    isSupportedFlv(initUrl, isSync);
  } else if (Hls.isSupported()) {
    isSupported(initUrl);
  }
};

const initVideoVolume = () => {
  if (!compVideo.value) {
    return;
  }
  if (!props.option.muted) {
    compVideo.value.volume = 1;
  } else {
    compVideo.value.volume = 0;
  }
};

// 监听器
watch(
  () => props.videoData,
  (info) => {
    const initUrl = setMinioUrl(info.url);
    nextTick(() => {
      if (info.url.match(/http.*\.(flv|m3u8|mp4|webm)$/)) {
        playerVideo(false, initUrl);
      }
    });
  },
  { deep: true }
);

watch(
  () => props.option.autoPlay,
  () => {
    playerVideo(true);
  }
);

watch(
  () => props.option.muted,
  () => {
    initVideoVolume();
  }
);

// 生命周期
onMounted(async () => {
  await nextTick();
  playerVideo();
  showPreview.value = props.isBuild;
  initVideoVolume();
});

onBeforeUnmount(() => {
  if (hlsjs.value) {
    hlsjs.value.off(Hls.Events.MANIFEST_PARSED, hlsManifestParsedCB);
    hlsjs.value.off(Hls.Events.ERROR, hlsErrorCB);
    hlsjs.value.destroy();
    hlsjs.value = null;
  }

  if (flvPlayer.value) {
    flvPlayer.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
.video-hls {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
