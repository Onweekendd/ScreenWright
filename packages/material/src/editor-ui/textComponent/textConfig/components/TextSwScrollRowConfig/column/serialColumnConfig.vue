<template>
  <sw-collapse-item title="序号列" v-model="selectTargetData[0].option.rowShow" @change="update" showIcon>
    <template #content>
      <el-form-item label="标题" :label-width="secondLabelWidth">
        <sw-input v-model.number="selectTargetData[0].option.rowTitle" @change="update" />
      </el-form-item>
      <el-form-item label="起始值" :label-width="secondLabelWidth">
        <sw-input-number v-model.number="selectTargetData[0].option.initialValue" controls @change="update" />
      </el-form-item>
      <el-form-item label="列宽" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rowWidth"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="列间距" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rowSpace"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <!-- 对齐方式 -->
      <ItemSelectAlign
        :label-width="secondLabelWidth"
        v-model="selectTargetData[0].option.rowAlign"
        @change="update"
        :type="typeAttrs.default"
      />
      <sw-collapse-item title="样式指定">
        <template #icon>
          <Icon type="CirclePlus" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="changeRow('add')" />
          <Icon type="Delete" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="changeRow('delete')" />
        </template>
        <template #content>
          <template
            v-if="selectTargetData[0].option.rowName.length > 0 && selectTargetData[0].option.rowKey.length > 0"
          >
            <ScreenwrightSeriesTabs v-model="seriesXTabs" :tabs="selectTargetData[0].option.rowName" />

            <el-form-item label="序号" :label-width="38">
              <sw-input
                v-model="selectTargetData[0].option.rowKey[currentIndex]"
                @change="update"
                style="margin-left: 10px"
              />
            </el-form-item>
            <el-form-item label="文本样式" :label-width="38" title="文本样式">
              <configTextStyle
                style="margin-left: 10px"
                v-model="rowStyle[currentIndex]"
                @change="(key, val) => handleConfigTextChange(key, val, currentIndex)"
                @update="update"
              >
                <template #append>
                  <div class="flex fullWidth flex-align-between" style="margin-left: 10px">
                    <sw-input-number
                      v-model="selectTargetData[0].option.rowlineHeight[currentIndex]"
                      unit="px"
                      bottomLabel="行距"
                      :controls="false"
                      width="60"
                      @change="update"
                    />
                    <sw-input-number
                      v-model="selectTargetData[0].option.rowletterSpacing[currentIndex]"
                      style="margin-left: 10px"
                      unit="px"
                      bottomLabel="字距"
                      :controls="false"
                      width="60"
                      @change="update"
                    />
                  </div>
                </template>
              </configTextStyle>
            </el-form-item>
            <el-form-item label="偏移" :label-width="38">
              <div class="input-wrap flex flex-center-between" style="margin-left: 10px">
                <sw-input-number
                  v-model.number="selectTargetData[0].option.rowOffsetX[currentIndex]"
                  unit="px"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                  width="90"
                />
                <sw-input-number
                  v-model.number="selectTargetData[0].option.rowOffsetY[currentIndex]"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                  width="90"
                />
              </div>
            </el-form-item>
            <sw-collapse-item title="背景">
              <template #content>
                <el-form-item label="尺寸" :label-width="34">
                  <div class="input-wrap flex flex-center-between">
                    <sw-input-number
                      v-model="selectTargetData[0].option.rowBgWidth[currentIndex]"
                      unit="px"
                      bottomLabel="宽度"
                      :controls="false"
                      @change="update"
                      width="90"
                    />
                    <sw-input-number
                      v-model="selectTargetData[0].option.rowBgHeight[currentIndex]"
                      unit="px"
                      bottomLabel="高度"
                      :controls="false"
                      @change="update"
                      width="90"
                    />
                  </div>
                </el-form-item>
                <el-form-item label="填充方式" :label-width="34" title="填充方式">
                  <el-select
                    v-model="selectTargetData[0].option.rowBgType[currentIndex]"
                    popper-class="sw-select-dropdown"
                    placeholder="请选择填充方式"
                    @change="update"
                  >
                    <el-option
                      v-for="item in backgroundType"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="颜色"
                  :label-width="34"
                  v-if="selectTargetData[0].option.rowBgType[currentIndex] === 'color'"
                >
                  <sw-color-picker
                    :options="{ colorTypeOption: 'linear-gradient,single' }"
                    v-model:color="selectTargetData[0].option.rowBgColor[currentIndex]"
                    v-model:opacity="selectTargetData[0].option.rowBgOpacity[currentIndex]"
                    :key="currentIndex"
                    :inputWidth="80"
                    show-alpha
                    input-disabled
                    @change="update"
                  />
                </el-form-item>
                <el-form-item
                  label="图片"
                  :label-width="34"
                  v-if="selectTargetData[0].option.rowBgType[currentIndex] === 'custom'"
                >
                  <sw-upload
                    v-model="selectTargetData[0].option.rowBgImage[currentIndex]"
                    :multiple="false"
                    :showFileList="false"
                    @change="update"
                    @delete="update"
                  />
                </el-form-item>
              </template>
            </sw-collapse-item>
          </template>

          <el-form-item label="列表为空" v-else />
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { isArray } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import { capitalizeFirstLetter } from "@editor/utils";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { secondLabelWidth } from "../../../../../constants";
import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { backgroundType } from "../../../constants";
import ItemSelectAlign from "../../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../../ItemComponent/ItemSelectAlign/ItemSelectAlign";

const { selectTargetData, update } = useUpdateInstance();
const seriesXTabs = ref("1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.rowName.findIndex((item: any) => item === seriesXTabs.value);
});
const changeRow = (type: string) => {
  console.log(type, "changeRow");
  const list = [
    "rowKey",
    "rowOffsetX",
    "rowOffsetY",
    "rowBgWidth",
    "rowBgHeight",
    "rowBgType",
    "rowBgColor",
    "rowBgOpacity",
    "rowBgImage",
    "rowFontSize",
    "rowFontFamily",
    "rowletterSpacing",
    "rowFontStyle",
    "rowFontWeight",
    "rowColor",
    "rowlineHeight"
  ];

  const defaultObj: any = {
    rowKey: "",
    rowBgImage: "",
    rowFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
    rowFontSize: 12,
    rowlineHeight: 12,
    rowletterSpacing: 1,
    rowColor: "rgba(241, 242, 245, 1)",
    rowFontStyle: "normal",
    rowFontWeight: "normal",
    rowBgType: "color",
    rowBgWidth: 20,
    rowBgHeight: 20,
    rowOffsetX: 0,
    rowOffsetY: 0,
    rowBgOpacity: 100,
    rowBgColor: "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0%)"
  };

  switch (type) {
    case "add":
      if (isArray(selectTargetData.value[0].option.rowName)) {
        const lastRowName = `${selectTargetData.value[0].option.rowName.length + 1}`;
        selectTargetData.value[0].option.rowName.push(lastRowName);
        for (let i = 0; i < list.length; i++) {
          const itemOptionName = list[i];
          selectTargetData.value[0].option[itemOptionName].push(defaultObj[itemOptionName]);
        }
        seriesXTabs.value = lastRowName;

        update();
        init();
      }

      break;
    case "delete":
      if (isArray(selectTargetData.value[0].option.rowName) && selectTargetData.value[0].option.rowName.length > 0) {
        // selectTargetData.value[0].option.rowName.splice(currentIndex.value, 1)
        console.log(selectTargetData.value[0].option.rowName, " selectTargetData.value[0].option.rowName");
        const index = selectTargetData.value[0].option.rowName.findIndex((item: any) => item === seriesXTabs.value);
        console.log(seriesXTabs.value, "seriesXTabs.value");
        console.log(index, "index");

        if (index > -1) {
          selectTargetData.value[0].option.rowName.splice(index, 1);
        }
        for (let i = 0; i < list.length; i++) {
          const itemOptionName = list[i];
          selectTargetData.value[0].option[itemOptionName].splice(index, 1);
        }
        selectTargetData.value[0].option.rowName.forEach((item: any, index: number) => {
          selectTargetData.value[0].option.rowName[index] = `${index + 1}`;
        });
        if (selectTargetData.value[0].option.rowName.length === 1) {
          seriesXTabs.value =
            selectTargetData.value[0].option.rowName[selectTargetData.value[0].option.rowName.length - 1];
        }
        if (index === selectTargetData.value[0].option.rowName.length) {
          seriesXTabs.value = selectTargetData.value[0].option.rowName[index - 1];
        }
        update();
        init();
      }
      break;
  }
};

const rowStyle = ref([]);
const init = () => {
  rowStyle.value = selectTargetData.value[0].option.rowName.map((item: any, index: number) => {
    return {
      fontFamily: selectTargetData.value[0].option.rowFontFamily[index],
      fontSize: selectTargetData.value[0].option.rowFontSize[index],
      fontStyle: selectTargetData.value[0].option.rowFontStyle[index],
      fontWeight: selectTargetData.value[0].option.rowFontWeight[index],
      color: selectTargetData.value[0].option.rowColor[index],
      lineHeight: selectTargetData.value[0].option.rowlineHeight[index],
      letterSpacing: selectTargetData.value[0].option.rowletterSpacing[index]
    };
  });
};
const handleConfigTextChange = (key: string, val: any, index: number) => {
  selectTargetData.value[0].option[`row${capitalizeFirstLetter(key)}`][index] = val[key];
  update();
};
watch(
  () => selectTargetData.value[0],
  (newVal, oldVal) => {
    if (
      (newVal?.id == oldVal?.id || oldVal == null) &&
      newVal?.option.rowName.length != oldVal?.option.rowName.length
    ) {
      init();
    }
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.input-wrap {
  width: 100%;
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
