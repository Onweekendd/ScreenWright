<template>
  <div class="build-side-bar-action flex flex-justify-evenly flex-align-center">
    <div
      @click="handleClick(item, getDisabledByType(item.key))"
      v-for="item in operationList"
      :key="item.key"
      class="operation-item"
      :class="{ 'is-disabled': getDisabledByType(item.key) }"
    >
      <el-tooltip :content="item.label" placement="top" effect="light">
        <Icon :type="item.icon || ''" size="14" />
      </el-tooltip>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import Icon from "@/components/Icon/index.vue";
import { useActionDisabled } from "@/views/build/components/buildRender/hooks/useActionDisabled";
import type { MenuOptionsItemType } from "@/views/build/components/buildRender/type";
import { ContextMenuType } from "@/views/build/components/buildRender/type";

import { usePanelMenuOption } from "./usePanelMenuOption";

const { panelDefaultOptions } = usePanelMenuOption();
const { getDisabledByType } = useActionDisabled();
const operationList = computed(() => {
  const whiteList = [
    ContextMenuType.LOCK,
    ContextMenuType.DEL,
    ContextMenuType.GROUP,
    ContextMenuType.UN_GROUP,
    ContextMenuType.TOP,
    ContextMenuType.BOTTOM,
    ContextMenuType.CLEAR
  ];
  return panelDefaultOptions.value.filter((item) => whiteList.includes(item.key));
});
const handleClick = (item: MenuOptionsItemType, disabled: boolean) => {
  if (disabled) return;
  if (item.fnHandle) {
    item.fnHandle();
  }
};
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";

.build-side-bar-action {
  width: 100%;
  height: 39px;
  border-bottom: 1px solid $sw-border;
}
.operation-item {
  cursor: pointer;
  color: $sw-text-dim;
  transition: color 0.15s;
  &:hover:not(.is-disabled) {
    color: $sw-text-strong;
  }
  &.is-disabled {
    cursor: not-allowed;
    color: #606266;
  }
}
</style>
