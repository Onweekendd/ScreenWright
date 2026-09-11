import { computed, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";

import { ModelApi } from "../../modelApi/index";

// 获取接口差异化
const useModelApi = () => {
  const route = useRoute();
  const modelApi = shallowRef(new ModelApi(route.path));

  const path = computed(() => {
    return route.path;
  });
  const isDisplay = computed(() => {
    return route.path === "/display";
  });
  const isMap = computed(() => {
    return route.path === "/map";
  });
  watch(
    () => route.path,
    async (path) => {
      modelApi.value = new ModelApi(path);
    },
    {
      immediate: true
    }
  );
  return {
    path,
    isDisplay,
    isMap,
    modelApi
  };
};

export { useModelApi };
