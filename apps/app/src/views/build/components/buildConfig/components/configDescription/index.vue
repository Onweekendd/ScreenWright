<!-- 组件描述 -->
<template>
  <div class="config-description" v-if="selectTargetData && selectTargetData[0] && selectTargetData.length > 0">
    <div class="component-name text-overflow">{{ selectTargetData[0].title }}</div>
    <div class="component-description">
      {{
        `v${"1.0.0"} | ${selectTargetData[0].title} | ${selectTargetData[0].id} | ${selectTargetData[0].zIndex || 0}`
      }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useEditStore } from "../../../buildRender/hooks/useEditStore";

const { selectTargetData } = useEditStore();
</script>
<style lang="scss" scoped>
.config-description {
  box-sizing: border-box;
  font-size: 12px;
  padding: 8px 16px 16px 16px;
  position: relative;
  .component-name {
    color: #fff;
    margin-bottom: 3px;
  }
  .text-overflow {
    width: 100%;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .component-description {
    display: inline;
    color: #666666;
    padding-left: 4px;
    white-space: nowrap;
  }
}
</style>
