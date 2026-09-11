import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { getPlugin } from "@/api/plugin";
import type { itemPluginResponse } from "@/model/Plugin";

export const usePluginLibrary = createGlobalState(() => {
  const params = ref({
    current: 1,
    size: 10,
    name: ""
  });
  const pluginList = ref<itemPluginResponse[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const getPluginList = async () => {
    loading.value = true;
    try {
      const res = await getPlugin(params.value);
      pluginList.value = res.result.records;
      total.value = res.result.total;
    } catch (error) {
      console.error("Error fetching plugin list:", error);
    } finally {
      loading.value = false;
    }
  };
  return {
    params,
    loading,
    pluginList,
    total,
    getPluginList
  };
});
