<template>
  <div class="echartliquid-fill-water">
    <SwCollapseItem title="水波样式" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="waveTabs" :tabs="selectTargetData[0].option.waveTabsName" />
        <div v-for="(item, index) in selectTargetData[0].option.waveTabsName" :key="index">
          <template v-if="item === waveTabs">
            <el-form-item label="颜色" :label-width="secondLabelWidth">
              <sw-single-color-picker v-model="selectTargetData[0].option.waveColor[index]" @change="update" />
            </el-form-item>
          </template>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const waveTabs = ref(selectTargetData.value[0].option.waveTabsName[0] || "");
const handleAdd = () => {
  const target = selectTargetData.value[0].option.waveTabsName.find((item: any) => item === waveTabs.value);
  const targetIndex = selectTargetData.value[0].option.waveTabsName.findIndex((item: any) => item === waveTabs.value);
  if (target) {
    const waveTabsName = `水波${selectTargetData.value[0].option.waveTabsName.length + 1}`;
    selectTargetData.value[0].option.waveTabsName.push(waveTabsName);
    waveTabs.value = waveTabsName;
    const targetColor = selectTargetData.value[0].option.waveColor[targetIndex];
    selectTargetData.value[0].option.waveColor.push(targetColor || "#000000");
    update();
  }
};
const handleDelete = () => {
  if (selectTargetData.value[0].option.waveTabsName.length <= 1) {
    return;
  }
  const index = selectTargetData.value[0].option.waveTabsName.indexOf(waveTabs.value);
  if (index > -1) {
    selectTargetData.value[0].option.waveTabsName.splice(index, 1);
    selectTargetData.value[0].option.waveColor.splice(index, 1);
    console.log(selectTargetData.value[0].option.waveTabsName, "selectTargetData.value[0].option.waveTabsName");

    for (let i = 0; i < selectTargetData.value[0].option.waveTabsName.length; i++) {
      selectTargetData.value[0].option.waveTabsName[i] = `水波${i + 1}`;
    }

    if (selectTargetData.value[0].option.waveTabsName.length === 1) {
      waveTabs.value =
        selectTargetData.value[0].option.waveTabsName[selectTargetData.value[0].option.waveTabsName.length - 1];
    }
    if (index === selectTargetData.value[0].option.waveTabsName.length) {
      waveTabs.value = selectTargetData.value[0].option.waveTabsName[index - 1];
    }

    update();
  }
};
onMounted(() => {
  if (selectTargetData.value[0].option.waveTabsName.length > 0) {
    waveTabs.value = selectTargetData.value[0].option.waveTabsName[0];
  }
});
</script>
