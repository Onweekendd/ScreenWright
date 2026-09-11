import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { isArray } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import { parseUrl, uuid } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

export interface JSPluginConfig {
  szId: string;
  szBasePath: string;
  iMaxSplit: number;
  iCurrentSplit: number;
  openDebug: boolean;
  bSupporDoubleClickFull: boolean;
  iWidth: number;
  iHeight: number;
  oStyle: {
    borderWidth: number;
    border: string;
  };
}

export interface WindowControlCallback {
  windowEventSelect: (iWndIndex: number) => void;
  pluginErrorHandler: (iWndIndex: number, iErrorCode: number, oError: any) => void;
  windowFullCcreenChange: (bFull: boolean) => void;
  firstFrameDisplay: (iWndIndex: number, iWidth: number, iHeight: number) => void;
  performanceLack: () => void;
}

// 定义类型
interface VideoState {
  value?: string;
  url?: string;
}

// 可复用的重试函数
const retry = async (fn: () => Promise<any>, retries: number, delay: number): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

// 解析自定义日期格式
const parseCustomDate = (dateStr: string): string => {
  if (dateStr.length !== 15) {
    return new Date(dateStr).toISOString();
  }

  const [year, month, day, hours, minutes, seconds] = [
    dateStr.slice(0, 4),
    dateStr.slice(4, 6),
    dateStr.slice(6, 8),
    dateStr.slice(9, 11),
    dateStr.slice(11, 13),
    dateStr.slice(13, 15)
  ];

  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`).toISOString();
};

export function useFtH5player(element: ComponentType) {
  // 从baseData中获取数据
  const { encodes, events, option, dataChart, isBuild } = useBaseData(element);

  // 响应式状态
  const h5playerRef = ref<HTMLElement | null>(null);
  const videoLoading = ref(true);
  const player = ref<any>(null);
  const dataChartItem = ref<VideoState>({});
  const playURL = ref("");
  const width = ref(0);
  const height = ref(0);
  const mode = ref(1); // 1高级模式兼容265类型 0普通模式不兼容265
  const RETRY_COUNT = 3;
  const RETRY_DELAY = 1000;

  // 计算属性
  const playerId = computed(() => `h5player_${uuid()}`);

  const containerClasses = computed(() => ({
    "ft-h5player": true,
    "component-bind-events": true,
    "has-bind": Boolean(events.value?.length && isBuild.value),
    "has-encode": Boolean(encodes.value?.length && isBuild.value)
  }));

  // 播放器相关函数
  const createPlayer = () => {
    const config: JSPluginConfig = {
      szId: playerId.value,
      szBasePath: "/public/cdn/h5player/",
      iMaxSplit: 1,
      iCurrentSplit: 1,
      openDebug: false,
      bSupporDoubleClickFull: false,
      iWidth: width.value,
      iHeight: height.value,
      oStyle: {
        borderWidth: 0,
        border: "none"
      }
    };

    const callbacks: WindowControlCallback = {
      windowEventSelect: (iWndIndex: number) => {
        console.log("windowSelect callback: ", iWndIndex);
      },
      pluginErrorHandler: (iWndIndex: number, iErrorCode: number, oError: any) => {
        console.log("pluginError callback: ", iWndIndex, iErrorCode, oError);
      },
      windowFullCcreenChange: (bFull: boolean) => {
        console.log("fullScreen callback: ", bFull);
      },
      firstFrameDisplay: (iWndIndex: number, iWidth: number, iHeight: number) => {
        console.log("firstFrame loaded callback: ", iWndIndex, iWidth, iHeight);
        videoLoading.value = false;
      },
      performanceLack: () => {
        console.log("performanceLack callback: ");
      }
    };

    player.value = new (window as any).JSPlugin(config);
    player.value.JS_SetWindowControlCallback(callbacks);
  };

  const initPlayer = () => {
    createPlayer();
    player.value?.JS_Resize();
  };

  const play = async () => {
    if (!playURL.value) return false;

    const { startTime, beginTime, endTime } = parseUrl(playURL.value) || {};
    const startTime_o = startTime ? parseCustomDate(startTime) : beginTime ? parseCustomDate(beginTime) : null;
    const endTime_o = endTime ? parseCustomDate(endTime) : null;

    return player.value?.JS_Play(
      playURL.value,
      { playURL: playURL.value, mode: mode.value },
      0,
      startTime_o,
      endTime_o
    );
  };

  // 监听器
  watch([width, height], () => player.value?.JS_Resize());

  watch(
    () => option.value,
    () => initPlayer(),
    { deep: true }
  );

  watch(
    () => dataChart.value,
    (nv: any) => {
      dataChartItem.value = isArray(nv) && nv.length ? nv[0] : nv;
      playURL.value = dataChartItem.value?.value || "";
    },
    { deep: true }
  );

  watch(
    () => playURL.value,
    async (nv) => {
      if (!nv) return;

      initPlayer();
      try {
        await retry(() => play(), RETRY_COUNT, RETRY_DELAY);
      } catch (error) {
        console.error("播放失败", error);
      }
    }
  );

  // 生命周期钩子
  onMounted(() => {
    playURL.value = dataChartItem.value?.url || "";

    initPlayer();
    videoLoading.value = true;

    retry(() => play(), RETRY_COUNT, RETRY_DELAY)
      .catch((error) => console.error("播放失败", error))
      .finally(() => {
        videoLoading.value = false;
      });
  });

  onBeforeUnmount(() => {
    player.value = null;
  });

  return {
    h5playerRef,
    videoLoading,
    playerId,
    containerClasses
  };
}
