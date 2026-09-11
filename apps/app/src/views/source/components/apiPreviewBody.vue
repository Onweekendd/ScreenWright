<template>
  <div class="api-preview-body">
    <el-radio-group v-model="params.data[activeNameEnum.Body].apiType">
      <el-radio label="none" :value="emApiType.None" />
      <el-radio label="formData" :value="emApiType.FormData" />
      <el-radio label="json" :value="emApiType.Json" />
      <el-radio label="raw" :value="emApiType.Raw" />
    </el-radio-group>
    <div v-show="params.data[activeNameEnum.Body].apiType === emApiType.None" class="body-content body-none mt-8">
      该请求没有 Body 体
    </div>
    <apiPreviewTable
      :listData="params.data[activeNameEnum.Body][emApiType.FormData].listData"
      v-show="params.data[activeNameEnum.Body].apiType === emApiType.FormData"
      class="mt-8"
      @add="handleAddClick"
    />
    <div v-show="params.data[activeNameEnum.Body].apiType === emApiType.Json" class="editor-wrapper body-content mt-8">
      <MonacoEditor language="json" v-model="params.data[activeNameEnum.Body][emApiType.Json]" />
    </div>

    <div v-show="params.data[activeNameEnum.Body].apiType === emApiType.Raw" class="editor-wrapper body-content mt-8">
      <MonacoEditor language="json" v-model="params.data[activeNameEnum.Body][emApiType.Raw]" />
    </div>
  </div>
</template>
<script setup lang="ts">
import MonacoEditor from "@/components/MonacoEditor/index.vue";

import apiPreviewTable from "./apiPreviewTable.vue";
import { activeNameEnum, emApiType } from "./constant";
import { useApiPreviewParams } from "./useApiPreviewParams";

const { params, handleAddClick } = useApiPreviewParams();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.api-preview-body {
  .mt-8 {
    margin-top: 8px;
  }
  @include radio-style();
  :deep(.el-radio__label) {
    color: #fff;
  }
  .body-content {
    border: 1px solid #363636;
    color: rgba(218, 218, 218, 0.4);
    border-radius: 6px;
    font-size: 14px;
    height: 200px;
  }
  .body-none {
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .editor-wrapper {
    height: 200px;
  }
}
</style>
