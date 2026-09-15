<!-- 轮播表格 -->
<template>
  <div :class="tableClasses" class="ft-progress-table">
    <TableHeader :header-list="headerList" :option="option" />
    <el-scrollbar
      :always="true"
      ref="scrollRef"
      class="ft-table-list-content ft-table-list-scrollbar vue-scroll-blue"
      :style="{ height: option.headerShow ? `calc(100% - ${option.headerlineHeight}px)` : '100%' }"
    >
      <div class="ft-table-list-box" :class="{ loop: rolling }" ref="TableBox">
        <div v-for="(listItem, index) in list" :key="listItem._idx">
          <TableRow
            :row-data="listItem"
            :header-list="headerList"
            :index="index"
            @row-click="rowClick"
            :element="element"
          />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { EventTypeEnum, textEnum, type ComponentType } from "@screenwright/types";
import { onMounted, watch } from "vue";

import { useActionEvent, useBaseData } from "@screenwright/composables";

import TableHeader from "./TableHeader.vue";
import TableRow from "./TableRow.vue";
import { useProgressTable } from "./useProgressTable";

const props = defineProps<{ element: ComponentType }>();
const { option, dataChart, isBuild, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();

const emit = defineEmits(["row-click", "data-change"]);
defineOptions({
  name: "ftProgresstable"
});
const { list, headerList, rolling, tableClasses, scrollRef, init } = useProgressTable(
  props.element,
  emit,
  isBuild.value
);

const rowClick = (params: { index: number; params: any }) => {
  console.log("行点击事件", params);
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: { ...params.params, isChecked: true }
  });
};

// 点击处理函数（供外部调用）
const handleClick = (info: any) => {
  // 如果是行数据，触发行点击事件
  if (info && typeof info === "object") {
    rowClick({ index: 0, params: info });
  }
};
function formatColor(color: string) {
  // 空值直接返回
  if (!color || typeof color !== "string") return "";

  // 去除首尾空格，统一转小写（避免大小写干扰）
  const cleanColor = color.trim().toLowerCase();

  // 规则1：匹配6位十六进制（仅0-9/a-f），补#
  const hex6Regex = /^[0-9a-f]{6}$/;
  if (hex6Regex.test(cleanColor)) {
    return `#${cleanColor}`;
  }

  // 规则2：匹配rgba格式（简单校验，保证基本语法），直接返回
  const rgbaRegex = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0?\.\d+|1|0)\s*\)$/;
  if (rgbaRegex.test(cleanColor)) {
    return cleanColor;
  }

  // 非目标格式返回空（或根据你的需求返回原值）
  return color;
}

// 生命周期
onMounted(() => {
  init();
  option.value.headerColor = `${formatColor(option.value.headerColor)}`;
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: dataChart.value
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${textEnum.SwProgress}-${props.element.id}`]: {
      handleClick
    }
  });
});
watch(
  () => dataChart.value,
  (val) => {
    if (val?.length) {
      emit("data-change", val[0]);
    }
    init();
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: dataChart.value
    });
  },
  { deep: true }
);

watch(() => option.value, init, { deep: true });
</script>

<style lang="scss" scoped>
.ft-table-box {
  padding-top: 1.6px;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  * {
    box-sizing: border-box;
  }
}

// 进度条统一样式
.ft-table-progress {
  :deep(.el-progress-bar__outer) {
    background-color: rgba(0, 187, 255, 0.2) !important;
    .el-progress-bar__inner {
      background-image: var(--ft-progress-bar-bg-image, none) !important;
    }
  }
  :deep(.el-scrollbar__view) {
    overflow-x: hidden !important;
  }

  :deep(.el-scrollbar__bar.is-horizontal) {
    display: none;
  }
}
.ft-table-list-content {
  width: fit-content !important;
}
.ft-table-list-scrollbar {
  &::-webkit-scrollbar {
    margin-left: 6px;
    width: 2px;
    height: 0;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #0078ff;
    height: 3px;
    border-radius: 0;
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 119, 255, 0.3);
  }
  &::-webkit-scrollbar-corner {
    background-color: rgba(2555, 255, 255, 0);
  }
}
</style>
