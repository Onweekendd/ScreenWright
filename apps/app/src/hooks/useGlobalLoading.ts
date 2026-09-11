import { onBeforeMount, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

// type LoadingTypeMap = {
//   common: boolean
//   scene: boolean
//   city: boolean
// }

// 处理 app.vue 的全局 loading效果
export const useGlobalLoading = createGlobalState(() => {
  // const loadingMap = ref<Map<string, boolean>>(new Map())

  const loading = ref(false);
  const loadingScene = ref(false);
  const loadingScreen = ref(false);
  const loadingText = ref("");
  const loadingProgress = ref(0);

  const showLoading = (text: string) => {
    loading.value = true;
    loadingText.value = text;
  };

  const showSceneLoading = (progress: number) => {
    loadingScene.value = true;
    loadingProgress.value = progress;
  };

  const hideLoading = (type = "common") => {
    if (type === "common") {
      loading.value = false;
      loadingText.value = "";
    } else {
      loadingScene.value = false;
      loadingProgress.value = 0;
    }
  };

  onBeforeMount(() => {
    loading.value = false;
    loadingScene.value = false;
    loadingText.value = "";
    loadingProgress.value = 0;
  });

  return {
    loading,
    loadingScene,
    loadingScreen,
    loadingText,
    loadingProgress,
    showLoading,
    showSceneLoading,
    hideLoading
  };
});
