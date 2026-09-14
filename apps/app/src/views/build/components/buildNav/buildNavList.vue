<template>
  <div class="build-nav-list flex flex-align-center">
    <controlItem
      v-for="item in filteredNavigationItems"
      :key="item.iconType"
      :type="item.iconType"
      :name="item.name"
      :en-name="item.enName"
      :compact="compact"
      :is-active="navListType === (item.type as unknown as NavListType)"
      @click="handleNavigationItemClick(item)"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from "vue";

import type { NavListType } from "../../useNavAction";
import { useNavAction } from "../../useNavAction";
import { NavigationActionType, type NavigationControlItem, useNavigationStrategies } from "../../useNavListStrategies";
import { useEditStore } from "../buildRender/hooks/useEditStore";
import controlItem from "../controlItem/index.vue";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

const { navListType } = useNavAction();
const { executeNavigationStrategy, filterNavigationItems } = useNavigationStrategies();
const { editConfig } = useEditStore();

// 基础导航控制项配置 - 重命名以更好表达意图
const baseNavigationItems: NavigationControlItem[] = [
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
    name: "应用预览",
    enName: "App Preview",
    iconType: "iconfont-preview",
    type: NavigationActionType.ARTIFACT_APP_PREVIEW
  },
  {
    name: "动态面板",
    enName: "Dynamic Panel",
    iconType: "iconfont-dongtaimianban",
    type: NavigationActionType.DYNAMIC_PANEL
  },
  {
    name: "引用面板",
    enName: "Quote Panel",
    iconType: "iconfont-quote",
    type: NavigationActionType.QUOTE_PANEL
  },
  {
    name: "终端交互",
    enName: "Term Inter",
    iconType: "iconfont-zhongduanjiaohu",
    type: NavigationActionType.ENCODE_PANEL,
    showCondition: () => !!editConfig.value.isEncodedControl
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

// 计算属性：根据条件过滤导航控制项 - 重命名以更好表达意图
const filteredNavigationItems = computed(() => {
  return filterNavigationItems(baseNavigationItems);
});

const handleNavigationItemClick = (item: NavigationControlItem): void => {
  executeNavigationStrategy(item);
};
onMounted(() => {
  handleNavigationItemClick(filteredNavigationItems.value[0]);
});
</script>
<style lang="scss" scoped>
.build-nav-list {
  gap: 8px;
}
</style>
