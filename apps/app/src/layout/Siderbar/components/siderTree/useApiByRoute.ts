import { ref, watch } from "vue";
import { useRoute } from "vue-router";

import { ApiStrategyContext } from "./ApiStrategyContext";
import type { ApiStrategy } from "./model/ApiStrategy";
import { DisplayApiStrategy } from "./model/DisplayApiStrategy";

export const useApiByRoute = () => {
  const route = useRoute();
  const apiStrategyContext = new ApiStrategyContext();
  const groupMapApi = ref<ApiStrategy>(new DisplayApiStrategy());
  watch(
    () => route.path,
    async (path) => {
      const apiContext = apiStrategyContext.getStrategy(path);
      groupMapApi.value = {
        addApi: (param: any) => apiContext.addApi(param),
        delApi: (param: any) => apiContext.delApi(param),
        updateApi: (param: any) => apiContext.updateApi(param)
      };
    },
    {
      immediate: true
    }
  );

  return {
    groupMapApi
  };
};
