<template>
  <div class="build-tabs flex">
    <buildTabsItem
      :title="item.title"
      @click="handleClick"
      @initMaterialData="initMaterialData"
      v-for="item in UIRenderData"
      :key="item.title"
      :menuGroup="item.children ?? []"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";

import buildTabsItem from "@/views/build/components/buildTabs/buildTabsItem.vue";
// import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import type {
  AllAssetsForRender,
  AllModuleForRender,
  AssetsGroupForRender,
  MenuItemForRender,
  SingleAssetsTypeForRender,
  SingleModuleTypeForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { useEncodeTabsMenuGroup } from "@/views/build/components/encodeEditor/components/Tabs/useEncodeTabsMenuGroup";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import { NavListType, useNavAction } from "../../useNavAction";
import { useEditStore } from "../buildRender/hooks/useEditStore";

const route = useRoute();
const { navListType } = useNavAction();
const { isEncodePanel } = useEditStore();
const {
  tabsGroupMenu,
  assetsData,
  getMaterialData,
  updatedMaterialLibraryItem,
  addComponentByNavType,
  getModuleInfoListApi
} = useTabsMenuGroup();
const { getEncodeModuleInfoListApi } = useEncodeTabsMenuGroup();

const UIRenderData = computed<AllModuleForRender | AllAssetsForRender>(() => {
  if (navListType.value === NavListType.Component) {
    return tabsGroupMenu.value;
  } else if (navListType.value === NavListType.MaterialLibrary) {
    return assetsData.value;
  }

  return [];
});
// 获取数据
const initMaterialData = async (option: {
  title: string;
  menuGroup: SingleAssetsTypeForRender | SingleModuleTypeForRender;
  resetUpdate: boolean;
  updateGroup: boolean;
}) => {
  if (option.updateGroup) {
    await updatedMaterialLibraryItem(option.title);
  }

  getMaterialData({
    title: option.title,
    menuGroupItem: option.menuGroup as AssetsGroupForRender,
    largeId: route.params.id,
    resetUpdate: option.resetUpdate
  });
};

onMounted(() => {
  if (isEncodePanel()) {
    getEncodeModuleInfoListApi();
  } else {
    getModuleInfoListApi();
  }
});

const handleClick = async (item: MenuItemForRender) => {
  addComponentByNavType(item, navListType.value);
};
</script>
<style lang="scss" scoped>
.build-tabs {
  width: 100%;
  height: 37px;
  background-color: rgb(55, 58, 71);
}
</style>
