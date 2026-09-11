<template>
  <div class="form-switch-global">
    <el-form-item label="对齐方式" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.type"
        @change="update"
      >
        <el-option v-for="item in typeOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="打开时的文字" :label-width="firstLabelWidth">
      <SwInput v-model="selectTargetData[0].option.activeText" @change="update" />
    </el-form-item>
    <el-form-item label="关闭时的文字" :label-width="firstLabelWidth">
      <SwInput v-model="selectTargetData[0].option.inactiveText" @change="update" />
    </el-form-item>
    <el-form-item
      label="打开时的背景色"
      v-if="selectTargetData[0].option.type !== 'image'"
      :label-width="firstLabelWidth"
    >
      <SwSingleColorPicker v-model="selectTargetData[0].option.activeColor" @change="update" />
    </el-form-item>
    <el-form-item
      label="关闭时的背景色"
      v-if="selectTargetData[0].option.type !== 'image'"
      :label-width="firstLabelWidth"
    >
      <SwSingleColorPicker v-model="selectTargetData[0].option.inactiveColor" @change="update" />
    </el-form-item>

    <el-form-item label="圆点大小" v-if="selectTargetData[0].option.type !== 'image'" :label-width="firstLabelWidth">
      <SwInputNumber unit="px" v-model="selectTargetData[0].option.pointSize" @change="update" />
    </el-form-item>
    <SwCollapseItem open title="圆点配置" v-if="selectTargetData[0].option.type === 'default'">
      <template #content>
        <el-form-item label="打开时颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.pointColor" @change="update" />
        </el-form-item>
        <el-form-item label="关闭时颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.pointColor2" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem open title="图标配置" v-if="selectTargetData[0].option.type === 'icon'">
      <template #content>
        <el-form-item label="打开图标" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.activeIcon" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item label="关闭图标" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.inactiveIcon" @change="update" @delete="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem open title="图标配置" v-if="selectTargetData[0].option.type === 'image'">
      <template #content>
        <el-form-item label="打开图片" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.activeImage" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item label="关闭图片" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.inactiveImage" @change="update" @delete="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="文本配置">
      <template #content>
        <el-form-item label="样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.letterSpacing"
                  unit="px"
                  bottomLabel="字距"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>

        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.isTextShadow" />
        </el-form-item>

        <el-form-item label="文本阴影" :label-width="secondLabelWidth" v-if="selectTargetData[0].option.isTextShadow">
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
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput as SwInput } from "@screenwright/ui/input";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const typeOption = ref([
  { label: "默认", value: "default" },
  { label: "图标", value: "icon" },
  { label: "图片", value: "image" }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
