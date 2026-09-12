<template>
  <el-form class="data-interface-form" ref="validateForm" label-width="100px" :model="formData" label-position="left">
    <el-form-item label="数据源类型">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="selectTargetData[0].dataType"
        placeholder="请选择分组"
        style="width: 100%"
        @change="handleChange"
      >
        <el-option v-for="item in preDataType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <!-- 静态数据 -->
    <template v-if="selectTargetData[0].dataType === 0">
      <dataStaticData />
    </template>
    <!-- sql数据库 -->
    <template v-if="selectTargetData[0].dataType === 1">
      <dataSql />
    </template>
    <!-- api接口 -->
    <template v-if="selectTargetData[0].dataType === 2">
      <dataApi />
    </template>

    <template v-if="selectTargetData[0].dataType === 3">
      <dataCsv />
    </template>
    <template v-if="selectTargetData[0].dataType === 4">
      <dataWebScoket />
    </template>
  </el-form>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { DataSourceType } from "@/views/source/type";

import { useUpdateInstance } from "../../useUpdateInstance";
import dataApi from "./dataApi.vue";
import dataCsv from "./dataCsv.vue";
import dataSql from "./dataSql.vue";
import dataStaticData from "./dataStaticData.vue";
import dataWebScoket from "./dataWebScoket.vue";
import { useDataApi } from "./useDataApi";

const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const { setOptions } = useDataApi();
const { emitFilterTrigger } = useCallbackArguments();
const formData = ref({
  dataViewType: "excel"
});
const preDataType = ref([
  { label: "静态数据", value: 0 },
  { label: "SQL数据库", value: 1 },
  { label: "API接口", value: 2 },
  { label: "CSV文件", value: 3 },
  { label: "WebSocket", value: 4 }
]);
const handleSetOptions = () => {
  console.log(selectTargetData.value[0].dataType, "selectTargetData[0].dataType");
  const optionsMapKey: Record<string, DataSourceType> = {
    "1": DataSourceType.DB,
    "2": DataSourceType.API,
    "3": DataSourceType.LOCAL,
    "4": DataSourceType.WEBSOCKET
  };
  const type = optionsMapKey[selectTargetData.value[0].dataType];
  if (type) {
    setOptions(type);
  }
};
const handleChange = () => {
  selectTargetData.value[0].dataSource = {};
  handleSetOptions();
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.data-interface-form {
  padding: 0 16px;

  :deep(.el-form-item__label) {
    color: #fff;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  @include common-element-style(".el-select__wrapper");
}
</style>
