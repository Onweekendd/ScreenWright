<template>
  <div class="config-item">
    <div class="label">
      <span :style="{ marginRight: showTooltip ? '8px' : '0' }">{{ label }}</span>
      <el-tooltip v-if="showTooltip" class="item" effect="dark" placement="right">
        <template #content>
          <p style="width: 300px">
            {{ tooltipContent }}
          </p>
        </template>
        <Icon type="QuestionFilled" size="14" style="position: relative; top: 2px; left: 0px" />
      </el-tooltip>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from "@editor/base/Icon/index.vue";

/** @description 组件属性定义 */
interface Props {
  /** @description 标签文本 */
  label: string;
  /** @description 是否显示提示 */
  showTooltip?: boolean;
  /** @description 提示内容（兼容旧版本） */
  tooltip?: string;
  /** @description 提示内容 */
  tooltipContent?: string;
}

// 定义props
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
    font-size: 12px;
    margin-right: 10px;
  }

  .content {
    flex: 1;
    margin-left: 10px;
  }
}
</style>
