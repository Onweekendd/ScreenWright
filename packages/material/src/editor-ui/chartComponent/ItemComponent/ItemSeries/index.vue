<!-- 系列设置 -->
<template>
  <sw-collapse-item title="数据系列" open>
    <template #icon>
      <Icon type="CirclePlus" @click="handleAddSeries" size="14" />
      <Icon type="Delete" @click="handleDeleteSeries" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
      <template v-if="selectTargetData[0].option.seriesTabsName.length > 0 && currentIndex !== -1">
        <FieldMapping :type="props.type" :currentIndex="currentIndex" />
      </template>
    </template>
  </sw-collapse-item>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";
import FieldMapping from "./fieldMapping.vue";
import { useSeries } from "./useSeries";

const props = withDefaults(
  defineProps<{
    type?: string;
  }>(),
  {
    type: "single"
  }
);
const { selectTargetData } = useUpdateInstance();
const seriesTabs = ref("系列1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === seriesTabs.value);
});
watch(
  () => seriesTabs.value,
  (newVal) => {
    console.log(newVal);
  }
);
const list = ["dataSeriesName", "seriesColor", "seriesOpacity"];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
</script>
<style lang="scss" scoped>
.input-wrap {
  width: 100%;
}
</style>
