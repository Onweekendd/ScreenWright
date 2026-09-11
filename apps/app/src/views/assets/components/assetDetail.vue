<template>
  <div class="asset-detail">
    <el-table
      height="400"
      :data="tableData"
      style="width: 100%"
      v-loading="loading"
      element-loading-background="rgba(0, 0, 0, 0.1)"
    >
      <template v-slot:empty>
        <div class="flex flex-center">
          <el-empty description="暂无数据" :image="logoImg" />
        </div>
      </template>
      <el-table-column prop="largeId" label="ID" align="center" />
      <el-table-column prop="largeName" label="大屏名称" align="center" />
      <el-table-column prop="versionCode" label="大屏版本" align="center" />
      <el-table-column prop="versionDesc" label="版本说明" align="center">
        <template #default="scope">
          <span>{{ scope.row.versionDesc || "--" }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ElMessage } from "element-plus";

import { minioGetLargeUse } from "@/api/assets";
import logoImg from "@/assets/image/bg/empty.png";
import type { assetItem } from "@/model/Assets";
import type { LargeUseEntity } from "@/model/Assets";
import to from "@/utils/await-to-js";

interface Props {
  item: assetItem;
}
const props = defineProps<Props>();
const tableData = ref<Array<LargeUseEntity>>([]);
const loading = ref(false);
const getBaseList = async () => {
  loading.value = true;
  const [error, res] = await to(minioGetLargeUse(props.item.id));
  if (error && res) {
    loading.value = false;
    return;
  }
  if (res && res.success) {
    if (Array.isArray(res.result)) {
      tableData.value = res.result;
    } else {
      ElMessage.warning(res.message || "获取大屏使用情况失败");
    }
  }
  loading.value = false;
};
onMounted(() => {
  getBaseList();
});
</script>
<style lang="scss" scoped>
.asset-detail {
  :deep(.el-table) {
    background: transparent !important;
    --el-table-row-hover-bg-color: rgba(61, 64, 73, 1) !important;
    --el-table-text-color: #fff !important;
  }
  :deep(.el-table) {
    tr {
      background: transparent !important;
    }
    th.el-table__cell {
      background: transparent !important;
      &.is-leaf {
        border-bottom: none !important;
      }
    }
    .el-table__inner-wrapper:before {
      background: transparent !important;
    }
    td.el-table__cell {
      border-bottom: none !important;
    }
  }
}
</style>
