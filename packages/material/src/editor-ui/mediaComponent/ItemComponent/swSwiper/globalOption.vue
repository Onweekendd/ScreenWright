<template>
  <div class="ft-swiper-global">
    <el-form-item label="类型" :label-width="firstLabelWidth">
      <SwRadio
        class="config-padding"
        direction="row"
        :option="swiperType"
        v-model="selectTargetData[0].option.type"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="默认显示" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.type === 'card'">
      <SwRadio
        class="config-padding"
        direction="row"
        :option="showOption"
        v-model="selectTargetData[0].option.showSwiper"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="选择器" :label-width="firstLabelWidth">
      <SwRadio
        class="config-padding"
        direction="row"
        :option="swiperIndicator"
        v-model="selectTargetData[0].option.indicator"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="轮播时间" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.interval"
        unit="ms"
        :min="0"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="轮播方向" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.direction"
        @change="update"
      >
        <el-option v-for="item in seriesLabelOrient" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="是否自动切换" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.autoplay" @change="update" />
    </el-form-item>
    <SwCollapseItem title="切换箭头">
      <template #content>
        <el-form-item label="显示时机" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.arrow"
            @change="update"
          >
            <el-option v-for="item in arrowOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片上传" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.arrowImg"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="是否翻转" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isRotate" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { reactive } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import type { dictBoolean, dictString } from "../type";

const { update, selectTargetData } = useUpdateInstance();

const swiperType = reactive<dictString[]>([
  { label: "普通", value: "" },
  { label: "立体", value: "card" }
]);

const showOption = reactive<dictBoolean[]>([
  { label: "3个", value: false },
  { label: "5个", value: true }
]);

const swiperIndicator = reactive<dictString[]>([
  { label: "外部", value: "outside" },
  { label: "不显示", value: "none" }
]);

const seriesLabelOrient = reactive<dictString[]>([
  { label: "水平", value: "horizontal" },
  { label: "垂直", value: "vertical" }
]);

const arrowOption = reactive<dictString[]>([
  { label: "总是", value: "always" },
  { label: "悬浮", value: "hover" },
  { label: "从不", value: "never" }
]);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
