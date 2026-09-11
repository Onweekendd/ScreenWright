<template>
  <el-pagination
    size="default"
    background
    layout="total, prev, pager, next"
    v-bind="$attrs"
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :total="total"
    @size-change="sizeChange"
    @current-change="currentChange"
    class="fant-pagination"
    popper-class="sw-select-dropdown"
  />
</template>

<script setup lang="ts">
import { computed } from "vue"

interface PaginationProps {
  pageNum: number
  pageSize: number
  total: number
}
export interface PaginationEvent {
  page: number
  pageSize: number
}
const props = defineProps<PaginationProps>()
const emits = defineEmits<{
  (e: "update:pageNum", value: number): void
  (e: "update:pageSize", value: number): void
  (e: "pagination", value: PaginationEvent): void
}>()
const currentPage = computed({
  get() {
    return props.pageNum
  },
  set(newValue) {
    emits("update:pageNum", newValue)
  }
})

const pageSize = computed({
  get() {
    return props.pageSize
  },
  set(newValue) {
    emits("update:pageSize", newValue)
  }
})

const sizeChange = (size: number) => {
  emits("pagination", { page: currentPage.value, pageSize: size })
}
const currentChange = (currentPage: number) => {
  emits("pagination", { page: currentPage, pageSize: pageSize.value })
}
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
