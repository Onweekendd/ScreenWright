<template>
  <div class="ft-timer-shaft-style">
    <SwCollapseItem title="外饰">
      <template #content>
        <el-form-item label="图标尺寸" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.iconSize" unit="px" :min="1" @change="update" />
        </el-form-item>

        <el-form-item label="内边距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.margin" unit="px" :min="1" @change="update" />
        </el-form-item>

        <el-form-item label="按钮边距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.iconLeft" unit="px" :min="1" @change="update" />
        </el-form-item>

        <el-form-item label="箭头边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model.number="selectTargetData[0].option.arrowLeft"
              unit="px"
              bottomLabel="左"
              @change="update"
            />
            <SwInputNumber
              v-model.number="selectTargetData[0].option.arrowRight"
              unit="px"
              bottomLabel="右"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="轴线粗度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.lineHeight" unit="px" @change="update" />
        </el-form-item>

        <el-form-item label="轴体颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.lineColor" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <SwCollapseItem title="文字">
      <template #content>
        <el-form-item label="文字样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="垂直偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option[tabsActive].textTranslateY" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option[tabsActive].isTextShadow" @change="update" />
        </el-form-item>

        <el-form-item
          label="文本阴影"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option[tabsActive].isTextShadow"
        >
          <div class="item-text-shadow flex flex-align-center flex-justify-between" style="width: 100%">
            <el-color-picker
              v-model="selectTargetData[0].option[tabsActive].textShadow.color"
              style="position: relative; top: -7px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option[tabsActive].textShadow.x"
              bottomLabel="X"
              width="48"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option[tabsActive].textShadow.y"
              bottomLabel="Y"
              width="48"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[tabsActive].textShadow.blur"
              bottomLabel="模糊"
              width="48"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="轴点">
      <template #content>
        <el-form-item label="光标尺寸" :label-width="secondLabelWidth">
          <SwInputNumber unit="px" v-model="selectTargetData[0].option[tabsActive].cursorSize" @change="update" />
        </el-form-item>

        <el-form-item label="轴点颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option[tabsActive].cursorColor" @change="update" />
        </el-form-item>
        <el-form-item v-if="tabsActive === 'activeObj'" label="边框颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option[tabsActive].borderColor" />
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
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor",
  attrs: tabsActive.value
});
</script>
<style lang="scss" scoped>
:deep(.el-color-picker__trigger) {
  border: none !important;
  width: 28px !important;
  height: 28px !important;
}
</style>
