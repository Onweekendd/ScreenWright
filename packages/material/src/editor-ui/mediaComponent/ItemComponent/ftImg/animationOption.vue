<template>
  <div class="animation-option">
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.animationShow" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.animationShow">
      <el-form-item label="循环播放" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.animationLoop" @change="update" />
      </el-form-item>
      <el-form-item
        label="动画结束隐藏"
        v-if="!selectTargetData[0].option.animationLoop"
        :label-width="firstLabelWidth"
      >
        <el-checkbox v-model="selectTargetData[0].option.animationendHidden" @change="update" />
      </el-form-item>
      <el-form-item
        label="速度"
        :label-width="firstLabelWidth"
        v-if="selectTargetData[0].option.animationType !== imgEAnimationType.Customize"
      >
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.animationSpeed"
          @change="update"
        >
          <el-option v-for="item in animationSpeed" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="速度系数"
        :label-width="firstLabelWidth"
        v-if="
          selectTargetData[0].option.animationSpeed !== 'constant' &&
          selectTargetData[0].option.animationType !== imgEAnimationType.Customize
        "
      >
        <sw-input-number
          v-model.number="selectTargetData[0].option.animationSpeedNum"
          :min="1"
          :max="10"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="动画时长" :label-width="firstLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.animationTime"
          unit="s"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="动画延时" :label-width="firstLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.animationDelayed"
          unit="s"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="动画间隔" :label-width="firstLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.animationInterval"
          unit="s"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="类型" :label-width="firstLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.animationType"
          @change="animationTypeUpdate"
        >
          <el-option v-for="item in imgAnimationType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <SwCollapseItem title="关键帧" v-if="selectTargetData[0].option.animationType === imgEAnimationType.Customize">
        <template #icon>
          <Icon type="CirclePlus" size="14" style="color: #fff; margin-bottom: 10px" @click="handleAddSeries" />
          <Icon type="Delete" size="14" style="color: #fff; margin-bottom: 10px" @click="handleDeleteSeries" />
        </template>

        <template #content>
          <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="tapList" @change="handleCustomizeChange" />
          <div v-if="currentCustomizeAnimation !== null">
            <el-form-item label="时间轴" :label-width="secondLabelWidth">
              <SwSlider
                v-model="currentCustomizeAnimation.keyFrameTime"
                :max="100"
                :step="0.1"
                :min="0"
                unit="%"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="速度" :label-width="secondLabelWidth">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="currentCustomizeAnimation.keyFrameSpeed"
                @change="update"
              >
                <el-option v-for="item in animationSpeed" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item
              label="速度系数"
              :label-width="secondLabelWidth"
              v-if="currentCustomizeAnimation.keyFrameSpeed !== 'constant'"
            >
              <sw-input-number
                v-model.number="currentCustomizeAnimation.animationSpeedNum"
                :min="1"
                :max="10"
                @change="update"
              />
            </el-form-item>

            <el-form-item label="透明度" :label-width="secondLabelWidth">
              <SwSlider
                v-model="currentCustomizeAnimation.keyFrameOpacity"
                :max="1"
                :min="0"
                :step="0.1"
                unit="%"
                @change="update"
              />
            </el-form-item>
            <SwCollapseItem
              title="旋转"
              v-model="currentCustomizeAnimation.showKeyFrameRotate"
              @change="update"
              showIcon
            >
              <template #content>
                <el-form-item label="x轴" :label-width="thirdLabelWidth">
                  <SwSlider
                    v-model="currentCustomizeAnimation.keyFrameRotateX"
                    :max="360"
                    :step="0.1"
                    :min="-360"
                    unit="°"
                    @change="update"
                  />
                </el-form-item>
                <el-form-item label="y轴" :label-width="thirdLabelWidth">
                  <SwSlider
                    v-model="currentCustomizeAnimation.keyFrameRotateY"
                    :max="360"
                    :step="0.1"
                    :min="-360"
                    unit="°"
                    @change="update"
                  />
                </el-form-item>
                <el-form-item label="z轴" :label-width="thirdLabelWidth">
                  <SwSlider
                    v-model="currentCustomizeAnimation.keyFrameRotateZ"
                    :max="360"
                    :step="0.1"
                    :min="-360"
                    unit="°"
                    @change="update"
                  />
                </el-form-item>
              </template>
            </SwCollapseItem>
            <SwCollapseItem
              title="缩放"
              v-model="currentCustomizeAnimation.showKeyFrameScale"
              @change="update"
              showIcon
            >
              <template #content>
                <el-form-item label="缩放" :label-width="thirdLabelWidth">
                  <div class="flex flex-center-between">
                    <sw-input-number
                      v-model.number="currentCustomizeAnimation.keyFrameScaleX"
                      unit="%"
                      :min="0"
                      :controls="false"
                      bottom-label="X"
                      @change="update"
                    />
                    <sw-input-number
                      v-model.number="currentCustomizeAnimation.keyFrameScaleY"
                      unit="%"
                      :min="0"
                      :controls="false"
                      bottom-label="Y"
                      @change="update"
                    />
                  </div>
                </el-form-item>
              </template>
            </SwCollapseItem>
            <SwCollapseItem
              title="平移"
              v-model="currentCustomizeAnimation.showKeyFrameTranslate"
              @change="update"
              showIcon
            >
              <template #content>
                <el-form-item label="平移" :label-width="thirdLabelWidth">
                  <div class="flex flex-center-between">
                    <sw-input-number
                      v-model.number="currentCustomizeAnimation.keyFrameTranslateX"
                      unit="px"
                      :controls="false"
                      bottom-label="X"
                      @change="update"
                    />
                    <sw-input-number
                      v-model.number="currentCustomizeAnimation.keyFrameTranslateY"
                      unit="px"
                      :controls="false"
                      bottom-label="Y"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { has, isArray } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth, thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
// import { animationSpeed, animationType } from "../dict"; animationType
import { animationSpeed, imgAnimationType } from "../dict";
import { imgEAnimationType } from "../enum";

const { update, selectTargetData } = useUpdateInstance();
const initCustomize = () => {
  selectTargetData.value[0].option.customizeArray = [];
};

const getFirstCustomizeAnimation = () => {
  const animation = {
    name: "帧1",
    keyFrameTime: 100,
    keyFrameOpacity: 1,
    keyFrameSpeed: "",
    keyFrameSpeedNum: 1,
    showKeyFrameRotate: false,
    keyFrameRotateX: 0,
    keyFrameRotateY: 0,
    keyFrameRotateZ: 0,
    showKeyFrameScale: false,
    keyFrameScaleX: 100,
    keyFrameScaleY: 100,
    showKeyFrameTranslate: false,
    keyFrameTranslateX: 0,
    keyFrameTranslateY: 0
  };
  selectTargetData.value[0].option.customizeArray = [];
  selectTargetData.value[0].option.customizeArray.push(animation);
};
const animationTypeUpdate = () => {
  if (
    selectTargetData.value[0].option.animationType === imgEAnimationType.Customize &&
    !has(selectTargetData.value[0].option, "customizeArray")
  ) {
    initCustomize();
    seriesTabs.value = "帧1";
    currentCustomizeAnimation.value = null;
    getCurrentAnimation();
  }
  update();
};

const seriesTabs = ref("帧1");
const currentCustomizeAnimation = ref<any | null>(null);

const handleAddSeries = () => {
  if (
    !isArray(selectTargetData.value[0].option.customizeArray) ||
    selectTargetData.value[0].option.customizeArray.length === 0
  ) {
    getFirstCustomizeAnimation();
    seriesTabs.value = selectTargetData.value[0].option.customizeArray[0].name;
  } else {
    const index = selectTargetData.value[0].option.customizeArray.findIndex((it: any) => it.name === seriesTabs.value);
    const obj = JSON.parse(JSON.stringify(selectTargetData.value[0].option.customizeArray[index]));
    obj.name = "帧" + (selectTargetData.value[0].option.customizeArray.length + 1);
    selectTargetData.value[0].option.customizeArray.push(obj);
    seriesTabs.value = "帧" + selectTargetData.value[0].option.customizeArray.length;
    //
    console.log("handleAddSeries", selectTargetData.value[0].option.customizeArray);
  }
  getCurrentAnimation();
  update();
};

const handleDeleteSeries = () => {
  if (
    has(selectTargetData.value[0].option, "customizeArray") &&
    selectTargetData.value[0].option.customizeArray.length == 1
  ) {
    selectTargetData.value[0].option.customizeArray = [];

    currentCustomizeAnimation.value = null;
    seriesTabs.value = "帧1";
    update();
  }

  if (
    has(selectTargetData.value[0].option, "customizeArray") &&
    selectTargetData.value[0].option.customizeArray.length > 1
  ) {
    const index = selectTargetData.value[0].option.customizeArray.findIndex((it: any) => it.name === seriesTabs.value);
    selectTargetData.value[0].option.customizeArray.splice(index, 1);

    selectTargetData.value[0].option.customizeArray.forEach((item: any, index: number) => {
      item.name = "帧" + (index + 1);
    });

    if (selectTargetData.value[0].option.customizeArray.length === 1) {
      seriesTabs.value =
        selectTargetData.value[0].option.customizeArray[
          selectTargetData.value[0].option.customizeArray.length - 1
        ].name;
    }
    if (index === selectTargetData.value[0].option.customizeArray.length) {
      seriesTabs.value = selectTargetData.value[0].option.customizeArray[index - 1].name;
    }

    getCurrentAnimation();
    update();
  }
};

const tapList = computed(() => {
  if (isArray(selectTargetData.value[0].option.customizeArray)) {
    return selectTargetData.value[0].option.customizeArray.map((item: any) => item.name);
  } else {
    return [];
  }
});
const getCurrentAnimation = () => {
  if (selectTargetData.value[0].option.customizeArray.length > 0) {
    currentCustomizeAnimation.value = selectTargetData.value[0].option.customizeArray.find(
      (it: any) => it.name === seriesTabs.value
    );
  } else {
    currentCustomizeAnimation.value = null;
  }
};

const handleCustomizeChange = () => {
  getCurrentAnimation();
};

const initAnimation = () => {
  if (
    has(selectTargetData.value[0].option, "customizeArray") &&
    isArray(selectTargetData.value[0].option.customizeArray) &&
    selectTargetData.value[0].option.customizeArray.length > 0
  ) {
    seriesTabs.value = "帧1";
    getCurrentAnimation();
  }
};
onMounted(() => {
  initAnimation();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
</style>
