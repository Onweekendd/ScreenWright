<template>
  <div class="data-config-remark">
    <el-table :data="dataRemark" style="width: 100%">
      <el-table-column prop="key" label="字段" width="90" />
      <el-table-column label="映射" width="103">
        <template #default="scope">
          <el-select @change="handleChange" v-model="scope.row.map" popper-class="sw-select-dropdown">
            <el-option v-for="(item, index) in mapOptions" :key="index" :value="item" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="decription" label="说明" width="87" />
      <el-table-column label="状态" width="55">
        <template #default="scope">
          <Icon :type="getIconType(scope.row.map)" size="14" :class="iconClass(scope.row.map)" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";

import { useUpdateInstance } from "../../useUpdateInstance";
import { useDataConfig } from "../useDataConfig";

const { update, selectTargetData } = useUpdateInstance({
  history: false
});
const { dataRemark, mapOptions } = useDataConfig();
const { emitFilterTrigger } = useCallbackArguments();
const iconClass = (key: string) => {
  return {
    success: isHasMapKey(key),
    error: !isHasMapKey(key)
  };
};

const isHasMapKey = (key: string) => {
  if (!selectTargetData.value || selectTargetData.value.length === 0) return false;
  const data = mapOptions.value;
  return data.some((item: any) => item === key);
};

const getIconType = (key: string) => {
  return isHasMapKey(key) ? "iconfont-duigou_kuai" : "iconfont-guanbi";
};

const handleChange = () => {
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.data-config-remark {
  @include common-element-style(".el-select__wrapper");
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .success {
    color: #67c23a;
  }
  .error {
    color: #ef5350;
  }
  :deep(.el-table) {
    --el-table-header-bg-color: #2b2e37;
    --el-fill-color-blank: #2b2e37;
    --el-border-color-lighter: #2b2e37;
    --el-table-tr-bg-color: #232630;
    --el-table-row-hover-bg-color: #2b2e37;
    .cell {
      padding-right: 0 !important;
      font-size: 12px;
      color: #b4b7c1;
    }
  }
}
</style>
