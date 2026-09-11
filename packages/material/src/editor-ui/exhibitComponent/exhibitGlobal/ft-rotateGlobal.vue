<template>
  <div class="ft-rotate-global">
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >是否关联
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>若设置启动关联的旋转组件共享动画</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="selectTargetData[0].option.relate" @change="update" />
    </el-form-item>
    <el-form-item label="默认图片" :label-width="firstLabelWidth">
      <sw-upload v-model="selectTargetData[0].option.frontBgImageUrl" @change="update" @delete="update" />
    </el-form-item>
    <el-form-item label="翻转图片" :label-width="firstLabelWidth">
      <sw-upload v-model="selectTargetData[0].option.backBgImageUrl" @change="update" @delete="update" />
    </el-form-item>
    <el-form-item label="方向" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.direction" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="展开大小" :label-width="firstLabelWidth">
      <div class="flex flex-center" style="width: 100%">
        <sw-input-number
          v-model.number="selectTargetData[0].option.backBgImageUrlSizeWidth"
          unit="px"
          bottomLabel="宽度"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.backBgImageUrlSizeHight"
          unit="px"
          bottomLabel="高度"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>

    <el-form-item label="翻转时间" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.openTime" :min="0.2" :max="5" unit="s" @change="update" />
    </el-form-item>
    <el-form-item label="翻转速率" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.openTiming" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in filteredTimingFunction" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="展开时间" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.rotateOpenTime"
        :min="0.2"
        :max="5"
        unit="s"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="展开速率" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.rotateOpenTiming"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in filteredTimingFunction" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="缩小时间" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.rotateBackTime"
        :min="0.2"
        :max="5"
        unit="s"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="缩小速率" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.rotateBackTiming"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in filteredTimingFunction" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="恢复翻转时间" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.hideTime" :min="0.2" :max="5" unit="s" @change="update" />
    </el-form-item>
    <el-form-item label="恢复翻转速率" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.hideTiming" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in filteredTimingFunction" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwInputNumber } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, timingFunction } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
const { update, selectTargetData } = useUpdateInstance();
const directionOptions = [
  { label: "左上", value: "leftTop" },
  { label: "右上", value: "rightTop" },
  { label: "右下", value: "rightBottom" },
  { label: "左下", value: "leftBottom" },
  { label: "中间", value: "center" }
];

// 过滤掉value为'none'的timing function选项
const filteredTimingFunction = computed(() => {
  return timingFunction.filter((item) => item.value !== "none");
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
