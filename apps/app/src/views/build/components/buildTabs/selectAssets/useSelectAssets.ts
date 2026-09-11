import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { assetsMenuManager } from "./assetsMenu";
import type { AssetsMenuKeyEnum, SingleAssetsTypeForRender } from "./assetsMenuType";

/** 资产库配置项类型 */
interface AssetLibraryConfigItem {
  title: string;
  key: AssetsMenuKeyEnum;
  canAdd: boolean;
}

export const useSelectAssets = () => {
  const router = useRoute();
  const loading = ref(false);
  // 计页器
  const params = ref({
    current: 1,
    size: 20,
    total: 0
  });

  const headerData = ref(["系统资产", "资产库", "本应用资产"]);
  // 存储数据
  const assetsSelectData = ref<SingleAssetsTypeForRender[]>([]);
  const assetsSide = ref<string>("");
  const groupId = ref<number | string>(-2);
  const groupName = ref<number | string>("全部");
  const assetsLibraryMap = ref<AssetLibraryConfigItem[]>([]);

  const resetParams = () => {
    params.value = {
      current: 1,
      size: 20,
      total: 0
    };
  };

  const changAssetsSide = (title?: string) => {
    if (title) {
      assetsSide.value = title;
    }
    groupName.value = "全部";
    groupId.value = -2;
    resetParams();
  };

  const changeGroupId = () => {
    const assetsIndex: number = assetsSelectData.value.findIndex((item) => {
      return item.title === assetsSide.value;
    });
    const item = assetsSelectData.value[assetsIndex];
    if (item.children) {
      const groupIndex: number = item.children.findIndex((item) => {
        return item.title === groupName.value;
      });
      groupId.value = item.children[groupIndex].groupId;
      resetParams();
    }
  };

  const getData = async () => {
    const index: number = assetsLibraryMap.value.findIndex((item: AssetLibraryConfigItem) => {
      return item.title === assetsSide.value;
    });

    const item = assetsLibraryMap.value[index];
    const DataItem = assetsSelectData.value[index];

    const groupIndex: number = DataItem.children.findIndex((child) => {
      return child.groupId === groupId.value;
    });

    const res = await assetsMenuManager.fetchAssetDataByParams({
      groupId: groupId.value,
      key: item.key,
      largeId: router.params.id,
      params: params.value
    });

    if (res && res.results) {
      DataItem.children[groupIndex].children = res.results;

      params.value.total = res.total;
    }
  };

  const initData = async () => {
    loading.value = true;
    const res = await assetsMenuManager.getAssetsLibraryData(headerData.value);
    if (res && res.libraryMapData) {
      assetsSelectData.value = res.libraryMapData;
      // 过滤掉可能的 undefined 值
      assetsLibraryMap.value = res.libraryMap.filter((item): item is AssetLibraryConfigItem => item !== undefined);

      changAssetsSide(assetsSelectData.value[0].title);
      resetParams();
      getData();
      loading.value = false;
    }
  };

  onMounted(() => {
    initData();
    console.log("onMounted 打开组件");
  });
  return {
    params,
    assetsSide,
    assetsSelectData,
    groupName,
    groupId,
    changAssetsSide,
    changeGroupId,
    getData,
    resetParams,
    loading
  };
};
