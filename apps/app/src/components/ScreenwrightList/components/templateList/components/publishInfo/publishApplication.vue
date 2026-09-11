<template>
  <div class="publish-application" v-if="params">
    <div class="label-item flex flex-align-center">
      <span class="label label-width-72"> 发布版本 </span>
      <el-select
        popper-class="sw-select-dropdown"
        v-model="params.versionCode"
        placeholder="Select"
        style="width: calc(100% - 72px)"
      >
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
          <template #default>
            <div class="option-item">
              <div class="option-label">版本号： {{ item.label }}</div>
              <div class="option-desc">版本描述：{{ item.versionDesc ?? "" }}</div>
            </div>
          </template>
        </el-option>
      </el-select>
    </div>
    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="params.hasPassword"> 加密发布 </el-checkbox>
    </div>
    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="params.hasExpirationTime"> 设置发布截至时间 </el-checkbox>
    </div>
    <DeadlineTime v-model="params.expirationTime" :hasExpirationTime="params.hasExpirationTime" />
    <div class="publish-footer">
      <el-button type="primary" @click="publishScreen()">发布应用</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import DeadlineTime from "./DeadlineTime.vue";
import { usePublishInfo } from "./usePublishInfo";

const { params, publishScreen, options } = usePublishInfo();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.el-select-dropdown__item {
  height: auto !important;
}

.publish-application {
  padding: 20px 50px 50px 20px !important;
  .label-width-72 {
    width: 72px;
  }
  @include common-element-style(".el-select__wrapper");
  .label-item {
    @include checkbox-style();
    margin-bottom: 8px;
  }
  .label {
    color: #bfbfbf;
  }
  .publish-footer {
    margin-top: 20px;
    text-align: center;
    .el-button.el-button--primary {
      border-color: #642cff;
      background-image: linear-gradient(180deg, #8b58e7, #642cff);
    }
  }

  .option-item {
    .option-label {
      font-weight: 500;
      color: #333;
    }
    .option-desc {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
      line-height: 1.2;
    }
  }
}
</style>
