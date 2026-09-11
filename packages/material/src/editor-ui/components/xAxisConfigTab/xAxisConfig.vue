<template>
  <div class="x-axis-config">
    <SwCollapseItem show-icon title="轴标签" @change="update" v-model="axisLabelShow">
      <template #content>
        <xAxisConfigLabel
          :showAxiosLabelUtil="showAxiosLabelUtil"
          :showAxisType="showAxisType"
          :showAxisInterval="showAxisInterval"
          :showLabelLimit="showLabelLimit"
          :showHightLight="showHightLight"
        />
      </template>
    </SwCollapseItem>
    <SwCollapseItem show-icon title="轴线" @change="update" v-model="axisLineShow">
      <template #content>
        <xAxisConfigLabelStyle />
      </template>
    </SwCollapseItem>

    <SwCollapseItem show-icon title="刻度" @change="update" v-model="axisTickShow">
      <template #content>
        <xAxisTickConfig />
      </template>
    </SwCollapseItem>
    <SwCollapseItem show-icon title="网格线" @change="update" v-model="axisSplitLineShow">
      <template #content>
        <xAxisSplitLineConfig
          :axisSplitLineIntervalLabel="axisSplitLineIntervalLabel"
          :showAxisSplitLineType="showAxisSplitLineType"
          :showAxisSplitLineIntervalLabel="showAxisSplitLineIntervalLabel"
        />
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../useUpdateInstance";
import xAxisConfigLabel from "./component/xAxisConfigLabel.vue";
import xAxisConfigLabelStyle from "./component/xAxisConfigLabelStyle.vue";
import xAxisSplitLineConfig from "./component/xAxisSplitLineConfig.vue";
import xAxisTickConfig from "./component/xAxisTickConfig.vue";
import { useAttrsByReverse } from "./useAttrsByReverse";

const { axisSplitLineShow, axisTickShow, axisLineShow, axisLabelShow } = useAttrsByReverse();
const { update } = useUpdateInstance();
withDefaults(
  defineProps<{
    showAxisType?: boolean;
    showAxisInterval?: boolean;
    showLabelLimit?: boolean;
    showAxiosLabelUtil?: boolean;
    axisSplitLineIntervalLabel?: string;
    showAxisSplitLineType?: boolean;
    showAxisSplitLineIntervalLabel?: boolean;
    showHightLight?: boolean;
  }>(),
  {
    showAxisType: true,
    showAxisInterval: true,
    showLabelLimit: true,
    showAxiosLabelUtil: false,
    axisSplitLineIntervalLabel: "间隔",
    showAxisSplitLineType: true,
    showAxisSplitLineIntervalLabel: true,
    showHightLight: false
  }
);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
