<template>
  <SwCollapseItem title="卡片列表" open>
    <template #icon>
      <Icon type="CirclePlus" size="14" @click="handleAddSeries" />
      <Icon type="Delete" size="14" @click="handleDeleteSeries" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="tabsNameTab" :tabs="tapList" @change="changeCardList" />
      <div v-if="currentCard !== null">
        <el-form-item label="标题文案" :label-width="secondLabelWidth">
          <sw-input v-model="currentCard.titleContent" type="text" @change="update" />
        </el-form-item>
        <el-form-item label="内容文案" :label-width="secondLabelWidth">
          <sw-input v-model="currentCard.textContent" type="text" @change="update" />
        </el-form-item>
        <el-form-item label="背景图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="currentCard.backgroundImg"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
          <el-radio-group v-model="placardType" size="large" class="custom-radio-group">
            <el-radio-button v-for="(item, index) in coordinateOption" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="currentCard[placardType].width"
              unit="px"
              bottomLabel="宽度"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentCard[placardType].height"
              unit="px"
              bottomLabel="高度"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="背景灰度" :label-width="secondLabelWidth">
          <SwSlider
            v-model="currentCard[placardType].markOpacity"
            :max="100"
            :min="0"
            :step="0.1"
            unit="%"
            @change="update"
          />
        </el-form-item>
        <SwCollapseItem title="标题" v-model="currentCard[placardType].titleShow" showIcon @change="update">
          <template #content>
            <el-form-item label="尺寸" :label-width="thirdLabelWidth">
              <div class="sw-label-type flex flex-align-center">
                <sw-input-number
                  v-model.number="currentCard[placardType].titleWidth"
                  unit="px"
                  bottomLabel="宽度"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentCard[placardType].titleHeight"
                  unit="px"
                  bottomLabel="高度"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="文本样式" :label-width="thirdLabelWidth">
              <configTextStyle
                @change="
                  (key, value) => {
                    handleTitleTextChange(key, value);
                  }
                "
                :model-value="getTitleInput(currentCard[placardType])"
              >
                <template #append>
                  <div class="flex flex-center-between" style="width: 100%">
                    <sw-input-number
                      style="margin-left: 12px"
                      v-model="currentCard[placardType].titleLetterSpacing"
                      bottomLabel="字距"
                      @change="update"
                      width="60"
                    />
                    <sw-input-number
                      v-model="currentCard[placardType].titleLineHeight"
                      bottomLabel="行距"
                      @change="update"
                      width="60"
                    />
                  </div>
                </template>
              </configTextStyle>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="sw-label-type flex flex-align-center">
                <sw-input-number
                  v-model.number="currentCard[placardType].titleOffsetLeft"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentCard[placardType].titleOffsetTop"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </SwCollapseItem>
        <SwCollapseItem title="内容" v-model="currentCard[placardType].textShow" showIcon @change="update">
          <template #content>
            <el-form-item label="尺寸" :label-width="thirdLabelWidth">
              <div class="sw-label-type flex flex-align-center">
                <sw-input-number
                  v-model.number="currentCard[placardType].textWidth"
                  unit="px"
                  bottomLabel="宽度"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentCard[placardType].textHeight"
                  unit="px"
                  bottomLabel="高度"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="文本样式" :label-width="thirdLabelWidth">
              <configTextStyle
                @change="
                  (key, value) => {
                    handleContentTextChange(key, value);
                  }
                "
                :model-value="getContentInput(currentCard[placardType])"
              >
                <template #append>
                  <div class="flex flex-center-between" style="width: 100%">
                    <sw-input-number
                      style="margin-left: 12px"
                      v-model="currentCard[placardType].textLetterSpacing"
                      bottomLabel="字距"
                      @change="update"
                      width="60"
                    />
                    <sw-input-number
                      v-model="currentCard[placardType].textLineHeight"
                      bottomLabel="行距"
                      @change="update"
                      width="60"
                    />
                  </div>
                </template>
              </configTextStyle>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="sw-label-type flex flex-align-center">
                <sw-input-number
                  v-model.number="currentCard[placardType].textOffsetLeft"
                  unit="px"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentCard[placardType].textOffsetTop"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </SwCollapseItem>
      </div>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { secondLabelWidth, thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import type { CardItem, CardStyleType, CoordinateItem } from "./swiperCard";

const { update, selectTargetData } = useUpdateInstance();

// 定义常量

const placardType = ref<CardStyleType>("defaultObj");

const coordinateOption = ref<CoordinateItem[]>([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);

const tapList = computed(() => {
  if (!selectTargetData.value[0].option.cardList) {
    return [];
  }
  return selectTargetData.value[0].option.cardList.map((item: any) => item.tabsName);
});

const handleAddSeries = () => {
  if (has(selectTargetData.value[0].option, "cardList")) {
    const obj = JSON.parse(JSON.stringify(selectTargetData.value[0].option.cardList[0]));
    obj.tabsName = "卡片" + (selectTargetData.value[0].option.cardList.length + 1);
    obj.textContent = "";
    obj.titleContent = "";

    selectTargetData.value[0].option.cardList.push(obj);
    placardType.value = "defaultObj";
    tabsNameTab.value = "卡片" + selectTargetData.value[0].option.cardList.length;
    getCurrent();
    update();
  }
};

const handleDeleteSeries = () => {
  if (has(selectTargetData.value[0].option, "cardList") && selectTargetData.value[0].option.cardList.length > 1) {
    const index = selectTargetData.value[0].option.cardList.findIndex(
      (it: CardItem) => it.tabsName === tabsNameTab.value
    );
    selectTargetData.value[0].option.cardList.splice(index, 1);

    selectTargetData.value[0].option.cardList.forEach((item: any, index: number) => {
      item.tabsName = "卡片" + (index + 1);
    });

    placardType.value = "defaultObj";

    if (selectTargetData.value[0].option.cardList.length === 1) {
      tabsNameTab.value =
        selectTargetData.value[0].option.cardList[selectTargetData.value[0].option.cardList.length - 1].tabsName;
    }
    if (index === selectTargetData.value[0].option.cardList.length) {
      tabsNameTab.value = selectTargetData.value[0].option.cardList[index - 1].tabsName;
    }

    getCurrent();
    update();
  }
};

const changeCardList = () => {
  placardType.value = "defaultObj";
  getCurrent();
};

const tabsNameTab = ref<string>("卡片1");

const currentCard = ref<CardItem | null>(null);
const getCurrent = () => {
  currentCard.value =
    selectTargetData.value[0].option.cardList.find((it: CardItem) => it.tabsName === tabsNameTab.value) || null;
};

const getTitleInput = (sl: any) => {
  console.log("getTitleInput", sl);
  return {
    color: sl.titleColor,
    fontSize: sl.titleFontSize,
    fontWeight: sl.titleFontWeight,
    fontStyle: sl.titleFontStyle,
    fontFamily: sl.titleFontFamily
  };
};

const handleTitleTextChange = (key: string, value: any) => {
  console.log("handleTitleTextChange", key, value);
  const attrsMap: Record<string, any> = {
    color: "titleColor",
    fontSize: "titleFontSize",
    fontWeight: "titleFontWeight",
    fontStyle: "titleFontStyle",
    fontFamily: "titleFontFamily"
  };
  const index = selectTargetData.value[0].option.cardList.findIndex(
    (it: CardItem) => it.tabsName === tabsNameTab.value
  );

  console.log(selectTargetData.value[0].option.cardList[index]);
  selectTargetData.value[0].option.cardList[index][placardType.value][attrsMap[key]] = value[key];

  update();
};

const getContentInput = (sl: any) => {
  console.log("getContentInput", sl);
  return {
    color: sl.textColor,
    fontSize: sl.textFontSize,
    fontWeight: sl.textFontWeight,
    fontStyle: sl.textFontStyle,
    fontFamily: sl.textFontFamily
  };
};

const handleContentTextChange = (key: string, value: any) => {
  console.log("handleContentTextChange", key, value);
  const attrsMap: Record<string, any> = {
    color: "textColor",
    fontSize: "textFontSize",
    fontWeight: "textFontWeight",
    fontStyle: "textFontStyle",
    fontFamily: "textFontFamily"
  };
  const index = selectTargetData.value[0].option.cardList.findIndex(
    (it: CardItem) => it.tabsName === tabsNameTab.value
  );
  selectTargetData.value[0].option.cardList[index][placardType.value][attrsMap[key]] = value[key];
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

:deep(.el-textarea .el-textarea__inner) {
  background-color: #000000 !important;
  --el-input-border-color: #333543;
}

.custom-radio-group {
  margin-top: 10px;
  :deep(.el-radio-button__inner) {
    background: transparent;
    border: none;
    color: #fff;
    padding: 8px 20px;
    height: 36px;
    line-height: 20px;

    &:hover {
      color: #fff;
      background: rgba(99, 102, 241, 0.8);
    }
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: #6366f1;
    box-shadow: none;
    color: #fff;
  }

  :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: 4px 0 0 4px;
  }

  :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 4px 4px 0;
  }

  // 移除默认边框和阴影
  :deep(.el-radio-button:not(:last-child)) {
    margin-right: 1px; // 添加间隔
    .el-radio-button__inner {
      border-right: none;
    }
  }

  // 未选中状态
  :deep(.el-radio-button:not(.is-active)) {
    .el-radio-button__inner {
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

// 禁用时的样式
:deep(.el-slider.is-disabled) {
  .el-slider__bar {
    background-color: rgba(99, 102, 241, 0.5);
  }

  .el-slider__button {
    background-color: rgba(99, 102, 241, 0.5);
  }
}
</style>
