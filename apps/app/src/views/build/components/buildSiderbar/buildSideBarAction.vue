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
import { useMenuOptions } from "@/views/build/components/buildRender/hooks/useMenuOptions";
import type { MenuOptionsItemType } from "@/views/build/components/buildRender/type";
import { ContextMenuType } from "@/views/build/components/buildRender/type";

const { defaultOptions } = useMenuOptions();
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
  return defaultOptions.value.filter((item) => whiteList.includes(item.key));
});
const handleClick = (item: MenuOptionsItemType, disabled: boolean) => {
  if (disabled) return;
  if (item.fnHandle) {
    item.fnHandle();
  }
};
</script>
<style lang="scss" scoped>
.build-side-bar-action {
  width: 100%;
  height: 39px;
  border-bottom: 1px solid #000;
}
.operation-item {
  cursor: pointer;
  &.is-disabled {
    cursor: not-allowed;
    color: #606266;
  }
}
</style>
