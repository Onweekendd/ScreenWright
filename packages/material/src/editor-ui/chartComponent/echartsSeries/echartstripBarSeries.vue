<template>
  <div class="echartbothWayStripBarSeries">
    <sw-collapse-item title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="handleAddSeries" />
        <Icon type="Delete" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
        <div
          v-if="
            selectTargetData[0].option.seriesTabsName &&
            selectTargetData[0].option.seriesTabsName.length > 0 &&
            currentIndex != -1
          "
        >
          <!-- 映射 -->
          <FieldMapping type="opacity" :currentIndex="currentIndex" />
          <!-- 极值高亮 -->
          <ItemBarextremeShow :currentIndex="currentIndex" />
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import ItemBarextremeShow from "../ItemComponent/ItemBarextremeShow/index.vue";
import FieldMapping from "../ItemComponent/ItemSeries/fieldMapping.vue";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const seriesTabs = ref("系列1");

const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex(
    (item: { name: string; value: string }) => item.name === seriesTabs.value
  );
});
const { selectTargetData } = useUpdateInstance();
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list: [
    "dataSeriesName",
    "seriesColor",
    "extremeColor",
    "extremeColorpicker",
    "extremeShow",
    "extremeType",
    "extremeOpacity",
    "seriesOpacity",
    "seriesColorpicker"
  ],
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
</script>
