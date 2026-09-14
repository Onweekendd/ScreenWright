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
import type {
  AssetsGroupForRender,
  MenuItemForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import type {
  AllAssetsForRender,
  AllModuleForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { useNavAction } from "@/views/build/useNavAction";
import { NavListType } from "@/views/build/useNavAction";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import { usePanelAction } from "../../usePanelAction";

const route = useRoute();
const { navListType } = useNavAction();
const { tabsGroupMenu, assetsData, getMaterialData, updatedMaterialLibraryItem, getModuleInfoListApi } =
  useTabsMenuGroup();
const { componentAddToPanelEntry } = usePanelAction();

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
  menuGroup?: AssetsGroupForRender;
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
    menuGroupItem,
    largeId: route.params.id,
    resetUpdate: option.resetUpdate
  });
};

const handleClick = async (item: MenuItemForRender) => {
  return componentAddToPanelEntry(item, navListType.value);
};

onMounted(async () => {
  await getModuleInfoListApi();
});
</script>
<style lang="scss" scoped>
.build-tabs {
  width: 100%;
  height: 37px;
  background-color: rgb(55, 58, 71);
}
</style>
