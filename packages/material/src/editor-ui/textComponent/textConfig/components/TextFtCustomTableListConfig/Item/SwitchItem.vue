<template>
  <div class="switch-item-container">
    <el-form-item label="层级" :label-width="secondLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.column[index].seriesYZIndex"
        :controls="false"
        :min="1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="开关尺寸" :label-width="secondLabelWidth">
      <div class="input-wrap flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetWidth"
          unit="px"
          bottomLabel="宽度"
          :controls="false"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetHeight"
          unit="px"
          bottomLabel="高度"
          :controls="false"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <el-form-item label="开关位置" :label-width="secondLabelWidth">
      <div class="input-wrap flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <el-form-item label="显示类型" :label-width="secondLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.column[index].switchType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in typeOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="打开文案" :label-width="secondLabelWidth">
      <sw-input v-model="selectTargetData[0].option.column[index].switchActiveText" @change="update" />
    </el-form-item>
    <el-form-item label="关闭文案" :label-width="secondLabelWidth">
      <sw-input v-model="selectTargetData[0].option.column[index].switchInactiveText" @change="update" />
    </el-form-item>
    <el-form-item
      label="打开背景色"
      v-if="selectTargetData[0].option.column[index].switchType !== 'image'"
      :label-width="secondLabelWidth"
    >
      <sw-single-color-picker
        field="pointColor"
        v-model="selectTargetData[0].option.column[index].switchActiveColor"
        :presetColor="selectTargetData[0].option.column[index].switchActiveColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item
      label="关闭背景色"
      v-if="selectTargetData[0].option.column[index].switchType !== 'image'"
      :label-width="secondLabelWidth"
    >
      <sw-single-color-picker
        field="pointColor"
        v-model="selectTargetData[0].option.column[index].switchInactiveColor"
        :presetColor="selectTargetData[0].option.column[index].switchInactiveColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item
      label="圆点大小"
      v-if="selectTargetData[0].option.column[index].switchType !== 'image'"
      :label-width="secondLabelWidth"
    >
      <sw-input-number
        v-model="selectTargetData[0].option.column[index].switchPointSize"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <sw-collapse-item title="图标配置" v-if="selectTargetData[0].option.column[index].switchType === 'icon'">
      <template #content>
        <el-form-item label="打开图标" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.column[index].switchActiveIcon"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="关闭图标" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.column[index].switchInactiveIcon"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="图片配置" v-if="selectTargetData[0].option.column[index].switchType === 'image'">
      <template #content>
        <el-form-item label="打开图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.column[index].switchActiveImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="关闭图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.column[index].switchInactiveImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="文本配置" :disabled="false">
      <template #content>
        <el-form-item label="样式" :label-width="48">
          <configTextStyle
            v-model="switchConfig[index]"
            @change="(key: string, val: any) => handleSwitchFontStyleChange(key, val)"
          />
        </el-form-item>
        <el-form-item label="阴影" :label-width="48">
          <el-checkbox v-model="selectTargetData[0].option.column[index].switchIsTextShadow" @change="update" />
        </el-form-item>
        <ItemTextShadow
          v-if="selectTargetData[0].option.column[index].switchIsTextShadow"
          v-model="shadowConfig[index]"
          label="文本阴影"
          :labelWidth="38"
          marginLeft="10px"
          @change="(key: string, val: ShadowProps) => shadowChange(key, val)"
        />
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ItemTextShadow from "../../../ItemComponent/ItemTextShadow/index.vue";
import type { ShadowProps } from "../../../ItemComponent/ItemTextShadow/type";

import { capitalizeFirstLetter } from "@editor/utils";
import type { StyleProps } from "@editor/components/configTextStyle/configTextStyle";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { typeOption } from "../../../constants";
import { secondLabelWidth } from "../../../textConfig";
import { seriesYContentType_switch_defaultObj } from "./config";

const { update, selectTargetData } = useUpdateInstance();
const props = defineProps<{
  index: number;
}>();
const shadowConfig = ref<ShadowProps[]>([]);
const shadowChange = (key: string, val: ShadowProps) => {
  selectTargetData.value[0].option.column[props.index].switchTextShadowColor = val.color;
  selectTargetData.value[0].option.column[props.index].switchTextShadowX = val.x;
  selectTargetData.value[0].option.column[props.index].switchTextShadowY = val.y;
  selectTargetData.value[0].option.column[props.index].switchTextShadowBlur = val.blur;
  update();
};
const switchConfig = ref<StyleProps[]>([]);
const initConfig = () => {
  switchConfig.value = [];
  shadowConfig.value = [];

  selectTargetData.value[0].option.column.forEach((item: any, index: number) => {
    seriesYContentType_switch_defaultObj.map((dObj) => {
      if (!has(item, dObj.key)) {
        (item as any)[dObj.key] = dObj.defaultValue;
      }
    });

    switchConfig.value.push({
      fontWeight: selectTargetData.value[0].option.column[index].switchFontWeight,
      fontSize: selectTargetData.value[0].option.column[index].switchFontSize,
      fontFamily: selectTargetData.value[0].option.column[index].switchFontFamily,
      fontStyle: selectTargetData.value[0].option.column[index].switchFontStyle,
      color: selectTargetData.value[0].option.column[index].switchFontColor
      // lineHeight: selectTargetData.value[0].option.column[index].switchlineHeight,
      // letterSpacing: selectTargetData.value[0].option.column[index].switchletterSpacing
    });
    shadowConfig.value.push({
      color: selectTargetData.value[0].option.column[index].switchTextShadowColor,
      x: selectTargetData.value[0].option.column[index].switchTextShadowX,
      y: selectTargetData.value[0].option.column[index].switchTextShadowY,
      blur: selectTargetData.value[0].option.column[index].switchTextShadowBlur
    });
  });
};
const handleSwitchFontStyleChange = (key: string, val: any) => {
  selectTargetData.value[0].option.column[props.index][
    `switch${key == "color" ? "FontColor" : capitalizeFirstLetter(key)}`
  ] = val[key];
  update();
};
watch(
  () => selectTargetData.value[0],
  (nval, oval) => {
    if ((nval?.id == oval?.id || oval == null) && nval?.option.column.length != oval?.option.column.length) {
      initConfig();
    }
  },
  {
    deep: true,
    immediate: true
  }
);
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.switch-item-container {
  width: 100%;
  .input-wrap {
    width: 100%;
  }
}
</style>
