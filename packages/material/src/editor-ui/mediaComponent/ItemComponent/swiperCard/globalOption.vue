<template>
  <div class="swiper-card-global-option" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="滚动时长" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.transitionTime"
        :min="0"
        unit="s"
        @change="update"
      />
    </el-form-item>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.globalConfig.autoPlay"
      title="自动轮播"
      showIcon
    >
      <template #content>
        <el-form-item label="支持悬停" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.globalConfig.hoverPause" @change="update" />
        </el-form-item>
        <el-form-item label="轮播方向" :label-width="secondLabelWidth">
          <SwRadio
            class="config-padding"
            direction="row"
            :option="directionListOptions"
            v-model="selectTargetData[0].option.globalConfig.rotateDirection"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="间隔时长" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.globalConfig.intervalTime"
            :min="0"
            unit="s"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.globalConfig.controlBtnShow"
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
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import type { DirectionOption } from "./swiperCard";

const { update, selectTargetData } = useUpdateInstance();

const directionListOptions = ref<DirectionOption[]>([
  { label: "顺时针", value: 1 },
  { label: "逆时针", value: 0 }
]);
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
