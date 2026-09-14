<template>
  <div class="component-search-body">
    <div class="component-search-body-header flex fullWidth">
      <div
        class="component-search-tabs flex flex-center"
        v-for="item in tabs"
        :key="item.value"
        :class="{ 'is-active': item.value === modelValue }"
        @click="$emit('update:modelValue', item.value)"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Props } from "./type";
import { searchTabsEmit } from "./type";
import { useTabsUpdate } from "./useTabsUpdate";

let props = defineProps<Props>();
const emit = defineEmits(searchTabsEmit);
useTabsUpdate(props, emit);
</script>
<style lang="scss" scoped>
.component-search-body-header {
  .component-search-tabs {
    flex: 1;
    cursor: pointer;
    font-size: 12px;
    height: 38px;
    line-height: 38px;
    text-align: left;
    color: #b4b7c1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
    &.is-active {
      background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      color: #fff;
    }
  }
}
</style>
