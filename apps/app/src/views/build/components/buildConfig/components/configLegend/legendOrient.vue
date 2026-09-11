<!-- 布局朝向组件 -->
<template>
  <SwCollapseItem title="布局" open>
    <template #content>
      <el-form-item label="布局朝向" :label-width="38">
        <div class="legend-size-wrapper">
          <SwRadio
            class="config-padding"
            direction="row"
            :option="legendOrient"
            v-model="selectTargetData[0].option.legendOrient"
            @change="update"
            style="margin-left: 10px"
          />
        </div>
      </el-form-item>

      <el-form-item label="整体尺寸" :label-width="38">
        <div class="legend-size-wrapper flex flex-justify-between" style="width: 100%; margin-left: 10px">
          <SwInputNumber
            v-model="selectTargetData[0].option.legendWidth"
            :controls="false"
            unit="px"
            bottom-label="宽度"
            width="100"
            @change="update"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.legendHeight"
            :controls="false"
            unit="px"
            bottom-label="高度"
            width="100"
            @change="update"
          />
        </div>
      </el-form-item>

      <el-form-item label="间距" :label-width="thirdLabelWidth">
        <div class="legend-size-wrapper">
          <SwInputNumber
            v-model="selectTargetData[0].option.legendItemGap"
            :controls="false"
            unit="px"
            width="100%"
            @change="update"
          />
        </div>
      </el-form-item>

      <el-form-item label="位置" :label-width="thirdLabelWidth">
        <div class="legend-size-wrapper flex flex-justify-between">
          <SwGridButton @change="update" v-model="selectTargetData[0].option.legendGrid" />
        </div>
      </el-form-item>

      <el-form-item label="偏移" :label-width="thirdLabelWidth">
        <div class="legend-size-wrapper flex flex-justify-between">
          <SwInputNumber
            v-model="selectTargetData[0].option.legendOffsetX"
            :controls="false"
            unit="px"
            bottom-label="X"
            width="90"
            @change="update"
            :disabled="xDisabled"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.legendOffsetY"
            :controls="false"
            unit="px"
            bottom-label="Y"
            width="90"
            @change="update"
            :disabled="yDisabled"
          />
        </div>
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwGridButton from "@/components/SwGridButton/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";

import { thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const yDisabled = computed(() => {
  if (!selectTargetData.value[0].option.legendGrid) {
    return true;
  }
  if (selectTargetData.value[0].option.legendGrid.top === "center") {
    return true;
  }
  return false;
});
const xDisabled = computed(() => {
  if (!selectTargetData.value[0].option.legendGrid) {
    return true;
  }
  if (selectTargetData.value[0].option.legendGrid.left === "center") {
    return true;
  }
  return false;
});
const legendOrient = ref([
  { label: "水平", value: "horizontal" },
  { label: "垂直", value: "vertical" }
]);
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 0px;
}
.legend-size-wrapper {
  width: 100%;
}
</style>
