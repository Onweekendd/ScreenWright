<template>
  <div class="build-tabs flex">
    <buildTabsItem
      :title="item.title"
      @click="handleClick"
      @initMaterialData="initMaterialData"
      v-for="item in tabsData"
      :key="item.title"
      :menuGroup="item.children ?? []"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

import buildTabsItem from "@/views/build/components/buildTabs/buildTabsItem.vue";
import type { AssetsGroupForRender } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { useNavAction } from "@/views/build/useNavAction";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

// 定义 props 接口
interface BaseTabsProps {
  tabsData: any[]; // 标签页数据
  clickHandler: (item: any, navType: any) => Promise<any>; // 点击处理函数
}

// 定义 props
const props = defineProps<BaseTabsProps>();

// 基础 hooks
const route = useRoute();
const { navListType } = useNavAction();
const { assetsData, getMaterialData, updatedMaterialLibraryItem } = useTabsMenuGroup();

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

// 点击处理
const handleClick = async (item: { id: number; moduleId: string; type?: string; img?: string; url?: string }) => {
  return props.clickHandler(item, navListType.value);
};
</script>

<style lang="scss" scoped>
.build-tabs {
  width: 100%;
  height: 37px;
  background-color: rgb(55, 58, 71);
}
</style>
