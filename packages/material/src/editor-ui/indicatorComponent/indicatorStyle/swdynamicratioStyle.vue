<template>
  <div class="ftdynamicratio-global">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <SwCollapseItem title="文本" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle @change="handleConfigTextChange" :model-value="getUnitInput" :isShowColorStyle="false" />
        </el-form-item>
        <el-form-item label="字体填充" title="字体填充" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.selectedTextType[tabsActive]"
            @change="update"
          >
            <el-option v-for="item in textColorType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <template v-if="selectTargetData[0].option.selectedTextType[tabsActive] === 'normal'">
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.textColor[tabsActive]" />
          </el-form-item>
          <el-form-item label="字体背景" :label-width="secondLabelWidth">
            <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.backgroundColor[tabsActive]" />
          </el-form-item>
        </template>

        <el-form-item
          label="颜色"
          v-if="selectTargetData[0].option.selectedTextType[tabsActive] === 'gradient'"
          :label-width="secondLabelWidth"
        >
          <sw-color-picker
            v-model:color="selectTargetData[0].option.selectedTextColor[tabsActive]"
            v-model:opacity="selectTargetData[0].option.selectedTextOpacity[tabsActive]"
            field="textGradientColor"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="字体间距" :label-width="secondLabelWidth">
          <sw-input-number controls @change="update" v-model="selectTargetData[0].option.split[tabsActive]" />
        </el-form-item>
        <el-form-item label="后缀" :label-width="secondLabelWidth">
          <sw-input @change="update" v-model="selectTargetData[0].option.textUnit[tabsActive]" />
        </el-form-item>
        <SwCollapseItem
          title="阴影"
          show-icon
          v-model="selectTargetData[0].option.shadowShow[tabsActive]"
          @change="update"
        >
          <template #content>
            <el-form-item label="阴影" :label-width="thirdLabelWidth">
              <div class="flex flex-justify-between" style="width: 100%">
                <el-color-picker
                  class="colorPicker"
                  size="small"
                  :show-alpha="true"
                  v-model="selectTargetData[0].option.shadowColor[tabsActive]"
                  style="position: relative; top: 7px; left: -4px"
                  @change="update"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.shadowX[tabsActive]"
                  :min="0"
                  bottomLabel="X"
                  width="50"
                  @change="update"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.shadowY[tabsActive]"
                  :min="0"
                  bottomLabel="Y"
                  width="50"
                  @change="update"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.shadowFuzzy[tabsActive]"
                  :min="0"
                  bottomLabel="模糊"
                  width="50"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="图标" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            v-model="selectTargetData[0].option.iconStyleMode[tabsActive]"
            popper-class="sw-select-dropdown"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="图片" value="custom" />
          </el-select>
        </el-form-item>

        <template
          v-if="
            selectTargetData[0].option.iconStyleMode && selectTargetData[0].option.iconStyleMode[tabsActive] === 'color'
          "
        >
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.iconColor[tabsActive]" />
          </el-form-item>
          <el-form-item label="尺寸" :label-width="secondLabelWidth">
            <sw-input-number @change="update" v-model="selectTargetData[0].option.iconSize[tabsActive]" :min="12" />
          </el-form-item>
        </template>
        <template
          v-if="
            selectTargetData[0].option.iconStyleMode &&
            selectTargetData[0].option.iconStyleMode[tabsActive] === 'custom'
          "
        >
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option.iconList[tabsActive]" @change="update" @delete="update" />
          </el-form-item>
          <el-form-item label="尺寸" :label-width="secondLabelWidth">
            <sw-input-number @change="update" v-model="selectTargetData[0].option.iconSize[tabsActive]" :min="12" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";
import { SwInput } from "@screenwright/ui/input";
// import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
// import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs"
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
const { selectTargetData, update } = useUpdateInstance();
const tabsActive = ref("0");
const textColorType = ref([
  { label: "纯色", value: "normal" },
  { label: "渐变", value: "gradient" }
]);
const getUnitInput = computed(() => {
  return {
    fontFamily: selectTargetData.value[0].option.fontFamily[tabsActive.value],
    fontSize: selectTargetData.value[0].option.fontSize[tabsActive.value],
    color: "",
    fontStyle: selectTargetData.value[0].option.fontStyle[tabsActive.value],
    fontWeight: selectTargetData.value[0].option.fontWeight[tabsActive.value]
  };
});

const handleConfigTextChange = (key: string, value: any) => {
  console.log("handleConfigTextChange", key, value);
  selectTargetData.value[0].option[key][tabsActive.value] = value[key];
  console.log(selectTargetData.value[0].option, "selectTargetData.value[0].option[key][tabsActive.value]");
};
const coordinateOption = ref([
  {
    label: "上升",
    value: "0"
  },
  {
    label: "下降",
    value: "1"
  }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
