<template>
  <div class="ft-h5player" ref="h5player">
    <div class="video-box" :id="playerId" v-loading="videoLoading" element-loading-background="rgba(0, 0, 0, 0.1)" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { parseUrl, uuid } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

import type { VideoItem, VideoOption } from "../../types";

const props = defineProps<{
  videoData: VideoItem;
  option: VideoOption;
  element: ComponentType;
}>();

// 响应式状态
const h5player = ref<HTMLElement>();
const player = ref<any>(null);
const playURL = ref("");
const videoLoading = ref(false);

const mode = 0; // 1高级模式兼容265类型 0普通模式不兼容265
const retryCount = 3;

// 计算属性
const playerId = computed(() => `h5player_${uuid()}`);

// 重试函数
const retry = (fn: () => Promise<any>, retries: number, delay: number) => {
  return new Promise((resolve, reject) => {
    const attempt = (retryCount: number) => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (retryCount <= 0) {
            reject(error);
          } else {
            setTimeout(() => {
              attempt(retryCount - 1);
            }, delay);
          }
        });
    };
    attempt(retries);
  });
};

// 方法
const initPlayer = () => {
  createPlayer();
  player.value.JS_Resize();
};

const createPlayer = () => {
  player.value = new (window as any).JSPlugin({
    szId: playerId.value,
    szBasePath: "/public/cdn/h5player/",
    iMaxSplit: 1,
    iCurrentSplit: 1,
    openDebug: false,
    bSupporDoubleClickFull: false,
    iWidth: props.element.width,
    iHeight: props.element.height,
    oStyle: {
      borderWidth: 0,
      border: "none"
    }
  });

  // 事件回调绑定
  player.value.JS_SetWindowControlCallback({
    windowEventSelect: (_iWndIndex: number) => {
      //插件选中窗口回调
      console.log("windowSelect callback: ", _iWndIndex);
    },
    pluginErrorHandler: (_iWndIndex: number, _iErrorCode: number, _oError: any) => {
      //插件错误回调
      console.log("pluginError callback: ", _iWndIndex, _iErrorCode, _oError);
    },
    windowEventOver: () => {
      //鼠标移过回调
    },
    windowEventOut: () => {
      //鼠标移出回调
    },
    windowEventUp: () => {
      //鼠标mouseup事件回调
    },
    windowFullCcreenChange: (_bFull: boolean) => {
      //全屏切换回调
      console.log("fullScreen callback: ", _bFull);
    },
    firstFrameDisplay: (_iWndIndex: number, _iWidth: number, _iHeight: number) => {
      //首帧显示回调
      console.log("firstFrame loaded callback: ", _iWndIndex, _iWidth, _iHeight);
    },
    performanceLack: () => {
      //性能不足回调
      console.log("performanceLack callback: ");
    }
  });
};

const play = () => {
  if (!playURL.value) return false;
  const { startTime, beginTime, endTime } = parseUrl(playURL.value) || {};
  const startTime_o = startTime ? parseCustomDate(startTime) : beginTime ? parseCustomDate(beginTime) : null;
  const endTime_o = endTime ? parseCustomDate(endTime) : null;

  return player.value.JS_Play(playURL.value, { playURL: playURL.value, mode }, 0, startTime_o, endTime_o);
};

const parseCustomDate = (dateStr: string) => {
  if (dateStr.length !== 15) {
    try {
      return new Date(dateStr).toISOString();
    } catch (err) {
      throw new Error("Invalid date string format:" + err);
    }
  }

  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  const hours = dateStr.slice(9, 11);
  const minutes = dateStr.slice(11, 13);
  const seconds = dateStr.slice(13, 15);

  const isoDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  return new Date(isoDateString).toISOString();
};

// 监听器

watch([props.element.width, props.element.height], () => {
  retry(() => player.value.JS_Resize(), retryCount, 1000).catch((e) => {
    console.log("播放失败", e);
  });
});

watch(
  () => props.videoData.url,
  (url) => {
    playURL.value = url;
    initPlayer();
    retry(() => play(), retryCount, 1000).catch((e) => {
      console.log("播放失败", e);
    });
  }
);

// 生命周期
onMounted(() => {
  playURL.value = props.videoData.url;

  initPlayer();
  videoLoading.value = true;

  retry(() => play(), retryCount, 1000)
    .catch((e) => {
      console.log("播放失败", e);
    })
    .finally(() => {
      videoLoading.value = false;
    });
});
</script>

<style lang="scss" scoped>
.ft-h5player {
  width: 100% !important;
  height: 100% !important;

  .video-box {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
