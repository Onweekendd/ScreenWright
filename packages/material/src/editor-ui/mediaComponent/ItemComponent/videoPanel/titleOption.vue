<template>
  <el-form-item label="是否显示" :label-width="firstLabelWidth">
    <el-checkbox v-model="selectTargetData[0].option.showVideoIcon" @change="update" />
  </el-form-item>
  <SwCollapseItem title="文本样式">
    <template #content>
      <el-form-item label="方向" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.textPosition"
          @change="update"
        >
          <el-option v-for="item in textPosition" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="文字" :label-width="secondLabelWidth">
        <configTextStyle v-model="fontInput" @change="handleChange" />
      </el-form-item>
      <el-form-item label="对齐方式" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.textAlign"
          @change="update"
        >
          <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="偏移" :label-width="secondLabelWidth">
        <div class="flex flex-center-between">
          <sw-input-number
            v-model="selectTargetData[0].option.textTranslateX"
            unit="px"
            :controls="false"
            bottomLabel="X"
            @change="update"
          />
          <sw-input-number
            v-model="selectTargetData[0].option.textTranslateY"
            unit="px"
            :controls="false"
            bottomLabel="Y"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="阴影" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isTextShadow" @change="update" />
      </el-form-item>
      <el-form-item label="文本阴影" v-if="selectTargetData[0].option.isTextShadow" :label-width="secondLabelWidth">
        <div class="flex flex-justify-between" style="width: 100%">
          <el-color-picker
            class="colorPicker"
            size="small"
            :show-alpha="true"
            v-model="selectTargetData[0].option.textShadow.color"
            style="position: relative; top: 7px"
            @change="update"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.textShadow.x"
            :min="0"
            bottomLabel="X"
            width="50"
            @change="update"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.textShadow.y"
            :min="0"
            bottomLabel="Y"
            width="50"
            @change="update"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.textShadow.blur"
            :min="0"
            bottomLabel="模糊"
            width="50"
            @change="update"
          />
        </div>
      </el-form-item>
    </template>
  </SwCollapseItem>
  <SwCollapseItem title="标题背景">
    <template #content>
      <el-form-item label="填充方式" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.titleBgType"
          @change="update"
        >
          <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        :label-width="secondLabelWidth"
        label="颜色"
        v-if="selectTargetData[0].option.titleBgType == 'color'"
      >
        <sw-single-color-picker v-model="selectTargetData[0].option.titleBgColor" @change="update" />
      </el-form-item>
      <el-form-item
        :label-width="secondLabelWidth"
        label="类型"
        v-if="selectTargetData[0].option.titleBgType == 'custom'"
      >
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.titleBgImageType"
          @change="update"
        >
          <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        :label-width="secondLabelWidth"
        label="图片"
        v-if="selectTargetData[0].option.titleBgType == 'custom'"
      >
        <sw-upload
          v-model="selectTargetData[0].option.titleBgImage"
          :multiple="false"
          :showFileList="false"
          @change="update"
          @delete="update"
        />
      </el-form-item>
    </template>
  </SwCollapseItem>
  <SwCollapseItem title="标题图标">
    <template #content>
      <el-form-item label="图标" :label-width="secondLabelWidth">
        <sw-upload
          v-model="selectTargetData[0].option.videoIcon"
          :multiple="false"
          :showFileList="false"
          @change="update"
          @delete="update"
        />
      </el-form-item>
      <el-form-item :label-width="secondLabelWidth" label="尺寸" v-if="selectTargetData[0].option.iconWidth >= 0">
        <div class="flex flex-center-between">
          <sw-input-number
            v-model="selectTargetData[0].option.iconWidth"
            bottomLabel="宽度"
            :min="0"
            @change="update"
          />
          <sw-input-number
            v-model="selectTargetData[0].option.iconHeight"
            bottomLabel="高度"
            :min="0"
            @change="update"
          />
        </div>
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { reactive } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const { input: fontInput, handleConfigTextChange: handleChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});

const textPosition = reactive<any>([
  { label: "顶部", value: "top" },
  { label: "底部", value: "bottom" }
]);

const textAlign = reactive<any>([
  { label: "居中", value: "center" },
  { label: "左对齐", value: "left" },
  { label: "右对齐", value: "right" }
]);

const backgroundType = reactive<any>([
  { label: "颜色", value: "color" },
  { label: "自定义", value: "custom" }
]);

const backgroundImageType = reactive<any>([
  { label: "适应", value: "100% 100%" },
  { label: "原比例", value: "contain" },
  { label: "裁切", value: "cover" }
]);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
:deep(.el-select__wrapper) {
  min-height: 24px;
}
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
