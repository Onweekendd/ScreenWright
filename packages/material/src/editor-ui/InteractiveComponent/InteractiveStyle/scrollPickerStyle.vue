<template>
  <div class="scroll-picker-style">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <SwCollapseItem title="文本样式" open>
      <template #content>
        <el-form-item label="文本" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <SwInputNumber
                v-model="selectTargetData[0].option[tabsActive].textLetterSpacing"
                @change="update"
                bottomLabel="字距"
                unit="px"
                width="60"
                style="margin-left: 12px"
              />
              <SwInputNumber
                v-model="selectTargetData[0].option[tabsActive].textLineHeight"
                @change="update"
                bottomLabel="行距"
                unit="px"
                width="60"
                style="margin-left: 12px"
              />
            </template>
          </configTextStyle>
        </el-form-item>
        <ItemSelectAlign
          label="对齐方式"
          :type="typeAttrs.default"
          v-model="selectTargetData[0].option[tabsActive].textAlign"
          @change="update"
          :label-width="secondLabelWidth"
        />
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option[tabsActive].isTextShadow" />
        </el-form-item>
        <el-form-item
          label="文本阴影"
          v-if="selectTargetData[0].option[tabsActive].isTextShadow"
          :label-width="secondLabelWidth"
        >
          <div class="flex flex-justify-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option[tabsActive].textShadowColor"
              style="position: relative; top: 7px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[tabsActive].textShadowX"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[tabsActive].textShadowY"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[tabsActive].textShadowBlur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="背景">
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option[tabsActive].backgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="颜色"
          v-if="selectTargetData[0].option[tabsActive].backgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option[tabsActive].backgroundColor" @change="update" />
        </el-form-item>
        <el-form-item
          label="图片"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option[tabsActive].backgroundType == 'custom'"
        >
          <SwUpload
            v-model="selectTargetData[0].option[tabsActive].backgroundImage"
            @delete="update"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwCoordinateTabs as SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const tabsActive = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);
watch(
  () => tabsActive.value,
  () => {
    const pathAttrs = tabsActive.value;
    getInitValue(pathAttrs);
  }
);
const { input, handleConfigTextChange, getInitValue } = useFontStyleAttrs({
  fontFamily: "textFontFamily",
  fontStyle: "textFontStyle",
  fontWeight: "textFontWeight",
  fontSize: "textFontSize",
  color: "textColor",
  attrs: `${tabsActive.value}`
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
