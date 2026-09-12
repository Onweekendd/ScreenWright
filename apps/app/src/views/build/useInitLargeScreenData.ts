import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { createInitialState } from "@screenwright/core";
import type { LargeScreeInfo, LargeScreenDetailInfo } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { omit } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import to from "@/utils/await-to-js";
import { getVersionCode } from "@/utils/version";

import { useHistoryData } from "./command/useHistoryData";
import { useCustomAnimation } from "./components/buildConfig/attrsRender/components/customAnimation/useCustomAnimation";
import { useStatusAnimation } from "./components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useAlignmentWasm } from "./components/buildRender/hooks/useAlignmentWasm";
import { useEditStore } from "./components/buildRender/hooks/useEditStore";
import type { ComponentType } from "./components/buildRender/type";
import { useCacheTime } from "./useCacheTime";
import { useDataFilter } from "./useDataFilter";
import { useGlobalComponentData } from "./useGlobalComponentData";
import type { NavInfo } from "./useLargeScreenInfo";
import { parseIfNeeded, useLargeScreenInfo } from "./useLargeScreenInfo";

const createDefaultDetailInfo = (): LargeScreeInfo => {
  const { navInfo, layers } = createInitialState();
  return { ...navInfo, layers };
};

export const useInitLargeScreenData = createGlobalState(() => {
  const detailInfo = ref<LargeScreeInfo>(createDefaultDetailInfo());
  const { setNavInfo, navInfo } = useLargeScreenInfo();
  const { setGroupData, groupData } = useGlobalComponentData();
  const { setDetail2Config, isBuild } = useEditStore();
  const { cloneDataFilterOnInit } = useDataFilter();
  const { initCallbackArguments } = useCallbackArguments();
  const { onAnimationInit } = useCustomAnimation();
  const { initCacheState } = useHistoryData();
  const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();
  const { checkCacheDataIsExpired } = useCacheTime();
  const { initializeWasm } = useAlignmentWasm();
  const isLoad = ref(false);
  const loading = ref(false);

  const initLargeScreen = async (id: number) => {
    loading.value = true;
    isLoad.value = false;

    const versionCode = getVersionCode();

    const isDataNotCacheInMemory = () => {
      return navInfo.value && (navInfo.value.id !== id || navInfo.value.versionCode !== versionCode);
    };

    if (isDataNotCacheInMemory() || (await checkCacheDataIsExpired())) {
      const [error, res] = await to(getLargeScreenInfo(id));
      if (error || !res) {
        loading.value = false;
        return;
      }

      await initLargeScreenData(res.result);

      if (isBuild()) {
        await initializeWasm();
        initCache();
      }

      loading.value = false;
      isLoad.value = true;
    } else {
      isLoad.value = true;
      loading.value = false;
    }
  };

  const initLargeScreenData = async (res: LargeScreeInfo) => {
    try {
      detailInfo.value = res;
      setNavInfo(detailInfo.value);
      setGroupData(detailInfo.value);
      setDetail2Config(detailInfo.value);
      cloneDataFilterOnInit();
      initCallbackArguments(groupData.value);
      onAnimationInit();
      initAnimationAndComponentDefaultConfigMap();
    } catch (error) {
      ElMessage.error("初始化大屏数据失败:" + (error as Error).message);
      detailInfo.value = createDefaultDetailInfo();
    }
  };

  const initCache = async () => {
    if (!navInfo.value.id) {
      return;
    }
    const [error, res] = await to(getLargeScreenInfo(navInfo.value.id));
    if (error || !res) {
      return;
    }

    initCacheState({
      componentList: res.result.layers.map((item) => parseIfNeeded<ComponentType>(item, {} as ComponentType)),
      editConfig: parseIfNeeded<LargeScreenDetailInfo>(res.result.detail, {} as LargeScreenDetailInfo),
      navInfo: omit(res.result, ["layers", "detail"]) as NavInfo
    });
  };

  return {
    detailInfo,
    isLoad,
    groupData,
    setDetail2Config,
    initLargeScreen,
    initLargeScreenData,
    initCallbackArguments
  };
});
