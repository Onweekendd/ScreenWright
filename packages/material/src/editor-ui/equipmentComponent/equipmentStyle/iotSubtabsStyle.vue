<template>
  <div class="iot-subtabs-style">
    <SwCoordinateTabs v-model="placardType" :option="coordinateOption" />

    <el-form-item label="启用" v-if="placardType === 'hoverObj'" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.isHovered" @change="update" />
    </el-form-item>
    <sw-collapse-item title="文字">
      <template #content>
        <el-form-item label="文字样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="fontInput" @change="handleChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="currentDataObj.textTranslateX"
              unit="px"
              :controls="false"
              bottomLabel="X"
              @change="update"
            />
            <sw-input-number
              v-model="currentDataObj.textTranslateY"
              unit="px"
              :controls="false"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox v-model="currentDataObj.isTextShadow" @change="update" />
        </el-form-item>
        <el-form-item label="文本阴影" v-if="currentDataObj.isTextShadow" :label-width="secondLabelWidth">
          <div class="flex flex-left-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="currentDataObj.textShadow.color"
              style="position: relative; top: 7px; left: -4px"
              @change="update"
            />
            <sw-input-number v-model="currentDataObj.textShadow.x" bottomLabel="X" :controls="false" @change="update" />
            <sw-input-number v-model="currentDataObj.textShadow.y" bottomLabel="Y" :controls="false" @change="update" />
            <sw-input-number
              v-model="currentDataObj.textShadow.blur"
              bottomLabel="模糊"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="背景">
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select popper-class="sw-select-dropdown" v-model="currentDataObj.backgroundType" @change="update">
            <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色" v-if="currentDataObj.backgroundType == 'color'" :label-width="secondLabelWidth">
          <sw-single-color-picker
            field="backgroundColor"
            v-model="currentDataObj.backgroundColor"
            :presetColor="currentDataObj.backgroundColor"
            @change="update"
          />
        </el-form-item>
        <div v-if="currentDataObj.backgroundType == 'custom'">
          <el-form-item label="类型" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="currentDataObj.backgroundImageType"
              @change="update"
            >
              <el-option
                v-for="item in backgroundImageType"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentDataObj.backgroundImage"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
        </div>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="描边" v-model="currentDataObj.isBorder" @change="update" showIcon>
      <template #content>
        <el-form-item label="颜色">
          <sw-single-color-picker
            field="borderColor"
            v-model="currentDataObj.borderColor"
            :presetColor="currentDataObj.borderColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细">
          <sw-input-number v-model="currentDataObj.borderWidth" :controls="false" unit="px" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwCoordinateTabs } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const placardType = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "悬停",
    value: "hoverObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);

const currentDataObj = computed(() => {
  return selectTargetData.value[0].option[placardType.value];
});

const backgroundType = ref([
  { label: "颜色", value: "color" },
  { label: "自定义", value: "custom" }
]);

const backgroundImageType = ref([
  { label: "适应", value: "100% 100%" },
  { label: "原比例", value: "contain" },
  { label: "裁切", value: "cover" }
]);

watch(
  () => placardType.value,
  () => {
    const pathAttrs = placardType.value;
    fontInit(pathAttrs);
  }
);

const {
  input: fontInput,
  handleConfigTextChange: handleChange,
  getInitValue: fontInit
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor",
  attrs: placardType.value
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
