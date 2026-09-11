<template>
  <sw-collapse-item v-if="selectTargetData[0].option.column[index].seriesYIsMapping" title="样式指定" open>
    <template #icon>
      <div class="flex flex-center">
        <Icon type="circlePlus" @click="handleSeriesYIsMapping('add', index)" size="14" />
        <Icon type="Delete" @click="handleSeriesYIsMapping('delete', index)" size="14" />
      </div>
    </template>
    <template #content>
      <template
        v-if="
          selectTargetData[0].option.column[index].styleAssignList &&
          selectTargetData[0].option.column[index].styleAssignList.length > 0
        "
      >
        <ScreenwrightSeriesTabs
          v-model="seriesYStyleAssignTabs"
          :tabs="
            selectTargetData[0].option.column[index].styleAssignList.map((sa: any, saIndex: number) => saIndex + 1)
          "
        />
        <div
          v-for="(styleItem, styleIndex) in selectTargetData[0].option.column[index].styleAssignList"
          :key="styleIndex"
        >
          <div v-if="listIndex(styleIndex) + 1 === seriesYStyleAssignTabs">
            <el-form-item
              :label="selectTargetData[0].option.column[index].wordValueType === 'number' ? '字段值' : '状态'"
              :label-width="thirdLabelWidth"
            >
              <div class="flex">
                <el-select
                  v-if="selectTargetData[0].option.column[index].wordValueType === 'number'"
                  v-model="selectTargetData[0].option.column[index].styleAssignList[styleIndex].styleAssignConditions"
                  popper-class="sw-select-dropdown"
                  @change="update"
                >
                  <el-option
                    v-for="item in conditionCompare"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <sw-input
                  v-model="selectTargetData[0].option.column[index].styleAssignList[styleIndex].styleAssignKeyValue"
                  :placeholder="`${
                    selectTargetData[0].option.column[index].wordValueType === 'number' ? '预期值' : ''
                  }`"
                  @change="update"
                />
              </div>
            </el-form-item>
            <template v-if="selectTargetData[0].option.column[index].seriesYContentType === 'word'">
              <el-form-item label="文本样式" title="文本样式" :label-width="38">
                <configTextStyle
                  style="margin-left: 10px"
                  v-model="styleAssignConfigList[index][listIndex(styleIndex)]"
                  @change="(key: string, val: any) => handleStyleAssignChange(key, val, listIndex(styleIndex))"
                >
                  <template #append>
                    <div style="margin-left: 8px; width: 100%" class="flex flex-justify-between">
                      <SwInputNumber
                        @change="
                          handleStyleAssignLineHeightChange(
                            styleAssignConfigList[index][listIndex(styleIndex)].lineHeight,
                            listIndex(styleIndex)
                          )
                        "
                        v-model="styleAssignConfigList[index][listIndex(styleIndex)].lineHeight"
                        unit="px"
                        bottomLabel="行距"
                        width="60"
                      />
                    </div>
                  </template>
                </configTextStyle>
              </el-form-item>
              <el-form-item label="背景图片" :label-width="38" title="背景图片">
                <sw-upload
                  style="margin-left: 10px"
                  v-model="selectTargetData[0].option.column[index].styleAssignList[styleIndex].styleAssignBgImg"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
              <el-form-item label="宽度" :label-width="thirdLabelWidth">
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index].styleAssignList[styleIndex].styleAssignWdith"
                  unit="px"
                  :controls="false"
                  @change="update"
                />
              </el-form-item>
              <el-form-item label="左间距" :label-width="thirdLabelWidth">
                <sw-input-number
                  v-model="selectTargetData[0].option.column[index].styleAssignList[styleIndex].styleAssignMarginLeft"
                  unit="px"
                  :controls="false"
                  @change="update"
                />
              </el-form-item>
            </template>
            <template v-else>
              <el-form-item label="图片" :label-width="thirdLabelWidth">
                <sw-upload
                  v-model="styleItem.styleAssignBgImg"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
              <el-form-item label="尺寸" :label-width="thirdLabelWidth">
                <div class="flex flex-center-between">
                  <sw-input-number
                    v-model="styleItem.styleAssignWdith"
                    unit="px"
                    bottomLabel="宽度"
                    :controls="false"
                    @change="update"
                  />
                  <sw-input-number
                    v-model="styleItem.styleAssignHeight"
                    unit="px"
                    bottomLabel="高度"
                    :controls="false"
                    @change="update"
                  />
                </div>
              </el-form-item>
            </template>
          </div>
        </div>
      </template>
      <el-form-item label="列表为空" v-else />
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { capitalizeFirstLetter } from "@editor/utils";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { conditionCompare } from "../../../constants";
import { thirdLabelWidth } from "../../../textConfig";
import { seriesYContentType_btn_defaultObj, styleAssignConfig } from "./config";

const props = defineProps<{
  index: number;
}>();

const { update, selectTargetData } = useUpdateInstance();
const seriesYStyleAssignTabs = ref(1);
const styleAssignConfigList = ref<ConfigItem[][]>([]);
/** v-for 第二项在模板类型推断中常为 string | number，数组索引需为 number */
const listIndex = (i: number | string) => Number(i);
interface ConfigItem {
  fontWeight: any;
  fontSize: any;
  fontFamily: any;
  fontStyle: any;
  color: any;
  lineHeight: any;
  letterSpacing: any;
  styleAssignMarginLeft: any;
}

const handleStyleAssignChange = (key: string, val: any, styleIndex: number) => {
  selectTargetData.value[0].option.column[props.index].styleAssignList[styleIndex][
    `styleAssign${capitalizeFirstLetter(key)}`
  ] = val[key];
  update();
};

const handleStyleAssignLineHeightChange = (val: any, styleIndex: number) => {
  selectTargetData.value[0].option.column[props.index].styleAssignList[styleIndex][`styleAssignLineHeight`] = val;
  update();
};

const currentState = ref("defaultObj");
const handleSeriesYIsMapping = (val: string, index: number) => {
  const targetCol = selectTargetData.value[0].option.column[index];
  let list;

  if (["word", "image"].includes(targetCol.seriesYContentType)) {
    list = styleAssignConfig;
    if (!targetCol.styleAssignList) {
      selectTargetData.value[0].option.column[index].styleAssignList = [];
    }
    const targetStyleAssignList = targetCol.styleAssignList;
    const len = targetStyleAssignList.length;
    if (val === "add") {
      let pushObj: any = {};
      // 指定样式为空时，部分字段采用默认值，部分字段沿用该子项的属性
      if (len === 0) {
        list.map((listObj: any) => {
          pushObj[listObj.key] = {
            ...listObj.defaultValue
          };
        });
        pushObj = {
          ...pushObj,
          styleAssignConditions: "==",
          styleAssignKeyValue: "",
          styleAssignFontFamily: targetCol.seriesYFontFamily || "Alibaba-PuHuiTi-Regular",
          styleAssignFontSize: targetCol.seriesYFontSize || 24,
          styleAssignColor: targetCol.seriesYColor || "rgba(255,255,255,1.00)",
          styleAssignFontWeight: targetCol.seriesYFontWeight || "normal",
          styleAssignFontStyle: targetCol.seriesYFontStyle || "normal",
          styleAssignLetterSpacing: targetCol.seriesYLetterSpacing || 0,
          styleAssignLineHeight: targetCol.seriesYLineHeight || 20,
          styleAssignWdith: targetCol.seriesYOffsetWidth || 50,
          styleAssignHeight: targetCol.seriesYOffsetHeight || 20,
          styleAssignBgImg: targetCol.icon || "",
          styleAssignMarginLeft: typeof targetCol.seriesYMarginLeft === "number" ? targetCol.seriesYMarginLeft : 0
        };
      } else {
        pushObj = cloneDeep(targetStyleAssignList[len - 1]);
      }
      selectTargetData.value[0].option.column[index].styleAssignList.push(pushObj);
      seriesYStyleAssignTabs.value = len + 1;
    } else if (val === "delete" && len) {
      const targetIndex = targetStyleAssignList.findIndex(
        (it: any, idx: number) => idx + 1 === seriesYStyleAssignTabs.value
      );
      if (targetIndex !== -1) {
        targetStyleAssignList.splice(targetIndex, 1);
      }
      if (targetIndex === len - 1) {
        seriesYStyleAssignTabs.value = targetStyleAssignList.length;
      }
    }
  }
  if (["btn"].includes(targetCol.seriesYContentType)) {
    list = seriesYContentType_btn_defaultObj;
    if (!targetCol[currentState.value].styleAssignList) {
      selectTargetData.value[0].option.column[index][currentState.value].styleAssignList = [];
    }
    const len = targetCol[currentState.value].styleAssignList.length;

    if (val === "add") {
      let pushObj: any = {};
      if (len === 0) {
        list.map((listObj: any) => {
          pushObj[listObj.key] = {
            ...listObj.defaultValue
          };
        });
        pushObj = {
          ...pushObj,
          styleAssignBgImg: targetCol.backgroundImage || "",
          styleAssignWdith: targetCol.seriesYOffsetWidth || "",
          styleAssignHeight: targetCol.seriesYOffsetHeight || ""
        };
      } else {
        pushObj = cloneDeep(targetCol[currentState.value].styleAssignList[len - 1]);
      }
      selectTargetData.value[0].option.column[index][currentState.value].styleAssignList.push(pushObj);

      seriesYStyleAssignTabs.value = len + 1;
    } else if (val === "delete" && len > 0) {
      const targetIndex = targetCol[currentState.value].styleAssignList.findIndex(
        (it: any, idx: number) => idx + 1 === seriesYStyleAssignTabs.value
      );
      if (targetIndex !== -1) {
        selectTargetData.value[0].option.column[index][currentState.value].styleAssignList.splice(targetIndex, 1);
      }
      if (targetIndex === len - 1) {
        seriesYStyleAssignTabs.value = targetCol[currentState.value].styleAssignList.length;
      }
    }
  }
  initConfig();
  update();
};
const initConfig = () => {
  styleAssignConfigList.value = [];
  selectTargetData.value[0].option.column.forEach((item: any, index: number) => {
    styleAssignConfigList.value.push([]);
    item.wordValueType = item.wordValueType || "string";
    item.styleAssignList?.forEach((styleItem: any) => {
      styleAssignConfigList.value[index].push({
        fontWeight: styleItem.styleAssignFontWeight,
        fontSize: styleItem.styleAssignFontSize,
        fontFamily: styleItem.styleAssignFontFamily,
        fontStyle: styleItem.styleAssignFontStyle,
        color: styleItem.styleAssignColor,
        lineHeight: styleItem.styleAssignLineHeight,
        letterSpacing: styleItem.styleAssignLetterSpacing,
        styleAssignMarginLeft: typeof styleItem.styleAssignMarginLeft === "number" ? styleItem.styleAssignMarginLeft : 0
      });
    });
  });
};
initConfig();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
