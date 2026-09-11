<template>
  <div class="page-reload-global">
    <el-form-item label="透明度" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.opacity"
        :max="1"
        :min="0"
        :step="0.1"
        controls
        @change="update"
      />
    </el-form-item>
    <el-form-item label="刷新方式" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.pageReloadType"
        popper-class="sw-select-dropdown"
        placeholder="请选择"
        @change="update"
      >
        <el-option v-for="(item, index) in pageReloadType" :key="index" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="selectTargetData[0].option.pageReloadType === 'click'"
      label="点击刷新"
      :label-width="firstLabelWidth"
    >
      <el-radio-group v-model="selectTargetData[0].option.pageReloadTypeClick" @change="update" class="custom-tabs">
        <el-radio-button
          v-for="(item, index) in pageReloadTypeClickType"
          :key="index"
          :label="item.label"
          :value="item.value"
        />
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="selectTargetData[0].option.pageReloadType === 'autoUpdate'"
      label="自动刷新"
      :label-width="firstLabelWidth"
    >
      <sw-input-number
        v-model.number="selectTargetData[0].option.pageReloadTypeAutoTime"
        unit="s"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item
      v-if="selectTargetData[0].option.pageReloadType === 'keepTime'"
      label="计时刷新"
      :label-width="firstLabelWidth"
    >
      <sw-input-number
        v-model.number="selectTargetData[0].option.pageReloadTypeKeepTime"
        unit="s"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item
      v-if="selectTargetData[0].option.pageReloadType === 'setTime'"
      label="定时刷新"
      :label-width="firstLabelWidth"
    >
      <div class="flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.pageReloadTypeTimeOutHour"
          bottomLabel="时"
          style="width: 67px"
          :min="0"
          :max="24"
          controls
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.pageReloadTypeTimeOutHourMinute"
          bottomLabel="分"
          style="width: 67px"
          :min="0"
          :max="59"
          controls
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="图标" :label-width="firstLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.icon"
        :multiple="false"
        :showFileList="false"
        :showDel="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
    <el-form-item label="图标大小" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.iconWidth"
          unit="px"
          bottomLabel="宽度"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.iconHeight"
          unit="px"
          bottomLabel="高度"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";
import { pageReloadType, pageReloadTypeClickType } from "../dict";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.custom-tabs {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  flex-direction: row;
  :deep(.el-radio-button__inner) {
    width: 107px;
    height: 30px;
    line-height: 30px;
    padding: 0;
    border: none;
    color: #b4b7c7;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background-color: #383b47;

    box-shadow: none;
  }

  :deep(.el-radio-button .el-radio-button__inner) {
    border-radius: 0;
    background-color: #383b47;
    color: #b4b7c1;
    text-align: center;
  }

  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    background-color: #6c5ce7;
    text-align: center;
  }
}
</style>
