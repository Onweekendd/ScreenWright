import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { cloneDeep } from "lodash-es";

import type { ParamsInterface } from "./constant";
import { activeNameEnum, defaultParams, emApiType } from "./constant";

export const useApiPreviewParams = createGlobalState(() => {
  const loading = ref(false);

  const params = ref<ParamsInterface>(cloneDeep(defaultParams));
  // 添加数据
  const handleAddClick = () => {
    const data = {
      key: "",
      value: "",
      type: "String"
    };
    if (params.value.activeName === activeNameEnum.Body) {
      params.value.data[activeNameEnum.Body][emApiType.FormData].listData.push(data);
    } else {
      params.value.data[params.value.activeName].listData.push(data);
    }
  };

  return {
    params,
    loading,
    handleAddClick
  };
});
