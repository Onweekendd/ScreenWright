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
    <sw-collapse-item title="中间卡片" :disabled="false">
      <template #content>
        <ft-card-settings v-model="card1Settings" @change="update" />
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="两侧卡片" :disabled="false">
      <template #content>
        <ft-card-settings v-model="card2Settings" @change="update" />
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="其他卡片" :disabled="false" v-if="selectTargetData[0].option.showSwiper">
      <template #content>
        <ft-card-settings v-model="card3Settings" @change="update" />
      </template>
    </sw-collapse-item>
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
import { computed, reactive } from "vue";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import type { dictBoolean, dictString } from "../type";
import SwCardSettings from "./swCardSettings.vue";
interface CardSettings {
  directionTranslate: number;
  directionScale: number;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  showFont: boolean;
}

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

const card1Settings = computed<CardSettings>({
  get() {
    if (has(selectTargetData.value[0].option, "picStyle")) {
      return {
        directionTranslate: selectTargetData.value[0].option.picStyle.firstStyle.directionTranslate,
        translateX: selectTargetData.value[0].option.picStyle.firstStyle.translateX,
        translateY: selectTargetData.value[0].option.picStyle.firstStyle.translateY,
        directionScale: selectTargetData.value[0].option.picStyle.firstStyle.directionScale,
        scaleX: selectTargetData.value[0].option.picStyle.firstStyle.scaleX,
        scaleY: selectTargetData.value[0].option.picStyle.firstStyle.scaleY,
        showFont: selectTargetData.value[0].option.picStyle.firstStyle.showFont,
        opacity: selectTargetData.value[0].option.opacity
      };
    } else {
      return {
        directionTranslate: 0,
        translateX: 0,
        translateY: 0,
        directionScale: 1,
        scaleX: 1,
        scaleY: 1,
        showFont: true,
        opacity: 1
      };
    }
  },
  set(val) {
    selectTargetData.value[0].option.picStyle.firstStyle.directionTranslate = val.directionTranslate;
    selectTargetData.value[0].option.picStyle.firstStyle.translateX = val.translateX;
    selectTargetData.value[0].option.picStyle.firstStyle.translateY = val.translateY;
    selectTargetData.value[0].option.picStyle.firstStyle.directionScale = val.directionScale;
    selectTargetData.value[0].option.picStyle.firstStyle.scaleX = val.scaleX;
    selectTargetData.value[0].option.picStyle.firstStyle.scaleY = val.scaleY;
    selectTargetData.value[0].option.picStyle.firstStyle.showFont = val.showFont;
    selectTargetData.value[0].option.opacity = val.opacity;
    update();
  }
});

const card2Settings = computed<CardSettings>({
  get() {
    if (has(selectTargetData.value[0].option, "picStyle")) {
      return {
        directionTranslate: selectTargetData.value[0].option.picStyle.secondStyle.directionTranslate,
        translateX: selectTargetData.value[0].option.picStyle.secondStyle.translateX,
        translateY: selectTargetData.value[0].option.picStyle.secondStyle.translateY,
        directionScale: selectTargetData.value[0].option.picStyle.secondStyle.directionScale,
        scaleX: selectTargetData.value[0].option.picStyle.secondStyle.scaleX,
        scaleY: selectTargetData.value[0].option.picStyle.secondStyle.scaleY,
        showFont: selectTargetData.value[0].option.picStyle.secondStyle.showFont,
        opacity: selectTargetData.value[0].option.secondOpacity
      };
    } else {
      return {
        directionTranslate: 0,
        translateX: 0,
        translateY: 0,
        directionScale: 1,
        scaleX: 1,
        scaleY: 1,
        showFont: true,
        opacity: 1
      };
    }
  },
  set(val) {
    selectTargetData.value[0].option.picStyle.secondStyle.directionTranslate = val.directionTranslate;
    selectTargetData.value[0].option.picStyle.secondStyle.translateX = val.translateX;
    selectTargetData.value[0].option.picStyle.secondStyle.translateY = val.translateY;
    selectTargetData.value[0].option.picStyle.secondStyle.directionScale = val.directionScale;
    selectTargetData.value[0].option.picStyle.secondStyle.scaleX = val.scaleX;
    selectTargetData.value[0].option.picStyle.secondStyle.scaleY = val.scaleY;
    selectTargetData.value[0].option.picStyle.secondStyle.showFont = val.showFont;
    selectTargetData.value[0].option.secondOpacity = val.opacity;
    update();
  }
});

const card3Settings = computed<CardSettings>({
  get() {
    if (has(selectTargetData.value[0].option, "picStyle")) {
      return {
        directionTranslate: selectTargetData.value[0].option.picStyle.thirdStyle.directionTranslate,
        translateX: selectTargetData.value[0].option.picStyle.thirdStyle.translateX,
        translateY: selectTargetData.value[0].option.picStyle.thirdStyle.translateY,
        directionScale: selectTargetData.value[0].option.picStyle.thirdStyle.directionScale,
        scaleX: selectTargetData.value[0].option.picStyle.thirdStyle.scaleX,
        scaleY: selectTargetData.value[0].option.picStyle.thirdStyle.scaleY,
        showFont: selectTargetData.value[0].option.picStyle.thirdStyle.showFont,
        opacity: selectTargetData.value[0].option.thirdOpacity
      };
    } else {
      return {
        directionTranslate: 0,
        translateX: 0,
        translateY: 0,
        directionScale: 1,
        scaleX: 1,
        scaleY: 1,
        showFont: true,
        opacity: 1
      };
    }
  },
  set(val) {
    selectTargetData.value[0].option.picStyle.thirdStyle.directionTranslate = val.directionTranslate;
    selectTargetData.value[0].option.picStyle.thirdStyle.translateX = val.translateX;
    selectTargetData.value[0].option.picStyle.thirdStyle.translateY = val.translateY;
    selectTargetData.value[0].option.picStyle.thirdStyle.directionScale = val.directionScale;
    selectTargetData.value[0].option.picStyle.thirdStyle.scaleX = val.scaleX;
    selectTargetData.value[0].option.picStyle.thirdStyle.scaleY = val.scaleY;
    selectTargetData.value[0].option.picStyle.thirdStyle.showFont = val.showFont;
    selectTargetData.value[0].option.thirdOpacity = val.opacity;
    update();
  }
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
