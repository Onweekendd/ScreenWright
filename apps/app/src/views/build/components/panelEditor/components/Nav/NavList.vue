<template>
  <div class="build-nav-list flex flex-align-center">
    <controlItem
      v-for="item in filteredNavigationItems"
      :key="item.iconType"
      :type="item.iconType"
      :name="item.name"
      :en-name="item.enName"
      :is-active="navListType == (item.type as unknown as NavListType)"
      @click="handleNavigationItemClick(item)"
    />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import controlItem from "@/views/build/components/controlItem/index.vue";
import type { NavListType } from "@/views/build/useNavAction";
import { useNavAction } from "@/views/build/useNavAction";
import {
  NavigationActionType,
  type NavigationControlItem,
  useNavigationStrategies
} from "@/views/build/useNavListStrategies";

import { usePanelInfo } from "../../usePanelInfo";

const { navListType } = useNavAction();
const { isScenePopupPanel } = usePanelInfo();
const { getStrategiesForPanelEditor, filterNavigationItems } = useNavigationStrategies();

const executeNavigationStrategy = (item: NavigationControlItem): void => {
  const strategies = getStrategiesForPanelEditor();
  const strategy = strategies[item.type];
  if (strategy) {
    strategy();
  }
};

const navigationItems: NavigationControlItem[] = [
  {
    name: "组件",
    enName: "Assembly",
    iconType: "iconfont-assembly",
    type: NavigationActionType.COMPONENT
  },
  {
    name: "素材库",
    enName: "Material Library",
    iconType: "iconfont-Material",
    type: NavigationActionType.MATERIAL_LIBRARY
  },
  {
    name: "动态面板",
    enName: "Dynamic Panel",
    iconType: "iconfont-dongtaimianban",
    type: NavigationActionType.DYNAMIC_PANEL_IN_PANEL,
    showCondition: () => !isScenePopupPanel.value
  },
  {
    name: "项目过滤器",
    enName: "Project Filter",
    iconType: "iconfont-jiekousheji",
    type: NavigationActionType.PROJECT_FILTER
  },
  {
    name: "回调管理",
    enName: "Callback Manage",
    iconType: "iconfont-interactive_btn",
    type: NavigationActionType.CALLBACK_MANAGE
  }
];

const filteredNavigationItems = computed(() => {
  return filterNavigationItems(navigationItems);
});

const handleNavigationItemClick = (item: NavigationControlItem): void => {
  executeNavigationStrategy(item);
};
</script>
<style lang="scss" scoped>
.build-nav-list {
  gap: 8px;
}
</style>
