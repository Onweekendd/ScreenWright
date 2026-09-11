<template>
  <div class="different-version" v-if="params">
    <span class="publish-tips">是否发布新版本V{{ getVersionCode() }}_？ </span>
    <span class="tips-warning"> 该版本将取代当前版本V{{ currentVersionCode }}_ </span>
    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="params.hasPassword" @change="handlePassword"> 加密发布 </el-checkbox>
    </div>
    <div class="label-item flex flex-align-center" v-if="params.hasPassword">
      <span class="label label-width-72">密码：</span>
      <el-input :disabled="true" v-model="params.password" />
      <span class="resetBtn" @click="resetPassword">重置密码</span>
    </div>
    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="params.hasExpirationTime" @change="handleHasExpirationTime"> 设置发布截止时间 </el-checkbox>
    </div>
    <DeadlineTime
      @change="handleExpirationTime"
      v-model="params.expirationTime"
      :hasExpirationTime="params.hasExpirationTime"
    />
    <div class="publish-footer">
      <el-button type="primary" @click="handlePublish">发布应用</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { CheckboxValueType } from "element-plus";

import { getVersionCode } from "@/utils/version";

import { usePublishInfo } from "./usePublishInfo";
const { params, options, updateExpirationTime, updatePassword, publishScreen, resetPassword } = usePublishInfo();
import { computed } from "vue";

import DeadlineTime from "./DeadlineTime.vue";
const handleExpirationTime = (val: any) => {
  updateExpirationTime(true, val);
};
const handlePassword = (val: CheckboxValueType) => {
  updatePassword(val as boolean);
};
const handlePublish = () => {
  if (params.value) {
    options.value.forEach((version: any) => {
      if (version.value === getVersionCode()) {
        version.status = true;
      } else {
        version.status = false;
      }
    });
    params.value.versionCode = getVersionCode() || "1";
    publishScreen();
  }
};
const handleHasExpirationTime = (val: CheckboxValueType) => {
  updateExpirationTime(val as boolean);
};
const currentVersionCode = computed(() => {
  const currentVersion = options.value.find((version: any) => version.status) || undefined;
  if (currentVersion) {
    return currentVersion.value;
  }
  return "";
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-input__wrapper");
.label-width-72 {
  width: 72px;
  color: #fff;
}
.publish-tips {
  color: #fff;
}
.tips-warning {
  color: red;
  font-weight: bold;
}
.publish-footer {
  margin-top: 20px;
  text-align: center;
  .el-button.el-button--primary {
    border-color: #642cff;
    background-image: linear-gradient(180deg, #8b58e7, #642cff);
  }
}
.resetBtn {
  cursor: pointer;
  text-align: center;
  width: 100px;
  text-decoration: underline;
  color: #fff;
}
</style>
