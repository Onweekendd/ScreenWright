<template>
  <li class="scroll-table-row list-item" :style="rowContainerStyle" @click="handleItemClick">
    <span v-if="option.rowIndex?.show" class="scroll-table-cell" :style="rowIndexCellStyle">
      {{ (option.rowIndex.startFrom ?? 1) + rowNumber }}
    </span>
    <span v-for="column in option.columns" :key="column.key" class="scroll-table-cell" :style="cellStyle(column)">
      {{ item[column.key] }}
    </span>
  </li>
</template>

<script setup lang="ts">
import { EventTypeEnum, type ComponentType } from "@screenwright/types";
import { useBaseData } from "@screenwright/composables";
import type { CSSProperties } from "vue";
import { computed } from "vue";

const props = defineProps<{
  item: Record<string, unknown>;
  listIndex: number;
  element: ComponentType;
}>();

const { option, handleEventAndCallbackEvent, handleEncode } = useBaseData(props.element);

// 循环滚动到复制段时，序号/斑马纹按原始数据长度取模回到第一行重新计数，跟内容一起无缝循环
const rowNumber = computed(() => (props.item._rowNumber as number | undefined) ?? props.listIndex);

const isStriped = computed(() => !!option.value.rowStyle?.stripeBackground && rowNumber.value % 2 === 1);

const rowContainerStyle = computed<CSSProperties>(() => ({
  display: "flex",
  height: `${option.value.rowStyle?.height ?? 40}px`,
  lineHeight: `${option.value.rowStyle?.height ?? 40}px`,
  background: isStriped.value ? option.value.rowStyle.stripeBackground : option.value.rowStyle?.background,
  color: option.value.rowStyle?.color,
  fontSize: `${option.value.rowStyle?.fontSize ?? 14}px`,
  textAlign: option.value.rowStyle?.align ?? "center"
}));

const rowIndexCellStyle = computed<CSSProperties>(() => ({
  flex: "none",
  width: `${option.value.rowIndex?.width ?? 50}px`,
  textAlign: "center"
}));

const cellStyle = (column: { key: string; width?: number; align?: string }): CSSProperties => {
  const override = option.value.columnStyleOverrides?.[column.key];
  return {
    flex: column.width ? `0 0 ${column.width}px` : "1 1 0",
    width: column.width ? `${column.width}px` : undefined,
    textAlign: override?.align ?? column.align ?? option.value.rowStyle?.align ?? "center",
    color: override?.color,
    background: override?.background,
    fontSize: override?.fontSize ? `${override.fontSize}px` : undefined,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "0 4px"
  };
};

// item 里混有 ScrollContainer 为循环滚动塞进去的内部字段（_rowNumber/_copy），
// 抛给事件系统/外部回调前去掉，避免暴露内部实现细节
const cleanItem = computed(() => {
  const { _rowNumber, _copy, ...rest } = props.item;
  return rest;
});

const handleItemClick = () => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    throwValue: cleanItem.value
  });
  handleEncode(cleanItem.value);
};
</script>

<style lang="scss" scoped>
.scroll-table-row {
  box-sizing: border-box;
  cursor: pointer;
}
</style>
