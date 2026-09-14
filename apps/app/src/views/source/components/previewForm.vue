<template>
  <el-table
    v-loading="loading"
    class="table-previewForm-layout"
    height="600px"
    border
    highlight-current-row
    stripe
    :data="jsonData"
  >
    <el-table-column v-for="key in tableHeader" :key="key" :prop="key" :label="key" align="center" />
  </el-table>
  <p style="text-align: center">若数据过多，则仅展示部分数据</p>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { ref } from "vue";

import { ElMessage } from "element-plus";

import { viewLocalData } from "@/api/dataSource";
import type { DbItem } from "@/model/DataModel";
import to from "@/utils/await-to-js";

interface Props {
  row: DbItem;
}
const jsonData = ref<any>([]);
const tableHeader = ref<any>([]);
const loading = ref(false);
const props = defineProps<Props>();
const getTableData = async () => {
  loading.value = true;
  const [error, res] = await to(viewLocalData(props.row.id));
  if (error) {
    ElMessage.error("预览数据源失败");
    loading.value = false;
    return;
  }
  if (res && res.success) {
    jsonData.value = res.result;
    tableHeader.value = Object.keys(res.result[0]);
  } else {
    ElMessage.error(res.message || "预览数据源失败");
  }
  loading.value = false;
};
onMounted(() => {
  getTableData();
});
</script>
<style lang="scss">
.table-previewForm-layout {
  position: relative;
  &.el-table {
    --el-table-border-color: transparent !important;
    --el-table-bg-color: transparent !important;
  }
  th,
  td {
    font-size: 12px;
    line-height: 16px;
    padding: 5px 0;
    border-color: #484b55 !important;
    background-color: transparent !important;
  }
  tr.current-row > td {
    background-color: transparent !important;
  }
  table tbody tr.el-table__row:hover {
    background-color: #3d4049 !important;
  }
  &::after {
    background-color: transparent;
  }
  .el-table__header-wrapper,
  .el-table__body-wrapper,
  .el-table__fixed-header-wrapper,
  .el-table__fixed-body-wrapper {
    tr,
    th {
      color: #ffffff !important;
    }

    thead tr {
      background-color: #3c3f4b !important;
    }
    tbody tr:nth-child(odd).el-table__row {
      background-color: var(--sw-panel-bg) !important;
    }
    tbody tr:nth-child(even).el-table__row {
      background-color: #32343b !important;
    }
  }
  .el-table__body tr,
  .el-table__body td {
    padding: 0;
    height: 30px;
  }
  .el-table__body-wrapper {
    .el-table__body {
      position: relative;
      &::after {
        content: "";
        position: absolute;
        left: 0;
        background-color: #ebeef53b;
        width: 1px;
        height: 100%;
        top: 0;
      }
    }
  }
  .el-table__header-wrapper {
    position: relative;
    .el-table__header {
      &::after {
        content: "";
        position: absolute;
        left: 0;
        background-color: #ebeef53b;
        width: 1px;
        height: 100%;
        top: 0;
      }
    }
  }
}
</style>
