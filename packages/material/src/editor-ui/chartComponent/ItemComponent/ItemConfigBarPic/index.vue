<!-- 柱状样式的贴图配置 -->
<template>
  <SwCollapseItem open title="柱状样式">
    <template #content>
      <el-form-item label="系列间距" :labelWidth="secondLabelWidth">
        <SwSlider v-model="selectTargetData[0].option.barGap" @change="update" />
      </el-form-item>
      <el-form-item label="柱间间距" :labelWidth="secondLabelWidth">
        <SwSlider v-model="selectTargetData[0].option.barCategoryGap" @change="update" />
      </el-form-item>
      <SwCollapseItem open title="贴图">
        <template #content>
          <el-form-item label="路径" :labelWidth="thirdLabelWidth">
            <SwInput v-model="selectTargetData[0].option.symbol" @change="update" />
          </el-form-item>
          <el-form-item label="尺寸" :labelWidth="thirdLabelWidth">
            <div class="config-bar-pic-wrap flex flex-justify-between">
              <SwInputNumber
                v-model="selectTargetData[0].option.symbolWidth"
                unit="%"
                bottom-label="宽度"
                width="90"
                @change="update"
              />
              <SwInputNumber
                v-model="selectTargetData[0].option.symbolHeight"
                unit="%"
                bottom-label="高度"
                width="90"
                @change="update"
              />
            </div>
          </el-form-item>
        </template>
      </SwCollapseItem>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth, thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
.config-bar-pic-wrap {
  width: 100%;
}
</style>
