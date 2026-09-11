import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import dayjs from "dayjs";

import { getScreenMeta } from "@/api/visual";

import { useLargeScreenInfo } from "./useLargeScreenInfo";

export const useCacheTime = createGlobalState(() => {
  const lastCacheTime = ref<number | null>(null);
  const { navInfo } = useLargeScreenInfo();

  const checkCacheDataIsExpired = async () => {
    if (lastCacheTime.value === null) {
      return true;
    }

    const data = await getScreenMeta(Number(navInfo.value.id));

    const lastUpdatedTimeStamp = dayjs(data.result.updatedTime).valueOf();

    return lastUpdatedTimeStamp > lastCacheTime.value;
  };

  const clearCacheTime = () => {
    lastCacheTime.value = null;
  };

  return {
    checkCacheDataIsExpired,
    lastCacheTime,
    clearCacheTime
  };
});
