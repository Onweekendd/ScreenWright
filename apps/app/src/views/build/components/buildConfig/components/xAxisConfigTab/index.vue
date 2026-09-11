<!-- 处理坐标轴x和y的配置 -->
<template>
  <div class="xAxis-config-tab">
    <xAxisTab v-model="active" :type="type" />
    <xAxisShow :type="active" />
    <template v-if="isLoad">
      <template v-if="active === XAxisType.X">
        <template v-if="type === TypeAttrs.column">
          <yAxisConfig
            :showAxiosLabelUtil="showAxiosLabelUtil"
            :showAxisSplitLineType="showAxisSplitLineType"
            :showAxisUnit="showAxisUnit"
            :showYAxisMinMax="showYAxisMinMax"
            :isShowNumberSlider="isShowNumberSlider"
          />
        </template>
        <template v-else>
          <xAxisConfig
            :showAxiosLabelUtil="showAxiosLabelUtil"
            :showAxisType="showAxisType"
            :showAxisInterval="showAxisInterval"
            :showLabelLimit="showLabelLimit"
            :showAxisSplitLineType="showAxisSplitLineType"
            :axisSplitLineIntervalLabel="axisSplitLineIntervalLabel"
            :showAxisSplitLineIntervalLabel="showAxisSplitLineIntervalLabel"
            :showHightLight="showHightLight"
          />
        </template>
      </template>
      <template v-else>
        <template v-if="type === TypeAttrs.column">
          <xAxisConfig
            :showAxiosLabelUtil="showAxiosLabelUtil"
            :showAxisType="showAxisType"
            :showAxisInterval="showAxisInterval"
            :showLabelLimit="showLabelLimit"
            :showAxisSplitLineType="showAxisSplitLineType"
            :axisSplitLineIntervalLabel="axisSplitLineIntervalLabel"
            :showAxisSplitLineIntervalLabel="showAxisSplitLineIntervalLabel"
            :showHightLight="showHightLight"
          />
        </template>
        <template v-else>
          <yAxisConfig
            :showAxiosLabelUtil="showAxiosLabelUtil"
            :showAxisSplitLineType="showAxisSplitLineType"
            :showAxisUnit="showAxisUnit"
            :showYAxisMinMax="showYAxisMinMax"
            :isShowNumberSlider="isShowNumberSlider"
          />
        </template>
      </template>
    </template>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import { XAxisType } from "./type";
import { TypeAttrs, useAttrsByReverse } from "./useAttrsByReverse";
import xAxisConfig from "./xAxisConfig.vue";
import xAxisShow from "./xAxisShow.vue";
import xAxisTab from "./xAxisTab.vue";
import yAxisConfig from "./yAxisConfig.vue";

const { setProps } = useAttrsByReverse();

interface Props {
  type?: TypeAttrs;
  showAxisType?: boolean;
  showAxisInterval?: boolean;
  showLabelLimit?: boolean;
  showAxiosLabelUtil?: boolean;
  showAxisSplitLineType?: boolean;
  axisSplitLineIntervalLabel?: string;
  showAxisSplitLineIntervalLabel?: boolean;
  showAxisUnit?: boolean;
  showYAxisMinMax?: boolean;
  showHightLight?: boolean;
  isShowNumberSlider?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  type: TypeAttrs.row,
  showAxisType: true,
  showAxisInterval: true,
  showLabelLimit: true,
  showAxiosLabelUtil: false,
  showAxisSplitLineType: true,
  showAxisSplitLineIntervalLabel: true,
  axisSplitLineIntervalLabel: "间隔",
  showAxisUnit: true,
  showHightLight: false,
  showYAxisMinMax: true,
  isShowNumberSlider: true
});
const active = ref(XAxisType.X);
const isLoad = ref(false);

const setPropsType = () => {
  if (active.value.includes("_")) {
    setProps(active.value.includes("L") ? TypeAttrs.column_l : TypeAttrs.column_r);
  } else {
    setProps(active.value === XAxisType.X ? TypeAttrs.row : TypeAttrs.column);
  }
};

watch(
  () => active.value,
  () => {
    setPropsType();
  }
);
onMounted(() => {
  console.log("xAxisConfigTab", props.type);
  setPropsType();
  isLoad.value = true;
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.xAxis-config-tab {
  @include checkbox-style();
}
</style>
