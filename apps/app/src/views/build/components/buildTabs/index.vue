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
  menuGroup?: SingleAssetsTypeForRender | SingleModuleTypeForRender;
  resetUpdate: boolean;
  updateGroup: boolean;
}) => {
  const shouldRefreshGroups = option.updateGroup || !option.menuGroup;
  if (shouldRefreshGroups) {
    await updatedMaterialLibraryItem(option.title);
  }

  const menuGroupItem = shouldRefreshGroups
    ? assetsData.value.find((item) => item.title === option.title)?.children[0]
    : option.menuGroup;
  if (!menuGroupItem) {
    return;
  }

  await getMaterialData({
    title: option.title,
    menuGroupItem: menuGroupItem as AssetsGroupForRender,
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
@import "src/style/theme.scss";
.build-tabs {
  width: 100%;
  height: 37px;
  align-items: center;
  padding: 0 4px;
  background-color: $sw-title-bg;
  border-bottom: 1px solid $sw-border;
  gap: 2px;
}
</style>
