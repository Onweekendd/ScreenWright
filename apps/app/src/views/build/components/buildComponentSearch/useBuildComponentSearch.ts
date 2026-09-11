import { nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import { createGlobalState } from "@vueuse/core";

import { minioPage } from "@/api/assets";
import { getModuleInfoList } from "@/api/library";
import { sleep } from "@/utils/utils";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";
import { AssetsMenuKeyEnum } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { useEncodePanelAction } from "@/views/build/components/encodeEditor/useEncodePanelAction";
import { usePanelAction } from "@/views/build/components/panelEditor/usePanelAction";
import { NavListType } from "@/views/build/useNavAction";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import type { ComponentType } from "../buildRender/type";
import { traverseComponentGroups } from "./utils";

export const useBuildComponentSearch = createGlobalState(() => {
  const buildTreeRef = ref();
  const { addComponentByNavType } = useTabsMenuGroup();
  const { componentAddToPanelEntry } = usePanelAction();
  const { componentAddToPanelEntry: componentAddToEncodeEntry } = useEncodePanelAction();
  const { setTargetSelectChart, scrollIntoViewTree, selectTargetData, componentList } = useEditStore();
  const activeTab = ref(AssetsMenuKeyEnum.assetsCloud);
  const route = useRoute();
  const systemApi = async (params: any): Promise<any[]> => {
    const res = await getModuleInfoList(params);
    return res.result.records.map((item) => ({
      id: item.id,
      title: item.name,
      img: item.thumbnail || "",
      name: item.name,
      moduleId: item.id,
      isVideo: false
    }));
  };
  const layerApi = async (): Promise<any[]> => {
    return new Promise((resolve) => {
      const layersData = traverseComponentGroups(componentList.value).map((item) => ({
        id: item.id,
        title: item.name,
        img: item.img || "",
        name: item.name,
        isVideo: false
      }));
      resolve(layersData);
    });
  };
  const assetsCloudApi = async (params: any): Promise<any[]> => {
    const dataParams = {
      fileType: 2,
      groupId: "-2",
      largeId: Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
      time: 1,
      ...params
    };
    const res = await minioPage(dataParams);
    const assetsCloudClass = assetsClassManager.getAssetsClass(AssetsMenuKeyEnum.assetsCloud);
    return assetsCloudClass.transformAssetsData(res.result.records);
  };

  const tabs = ref([
    { label: "资产库", value: AssetsMenuKeyEnum.assetsCloud, getApi: assetsCloudApi },
    { label: "系统组件", value: "component", getApi: systemApi },
    { label: "系统图层", value: "layer", getApi: layerApi }
  ]);
  const handleItemClick = async (item: any, active: string, type: "panel" | "render" | "encode") => {
    console.log("Item clicked in sidebar:", item, active);

    // 提取处理layer的公共方法
    const handleLayer = async (id: number) => {
      setTargetSelectChart(`${id}`);
      await nextTick();
      const targetData = selectTargetData.value?.[0];
      if (!targetData) {
        return;
      }

      const { parent: targetParentId, id: targetId } = targetData;
      const parentIdStr = `${targetParentId}`;

      // 处理父节点展开逻辑
      if (targetParentId && buildTreeRef.value?.expandedIds?.includes(parentIdStr) === false) {
        buildTreeRef.value?.handleToggleExpand(parentIdStr);
        await sleep(400);
      }
      console.log(targetId, "targetId");

      scrollIntoViewTree(`${targetId}`);
    };

    // 主逻辑判断
    const isPanel = type === "panel";
    const isRender = type === "render";
    const isEncode = type === "encode";
    const isMaterialType = ["assetsCloud"].includes(active);
    if (active === "component") {
      if (isPanel) {
        const res = (await componentAddToPanelEntry(item, NavListType.Component)) as ComponentType;
        if (res) {
          handleLayer(res.id);
        }
      } else if (isRender) {
        const res = (await addComponentByNavType(item, NavListType.Component)) as ComponentType;
        if (res) {
          handleLayer(res.id);
        }
      } else if (isEncode) {
        const res = (await componentAddToEncodeEntry(item, NavListType.Component)) as ComponentType;
        if (res) {
          handleLayer(res.id);
        }
      }
    } else if (isMaterialType) {
      if (isPanel) {
        const res = await componentAddToPanelEntry(item, NavListType.MaterialLibrary);
        if (res && Array.isArray(res) && res.length > 0) {
          handleLayer(res[0].id);
        }
      } else if (isRender) {
        const res = await addComponentByNavType(item, NavListType.MaterialLibrary);
        if (res && Array.isArray(res) && res.length > 0) {
          handleLayer(res[0].id);
        }
      } else if (isEncode) {
        const res = await componentAddToEncodeEntry(item, NavListType.MaterialLibrary);
        if (res && Array.isArray(res) && res.length > 0) {
          handleLayer(res[0].id);
        }
      }
    } else if (active === "layer") {
      await handleLayer(item.id);
    }
  };

  return {
    buildTreeRef,
    tabs,
    activeTab,
    handleItemClick
  };
});
