import { ref } from "vue";

import { ElMessage } from "element-plus";
import { get } from "lodash-es";

import { getQuoteScreenObj } from "@/api/visual";
import { useBluePrint } from "@/hooks/useBluePrint";
import { pipeValidator } from "@/utils/pipeValidator";
import { getVersionCode } from "@/utils/version";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
export const useQuotePanelData = () => {
  const loading = ref(false);
  const { tranFormBluePrint } = useBluePrint();
  const { groupData } = useGlobalComponentData();
  const handleEmptyTemplate = (layers: ComponentType[] | string[]) => {
    if (layers.length === 0) {
      ElMessage.info("该大屏未配置组件！");
      return false;
    }
    return true;
  };

  const handleSceneTemplate = (layers: ComponentType[] | string[]) => {
    const fn = (item: ComponentType) => item.title === "场景模板";
    const parseLayersData = layers.map((item) => {
      if (typeof item === "string") {
        return JSON.parse(item);
      }
      return item;
    });
    const isHasMoreScene = groupData.value.find(fn) && parseLayersData.find(fn);
    if (isHasMoreScene) {
      ElMessage.info("大屏已存在场景模板！引用面板中不可以重复添加！");
      return false;
    }
    return true;
  };

  const getPanelData = async (target: { id: string | number; name: string; version: string; value: string }) => {
    if (!target.value) {
      return {
        panelData: [],
        detail: ""
      };
    }
    try {
      loading.value = true;
      const response = await getQuoteScreenObj(
        {
          // 大屏id
          largeScreenId: Number(target.value),
          // 引用面板id
          quoteId: Number(target.value),
          // 是否发布
          status: 0,
          // 大屏版本
          largeVersion: getVersionCode() || "1",
          // 引用大屏版本
          quoteVersion: target.version || "1"
        },
        false,
        false
      );
      console.log("Fetched quote screen object:", response);
      if (response.success) {
        const canAddTemplate = await new pipeValidator()
          .add(() => handleEmptyTemplate(response.result.layers))
          .add(() => handleSceneTemplate(response.result.layers))
          .validate();
        if (!canAddTemplate) {
          loading.value = false;

          return {
            panelData: [],
            detail: ""
          };
        }

        const quotePanelData = response.result.layers.map((item: any) => {
          return JSON.parse(item);
        });
        await tranFormBluePrint(quotePanelData, Number(target.value));
        loading.value = false;

        return {
          panelData: quotePanelData,
          detail: response.result.detail
        };
      } else {
        loading.value = false;
        ElMessage.error("获取引用面板数据失败！");
        return {
          panelData: [],
          detail: ""
        };
      }
    } catch (error) {
      loading.value = false;
      console.error("Error fetching quote screen object:", error);
      const status = get(error, "response.status");
      if (status === 401) {
        ElMessage.error("当前用户无权限访问引用面板数据，请联系管理员！");
      }
      return {
        panelData: [],
        detail: ""
      };
    }
  };
  return {
    loading,
    getPanelData
  };
};
