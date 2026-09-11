<template>
  <div class="echarts-ankey-series">
    <sw-collapse-item title="数据系列" open>
      <template #content>
        <template v-if="selectTargetData[0].data.length > 0">
          <ScreenwrightSeriesTabs v-model="active" :tabs="points" />
          <el-form-item label="节点名称" :label-width="secondLabelWidth">
            <sw-input v-model="nodeName[currentIndex].name" disabled />
          </el-form-item>
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              @change="update"
              v-model="selectTargetData[0].option.pointColor[currentIndex]"
              field="pointColor"
            />
          </el-form-item>
        </template>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { uniq } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const targetName = computed<string[]>(() => {
  const rightData = selectTargetData.value[0].data.map((item: any) => item.target);
  return uniq([...rightData]);
});

const sourceName = computed<string[]>(() => {
  const optionData = selectTargetData.value[0].data || [];
  const leftData = optionData.map((item: any) => item.source);
  return uniq([...leftData]);
});

const linkName = computed<string[]>(() => {
  return uniq([...sourceName.value, ...targetName.value]);
});

const nodeName = computed<Array<{ name: string }>>(() => {
  return linkName.value.map((item) => {
    return { name: item };
  });
});
const points = computed(() => {
  return linkName.value.map((item, index) => `节点${index + 1}`);
});
const active = ref("节点1");
const currentIndex = computed(() => {
  return points.value.findIndex((item) => item === active.value);
});
</script>
