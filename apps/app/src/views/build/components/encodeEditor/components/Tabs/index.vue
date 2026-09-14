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
import { computed } from "vue";
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
import { useEncodeTabsMenuGroup } from "@/views/build/components/encodeEditor/components/Tabs/useEncodeTabsMenuGroup";
import { useEncodePanelAction } from "@/views/build/components/encodeEditor/useEncodePanelAction";
import { useNavAction } from "@/views/build/useNavAction";

const route = useRoute();
const { navListType } = useNavAction();
const { activeTabsGroupMenu, getMaterialData, updatedMaterialLibraryItem } = useEncodeTabsMenuGroup();
const { componentAddToPanelEntry } = useEncodePanelAction();

const UIRenderData = computed<AllModuleForRender | AllAssetsForRender>(() => {
  return activeTabsGroupMenu.value;
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

  const menuGroupItem = (
    shouldRefreshGroups
      ? activeTabsGroupMenu.value.find((item) => item.title === option.title)?.children[0]
      : option.menuGroup
  ) as AssetsGroupForRender | undefined;
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
</script>
<style lang="scss" scoped>
.build-tabs {
  width: 100%;
  height: 37px;
  background-color: rgb(55, 58, 71);
}
</style>
