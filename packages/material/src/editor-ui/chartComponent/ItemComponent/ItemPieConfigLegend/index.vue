<template>
  <SwCollapseItem title="图例" @change="update" v-model="selectTargetData[0].option.legendShow" showIcon>
    <template #content>
      <el-form-item label="顺序" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.legendOrder"
          placeholder="Select"
          style="width: 214px"
          @change="update"
        >
          <el-option v-for="item in dataOrder" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="图标尺寸" :label-width="70">
        <div class="flex flex-center" style="width: 100%">
          <SwInputNumber
            unit="px"
            bottom-label="宽度"
            width="100"
            @change="update"
            v-model="selectTargetData[0].option.legendItemWidth"
          />
          <SwInputNumber
            unit="px"
            bottom-label="高度"
            width="100"
            @change="update"
            v-model="selectTargetData[0].option.legendItemHeight"
          />
        </div>
      </el-form-item>
      <el-form-item label="间距" :label-width="secondLabelWidth">
        <SwInputNumber unit="px" @change="update" v-model="selectTargetData[0].option.legendTextLeftPadding" />
      </el-form-item>
      <!-- 类目组件配置 -->
      <categoryConfig />
      <!-- 图例占比值配置 -->
      <proportionConfig />
      <!-- 真实值配置 -->
      <pieRealConfig />
      <!-- 布局位置 -->
      <LegendOrient />
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import LegendOrient from "../../../components/configLegend/legendOrient.vue";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import categoryConfig from "./categoryConfig.vue";
import pieRealConfig from "./pieRealConfig.vue";
import proportionConfig from "./proportionConfig.vue";

const { selectTargetData, update } = useUpdateInstance();
const dataOrder = ref([
  { label: "数据返回顺序", value: "default" },
  { label: "从大到小", value: "desc" },
  { label: "从小到大", value: "asc" }
]);
</script>
<style scoped lang="scss">
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
.config-legend-wrap {
  width: 100%;
}
</style>
