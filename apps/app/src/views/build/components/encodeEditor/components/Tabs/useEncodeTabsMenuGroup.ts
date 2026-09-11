import { computed, onMounted, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { getModuleInfoList } from "@/api/library";
import type { ModuleInfo } from "@/model/Library";
import to from "@/utils/await-to-js";
import { assetsMenuManager } from "@/views/build/components/buildTabs/selectAssets/assetsMenu";
import type {
  AllModuleForRender,
  SingleModuleTypeForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { useNavAction } from "@/views/build/useNavAction";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

/**
 * 处理编码模块信息列表，进行数据转换和过滤
 * 将原始的模块信息转换为菜单组结构，只包含指定ID的组件，并按预定义规则进行排序
 * @param records - 原始的模块信息数组
 * @returns 处理后的编码组件菜单组数据，已过滤出指定ID的组件
 */
const processEncodeModuleInfoList = (records: ModuleInfo[]): AllModuleForRender => {
  // 指定需要的组件ID列表 TODO: 转为使用 component.prop 来完成
  const allowedIds = [
    21, 43, 46, 47, 49, 50, 53, 54, 61, 63, 79, 106, 107, 108, 109, 128, 130, 131, 132, 133, 135, 155
  ];

  // 过滤出指定ID的组件
  const filteredRecords = records.filter((record) => allowedIds.includes(record.id));

  // 直接创建常规分组，把所有过滤出的组件放入其中
  const regularGroup: SingleModuleTypeForRender = {
    title: "常规",
    children: filteredRecords.map((record) => ({
      title: record.name,
      img: record.thumbnail,
      moduleId: record.id
    }))
  };

  return [regularGroup];
};

/**
 * 系统资产的数据对象创建和管理hooks
 * 提供组件菜单、素材库等数据的获取和管理功能
 * 使用createGlobalState确保全局状态一致性
 */
export const useEncodeTabsMenuGroup = createGlobalState(() => {
  const { navListType } = useNavAction();
  const { assetsData, getMaterialData, getLibraryByMaterial, updatedMaterialLibraryItem } = useTabsMenuGroup();
  const encodeTabsGroupMenu = ref<AllModuleForRender>([]);

  const activeTabsGroupMenu = computed(() => {
    return navListType.value === "component" ? encodeTabsGroupMenu.value : assetsData.value;
  });

  /**
   * 获取模块信息列表的API调用
   * 从服务器获取组件模块信息，并处理成菜单组数据格式
   */
  const getEncodeModuleInfoListApi = async (): Promise<void> => {
    const [error, res] = await to(getModuleInfoList());
    if (error) {
      return;
    }
    if (res && res.success) {
      encodeTabsGroupMenu.value = processEncodeModuleInfoList(res.result.records);
    }
  };

  /**
   * 获取素材库列表
   * 获取系统定义的素材库分类数据（资产库、本应用资产）
   */
  const getMaterialLibraryList = async (): Promise<void> => {
    const dataRes = ["资产库", "本应用资产"];
    encodeTabsGroupMenu.value = [];

    const res = await assetsMenuManager.getAssetsLibraryData(dataRes);
    if (res && res.libraryMapData) {
      encodeTabsGroupMenu.value = res.libraryMapData;
    }
  };

  onMounted(async () => {
    await getEncodeModuleInfoListApi();
  });

  return {
    activeTabsGroupMenu,
    encodeTabsGroupMenu,
    getEncodeModuleInfoListApi,
    getMaterialLibraryList,
    getMaterialData,
    getLibraryByMaterial,
    updatedMaterialLibraryItem
  };
});
