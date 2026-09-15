<template>
  <div class="ftText2-global">
    <el-form-item label="是否换行" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.iswrap" @change="update" />
    </el-form-item>
    <el-form-item label="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowColorStyle="false" />
    </el-form-item>
    <el-form-item label="字体填充" :label-width="firstLabelWidth">
      <el-select
        @change="update"
        v-model="selectTargetData[0].option.selectedTextType"
        popper-class="sw-select-dropdown"
      >
        <el-option v-for="item in textColorType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <template v-if="selectTargetData[0].option.selectedTextType === 'normal'">
      <el-form-item label="颜色" :label-width="firstLabelWidth">
        <sw-single-color-picker @change="update" field="textColor" v-model="selectTargetData[0].option.color" />
      </el-form-item>
      <el-form-item label="字体背景" :label-width="firstLabelWidth">
        <sw-single-color-picker
          @change="update"
          v-model="selectTargetData[0].option.backgroundColor"
          field="backgroundColor"
        />
      </el-form-item>
    </template>
    <el-form-item
      :label-width="firstLabelWidth"
      label="颜色"
      v-if="selectTargetData[0].option.selectedTextType === 'gradient'"
    >
      <sw-color-picker
        field="textGradientColor"
        :options="{ colorTypeOption: 'linear-gradient,single' }"
        v-model:color="selectTargetData[0].option.selectedTextColor"
        v-model:opacity="selectTargetData[0].option.selectedTextOpacity"
        :input-disabled="true"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="字体间距" :label-width="firstLabelWidth">
      <sw-input-number controls @change="update" v-model="selectTargetData[0].option.split" />
    </el-form-item>

    <el-form-item label="字体行高" :label-width="firstLabelWidth">
      <sw-input-number controls @change="update" v-model="selectTargetData[0].option.lineHeight2" />
    </el-form-item>
    <ItemSelectAlign
      label="对齐方式"
      v-model="selectTargetData[0].option.textAlign"
      :type="typeAttrs.default"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <ItemSelectAlign
      label="垂直对齐"
      v-model="selectTargetData[0].option.textAlignVertical"
      :type="typeAttrs.vertical"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <el-form-item label="鼠标事件" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.pointerEvents" />
    </el-form-item>
    <sw-collapse-item title="阴影" showIcon v-model="selectTargetData[0].option.shadowShow" @change="update">
      <template #content>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <div class="item-text-shadow flex flex-align-center flex-justify-between">
            <el-color-picker
              v-model="selectTargetData[0].option.shadowColor"
              style="position: relative; top: -7px; left: -4px"
              @confirm="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.shadowX"
              bottomLabel="X"
              @confirm="update"
              :controls="false"
              width="48"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.shadowY"
              bottomLabel="Y"
              @confirm="update"
              :controls="false"
              width="48"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.shadowFuzzy"
              bottomLabel="模糊"
              @confirm="update"
              :controls="false"
              width="48"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemSelectAlign from "./../textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "./../textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color"
});
const textColorType = [
  { label: "纯色", value: "normal" },
  { label: "渐变", value: "gradient" }
];
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.item-text-shadow {
  width: 100%;
}
:deep(.el-color-picker__trigger) {
  border: none !important;
  width: 28px !important;
  height: 28px !important;
}
</style>
