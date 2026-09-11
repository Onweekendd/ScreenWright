<template>
  <div class="echartbothWayStripBarSeries">
    <sw-collapse-item title="数据系列" open>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
        <div v-if="selectTargetData[0].option.seriesTabsName.length > 0 && currentIndex != -1">
          <!-- 映射 -->
          <FieldMapping type="opacity" :currentIndex="currentIndex" />
          <!-- 极值高亮 -->
          <ItemBarextremeShow :currentIndex="currentIndex" />
          <!-- 整体布局 -->
          <ItemechartbothWayStripBarGrid :currentIndex="currentIndex" />
          <!-- 数值标签 -->
          <sw-collapse-item
            title="数值标签"
            showIcon
            v-model="selectTargetData[0].option.seriesLabelShow[currentIndex]"
            @change="update"
          >
            <template #content>
              <ConfigNumericalLabel type="none" :index="currentIndex" :labelWidth="thirdLabelWidth" />
            </template>
          </sw-collapse-item>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import ConfigNumericalLabel from "@editor/components/configNumericalLabel/index.vue";

import { thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemBarextremeShow from "../ItemComponent/ItemBarextremeShow/index.vue";
import ItemechartbothWayStripBarGrid from "../ItemComponent/ItemechartbothWayStripBarGrid/index.vue";
import FieldMapping from "../ItemComponent/ItemSeries/fieldMapping.vue";

const seriesTabs = ref("系列1");

const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === seriesTabs.value);
});
const { selectTargetData, update } = useUpdateInstance();
</script>
