<template>
  <div class="ft-date-time-picker-chose">
    <el-form-item label="文字样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <el-form-item label="字间距" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" v-model="selectTargetData[0].option.letterSpacing" unit="px" />
    </el-form-item>
    <el-form-item label="行距" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" v-model="selectTargetData[0].option.lineHeight" unit="px" />
    </el-form-item>
    <el-form-item
      :label-width="firstLabelWidth"
      label="连接符"
      v-if="selectTargetData[0].option.type === 'datetimerange'"
    >
      <SwInput v-model="selectTargetData[0].option.rangeSeparator" @change="update" />
    </el-form-item>
    <SwCollapseItem title="背景色" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.backgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="颜色"
          v-if="selectTargetData[0].option.backgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
        </el-form-item>

        <template v-if="selectTargetData[0].option.backgroundType == 'custom'">
          <el-form-item label="类型" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.backgroundImageType"
              @change="update"
            >
              <el-option label="适应" value="100% 100%" />
              <el-option label="原比例" value="contain" />
              <el-option label="裁切" value="cover" />
            </el-select>
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option.backgroundImage" @delete="update" @change="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="边框" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.borderColor" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.borderWidth" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.borderRadius" unit="px" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
// import Icon from "@editor/base/Icon/index.vue"
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
