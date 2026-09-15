<template>
  <div class="ft-text-word-cloud-series">
    <sw-collapse-item title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="changeSeries('add')" size="14" />
        <Icon type="Delete" @click="changeSeries('delete')" size="14" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="seriesTabsName" />
        <div v-for="(item, index) in seriesTabsName" :key="index">
          <div v-if="item === seriesTabs">
            <el-form-item label="颜色" :label-width="73">
              <sw-single-color-picker
                v-model="selectTargetData[0].option.seriesColor[index]"
                field="seriesColor"
                @change="update"
              />
            </el-form-item>
          </div>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

const seriesTabs = ref("系列1");
const { update, selectTargetData } = useUpdateInstance();
const seriesTabsName = ref<string[]>([]);

const changeSeries = (type: string) => {
  const index = seriesTabsName.value.findIndex((item: any) => {
    return item === seriesTabs.value;
  });
  if (type === "add") {
    const targetColor = selectTargetData.value[0].option.seriesColor[index];
    const name = `系列${selectTargetData.value[0].option.seriesColor.length + 1}`;
    seriesTabsName.value.push(name);
    selectTargetData.value[0].option.seriesColor.push(targetColor);
    seriesTabs.value = name;
  } else {
    if (selectTargetData.value[0].option.seriesColor.length > 1) {
      selectTargetData.value[0].option.seriesColor.splice(index, 1);
      seriesTabsName.value.splice(index, 1);
      for (let i = 0; i < seriesTabsName.value.length; i++) {
        seriesTabsName.value[i] = `系列${i + 1}`;
      }
      if (selectTargetData.value[0].option.seriesColor.length === 1) {
        seriesTabs.value = seriesTabsName.value[seriesTabsName.value.length - 1];
      }
      if (index === selectTargetData.value[0].option.seriesColor.length) {
        seriesTabs.value = seriesTabsName.value[index - 1];
      }
      update();
    }
  }
};
onMounted(() => {
  seriesTabsName.value = selectTargetData.value[0].option.seriesColor.map((item: any, index: number) => {
    return `系列${index + 1}`;
  });
  seriesTabs.value = seriesTabsName.value[0];
});
</script>
