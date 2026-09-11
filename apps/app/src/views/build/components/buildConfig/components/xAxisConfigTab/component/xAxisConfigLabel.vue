<!-- 轴标签 -->
<template>
  <div class="xAxisConfigLabel">
    <el-form-item label="格式" :label-width="labelWidth" v-if="showAxisType">
      <SwRadio direction="row" :option="xAxisTypeOption" v-model="axisType" @change="update" />
    </el-form-item>
    <el-form-item label="展示" :label-width="labelWidth" v-if="showAxisInterval">
      <div class="flex flex-justify-between" style="width: 100%">
        <SwInputNumber
          v-model="axisInterval"
          controls
          bottom-label="标签间隔"
          @change="update"
          :min="0"
          :precision="0"
          width="96"
        />
        <SwInputNumber v-model="axisRotate" unit="度" bottom-label="文字角度" @change="update" width="96" />
      </div>
    </el-form-item>
    <el-form-item label="距离" :label-width="labelWidth">
      <SwInputNumber v-model="axisMargin" unit="px" @change="update" />
    </el-form-item>
    <sw-collapse-item title="高亮配置" open v-if="showHightLight">
      <template #content>
        <ScreenwrightSeriesTabs v-model="axisLabelTabs" :tabs="yAxisLabelList" />
        <div v-for="(item, index) in yAxisSeriesTabsData" :key="index">
          <template v-if="yAxisLabelList[index] === axisLabelTabs">
            <el-form-item label="名称" :label-width="thirdLabelWidth">
              <sw-input v-model="yAxisSeriesTabsData[index]" disabled @change="update" />
            </el-form-item>
            <el-form-item label="启用" :label-width="thirdLabelWidth">
              <el-checkbox v-model="axisLabelHover[index]" @change="update" />
            </el-form-item>
            <el-form-item label="颜色" :label-width="thirdLabelWidth" v-if="axisLabelHover[index]">
              <sw-single-color-picker v-model="axisLabelHoverColor[index]" @change="update" />
            </el-form-item>
          </template>
        </div>
      </template>
    </sw-collapse-item>
    <el-form-item label="文本样式" :label-width="labelWidth" v-if="!showHightLight">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>

    <el-form-item label="文本限制" :label-width="labelWidth" v-if="showLabelLimit">
      <el-checkbox v-model="axisLabelLimit" @change="update" />
    </el-form-item>
    <el-form-item label="后缀" :label-width="labelWidth" v-if="showAxiosLabelUtil">
      <SwInput v-model="axisLabelUtil" @change="update" />
    </el-form-item>
    <el-form-item
      class="mr-10"
      label="显示每行个数"
      :label-width="63"
      v-if="selectTargetData[0].option.xAxisLabelLimit && showLabelLimit"
    >
      <SwInputNumber v-model="axisLabelLimitNum" :min="1" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import { splitArray } from "@/utils/utils";

import { useUpdateInstance } from "../../../useUpdateInstance";
import configTextStyle from "../../configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../configTextStyle/useTextStyleAttrs";
import { TypeAttrs, useAttrsByReverse } from "../useAttrsByReverse";

const {
  type,
  axisType,
  axisInterval,
  axisRotate,
  axisMargin,
  axisLabelLimit,
  axisLabelUtil,
  axisLabelLimitNum,
  axisLabelHover,
  axisLabelHoverColor
} = useAttrsByReverse();
const thirdLabelWidth = ref("48");
const { update, selectTargetData } = useUpdateInstance();
withDefaults(
  defineProps<{
    showAxisType?: boolean;
    showAxisInterval?: boolean;
    showLabelLimit?: boolean;
    showAxiosLabelUtil?: boolean;
    showHightLight?: boolean;
  }>(),
  {
    showAxisType: true,
    showAxisInterval: true,
    showLabelLimit: true,
    showAxiosLabelUtil: false,
    showHightLight: false
  }
);
const labelWidth = ref("73");
const xAxisTypeOption = ref([
  { label: "类目型", value: "category" },
  { label: "时间型", value: "time", disabled: true }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: type.value === TypeAttrs.row ? "xAxisFontFamily" : "yAxisFontFamily",
  fontStyle: type.value === TypeAttrs.row ? "xAxisFontStyle" : "yAxisFontStyle",
  fontWeight: type.value === TypeAttrs.row ? "xAxisFontWeight" : "yAxisFontWeight",
  fontSize: type.value === TypeAttrs.row ? "xAxisFontSize" : "yAxisFontSize",
  color: type.value === TypeAttrs.row ? "xAxisColor" : "yAxisColor"
});
const axisLabelTabs = ref("标签1");
const yAxisSeriesTabsData = computed(() => {
  return splitArray(cloneDeep(selectTargetData.value[0].data), "name").map((item: any) => item.name);
});
const yAxisLabelList = computed(() => {
  return yAxisSeriesTabsData.value.map((_item, index) => {
    return `标签${index + 1}`;
  });
});
onMounted(() => {
  if (axisLabelHoverColor.value) {
    axisLabelHoverColor.value = yAxisSeriesTabsData.value.map((item, index) => {
      return axisLabelHoverColor.value[index] || "#ffffff";
    });
  }
  if (axisLabelHover.value) {
    axisLabelHover.value = yAxisSeriesTabsData.value.map((item, index) => {
      return axisLabelHover.value[index] || false;
    });
  }
});
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
.mr-10 {
  :deep(.el-form-item__label) {
    margin-right: 10px;
  }
}
</style>
