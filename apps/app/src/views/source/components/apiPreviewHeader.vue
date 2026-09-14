<template>
  <div class="api-preview-header">
    <el-row :gutter="20">
      <el-col :span="3">
        <el-select
          popper-class="sw-select-dropdown"
          class="sw-select"
          v-model="params.methods"
          placeholder="请选择"
        >
          <el-option label="GET" :value="methodsEnum.GET" />
          <el-option label="POST" :value="methodsEnum.POST" />
          <el-option label="DELETE" :value="methodsEnum.DELETE" />
          <el-option label="PUT" :value="methodsEnum.PUT" />
        </el-select>
      </el-col>

      <el-col :span="19">
        <el-input v-model="params.url" placeholder="请输入内容" />
      </el-col>
      <el-col :span="1">
        <el-button type="primary" @click="handleSend">发送</el-button>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import axios from "axios";
import { ElMessage } from "element-plus";

import { methodsEnum } from "./constant";
import { useApiPreviewParams } from "./useApiPreviewParams";
import { getDataByJson, getFormDataByEmApiType, getHeader, getQueryOrData } from "./utils";

const { params, loading } = useApiPreviewParams();

const handleSend = () => {
  const header = getHeader(params);
  loading.value = true;
  axios({
    method: params.value.methods,
    url: params.value.url,
    headers: {
      ...header
    },
    ...getQueryOrData(params),
    ...getFormDataByEmApiType(params),
    ...getDataByJson(params)
  })
    .then((res) => {
      if (res.status === 200 || res.status === 201) {
        params.value.response = JSON.stringify(res.data, null, 2);
        console.log(params.value.response, "params.value.response");
      }
      loading.value = false;
    })
    .catch((err) => {
      ElMessage.error(err.message);
      loading.value = false;
    });
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.api-preview-header {
  @include common-element-style(".el-select__wrapper");
  @include common-element-style(".el-input__wrapper");
  .el-button {
    color: #ffffff;
    background-color: #3d404c;
    border-color: #3d404c;
    &.el-button--primary {
      // background-color: var(--sw-theme-color);
      border-color: var(--sw-theme-color);
      background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
    }
  }
}
</style>
