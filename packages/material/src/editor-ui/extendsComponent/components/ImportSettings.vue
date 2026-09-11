<template>
  <div class="import-settings">
    <interface-config-form v-model="exportConfig" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import InterfaceConfigForm from "./InterfaceConfigForm/index.vue";

/** @description 导出配置类型 */
interface ExportConfig {
  apiUrl: string;
  method: "POST" | "GET";
  headers: Array<{ key: string; value: string }>;
  body: Array<{ key: string; value: string }>;
}

/** @description 组件属性定义 */
interface Props {
  /** @description 配置值 */
  modelValue: ExportConfig;
}

/** @description 组件事件定义 */
interface Emits {
  (e: "update:modelValue", value: ExportConfig): void;
}

// 定义props和emits
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算属性
const exportConfig = computed({
  get: () => props.modelValue,
  set: (value: ExportConfig) => emit("update:modelValue", value)
});
</script>

<style lang="scss" scoped>
.import-settings {
  // border-radius: 4px;
  // padding: 16px;
  // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .settings-header {
    margin-bottom: 20px;

    .title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin: 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #ebeef5;
    }
  }

  .url-section,
  .method-section {
    margin-bottom: 20px;
  }
}

// 添加系统紫色按钮样式
:deep(.el-button--primary),
:deep(.el-button--default.is-plain) {
  &.is-plain,
  &:not(.is-plain) {
    color: #ffffff;
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;

    &:hover,
    &:focus {
      background-image: linear-gradient(180deg, #9d75ed 0%, #7446ff 100%);
      border-color: transparent;
      color: #ffffff;
    }
  }
}
</style>
