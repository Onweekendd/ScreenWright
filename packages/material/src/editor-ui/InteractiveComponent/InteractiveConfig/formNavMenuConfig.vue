<template>
  <div class="form-nav-menu-config">
    <SwCollapseItem title="子级样式">
      <template #content>
        <el-form-item :label-width="secondLabelWidth" label="启用">
          <el-checkbox v-model="selectTargetData[0].option.isChildStyle" @change="update" />
        </el-form-item>
        <el-form-item label="隐藏展开图标" :label-width="ellipsisLabelWidth" title="隐藏展开图标">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.isHiddenArrow" style="margin-left: 10px" />
        </el-form-item>
        <el-form-item label="字体" :label-width="secondLabelWidth">
          <configTextStyle :isShowFontSize="false" v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.childLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>

        <el-form-item label="对齐方式" :label-width="secondLabelWidth">
          <el-select
            style="width: 100%"
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.childTextAlign"
            @change="update"
          >
            <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <SwCollapseItem title="展开线配色" open>
          <template #content>
            <el-form-item label="显示线" :label-width="ellipsisLabelWidth">
              <el-checkbox v-model="selectTargetData[0].option.isOpenedLine" @change="update" />
            </el-form-item>

            <el-form-item label="默认配色" :label-width="ellipsisLabelWidth">
              <SwSingleColorPicker :width="80" v-model="selectTargetData[0].option.childLineColor1" @change="update" />
            </el-form-item>
            <el-form-item label="选中配色" :label-width="ellipsisLabelWidth">
              <SwSingleColorPicker :width="80" v-model="selectTargetData[0].option.childLineColor2" @change="update" />
            </el-form-item>
          </template>
        </SwCollapseItem>

        <SwCollapseItem title="选中背景色" open>
          <template #content>
            <el-form-item label="渐变角度" :label-width="ellipsisLabelWidth">
              <SwInputNumber v-model="selectTargetData[0].option.childBgRadius" unit="°" @change="update" />
            </el-form-item>
            <el-form-item label="渐变起始色" :label-width="ellipsisLabelWidth">
              <SwSingleColorPicker :width="80" v-model="selectTargetData[0].option.childBgColor1" @change="update" />
            </el-form-item>
            <el-form-item label="渐变终点色" :label-width="ellipsisLabelWidth">
              <SwSingleColorPicker :width="80" v-model="selectTargetData[0].option.childBgColor2" @change="update" />
            </el-form-item>

            <el-form-item label="圆角" :label-width="ellipsisLabelWidth">
              <div class="flex">
                <SwInputNumber
                  v-model.number="selectTargetData[0].option.childRadiusTop"
                  bottomLabel="上"
                  @change="update"
                />
                <SwInputNumber
                  v-model.number="selectTargetData[0].option.childRadiusRight"
                  bottomLabel="右"
                  @change="update"
                />
                <SwInputNumber
                  v-model.number="selectTargetData[0].option.childRadiusBottom"
                  bottomLabel="下"
                  @change="update"
                />
                <SwInputNumber
                  v-model.number="selectTargetData[0].option.childRadiusLeft"
                  bottomLabel="左"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const ellipsisLabelWidth = parseInt(secondLabelWidth) - 10;
const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "childFontFamily",
  fontStyle: "childFontStyle",
  fontWeight: "childFontWeight",
  fontSize: "fontSize",
  color: "childFontColor"
});
const textAlign = ref<Array<{ label: string; value: string }>>([
  { label: "居中", value: "center" },
  { label: "左对齐", value: "left" },
  { label: "右对齐", value: "right" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
