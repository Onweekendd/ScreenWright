<template>
  <div class="ft-swiper-picture">
    <el-form-item label="首层透明度" :label-width="firstLabelWidth">
      <SwSlider v-model="selectTargetData[0].option.opacity" :max="1" :step="0.1" unit="°" @change="update" />
    </el-form-item>
    <el-form-item label="二层透明度" :label-width="firstLabelWidth">
      <SwSlider v-model="selectTargetData[0].option.secondOpacity" :max="1" :step="0.1" unit="°" @change="update" />
    </el-form-item>
    <el-form-item label="三层透明度" v-if="selectTargetData[0].option.showSwiper" :label-width="firstLabelWidth">
      <SwSlider v-model="selectTargetData[0].option.thirdOpacity" :max="1" :step="0.1" unit="°" @change="update" />
    </el-form-item>
    <el-form-item label="图片填充类型" title="图片填充类型" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.objectFit"
        @change="update"
      >
        <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="图片宽高比例" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.imageWidth"
          unit="%"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.imageHeight"
          unit="%"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>

    <SwCollapseItem title="图片系列">
      <template #icon>
        <Icon type="CirclePlus" size="14" style="color: #fff; margin-bottom: 10px" @click="handleAddSeries" />
        <Icon type="Delete" size="14" style="color: #fff; margin-bottom: 10px" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="tapList" @change="handleChange" />
        <div v-if="currentPic !== null">
          <el-form-item label="尺寸类型" title="尺寸类型" :label-width="secondLabelWidth">
            <el-select
              style="width: 100%"
              popper-class="sw-select-dropdown"
              v-model="currentPic.objectFit"
              @change="handleChange"
            >
              <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentPic.value"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <el-form-item label="偏移" :label-width="secondLabelWidth">
            <div class="flex flex-center-between">
              <sw-input-number
                v-model.number="currentPic.imgTranslateX"
                unit="px"
                :controls="false"
                bottomLabel="X"
                @change="update"
              />
              <sw-input-number
                v-model.number="currentPic.imgTranslateY"
                unit="px"
                :controls="false"
                bottomLabel="Y"
                @change="update"
              />
            </div>
          </el-form-item>
          <sw-collapse-item title="图片框" :disabled="false">
            <template #content>
              <el-form-item label="宽高" :label-width="thirdLabelWidth">
                <div class="flex flex-center-between">
                  <sw-input-number
                    v-model.number="currentPic.borderImageWidth"
                    unit="%"
                    :controls="false"
                    @change="update"
                  />
                  <sw-input-number
                    v-model.number="currentPic.borderImageHeight"
                    unit="%"
                    :controls="false"
                    @change="update"
                  />
                </div>
              </el-form-item>
              <el-form-item label="尺寸类型" title="尺寸类型" :label-width="thirdLabelWidth">
                <el-select
                  style="width: 100%"
                  popper-class="sw-select-dropdown"
                  v-model="currentPic.borderImageSize"
                  @change="update"
                >
                  <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="图片" :label-width="thirdLabelWidth">
                <sw-upload
                  v-model="currentPic.borderImage"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
            </template>
          </sw-collapse-item>
          <sw-collapse-item title="文字" :disabled="false">
            <template #content>
              <el-form-item label="内容" :label-width="thirdLabelWidth">
                <sw-input v-model="currentPic.content" @change="update" />
              </el-form-item>
              <el-form-item label="样式" :label-width="thirdLabelWidth">
                <configTextStyle
                  @change="
                    (key, value) => {
                      handleTextChange(key, value);
                    }
                  "
                  :model-value="getInput(currentPic)"
                >
                  <template #append>
                    <div class="flex flex-center-between" style="width: 100%">
                      <sw-input-number
                        style="margin-left: 12px"
                        v-model="currentPic.textLetterSpacing"
                        bottomLabel="字距"
                        @change="update"
                        width="60"
                      />
                      <sw-input-number
                        v-model="currentPic.textLineHeight"
                        bottomLabel="行距"
                        @change="update"
                        width="60"
                      />
                    </div>
                  </template>
                </configTextStyle>
              </el-form-item>
              <el-form-item label="偏移" :label-width="thirdLabelWidth">
                <div class="flex flex-center-between">
                  <sw-input-number
                    v-model.number="currentPic.textTranslateX"
                    unit="px"
                    :controls="false"
                    bottomLabel="X"
                    @change="update"
                  />
                  <sw-input-number
                    v-model.number="currentPic.textTranslateY"
                    unit="px"
                    :controls="false"
                    bottomLabel="Y"
                    @change="update"
                  />
                </div>
              </el-form-item>
              <el-form-item label="对齐" :label-width="thirdLabelWidth">
                <el-select
                  style="width: 100%"
                  popper-class="sw-select-dropdown"
                  v-model="currentPic.textAlign"
                  @change="update"
                >
                  <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="阴影" :label-width="thirdLabelWidth">
                <el-checkbox v-model="currentPic.isTextShadow" @change="update" />
              </el-form-item>
              <el-form-item label="文本阴影" v-if="currentPic.isTextShadow" :label-width="thirdLabelWidth">
                <sw-single-color-picker v-model="currentPic.textShadow.color" @change="update" />
                <div class="flex flex-left-between">
                  <sw-input-number
                    v-model.number="currentPic.textShadow.x"
                    bottomLabel="X"
                    :controls="false"
                    @change="update"
                  />
                  <sw-input-number
                    v-model.number="currentPic.textShadow.y"
                    bottomLabel="Y"
                    :controls="false"
                    @change="update"
                  />
                  <sw-input-number
                    v-model.number="currentPic.textShadow.blur"
                    bottomLabel="模糊"
                    :controls="false"
                    @change="update"
                  />
                </div>
              </el-form-item>
            </template>
          </sw-collapse-item>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
// import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { firstLabelWidth, secondLabelWidth, thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { objectFit, textAlign } from "../dict";

const { update, selectTargetData } = useUpdateInstance();

const tapList = computed(() => {
  return selectTargetData.value[0].option.imagesList.map((item: any) => item.name);
});

const handleAddSeries = () => {
  if (has(selectTargetData.value[0].option, "imagesList")) {
    const obj = JSON.parse(JSON.stringify(selectTargetData.value[0].option.imagesList[0]));
    obj.name = "图片" + (selectTargetData.value[0].option.imagesList.length + 1);
    obj.content = "";

    selectTargetData.value[0].option.imagesList.push(obj);

    seriesTabs.value = "图片" + selectTargetData.value[0].option.imagesList.length;
    getCurrent();
    update();
  }
};

const handleDeleteSeries = () => {
  if (has(selectTargetData.value[0].option, "imagesList") && selectTargetData.value[0].option.imagesList.length > 1) {
    const index = selectTargetData.value[0].option.imagesList.findIndex((it: any) => it.name === seriesTabs.value);
    selectTargetData.value[0].option.imagesList.splice(index, 1);

    selectTargetData.value[0].option.imagesList.forEach((item: any, index: number) => {
      item.name = "图片" + (index + 1);
    });

    if (selectTargetData.value[0].option.imagesList.length === 1) {
      seriesTabs.value =
        selectTargetData.value[0].option.imagesList[selectTargetData.value[0].option.imagesList.length - 1].name;
    }
    if (index === selectTargetData.value[0].option.imagesList.length) {
      seriesTabs.value = selectTargetData.value[0].option.imagesList[index - 1].name;
    }

    // seriesTabs.value = "图片" + selectTargetData.value[0].option.imagesList.length
    getCurrent();
    update();
  }
};

const seriesTabs = ref<string>("图片1");
const currentPic = ref<any | null>(null);
const getCurrent = () => {
  currentPic.value = selectTargetData.value[0].option.imagesList.find((it: any) => it.name === seriesTabs.value);
};

const getInput = (sl: any) => {
  console.log("查看sl", sl);
  return {
    color: sl.fontColor,
    fontSize: sl.fontSize,
    fontWeight: sl.fontWeight,
    fontStyle: sl.fontStyle,
    fontFamily: sl.fontFamily
  };
};

const handleTextChange = (key: string, value: any) => {
  const attrsMap: Record<string, any> = {
    color: "fontColor",
    fontSize: "fontSize",
    fontWeight: "fontWeight",
    fontStyle: "fontStyle",
    fontFamily: "fontFamily"
  };

  const index = selectTargetData.value[0].option.imagesList.findIndex((it: any) => it.name === seriesTabs.value);

  selectTargetData.value[0].option.imagesList[index][attrsMap[key]] = value[key];
  update();
};

const handleChange = () => {
  getCurrent();
  update();
};

onMounted(() => {
  getCurrent();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
