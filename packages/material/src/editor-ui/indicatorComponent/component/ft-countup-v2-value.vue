<template>
  <div class="ft-countup-v2-value">
    <SwCollapseItem title="边框设置">
      <template #content>
        <el-form-item label="边框" :label-width="secondLabelWidth">
          <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.type" @change="update">
            <el-option v-for="item in border" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <template v-if="selectTargetData[0].option.type === 'border'">
          <el-form-item label="边框颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker v-model="selectTargetData[0].option.borderColor" @change="update" />
          </el-form-item>
        </template>
        <el-form-item label="边框宽度" :label-width="secondLabelWidth">
          <div class="flex flex-justify-around" style="width: 100%">
            <sw-input-number
              v-model.number="selectTargetData[0].option.borderTopWidth"
              bottomLabel="上"
              width="50"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.borderBottomWidth"
              bottomLabel="下"
              @change="update"
              width="50"
            />
            <sw-input-number
              width="50"
              v-model="selectTargetData[0].option.borderLeftWidth"
              bottomLabel="左"
              @change="update"
            />
            <sw-input-number
              width="50"
              v-model="selectTargetData[0].option.borderRightWidth"
              bottomLabel="右"
              @change="update"
            />
          </div>
        </el-form-item>
        <template v-if="selectTargetData[0].option.type === 'img'">
          <el-form-item label="背景图" :label-width="secondLabelWidth">
            <sw-upload v-model="selectTargetData[0].option.backgroundBorder" @change="update" @delete="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="内部设置">
      <template #content>
        <el-form-item label="大小" :label-width="secondLabelWidth">
          <div class="flex flex-justify-around" style="width: 100%">
            <sw-input-number
              width="100"
              v-model="selectTargetData[0].option.spanWidth"
              bottomLabel="宽"
              @change="update"
            />
            <sw-input-number
              width="100"
              v-model="selectTargetData[0].option.spanHeight"
              bottomLabel="高"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="背景颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
        </el-form-item>
        <el-form-item label="背景图片" :label-width="secondLabelWidth">
          <sw-upload v-model="selectTargetData[0].option.backgroundImage" @change="update" @delete="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="字体渐变色">
      <template #content>
        <el-form-item label="字体渐变" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.setFontLinear" @change="update" />
        </el-form-item>
        <el-form-item label="字体颜色" :label-width="secondLabelWidth" v-if="selectTargetData[0].option.setFontLinear">
          <sw-color-picker
            field="textGradientColor"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="selectTargetData[0].option.fontLinearColor"
            :opacity="100"
            inputDisabled
            returnType="str"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const border = ref([
  { label: "无边框", value: "" },
  { label: "内置图片", value: "img" },
  { label: "内置边框", value: "border" }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
