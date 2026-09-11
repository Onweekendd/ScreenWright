<template>
  <el-select
    :style="style"
    popper-class="config-select sw-select-dropdown"
    :class="{ 'opt-multiple': multiple }"
    placeholder="请选择"
    v-model="inputValue"
    :size="size"
    :clearable="clearable"
    :multiple="multiple"
    @change="handleValueChange"
    :filterable="filterable"
    :popper-append-to-body="false"
    ref="selectRef"
  >
    <el-option
      v-for="item in processedOptions.filter((item) => !excludesList.includes(item.value))"
      :class="{ hidden: hasTree }"
      :key="item.value"
      :label="item.label"
      :value="item.assetsType ? item : item.value"
      :disabled="item.disabled"
    >
      <span class="opt-item" :data-translate="item.label">{{ item.label }}</span>
    </el-option>
    <div v-if="hasTree">
      <div class="filter-container">
        <div class="filter-text">
          <sw-input v-model="filterText" placeholder="输入关键字进行过滤" style="width: 100%" />
        </div>
      </div>
      <SourceTree
        ref="treeRef"
        :nodeKey="nodeKey"
        :showCheckbox="true"
        :checkedKeys="normalizeValue(inputValue)"
        :treedata="options"
        :checkStrictly="checkStrictly"
        :isCheckbox="isCheckbox"
        :filterText="filterText"
        @fireOnCheckChange="handleTreeCheckChange"
      />
    </div>
  </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useVModel } from "@vueuse/core";

import SwInput from "@/components/SwInput/index.vue";

import { ConfigFieldEnum } from "../options";
import SourceTree from "./sourceTree.vue";
import { type ConfigSelectOption, type ConfigSelectProps, useConfigSelect } from "./useConfigSelect";

type Props = ConfigSelectProps;

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  field: ConfigFieldEnum.None,
  option: () => [],
  size: "small",
  multiple: false,
  clearable: false,
  excludes: "",
  hasTree: false,
  checkStrictly: false,
  isCheckbox: true,
  nodeKey: "id",
  labelFormat: (item: ConfigSelectOption) => item.label,
  filterable: false,
  isComp: false,
  isReserveCheckedGroup: false,
  style: () => ({})
});

const emit = defineEmits<{
  (e: "change", value: string | string[] | number[], checkedNodesList?: ConfigSelectOption[]): void;
  (e: "update:modelValue", value: string | string[] | number[]): void;
}>();

const inputValue = useVModel(props, "modelValue", emit);
const treeRef = ref();

// 将 number 和 number[] 转换为 string[] 的辅助函数，用于内部处理
const normalizeValue = (value: string | string[] | number[] | number | undefined): string | string[] | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return String(value);
};

// 将 inputValue 转换为 useConfigSelect 期望的类型
const normalizedInputValue = computed({
  get: () => normalizeValue(inputValue.value),
  set: (value: string | string[] | number[] | undefined) => {
    // 检查原始 inputValue 的类型并保持一致
    if (Array.isArray(inputValue.value) && inputValue.value.length > 0 && typeof inputValue.value[0] === "number") {
      // 原始是 number[]，保持为 number[]
      if (Array.isArray(value)) {
        inputValue.value = value.map((v) => Number(v)) as number[];
      } else if (value !== undefined) {
        inputValue.value = [Number(value)] as number[];
      } else {
        inputValue.value = value;
      }
    } else if (typeof inputValue.value === "number") {
      // 原始是单个 number，保持为单个 number
      if (Array.isArray(value)) {
        inputValue.value = Number(value[0]);
      } else if (value !== undefined) {
        inputValue.value = Number(value);
      } else {
        inputValue.value = value;
      }
    } else {
      // 原始是 string 或 string[]，保持原样
      inputValue.value = value;
    }
  }
});

const {
  // 响应式状态
  options,
  filterText,

  // 计算属性
  excludesList,
  processedOptions,

  // 方法
  initializeOptions,
  handleValueChange,
  handleTreeCheckChange,
  updateTreeSelection
} = useConfigSelect(props, normalizedInputValue, emit);

onMounted(() => {
  initializeOptions();
});

/**
 * 监听选中值变化，更新树形组件选中状态
 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) {
      const normalizedValue = normalizeValue(newValue);
      if (normalizedValue !== undefined) {
        updateTreeSelection(treeRef, normalizedValue);
      }
    }
  }
);

const exposedUpdateTreeSelection = (newValue: string | string[] | number[] | number | undefined) => {
  const normalizedValue = normalizeValue(newValue);
  if (normalizedValue !== undefined) {
    updateTreeSelection(treeRef, normalizedValue);
  }
};

defineExpose({
  updateTreeSelection: exposedUpdateTreeSelection
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-input__wrapper");
@include common-element-style(".el-select__wrapper");
:deep(.el-tag) {
  background-color: #383b47;
  border-color: #383b47;
  color: #b4b7c1;
}
@include checkbox-style();
.opt-multiple {
  .el-input__suffix {
    display: none;
  }
  .el-tag.el-tag--info {
    background-color: #383b47;
    border-color: #383b47;
    color: #b4b7c1;
  }
  .el-tag.el-tag--info .el-tag__close {
    color: #b4b7c1;
    background-color: transparent;
    &::before {
      content: "\e624";
      font-family: "iconfont";
      font-size: 16px;
      transform: translate(0, 2px);
    }
  }
  .opt-item::before {
    opacity: 1;
  }
}
.config-select {
  width: 100%;
  li {
    &.selected::after {
      left: 10px;
    }
    &.selected .opt-item {
      color: #ffffff;
    }
  }
  .opt-item {
    position: relative;
    &::before {
      // content: '\ed1d';
      content: "";
      color: transparent;
      font-family: "iconfont" !important;
      width: 12px;
      height: 12px;
      line-height: 12px;
      border: 1px solid #383b47;
      position: absolute;
      top: 50%;
      left: -20px;
      transform: translate(0, -50%);
      background-color: #1a1e27;
      opacity: 0;
    }
  }
  .filter-container {
    height: 30px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .filter-text {
      width: 90%;
      text-indent: 0;
    }
  }
  .source-tree {
    .el-tree__empty-text {
      text-indent: 0;
    }
  }
  .hidden {
    display: none;
  }
}
</style>
