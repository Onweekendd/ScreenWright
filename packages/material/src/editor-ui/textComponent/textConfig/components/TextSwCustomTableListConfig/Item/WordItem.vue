<template>
  <div class="word-item-container">
    <el-form-item
      v-if="!selectTargetData[0].option.column[index].seriesYIsMapping"
      label="文本内容"
      :label-width="secondLabelWidth"
    >
      <sw-input v-model="selectTargetData[0].option.column[index].word" @change="update" />
    </el-form-item>
    <el-form-item label="层级" :label-width="secondLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.column[index].seriesYZIndex"
        :controls="false"
        :min="1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="位置" :label-width="secondLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="宽度" :label-width="secondLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.column[index].seriesYOffsetWidth"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <ItemSelectAlign v-model="selectTargetData[0].option.column[index].seriesYTextAlign" :type="typeAttrs.default" />
    <el-form-item label="文本样式" :label-width="secondLabelWidth">
      <configTextStyle
        v-model="seriesYConfig[index]"
        @change="(key: keyof StyleProps, val: StyleProps) => handleSwitchFontStyleChange(key, val)"
      >
        <template #append>
          <div style="margin-left: 8px; width: 100%" class="flex flex-justify-between">
            <SwInputNumber
              @change="handleSwitchFonLineHeightChange"
              v-model="seriesYConfig[index].lineHeight"
              unit="px"
              bottomLabel="行距"
              width="60"
            />
          </div>
        </template>
      </configTextStyle>
    </el-form-item>
    <el-form-item label="文字溢出" :label-width="secondLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.column[index].seriesYOverFlow"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in textOverFlow" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="selectTargetData[0].option.column[index].seriesYIsMapping" :label-width="secondLabelWidth">
      <template #label>
        <div class="flex flex-center">
          <span>值类型 </span>
          <el-tooltip
            effect="dark"
            content="字段名对应字段映射的值的类型，例：字段名为id，映射值为1，值类型为数字"
            placement="top"
          >
            <Icon type="QuestionFilled" size="12" />
          </el-tooltip>
        </div>
      </template>

      <el-select
        v-model="selectTargetData[0].option.column[index].wordValueType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in wordValueTypeOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="
        selectTargetData[0].option.column[index].seriesYIsMapping &&
        selectTargetData[0].option.column[index].wordValueType === 'number'
      "
      label="后缀"
      :label-width="secondLabelWidth"
    >
      <sw-input v-model="selectTargetData[0].option.column[index].wordUnit" @change="update" />
    </el-form-item>
    <seriesYIsMapping :index="index" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { capitalizeFirstLetter } from "@editor/utils";
import type { StyleProps } from "@editor/components/configTextStyle/configTextStyle";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { textOverFlow, wordValueTypeOption } from "../../../constants";
import ItemSelectAlign from "../../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../../ItemComponent/ItemSelectAlign/ItemSelectAlign";
import { secondLabelWidth } from "../../../textConfig";
import type { ConfigItem } from "./item";
import seriesYIsMapping from "./seriesYIsMapping.vue";

const { update, selectTargetData } = useUpdateInstance();
const styleAssignConfigList = ref<ConfigItem[][]>([]);

const props = defineProps<{
  index: number;
}>();

const seriesYConfig = ref<StyleProps[]>([]);

const handleSwitchFontStyleChange = (key: keyof StyleProps, val: StyleProps) => {
  selectTargetData.value[0].option.column[props.index][`seriesY${capitalizeFirstLetter(key)}`] = val[key];
  update();
};

const handleSwitchFonLineHeightChange = (val: any) => {
  selectTargetData.value[0].option.column[props.index][`seriesYLineHeight`] = val;
  update();
};

const initConfig = () => {
  seriesYConfig.value = [];
  styleAssignConfigList.value = [];
  selectTargetData.value[0].option.column.forEach((item: any, index: number) => {
    seriesYConfig.value.push({
      fontWeight: selectTargetData.value[0].option.column[index].seriesYFontWeight,
      fontSize: selectTargetData.value[0].option.column[index].seriesYFontSize,
      fontFamily: selectTargetData.value[0].option.column[index].seriesYFontFamily,
      fontStyle: selectTargetData.value[0].option.column[index].seriesYFontStyle,
      color: selectTargetData.value[0].option.column[index].seriesYColor,
      lineHeight: selectTargetData.value[0].option.column[index].seriesYLineHeight
      // letterSpacing: selectTargetData.value[0].option.column[index].seriesYletterSpacing
    });
    styleAssignConfigList.value.push([]);
    item.styleAssignList?.forEach((styleItem: any) => {
      styleAssignConfigList.value[index].push({
        fontWeight: styleItem.styleAssignFontFontWeight,
        fontSize: styleItem.styleAssignFontFontSize,
        fontFamily: styleItem.styleAssignFontFamily,
        fontStyle: styleItem.styleAssignFontStyle,
        color: styleItem.styleAssignFontColor,
        lineHeight: styleItem.styleAssignLineHeight,
        letterSpacing: styleItem.styleAssignFontLetterSpacing
      });
    });
  });
};
onMounted(() => {
  initConfig();
});
defineExpose({
  initConfig
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.word-item-container {
  width: 100%;
}
</style>
