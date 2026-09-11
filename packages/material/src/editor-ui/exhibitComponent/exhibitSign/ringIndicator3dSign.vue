<template>
  <div class="ring-indicator3d-sign">
    <SwCoordinateTabs v-model="placardType" :option="coordinateOption" />
    <el-form-item label="透明度" :label-width="firstLabelWidth">
      <sw-slider v-model="currentDataObj.opacity" unit="%" @change="update" />
    </el-form-item>
    <sw-collapse-item title="标牌" open>
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="currentDataObj.placardImg"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="currentDataObj.placardOffsetWidth"
              unit="px"
              bottomLabel="宽度"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentDataObj.placardOffsetHeight"
              unit="px"
              bottomLabel="高度"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="图标列表" open>
      <template #icon>
        <Icon type="CirclePlus" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleAddSeries" />
        <Icon type="Delete" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleDeleteSeries" />
      </template>
      <template #content v-if="tapList.length > 0">
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="tapList" @change="handleChange" />
        <div v-if="currentData !== null">
          <!--  -->
          <el-form-item label="对应名称" :label-width="secondLabelWidth">
            <sw-input v-model="currentData.name" :controls="false" @change="update" />
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentData.img"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <el-form-item label="尺寸" :label-width="secondLabelWidth">
            <div class="flex flex-center-between">
              <sw-input-number
                v-model.number="currentData.offsetWidth"
                unit="px"
                bottomLabel="宽度"
                :controls="false"
                @change="update"
              />
              <sw-input-number
                v-model.number="currentData.offsetHeight"
                unit="px"
                bottomLabel="高度"
                :controls="false"
                @change="update"
              />
            </div>
          </el-form-item>
          <el-form-item label="偏移" :label-width="secondLabelWidth">
            <div class="flex flex-center-between">
              <sw-input-number
                v-model.number="currentData.offsetLeft"
                unit="px"
                bottomLabel="X"
                :controls="false"
                @change="update"
              />
              <sw-input-number
                v-model.number="currentData.offsetTop"
                unit="px"
                bottomLabel="Y"
                :controls="false"
                @change="update"
              />
            </div>
          </el-form-item>
        </div>
      </template>
      <template #content v-else>
        <div style="text-align: center; color: #fff; font-size: 12px">暂无数据</div>
      </template>
    </sw-collapse-item>
    <sw-collapse-item open title="数字" v-model="currentDataObj.showNum" showIcon @change="update">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="numberFontInput" @change="handleNumberChange" />
          <div class="flex">
            <sw-input-number
              v-model.number="currentDataObj.numLetterSpacing"
              unit="px"
              bottomLabel="字距"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentDataObj.numLineHeight"
              unit="px"
              bottomLabel="行距"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="currentDataObj.numOffsetLeft"
              unit="px"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentDataObj.numOffsetTop"
              unit="px"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <sw-collapse-item title="后缀" open v-model="currentDataObj.showNumUnit" showIcon @change="update">
          <template #content>
            <el-form-item label="内容" :label-width="thirdLabelWidth">
              <sw-input v-model="currentDataObj.numUnitText" :controls="false" @change="update" />
            </el-form-item>
            <el-form-item label="文本样式" :label-width="thirdLabelWidth">
              <configTextStyle v-model="unitFontInput" @change="handleUnitChange" />
              <div class="flex">
                <sw-input-number
                  v-model.number="currentDataObj.numUnitLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentDataObj.numUnitLineHeight"
                  unit="px"
                  bottomLabel="行距"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="flex flex-center-between">
                <sw-input-number
                  v-model.number="currentDataObj.numUnitOffsetLeft"
                  unit="px"
                  bottomLabel="X"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="currentDataObj.numUnitOffsetTop"
                  unit="px"
                  bottomLabel="Y"
                  :controls="false"
                  @change="update"
                />
              </div>
            </el-form-item>
          </template>
        </sw-collapse-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="名称" open v-model="currentDataObj.showName" showIcon @change="update">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="nameFontInput" @change="handleNameChange" />
          <div class="flex">
            <sw-input-number
              v-model.number="currentDataObj.nameLetterSpacing"
              unit="px"
              bottomLabel="字距"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentDataObj.nameLineHeight"
              unit="px"
              bottomLabel="行距"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="currentDataObj.nameOffsetLeft"
              unit="px"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentDataObj.nameOffsetTop"
              unit="px"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwCoordinateTabs } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const placardType = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "选中",
    value: "selectObj"
  }
]);

const currentDataObj = computed(() => {
  return selectTargetData.value[0].option.placard[placardType.value];
});

const tapList = computed(() => {
  return selectTargetData.value[0].option.placard[placardType.value].iconList.map((item: any) => item.tabsName);
});
const seriesTabs = ref<string>("图标1");
const handleAddSeries = () => {
  const index = selectTargetData.value[0].option.placard[placardType.value].iconList.findIndex((item: any) => {
    return item.tabsName === seriesTabs.value;
  });
  const obj = cloneDeep(selectTargetData.value[0].option.placard[placardType.value].iconList[index]);
  obj.tabsName = "图标" + (selectTargetData.value[0].option.placard[placardType.value].iconList.length + 1);
  obj.content = "";
  selectTargetData.value[0].option.placard[placardType.value].iconList.push(obj);

  seriesTabs.value = "图标" + selectTargetData.value[0].option.placard[placardType.value].iconList.length;
  getCurrent();
  update();
};

const handleDeleteSeries = () => {
  if (selectTargetData.value[0].option.placard[placardType.value].iconList.length === 1) {
    return;
  }
  const index = selectTargetData.value[0].option.placard[placardType.value].iconList.findIndex(
    (it: any) => it.tabsName === seriesTabs.value
  );
  selectTargetData.value[0].option.placard[placardType.value].iconList.splice(index, 1);

  selectTargetData.value[0].option.placard[placardType.value].iconList.forEach((item: any, index: number) => {
    item.tabsName = "图标" + (index + 1);
  });

  seriesTabs.value = "图标" + selectTargetData.value[0].option.placard[placardType.value].iconList.length;
  getCurrent();
  update();
};

const currentData = ref<any | null>(null);
const getCurrent = () => {
  currentData.value = selectTargetData.value[0].option.placard[placardType.value].iconList.find(
    (it: any) => it.tabsName === seriesTabs.value
  );

  console.log("getCurrent", currentData.value);
  console.log("getCurrent", selectTargetData.value[0].option.placard[placardType.value]);
  console.log("getCurrent", selectTargetData.value[0].option.placard[placardType.value].iconList);
};

const handleChange = () => {
  getCurrent();
  update();
};

watch(
  () => placardType.value,
  () => {
    const pathAttrs = placardType.value;
    numberInit("placard." + pathAttrs);
    unitInit("placard." + pathAttrs);
    nameInit("placard." + pathAttrs);
  }
);

const {
  input: numberFontInput,
  handleConfigTextChange: handleNumberChange,
  getInitValue: numberInit
} = useFontStyleAttrs({
  fontFamily: "numFontFamily",
  fontStyle: "numFontStyle",
  fontWeight: "numFontWeight",
  fontSize: "numFontSize",
  color: "numColor",
  attrs: "placard." + placardType.value
});

const {
  input: unitFontInput,
  handleConfigTextChange: handleUnitChange,
  getInitValue: unitInit
} = useFontStyleAttrs({
  fontFamily: "numUnitFontFamily",
  fontStyle: "numUnitFontStyle",
  fontWeight: "numUnitFontWeight",
  fontSize: "numUnitFontSize",
  color: "numUnitColor",
  attrs: "placard." + placardType.value
});

const {
  input: nameFontInput,
  handleConfigTextChange: handleNameChange,
  getInitValue: nameInit
} = useFontStyleAttrs({
  fontFamily: "nameFontFamily",
  fontStyle: "nameFontStyle",
  fontWeight: "nameFontWeight",
  fontSize: "nameFontSize",
  color: "nameColor",
  attrs: "placard." + placardType.value
});

onMounted(() => {
  getCurrent();
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
