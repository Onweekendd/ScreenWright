<template>
  <div class="config-item">
    <div class="label">
      <span :style="{ marginRight: showTooltip ? '8px' : '0' }">{{ label }}</span>
      <el-tooltip v-if="showTooltip" class="item" effect="dark" placement="right">
        <template #default> <Icon type="el-icon-question" style="font-size: 14px" /></template>
        <template #content>
          <p style="width: 300px">
            {{ tooltipContent }}
          </p>
        </template>
      </el-tooltip>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from "@editor/base/Icon/index.vue";

interface Props {
  label: string;
  showTooltip?: boolean;
  tooltip?: string;
  tooltipContent?: string;
}

withDefaults(defineProps<Props>(), {
  showTooltip: false,
  tooltip: "",
  tooltipContent: ""
});
</script>

<style lang="scss" scoped>
.config-item {
  display: flex;
  align-items: center;
  width: 100%;

  .label {
    width: 80px;
    font-size: 14px;
    color: #606266;
    margin-right: 10px;
  }

  .content {
    flex: 1;
  }
}
</style>
