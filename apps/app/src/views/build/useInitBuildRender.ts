import { type ComponentPublicInstance, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";

import type buildRender from "./components/buildRender/buildRender.vue";
import { useGlobalComponentData } from "./useGlobalComponentData";
import { useInitLargeScreenData } from "./useInitLargeScreenData";

const { loadingScene } = useGlobalLoading();
interface Props {
  direct?: boolean;
}

export const useInitBuildRender = (props: Props) => {
  const route = useRoute();
  const { initLargeScreen } = useInitLargeScreenData();
  const { groupData } = useGlobalComponentData();
  const buildRenderRef = ref<ComponentPublicInstance<InstanceType<typeof buildRender>> | null>(null);
  onMounted(async () => {
    loadingScene.value = true;
    await initLargeScreen(Number(route.params.id));
    if (buildRenderRef.value) {
      buildRenderRef.value.initRender(groupData.value);
      // 如果props.direct为true，则初始化方向键
      if (props.direct) {
        buildRenderRef.value.initDirection();
      }
    }
    loadingScene.value = false;
  });

  return {
    loadingScene,
    buildRenderRef
  };
};
