<template>
  <div class="y-axis-config">
    <SwCollapseItem show-icon title="轴标签" @change="update" v-model="axisLabelShow">
      <template #content>
        <yAxisConfigLabel :showAxiosLabelUtil="showAxiosLabelUtil" :showYAxisMinMax="showYAxisMinMax" />
      </template>
    </SwCollapseItem>
    <SwCollapseItem show-icon title="轴单位" @change="update" v-model="axisNameShow" v-if="showAxisUnit">
      <template #content>
        <yAxisConfigName :isShowNumberSlider="isShowNumberSlider" />
      </template>
    </SwCollapseItem>
    <SwCollapseItem show-icon title="轴线" @change="update" v-model="axisLineShow">
      <template #content>
        <yAxisConfigLine />
      </template>
    </SwCollapseItem>

    <SwCollapseItem show-icon title="刻度" @change="update" v-model="axisTickShow">
      <template #content>
        <yAxisConfigTick />
      </template>
    </SwCollapseItem>

    <SwCollapseItem show-icon title="网格线" @change="update" v-model="axisSplitLineShow">
      <template #content>
        <yAxisConfigSplitLine :showyAxisSplitLineType="showAxisSplitLineType" />
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../useUpdateInstance";
import yAxisConfigLabel from "./component/yAxisConfigLabel.vue";
import yAxisConfigLine from "./component/yAxisConfigLine.vue";
import yAxisConfigName from "./component/yAxisConfigName.vue";
import yAxisConfigSplitLine from "./component/yAxisConfigSplitLine.vue";
import yAxisConfigTick from "./component/yAxisConfigTick.vue";
import { useAttrsByReverse } from "./useAttrsByReverse";

const { axisSplitLineShow, axisTickShow, axisLineShow, axisLabelShow, axisNameShow } = useAttrsByReverse();
const { update } = useUpdateInstance();
withDefaults(
  defineProps<{
    showAxiosLabelUtil?: boolean;
    showAxisSplitLineType?: boolean;
    showAxisUnit?: boolean;
    showYAxisMinMax?: boolean;
    isShowNumberSlider?: boolean;
  }>(),
  {
    showAxiosLabelUtil: false,
    showAxisSplitLineType: true,
    showAxisUnit: true,
    showYAxisMinMax: true,
    isShowNumberSlider: true
  }
);
</script>
