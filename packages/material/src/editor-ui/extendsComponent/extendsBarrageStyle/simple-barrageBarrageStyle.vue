<template>
  <div class="simple-barrage-style">
    <sw-collapse-item title="文本样式" :isSeriesTabs="true" type="dataSeries" @handleSeries="changeSeries">
      <template #icon>
        <Icon type="CirclePlus" @click="handleAdd" size="14" />
        <Icon type="Delete" @click="handleDel" size="14" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesTabs"
          :tabs="selectTargetData[0].option.stylesList.map((sl: any) => sl.name)"
        />
        <div v-for="(item, index) in selectTargetData[0].option.stylesList" :key="index">
          <template v-if="item.name === seriesTabs">
            <div class="style-collapse">
              <el-form-item label="文字样式" :label-width="secondLabelWidth">
                <div class="flex" style="width: 100%">
                  <SwLabelType
                    style="width: calc(100% - 60px)"
                    :modelValue="getCurrentItemLabelProps(item)"
                    @change="handleLabelTypeChange"
                  />
                  <SwInputNumber width="60" controls v-model="item.fontSize" style="top: -2px" />
                </div>
                <sw-single-color-picker
                  field="fontColor"
                  style="margin: 10px 0"
                  v-model="item.fontColor"
                  :presetColor="item.fontColor"
                  @change="update"
                />

                <div class="flex flex-left-between">
                  <TextFontStyle :modelValue="getCurrentItemStyleProps(item)" @change="handleFontStyleChange" />
                  <sw-input-number
                    v-model="item.letterSpacing"
                    unit="px"
                    :controls="false"
                    bottomLabel="字距"
                    @change="update"
                  />
                </div>
              </el-form-item>

              <el-form-item label="阴影" :label-width="secondLabelWidth">
                <el-checkbox v-model="item.isTextShadow" @change="update" />
              </el-form-item>

              <el-form-item label="文本阴影" :label-width="secondLabelWidth" v-if="item.isTextShadow">
                <sw-single-color-picker
                  style="margin: 10px 0"
                  field="textShadow.color"
                  v-model="item.textShadow.color"
                  :presetColor="item.textShadow.color"
                  @change="update"
                />
                <div class="flex flex-left-between">
                  <sw-input-number v-model="item.textShadow.x" bottomLabel="X" :controls="false" @change="update" />
                  <sw-input-number v-model="item.textShadow.y" bottomLabel="Y" :controls="false" @change="update" />
                  <sw-input-number
                    v-model="item.textShadow.blur"
                    bottomLabel="模糊"
                    :controls="false"
                    @change="update"
                  />
                </div>
              </el-form-item>

              <el-form-item label="背景图片" :label-width="secondLabelWidth">
                <SwUpload v-model="item.backgroundImage" @delete="update" @change="update" />
              </el-form-item>
            </div>
          </template>
        </div>
      </template>
    </sw-collapse-item>

    <el-form-item label="圆角" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.textBoxBorderRadius"
        unit="px"
        :min="0"
        :controls="false"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="边距" :label-width="firstLabelWidth">
      <div class="flex">
        <sw-input-number
          v-model.number="selectTargetData[0].option.textBoxPadding[0]"
          bottomLabel="上"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.textBoxPadding[2]"
          bottomLabel="下"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.textBoxPadding[3]"
          bottomLabel="左"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.textBoxPadding[1]"
          bottomLabel="右"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwLabelType } from "@screenwright/ui/label-type";
import { SwSingleColorPicker } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import type { StyleProps } from "../../components/configTextStyle/configTextStyle";
import TextFontStyle from "../../components/configTextStyle/textFontStyle.vue";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const seriesTabs = ref("样式1");

/**
 * 更改系列
 */
const changeSeries = (val: string) => {
  // 简化的系列切换逻辑，避免复杂的依赖
  console.log("changeSeries:", val);
  update();
};

/**
 * 获取当前项的标签属性（用于SwLabelType组件）
 */
const getCurrentItemLabelProps = (item: any) => {
  return {
    fontFamily: item.fontFamily || "Microsoft YaHei",
    fontSize: item.fontSize || 14
  };
};

/**
 * 获取当前项的样式属性
 */
const getCurrentItemStyleProps = (item: any): StyleProps => {
  return {
    fontStyle: item.fontStyle ? "italic" : "normal",
    fontWeight: item.fontWeight ? "bolder" : "normal",
    color: item.fontColor || "",
    fontFamily: item.fontFamily || "",
    fontSize: item.fontSize || 14
  };
};

/**
 * 处理标签类型变化（字体和字号）
 */
const handleLabelTypeChange = (key: string, value: any) => {
  const currentSeriesIndex = selectTargetData.value[0].option.stylesList.findIndex(
    (s: any) => s.name === seriesTabs.value
  );
  if (currentSeriesIndex >= 0) {
    const currentItem = selectTargetData.value[0].option.stylesList[currentSeriesIndex];
    if (key === "fontFamily") {
      currentItem.fontFamily = value.fontFamily;
    } else if (key === "fontSize") {
      currentItem.fontSize = value.fontSize;
    }
    update();
  }
};

/**
 * 处理字体样式变化
 */
const handleFontStyleChange = (key: keyof StyleProps, value: StyleProps) => {
  const currentSeriesIndex = selectTargetData.value[0].option.stylesList.findIndex(
    (s: any) => s.name === seriesTabs.value
  );
  if (currentSeriesIndex >= 0) {
    const currentItem = selectTargetData.value[0].option.stylesList[currentSeriesIndex];
    if (key === "fontWeight") {
      currentItem.fontWeight = value.fontWeight === "bolder";
    } else if (key === "fontStyle") {
      currentItem.fontStyle = value.fontStyle === "italic";
    }
    update();
  }
};

const handleAdd = () => {
  const index = selectTargetData.value[0].option.stylesList.findIndex((item: any) => {
    return item.name === seriesTabs.value;
  });
  const lastName = "样式" + (selectTargetData.value[0].option.stylesList.length + 1);

  const cpData = cloneDeep(selectTargetData.value[0].option.stylesList[index]);
  cpData.name = lastName;
  selectTargetData.value[0].option.stylesList.push(cpData);

  seriesTabs.value = lastName;
  update();
};
const handleDel = () => {
  if (selectTargetData.value[0].option.stylesList.length > 1) {
    const index = selectTargetData.value[0].option.stylesList.findIndex((item: any) => {
      return item.name === seriesTabs.value;
    });

    selectTargetData.value[0].option.stylesList.splice(index, 1);
    selectTargetData.value[0].option.stylesList.forEach((item: any, idx: number) => {
      item.name = `样式${idx + 1}`;
    });
    seriesTabs.value = selectTargetData.value[0].option.stylesList[0].name;
    update();
  }
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();

.simple-barrage-style {
  .text {
    color: #fff;
  }
  .flex {
    display: flex;

    &.flex-center-between {
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }

    &.flex-left-between {
      justify-content: space-between;
      gap: 10px;
      align-items: start;

      // 确保 TextFontStyle 组件与其他元素垂直居中对齐
      // > * {
      //   display: flex;
      //   align-items: center;
      // }
    }
  }

  .style-collapse {
    padding: 10px 0;
  }

  .default_button {
    color: #859094;
    height: 16px;
    line-height: 16px;
    padding: 5px 5px;
    margin: 0 5px;
    border-radius: 4px;
    border: 1px solid #393b4a;
    cursor: pointer;

    &.primary {
      color: #ffffff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
  }
}
</style>
