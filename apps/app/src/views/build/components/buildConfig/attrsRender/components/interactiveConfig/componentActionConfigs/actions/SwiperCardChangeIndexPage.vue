<template>
  <el-form-item label="选中页码" :label-width="85">
    <el-select popper-class="sw-select-dropdown" v-model="action.swiperCardTabsName" @change="update">
      <el-option v-for="item in currentSwiperCardList" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>

  <el-form-item label="延时(ms)" :label-width="85">
    <sw-input-number v-model="action.animation.delay" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();
const currentSwiperCardList = computed(() => {
  if (action.value.component.length > 1) {
    return [];
  }
  const targetComponent = globalComponentMap.value.get(`${extractComponentId(action.value.component[0])}`);
  if (!targetComponent) {
    return [];
  }
  if (targetComponent.title.includes("轮播卡片")) {
    let optionsList = targetComponent.option.cardList.map((item: any, i: number) => {
      return {
        label: `${item.titleContent}-${i + 1}`,
        value: item.tabsName
      };
    });
    if (optionsList && optionsList.length > 0) {
      optionsList = [{ label: "左翻", value: "left" }, { label: "右翻", value: "right" }, ...optionsList];
    }
    return optionsList;
  }
  if (targetComponent.title === "3D图片列表") {
    return targetComponent.option.seriesTabsList?.map((item: any) => {
      return {
        label: `${item.name}-${item.defaultObj.title}`,
        value: item.id
      };
    });
  }
  return [];
});
</script>
