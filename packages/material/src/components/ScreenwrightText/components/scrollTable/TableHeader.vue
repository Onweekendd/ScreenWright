<template>
  <div v-if="option.header?.show !== false" class="table-head" :style="headerContainerStyle">
    <span v-if="option.rowIndex?.show" class="table-head-cell" :style="rowIndexCellStyle">
      {{ option.rowIndex.title }}
    </span>
    <span v-for="column in option.columns" :key="column.key" class="table-head-cell" :style="cellStyle(column)">
      {{ column.title }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

const props = defineProps<{ option: any }>();

const headerContainerStyle = computed<CSSProperties>(() => ({
  display: "flex",
  height: `${props.option.header?.height ?? 40}px`,
  lineHeight: `${props.option.header?.height ?? 40}px`,
  background: props.option.header?.background,
  color: props.option.header?.color,
  fontSize: `${props.option.header?.fontSize ?? 14}px`
}));

const rowIndexCellStyle = computed<CSSProperties>(() => ({
  flex: "none",
  width: `${props.option.rowIndex?.width ?? 50}px`,
  textAlign: "center"
}));

const cellStyle = (column: { width?: number; align?: CSSProperties["textAlign"] }): CSSProperties => ({
  flex: column.width ? `0 0 ${column.width}px` : "1 1 0",
  width: column.width ? `${column.width}px` : undefined,
  textAlign: column.align ?? "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  padding: "0 4px"
});
</script>

<style lang="scss" scoped>
.table-head {
  width: 100%;
  box-sizing: border-box;
}
</style>
