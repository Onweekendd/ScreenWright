<template>
  <div class="vertical-card-global" v-if="selectTargetData[0].option.globalConfig">
    <!-- <el-form-item label="间隔时长" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.autoplayTimeout"
        :min="0"
        unit="s"
        @change="update"
      />
    </el-form-item> -->
    <el-form-item label="列表间距" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.space"
        :min="0"
        unit="px"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="默认展示" :label-width="firstLabelWidth">
      <sw-input-number v-model.number="selectTargetData[0].option.globalConfig.display" :min="0" @change="update" />
    </el-form-item>
    <el-form-item label="焦距" :label-width="firstLabelWidth">
      <sw-input-number v-model.number="selectTargetData[0].option.globalConfig.perspective" :min="0" @change="update" />
    </el-form-item>
    <el-form-item label="控制" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.globalConfig.controlsVisible" @change="update" />
    </el-form-item>
    <el-form-item label="背景模糊" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.globalConfig.blur" :min="0" :max="100" @change="update" />
    </el-form-item>
    <el-form-item label="边框圆角" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.globalConfig.borderRadius" :min="0" :max="100" @change="update" />
    </el-form-item>
    <el-form-item label="动画停留时长" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.animationDuration"
        :min="0"
        unit="ms"
        @change="update"
      />
    </el-form-item>

    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.globalConfig.autoplay"
      title="自动轮播"
      showIcon
    >
      <template #content>
        <el-form-item label="支持悬停" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.globalConfig.autoplayHoverPause" @change="update" />
        </el-form-item>
        <el-form-item label="轮播方向" :label-width="secondLabelWidth">
          <SwRadio
            class="config-padding"
            direction="row"
            :option="directionListOptions"
            v-model="selectTargetData[0].option.globalConfig.dir"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="间隔时长" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.globalConfig.autoplayTimeout"
            :min="0"
            unit="ms"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <!-- <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.globalConfig.controlsVisible"
      title="控制按钮"
      showIcon
    >
      <template #content>
        <el-form-item label="按钮尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.globalConfig.controlBtnWidth"
              unit="px"
              bottomLabel="宽度"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.globalConfig.controlBtnHeight"
              unit="px"
              bottomLabel="高度"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.globalConfig.controlBtnOffsetLeftOrRight"
              unit="px"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.globalConfig.controlBtnOffsetTop"
              unit="px"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="左按钮背景" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.globalConfig.controlBtnLBg"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="左按钮背景" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.globalConfig.controlBtnRBg"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem> -->
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";

import { isUndefined } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

// import SwUpload from "@editor/base/SwUpload/index.vue";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
const { update, selectTargetData } = useUpdateInstance();

const directionListOptions = ref<
  Array<{
    label: string;
    value: string;
  }>
>([
  { label: "左滚动", value: "rtl" },
  { label: "右滚动", value: "ltr" }
]);
onBeforeMount(() => {
  let blur = selectTargetData.value[0].option.globalConfig.blur;
  if (isUndefined(blur)) {
    selectTargetData.value[0].option.globalConfig.blur = 10;
  }
  let animationDuration = selectTargetData.value[0].option.globalConfig.animationDuration;
  if (isUndefined(animationDuration)) {
    selectTargetData.value[0].option.globalConfig.animationDuration = 2000;
  }
  let borderRadius = selectTargetData.value[0].option.globalConfig.borderRadius;
  if (isUndefined(borderRadius)) {
    selectTargetData.value[0].option.globalConfig.borderRadius = 20;
  }
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
:deep(.el-textarea .el-textarea__inner) {
  background-color: #000000 !important;
  --el-input-border-color: #333543;
}
</style>
