<template>
  <div class="data-api">
    <dataSelect v-model="input" :type="DataSourceType.API" @change="handleChange" />
    <el-form-item label="Base URL" v-if="selectTargetData[0].url">
      <SwInput v-model="selectTargetData[0].url" :disabled="true" />
    </el-form-item>
    <el-form-item label="请求方式">
      <el-select
        popper-class="sw-select-dropdown"
        @change="handleApiAttrsChange"
        v-model="selectTargetData[0].dataMethod"
        default-first-option
      >
        <el-option v-for="(item, index) in dataMethod" :key="index" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <div class="data-api-tips">请求头(JSON格式)</div>
    <div class="data-api-json-wrapper">
      <MonacoEditor language="json" v-model="selectTargetData[0].requestHeader" @change="handleApiAttrsChange" />
      <div class="icon-position" @click="handleFullScreen('requestHeader')">
        <Icon type="iconfont-fangda" />
      </div>
    </div>
    <el-form-item label="路径">
      <SwInput v-model="apiPath" @change="handleApiAttrsChange" />
    </el-form-item>
    <el-form-item label="参数">
      <SwInput v-model="apiDataQuery" @change="handleApiAttrsChange" />
    </el-form-item>
    <template v-if="selectTargetData[0].dataMethod === 'post'">
      <el-form-item label="Body(JSON格式)" />
      <div class="data-api-json-wrapper">
        <MonacoEditor language="json" v-model="selectTargetData[0].requestBody" @change="handleApiAttrsChange" />
        <div class="icon-position" @click="handleFullScreen('requestBody')">
          <Icon type="iconfont-fangda" />
        </div>
      </div>
    </template>
    <div class="request-header flex flex-align-center">
      <el-checkbox v-model="selectTargetData[0].crossOrigin" @change="handleApiAttrsChange" />
      后端发起请求
      <el-tooltip effect="dark" placement="top">
        <template #content>允许跨域请求</template>
        <Icon type="QuestionFilled" class="tooltip-icon" size="12" />
      </el-tooltip>
    </div>
    <dataFilter />
    <dataResponse v-loading="loading" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { computed } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import Icon from "@/components/Icon/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useDialog } from "@/hooks/useDialog";
import { DataSourceType } from "@/views/source/type";

import { useUpdateInstance } from "../../useUpdateInstance";
import { useDataConfig } from "../useDataConfig";
import dataApiDialog from "./dataApiDialog.vue";
import dataFilter from "./dataFilter.vue";
import dataResponse from "./dataResponse.vue";
import dataSelect from "./dataSelect.vue";
import type { DataSource } from "./useDataApi";

const { loading } = useDataConfig();
const input = ref("");
const { dialog } = useDialog();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});

// 可写的 computed 属性
const apiPath = computed({
  get: () => selectTargetData.value?.[0]?.path || "",
  set: (value) => (selectTargetData.value[0].path = value)
});

const apiDataQuery = computed({
  get: () => selectTargetData.value?.[0]?.dataQuery || "",
  set: (value) => (selectTargetData.value[0].dataQuery = value)
});

const { emitFilterTrigger } = useCallbackArguments();

const dataMethod = ref([
  { label: "POST", value: "post" },
  { label: "GET", value: "get" }
]);
const setBaseUrl = (target: any) => {
  const parseTarget = target.config ? JSON.parse(target.config) : {};
  selectTargetData.value[0].url = parseTarget.baseUrl;
};
const handleFullScreen = (field: string) => {
  dialog({
    DialogProps: {
      title: "全屏编辑",
      width: "80%",
      modalClass: "data-interface-dialog"
    },
    componentProps: { field },
    component: dataApiDialog
  });
};
const handleChange = async (target: DataSource) => {
  setBaseUrl(target);
  selectTargetData.value[0].dataSource = target;

  update();
};
const handleApiAttrsChange = () => {
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
};

onMounted(async () => {
  const dataSource = selectTargetData.value[0].dataSource;
  if (dataSource && Object.keys(dataSource).length > 0) {
    input.value = dataSource.id;
    setBaseUrl(dataSource);
  } else {
    input.value = "";
    selectTargetData.value[0].url = "";
  }
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
.data-api {
  @include common-element-style(".el-select__wrapper");
}
.data-api-tips {
  margin: 16px 0;
  font-size: 12px;
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  font-weight: 400;
  color: #b4b7c1 !important;
}
.request-header {
  font-size: 12px;
  .el-icon {
    cursor: pointer;
  }
}
.data-api-json-wrapper {
  width: 300px;
  height: 202px;
  position: relative;
  margin-bottom: 16px;
  .icon-position {
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: pointer;
  }
}
</style>
