import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

export const useActionTime = createGlobalState(() => {
  const actionTime = ref(0); ////页面无操作刷新计算
  const setActionTime = () => {
    actionTime.value = new Date().getTime();
  };
  return {
    actionTime,
    setActionTime
  };
});
