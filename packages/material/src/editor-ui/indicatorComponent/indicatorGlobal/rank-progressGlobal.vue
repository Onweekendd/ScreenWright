<template>
  <div class="rank-progressGlobal">
    <SwCollapseItem title="文字" open>
      <template #content v-if="selectTargetData[0].option.name">
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="字间距" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.name.letterSpacing" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.name.textTranslateX"
              bottomLabel="x"
              unit="px"
              @change="update"
              width="90"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.name.textTranslateY"
              bottomLabel="y"
              unit="px"
              @change="update"
              width="90"
            />
          </div>
        </el-form-item>
        <el-form-item
          label="背景"
          v-if="selectTargetData[0].option.name && isBoolean(selectTargetData[0].option.name.showBg)"
          :label-width="secondLabelWidth"
        >
          <el-checkbox @change="update" v-model="selectTargetData[0].option.name.showBg" />
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.name.isTextShadow" />
        </el-form-item>

        <el-form-item
          label="文本阴影"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.name && selectTargetData[0].option.name.isTextShadow"
        >
          <div class="flex flex-justify-between fullWidth">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.name.textShadow.color"
              style="position: relative; top: 7px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.name.textShadow.x"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.name.textShadow.y"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.name.textShadow.blur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="数值" open>
      <template #content v-if="selectTargetData[0].option.value">
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="inputValue" @change="handleValueChange" />
        </el-form-item>
        <el-form-item label="字间距" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.value.letterSpacing" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.value.textTranslateX"
              bottomLabel="x"
              unit="px"
              @change="update"
              width="90"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.value.textTranslateY"
              bottomLabel="y"
              unit="px"
              @change="update"
              width="90"
            />
          </div>
        </el-form-item>
        <el-form-item
          label="背景"
          v-if="isBoolean(selectTargetData[0].option.value.showBg)"
          :label-width="secondLabelWidth"
        >
          <el-checkbox @change="update" v-model="selectTargetData[0].option.value.showBg" />
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.value.isTextShadow" />
        </el-form-item>
        <el-form-item
          label="文本阴影"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.value.isTextShadow"
        >
          <div class="flex flex-justify-between fullWidth">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.value.textShadow.color"
              style="position: relative; top: 7px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.value.textShadow.x"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.value.textShadow.y"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.value.textShadow.blur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { isBoolean } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  color: "fontColor",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  attrs: "name"
});

const { input: inputValue, handleConfigTextChange: handleValueChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  color: "fontColor",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  attrs: "value"
});
</script>
<style lang="scss" scoped>
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
