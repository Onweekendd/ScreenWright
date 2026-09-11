<!-- 图例配置 -->
<template>
  <div class="config-legend">
    <el-form-item label="文本样式" :label-width="labelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <el-form-item label="图标尺寸" :label-width="labelWidth" v-if="isShowLegendSize">
      <div class="legend-size-wrapper flex flex-justify-between">
        <SwInputNumber
          v-model="selectTargetData[0].option.legendItemWidth"
          :controls="false"
          unit="px"
          bottom-label="宽度"
          width="90"
          @change="update"
        />
        <SwInputNumber
          v-model="selectTargetData[0].option.legendItemHeight"
          :controls="false"
          unit="px"
          bottom-label="高度"
          width="90"
          @change="update"
        />
      </div>
    </el-form-item>

    <el-form-item label="间距" :label-width="labelWidth">
      <div class="legend-size-wrapper flex flex-justify-between">
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.legendItemGap"
          :controls="false"
          unit="px"
          width="100%"
          v-if="legendItemGapShow"
        />
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.legendTextLeftPadding"
          :controls="false"
          unit="px"
          width="100%"
          v-else
        />
      </div>
    </el-form-item>
    <!-- 布局朝向组件 -->
    <LegendOrient v-if="isShowLegendOrient" />
    <el-form-item label="点击交互" :label-width="labelWidth" v-if="isShowLegendSelectedMode">
      <el-checkbox v-model="selectTargetData[0].option.legendSelectedMode" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../useUpdateInstance";
import configTextStyle from "../configTextStyle/index.vue";
import { useFontStyleAttrs } from "../configTextStyle/useTextStyleAttrs";
import LegendOrient from "./legendOrient.vue";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "legendFontFamily",
  fontStyle: "legendFontStyle",
  fontWeight: "legendFontWeight",
  fontSize: "legendFontSize",
  color: "legendColor"
});

interface Props {
  labelWidth?: string;
  isShowLegendOrient?: boolean;
  isShowLegendSelectedMode?: boolean;
  isShowLegendSize?: boolean;
  legendItemGapShow?: boolean;
}

withDefaults(defineProps<Props>(), {
  labelWidth: "73",
  isShowLegendOrient: true,
  isShowLegendSelectedMode: true,
  isShowLegendSize: true,
  legendItemGapShow: false
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.config-legend {
  width: 100%;
  .legend-size-wrapper {
    width: 100%;
  }
  @include checkbox-style();
  :deep(.el-form-item__label) {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0;
    display: inline-block;
    margin-right: 0px;
  }
}
</style>
