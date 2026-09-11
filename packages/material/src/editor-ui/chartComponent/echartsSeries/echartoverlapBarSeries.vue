<template>
  <div class="echart-overlap-bar-series">
    <sw-collapse-item title="数据系列" open>
      <template #content>
        <SwSeriesTabs v-model="activeTab" :tabs="selectTargetData[0].option.seriesTabsName" />
        <ItemechartoverlapBarStyle :currentIndex="currentIndex" :activeTab="activeTab" />
        <ItemechartoverlapValueLabel :key="currentIndex" :currentIndex="currentIndex" :activeTab="activeTab" />
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as SwSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../useUpdateInstance";
import ItemechartoverlapBarStyle from "../ItemComponent/ItemechartoverlapBarStyle/index.vue";
import ItemechartoverlapValueLabel from "../ItemComponent/ItemechartoverlapValueLabel/index.vue";

const { selectTargetData } = useUpdateInstance();
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item === activeTab.value);
});
const activeTab = ref("系列1");
</script>
