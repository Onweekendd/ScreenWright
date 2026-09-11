<!-- 图标配置的tab -->
<template>
  <div class="config-attrs-tab">
    <div class="config-tab-header flex">
      <div
        v-for="item in options.filter((v) => !v.hidden)"
        :key="item.value"
        class="config-tab-item flex flex-center"
        :class="{ ' is-active': item.value === input }"
        @click="handleChange(item.value)"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { configAttrsTabProps } from "./configAttrsTab";
import { configAttrsTabEmits } from "./configAttrsTab";
import { useConfigAttrsTab } from "./useConfigAttrsTab";

const props = defineProps<configAttrsTabProps>();
const emits = defineEmits(configAttrsTabEmits);
const { input, options, handleChange } = useConfigAttrsTab(props, emits);
</script>
<style lang="scss" scoped>
.config-attrs-tab {
  padding: 0;
  position: relative;
  margin: 0 0 15px;
  width: 100%;
  .config-tab-item {
    height: 30px;
    line-height: 30px;
    border-radius: 5px 5px 0px 0px;
    border-bottom: 2px solid #642cff;
    background-color: #383b47;
    width: 100%;
    list-style: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    &.is-active {
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      color: #fff;
    }
  }
}
</style>
