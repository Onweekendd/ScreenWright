import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";

import { ElMessage } from "element-plus";

import { useBaseData } from "@/hooks/useBaseData";
import { getVersionCode } from "@/utils/version";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import { useQuotePanelData } from "./useQuptePanelData";
export const useQuotePanel = (element: ComponentType) => {
  const screenQuoteRef = ref<HTMLElement | null>(null);
  const quotePanelData = shallowRef<ComponentType[] | null>(null);
  const { getPanelData, loading } = useQuotePanelData();
  const { isBuild } = useBaseData(element);
  let timer: NodeJS.Timer | null = null;
  const route = useRoute();
  const handleJumpQuotePanel = () => {
    if (!isBuild.value) {
      return;
    }

    if (element.isLock) {
      ElMessage.error("引用面板已锁定！");
      return;
    }
    if (!element.panelData || element.panelData.length === 0) {
      ElMessage.error("请设置引用面板的大屏！");
      return;
    }
    const currentDisplayList = element.option.displayList[parseInt(element.status)];
    if (currentDisplayList.value === "" || currentDisplayList.version === "") {
      ElMessage.error("请设置引用面板的大屏!");
      return;
    }

    const isDelete = element.panelData.some((v: any) => {
      return v.detail.length === 0;
    });

    if (isDelete) {
      ElMessage.error("引用面板的大屏已被删除，请重新设置！");
      return;
    }
    const { PUBLIC_PATH } = process.env;
    const index = parseInt(element.status);
    const target = element.option.displayList[index];
    const list = JSON.parse(window.localStorage.getItem("versionCodeList") || "[]");
    const currentVersion = getVersionCode();
    const fromPath = `${PUBLIC_PATH}${route.path.substring(1)}`;
    const fromVersion = currentVersion || "1";
    const toPath = `${PUBLIC_PATH}build/${target.value}?version=${target.version}`;
    list.push({
      fromPath,
      toPath,
      fromVersion,
      toVersion: target.version || "1"
    });
    window.localStorage.setItem("versionCodeList", JSON.stringify(list));
    window.location.href = toPath;
  };
  // 检查是否存在相互引用的大屏
  const checkSamePanelData = (panelData: ComponentType[], target: any) => {
    const queryId = route.params?.id as string;
    const quoteList = panelData.filter((v) => v.component.prop === PanelType.quotePanel);
    if (quoteList.length > 0) {
      let isHasSameId = null;
      for (let i = 0; i < quoteList.length; i++) {
        const v = quoteList[i];
        const option = v.option || {};
        const displayList = option.displayList || [];
        const foundItem = displayList.find((item: any) => {
          return `${item.value}` === queryId;
        });
        if (foundItem) {
          isHasSameId = foundItem;
          break;
        }
      }
      if (isHasSameId && Object.keys(isHasSameId).length > 0) {
        if (target && isHasSameId && `${target.version}` === `${isHasSameId.version}`) {
          ElMessage.warning("存在引用面板嵌套引用大屏,会造成死循环，故不显示该组件！");
          return panelData.filter((v) => v.component.prop !== PanelType.quotePanel);
        } else {
          return panelData;
        }
      }
    }
    return panelData;
  };
  const initPanelData = async (status: number) => {
    const displayList = element.option.displayList || [];
    const target = displayList[status || 0];
    const isLibMode = typeof __BUILD_MODE__ !== "undefined" && __BUILD_MODE__ === "lib";
    if (isLibMode) {
      quotePanelData.value = element.panelData[Number(element.status)].config;
    } else {
      if (target && target.value) {
        const panelDataResponse = await getPanelData(target);
        if (panelDataResponse) {
          quotePanelData.value = checkSamePanelData(panelDataResponse.panelData, target);
          const isHasPanelData = displayList.some((v: any) => v.value === Number(target.value));
          const targetPanel = {
            id: Number(target.value),
            component: [],
            detail:
              typeof panelDataResponse.detail === "string" && panelDataResponse.detail.length > 0
                ? JSON.parse(panelDataResponse.detail)
                : panelDataResponse.detail,
            config: quotePanelData.value
          };

          console.log("targetPanel", targetPanel);
          if (isHasPanelData) {
            element.panelData[element.status] = targetPanel;
          } else {
            element.panelData.push(targetPanel);
          }
        }
      } else {
        quotePanelData.value = [];
      }
    }
  };
  const startAutoPlay = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (!element.option.autoRotation || isBuild.value) {
      return;
    }

    const ANIMATION_DURATION = 1000; // 动画持续时间(ms)
    const { animationType, timingFunction } = element.option;
    const animation = `${animationType}0 ${ANIMATION_DURATION}ms linear 1`;
    const panelData = element.option.displayList;
    const intervalTime = parseFloat(timingFunction) * 1000;

    // 检查DOM引用是否存在
    if (!screenQuoteRef.value) {
      return;
    }

    // 定义重置动画的函数，避免重复代码
    const resetAnimation = () => {
      if (screenQuoteRef.value) {
        screenQuoteRef.value.style.animation = "";
      }
    };

    // 初始执行一次动画
    screenQuoteRef.value.style.animation = animation;
    setTimeout(resetAnimation, ANIMATION_DURATION);

    // 设置自动播放定时器
    timer = setInterval(() => {
      const maxIndex = panelData.length - 1;
      element.status = element.status >= maxIndex ? 0 : Number(element.status) + 1;
      // 执行动画并在结束后重置
      if (screenQuoteRef.value) {
        screenQuoteRef.value.style.animation = animation;
      }
      setTimeout(resetAnimation, ANIMATION_DURATION);
    }, intervalTime);
  };

  const panelViewStyle = computed(() => {
    return element.option.enableScroll && !isBuild.value ? { overflow: "auto" } : { overflow: "hidden" };
  });
  const panelZIndexStyle = computed(() => {
    return !isBuild.value ? { zIndex: 999 } : { zIndex: -1 };
  });

  watch(
    () => element.status,
    async () => {
      initPanelData(element.status);
    }
  );

  watch(
    () => element.option.refreshKey,
    async () => {
      initPanelData(element.status);
    }
  );

  onMounted(async () => {
    await initPanelData(element.status);
    startAutoPlay();
  });
  return {
    quotePanelData,
    screenQuoteRef,
    loading,
    panelViewStyle,
    panelZIndexStyle,
    isBuild,
    initPanelData,
    handleJumpQuotePanel
  };
};
