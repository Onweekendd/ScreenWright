<template>
  <div
    :class="`customTableList-scrollbar-box-item customTableList_${id} row-item_${id}_${listIndex}`"
    :style="rowStyle"
    :key="listIndex"
    @click.stop="$emit('row-click', $event, listIndex)"
    @mousemove="$emit('row-hover', $event, listIndex)"
    @mouseout="$emit('row-leave', $event, listIndex)"
  >
    <div v-for="(column, index) in columnConfig" :key="index" class="column-item" :style="getColumnStyle(column)">
      <!-- 按钮 -->
      <TableButtonItem
        v-if="column.seriesYContentType === 'btn'"
        :column="column"
        :list-item="listItem"
        :list-index="listIndex"
        :column-index="index"
        :list-data="listData"
        :option="option"
        @button-click="handleButtonClick"
        @btn-click="handleBtnClick"
      />
      <!-- 图片 -->

      <TableImageItem
        v-if="column.seriesYContentType === 'image'"
        :column="column"
        :list-item="listItem"
        :column-index="index"
        :option="option"
      />

      <!-- 开关 -->
      <TableSwitchItem
        v-if="column.seriesYContentType === 'switch'"
        :column="column"
        :list-item="listItem"
        :list-index="listIndex"
        :column-index="index"
        @switch-change="handleSwitchChange"
      />

      <!-- 文字 -->
      <TableTextItem
        v-if="column.seriesYContentType === 'word'"
        :column="column"
        :list-item="listItem"
        :list-index="listIndex"
        :column-index="index"
        :option="option"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import { setMinioUrl } from "@material/minioUrl";

import type { ColumnConfig, Option } from "../types";
import TableButtonItem from "./TableButtonItem.vue";
import TableImageItem from "./TableImageItem.vue";
import TableSwitchItem from "./TableSwitchItem.vue";
import TableTextItem from "./TableTextItem.vue";

interface RowProps {
  option: Option;
  id: number;
  listItem: Record<string, unknown>;
  listIndex: number;
  listData: unknown[];
  columnConfig: ColumnConfig[];
  rowStyle: CSSProperties;
}

const props = defineProps<RowProps>();
const emit = defineEmits(["row-click", "row-hover", "row-leave", "button-click", "switch-change"]);

// 计算属性：行样式
const rowStyle = computed(() => {
  const { option, listItem, listData } = props;

  let background =
    option.rowConfig.listRowBgType === "color"
      ? option.rowConfig.listRowBgColor
      : `url(${setMinioUrl(option.rowConfig.listRowBgImage)}) no-repeat center/100% 100%`;

  if (option.rowConfig.listRowStatusShow && listItem) {
    // 数据中对应的状态值
    const targetValue = listItem[option.rowConfig.listRowMappingKey];
    (option.rowConfig.listRowStatusList as Record<string, unknown>[]).forEach((listRowStatusItem) => {
      if (
        targetValue &&
        listRowStatusItem.seriesXBackgroundMappingStatus &&
        targetValue === listRowStatusItem.seriesXBackgroundMappingStatus
      ) {
        background =
          listRowStatusItem.seriesXBackgroundType === "color"
            ? String(listRowStatusItem.seriesXBackgroundColor ?? "")
            : `url(${setMinioUrl(String(listRowStatusItem.seriesXBackgroundImage ?? ""))}) no-repeat center/100% 100%`;
      }
    });
  }

  return {
    background,
    width: `${option.rowConfig.listRowWidth}px`,
    height: `${option.rowConfig.listRowHeight}px`,
    lineHeight: `${option.rowConfig.listRowHeight}px`,
    marginBottom: `${
      option.globalConfig.globalScroll
        ? option.globalConfig.globalRowLineMarginBottom
        : props.listIndex === listData.length - 1
          ? 0
          : option.globalConfig.globalRowLineMarginBottom
    }px` // 末项不需要margin
  };
});

// 计算属性：获取列样式
const getColumnStyle = (column: ColumnConfig): CSSProperties => {
  return {
    pointerEvents: ["btn", "switch"].includes(column.seriesYContentType) ? "auto" : "none",
    top: `${column.seriesYOffsetY}px`,
    left: `${column.seriesYOffsetX}px`,
    zIndex: column.seriesYZIndex,
    lineHeight: "0px"
  };
};

// 事件处理函数
const handleButtonClick = (item: unknown, index: number) => {
  emit("button-click", { item, index });
};

const handleSwitchChange = (item: unknown, columnIndex: number) => {
  emit("switch-change", { item, columnIndex, listIndex: props.listIndex });
};

const handleBtnClick = (listItem: unknown, columnId: number) => {
  console.log(listItem, columnId);
  emit("button-click", { item: listItem, index: columnId });
  // 按钮点击事件处理逻辑
};
</script>

<style lang="scss" scoped>
.customTableList-scrollbar-box-item {
  position: relative;
  overflow: hidden;

  .column-item {
    position: absolute;
  }
}
</style>
