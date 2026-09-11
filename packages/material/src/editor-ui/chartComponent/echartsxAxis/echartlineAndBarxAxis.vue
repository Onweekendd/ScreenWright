<template>
  <div class="echart-threed-bar-and-line-x-axis">
    <!-- 选择轴 -->
    <ItemThreeDBarAndLineTab v-model="active" />
    <ItemThreeDBarAndLinexAxisShow :type="active" />
    <!-- 轴配置 -->
    <xAxisConfig
      :showLabelLimit="false"
      v-if="active === 'X'"
      axisSplitLineIntervalLabel="虚线间隔"
      :showAxisSplitLineType="false"
    />
    <ItemThreeDBarAndLineyAxisConfig :type="active" v-if="isLoad" :isShowXAxisName="true" :showNumberMaxAndMin="true" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import xAxisConfig from "../../components/xAxisConfigTab/xAxisConfig.vue";
import ItemThreeDBarAndLineTab from "../ItemComponent/ItemThreeDBarAndLineTab/index.vue";
import ItemThreeDBarAndLinexAxisShow from "../ItemComponent/ItemThreeDBarAndLinexAxisShow/index.vue";
import ItemThreeDBarAndLineyAxisConfig from "../ItemComponent/ItemThreeDBarAndLineyAxisConfig/index.vue";

const active = ref("X");
const reload = ref(true);

const isLoad = computed(() => {
  return (active.value === "Y_L" || active.value === "Y_R") && reload.value;
});
watch(
  () => active.value,
  (val: string) => {
    console.log(val);
    reload.value = false;
    nextTick(() => {
      reload.value = true;
    });
  }
);
</script>
