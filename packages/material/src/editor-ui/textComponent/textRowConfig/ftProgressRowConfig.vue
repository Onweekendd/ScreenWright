<template>
  <div class="ft-progress-row-config">
    <sw-collapse-item title="表头配置" v-model="selectTargetData[0].option.headerShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="行高" :label-width="secondLabelWidth">
          <sw-input-number v-model.number="selectTargetData[0].option.headerlineHeight" unit="px" :controls="false" />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div style="margin-left: 8px; width: 100%" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.headerletterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  width="60"
                />
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.headerHeight"
                  unit="px"
                  bottomLabel="行距"
                  width="60"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <sw-collapse-item title="背景" open>
          <template #content>
            <el-form-item label="填充方式" :label-width="38">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.backgroundType"
                @change="update"
                style="margin-left: 10px"
              >
                <el-option label="颜色" value="color" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item
              :label-width="thirdLabelWidth"
              label="颜色"
              v-if="selectTargetData[0].option.backgroundType === 'color'"
            >
              <sw-single-color-picker v-model="selectTargetData[0].option.headerBackground" @change="update" />
            </el-form-item>
            <el-form-item
              :label-width="thirdLabelWidth"
              label="图片"
              v-if="selectTargetData[0].option.backgroundType === 'custom'"
            >
              <sw-upload v-model="selectTargetData[0].option.backgroundImage" @change="update" @delete="update" />
            </el-form-item>
          </template>
        </sw-collapse-item>
      </template>
    </sw-collapse-item>

    <sw-collapse-item title="行" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleRowAdd" />
        <Icon type="Delete" size="14" @click="handleRowDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesXTabs" :tabs="selectTargetData[0].option.seriesXTabsName" />
        <div v-for="(item, index) in selectTargetData[0].option.seriesXTabsName" :key="index">
          <div v-if="selectTargetData[0].option.seriesXTabsName[index] === seriesXTabs">
            <sw-collapse-item title="背景" open>
              <template #content>
                <el-form-item label="填充方式" title="填充方式" :label-width="thirdLabelWidth">
                  <el-select
                    popper-class="sw-select-dropdown"
                    v-model="selectTargetData[0].option.seriesXbackgroundType[index]"
                    @change="update"
                    style="margin-left: 10px"
                  >
                    <el-option label="颜色" value="color" />
                    <el-option label="自定义" value="custom" />
                  </el-select>
                </el-form-item>

                <el-form-item
                  label="颜色"
                  :label-width="58"
                  v-if="selectTargetData[0].option.seriesXbackgroundType[index] === 'color'"
                >
                  <sw-single-color-picker
                    width="90"
                    v-model="selectTargetData[0].option.seriesXBackground[index]"
                    @change="update"
                  />
                </el-form-item>

                <el-form-item
                  :label-width="58"
                  label="图片"
                  v-if="selectTargetData[0].option.seriesXbackgroundType[index] === 'custom'"
                >
                  <sw-upload
                    v-model="selectTargetData[0].option.seriesXbackgroundImage[index]"
                    @change="update"
                    @delete="update"
                  />
                </el-form-item>
              </template>
            </sw-collapse-item>
            <el-form-item label="描边" style="margin-bottom: 10px" :label-width="84">
              <sw-single-color-picker
                width="90"
                v-model="selectTargetData[0].option.seriesXBorderColor[index]"
                @change="update"
              />
            </el-form-item>
            <el-form-item :label-width="84">
              <sw-input-number
                v-model="selectTargetData[0].option.seriesXBorderWidth[index]"
                unit="px"
                bottomLabel="粗细"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="圆角" :label-width="84">
              <sw-slider v-model="selectTargetData[0].option.seriesXRadius[index]" unit="%" @change="update" />
            </el-form-item>
            <el-form-item label="偏移量" :label-width="84">
              <sw-input-number v-model="selectTargetData[0].option.seriesXOffsetX[index]" unit="px" @change="update" />
            </el-form-item>
          </div>
        </div>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="选中高亮" @change="update" show-icon v-model="selectTargetData[0].option.selectedShow">
      <template #content>
        <el-form-item label="选中模式" :label-width="secondLabelWidth">
          <sw-radio
            direction="row"
            @change="update"
            v-model="selectTargetData[0].option.selectedMode"
            :option="selectedMode"
          />
        </el-form-item>

        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="hoverInput" @change="handleHoverInput">
            <template #append>
              <div style="margin-left: 8px; width: 100%" class="flex flex-justify-between">
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.selectedletterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  width="60"
                />
                <SwInputNumber
                  @change="update"
                  v-model="selectTargetData[0].option.selectedHeight"
                  unit="px"
                  bottomLabel="行距"
                  width="60"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <sw-collapse-item title="阴影" @change="update" show-icon v-model="selectTargetData[0].option.shadowShow">
          <template #content>
            <el-form-item label="文本阴影" :label-width="38" title="文本阴影">
              <div class="flex flex-justify-around" style="width: 100%; margin-left: 10px">
                <el-color-picker
                  class="colorPicker"
                  size="small"
                  :show-alpha="true"
                  v-model="selectTargetData[0].option.shadowColor"
                  style="position: relative; top: 7px; left: -4px"
                  @change="update"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.shadowX"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                  width="50"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.shadowY"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                  width="50"
                />
                <sw-input-number
                  v-model="selectTargetData[0].option.shadowFuzzy"
                  bottomLabel="模糊"
                  :controls="false"
                  @change="update"
                  width="50"
                />
              </div>
            </el-form-item>
          </template>
        </sw-collapse-item>
        <sw-collapse-item title="背景">
          <template #content>
            <el-form-item label="填充方式" :label-width="38">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.selectedBgType"
                @change="update"
                style="margin-left: 10px"
              >
                <el-option label="颜色" value="color" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item
              :label-width="thirdLabelWidth"
              label="颜色"
              v-if="selectTargetData[0].option.selectedBgType === 'color'"
            >
              <sw-color-picker
                :options="{ colorTypeOption: 'linear-gradient,single' }"
                v-model:color="selectTargetData[0].option.selectedBgColor"
                v-model:opacity="selectTargetData[0].option.selectedBgOpacity"
                field="tableSelectBackground"
                @change="update"
              />
            </el-form-item>
            <el-form-item
              :label-width="thirdLabelWidth"
              label="图片"
              v-if="selectTargetData[0].option.selectedBgType === 'custom'"
            >
              <sw-upload v-model="selectTargetData[0].option.selectedBgImage" @change="update" @delete="update" />
            </el-form-item>
          </template>
        </sw-collapse-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "headerFontFamily",
  fontStyle: "headerFontStyle",
  fontWeight: "headerFontWeight",
  fontSize: "headerFontSize",
  color: "headerColor"
});
const { input: hoverInput, handleConfigTextChange: handleHoverInput } = useFontStyleAttrs({
  fontFamily: "selectedFontFamily",
  fontStyle: "selectedFontStyle",
  fontWeight: "selectedFontWeight",
  fontSize: "selectedFontSize",
  color: "selectedColor"
});

const seriesXTabs = ref("行1");
const selectedMode = [
  { label: "单选", value: "single" },
  { label: "多选", value: "multiple" }
];
// 提取公共数据结构和工具函数
const getTargetOption = () => {
  if (!selectTargetData.value || selectTargetData.value.length === 0) {
    return null;
  }
  return selectTargetData.value[0].option;
};

// 定义相关字段数组
const RELATED_FIELDS = [
  "seriesXbackgroundType",
  "seriesXBackground",
  "seriesXbackgroundImage",
  "seriesXBorderColor",
  "seriesXBorderWidth",
  "seriesXRadius",
  "seriesXOffsetX"
];

// 生成行名称的工具函数
const generateRowName = (length: number) => `行${length + 1}`;

// 处理相关字段的公共函数
const handleRelatedFields = (targetIndex: number, operation: "add" | "delete", value?: any) => {
  const option = getTargetOption();
  if (!option) return;

  RELATED_FIELDS.forEach((field) => {
    if (operation === "add") {
      option[field].push(value ? value : option[field][targetIndex]);
    } else if (operation === "delete") {
      option[field].splice(targetIndex, 1);
    }
  });
};

const handleRowAdd = () => {
  const option = getTargetOption();
  if (!option) return;

  const { seriesXTabsName } = option;
  const targetIndex = seriesXTabsName.findIndex((item: string) => item === seriesXTabs.value);
  const newRowName = generateRowName(seriesXTabsName.length);

  if (targetIndex > -1) {
    seriesXTabsName.push(newRowName);
    handleRelatedFields(targetIndex, "add");
    seriesXTabs.value = newRowName;
    update();
  }
};

const handleRowDelete = () => {
  const option = getTargetOption();
  if (!option) return;

  const { seriesXTabsName } = option;
  const targetIndex = seriesXTabsName.findIndex((item: string) => item === seriesXTabs.value);

  if (seriesXTabsName.length <= 1) {
    return;
  }

  if (targetIndex > -1) {
    seriesXTabsName.splice(targetIndex, 1);
    handleRelatedFields(targetIndex, "delete");

    // 重命名剩余行
    for (let i = 0; i < seriesXTabsName.length; i++) {
      seriesXTabsName[i] = generateRowName(i);
    }
    // 更新当前选中的行
    seriesXTabs.value = seriesXTabsName.length > 0 ? seriesXTabsName[0] : "";
    update();
  }
};
onMounted(() => {
  if (selectTargetData.value[0].option.seriesXTabsName.length > 0) {
    seriesXTabs.value = selectTargetData.value[0].option.seriesXTabsName[0];
  }
});
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
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
