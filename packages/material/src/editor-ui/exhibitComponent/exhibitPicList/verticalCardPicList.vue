<template>
  <div class="verticalCardPicList">
    <SwCollapseItem title="卡片列表" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAddSeries" />
        <Icon type="Delete" size="14" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="tabsNameTab" :tabs="tapList" @change="changeCardList" />
        <div v-if="currentCard !== null">
          <el-form-item label="列表图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentCard.backgroundImg"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <el-form-item label="背景图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentCard.coverImg"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>

          <el-form-item :label-width="secondLabelWidth">
            <template #label>
              <span>卡片名称 </span>
            </template>
            <sw-input v-model="currentCard.tabsName" :disabled="true" />
          </el-form-item>

          <!-- <el-form-item label="背景灰度" :label-width="secondLabelWidth">
          <SwSlider
            v-model="currentCard[placardType].markOpacity"
            :max="100"
            :min="0"
            :step="0.1"
            unit="%"
            @change="update"
          />
        </el-form-item> -->
        </div>
      </template>
    </SwCollapseItem>
    <el-form-item
      label="尺寸"
      :label-width="firstLabelWidth"
      v-if="selectTargetData[0].option && selectTargetData[0].option.globalConfig"
    >
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.globalConfig.width"
          unit="px"
          bottomLabel="宽度"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.globalConfig.height"
          unit="px"
          bottomLabel="高度"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
// import { SwSlider } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import type { SwiperCardItem as CardItem, CardStyleType } from "../../../media";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
const { update, selectTargetData } = useUpdateInstance();

// 定义常量

const placardType = ref<CardStyleType>("defaultObj");

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
