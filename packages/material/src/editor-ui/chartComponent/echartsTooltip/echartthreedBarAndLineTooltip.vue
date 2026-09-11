<template>
  <div class="ehcart-threed-bar-and-line-tooltip">
    <el-form-item label="自动轮播" :label-width="secondLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.tooltipLoop" @change="update" />
    </el-form-item>
    <sw-collapse-item title="后缀" open>
      <template #content>
        <ScreenwrightSeriesTabs v-model="tooltipUnitTabs" :tabs="selectTargetData[0].option.tooltipUnitTabsName" />
        <el-form-item label="后缀名" :label-width="secondLabelWidth">
          <sw-input v-model="selectTargetData[0].option.tooltipUnit[currentIndex]" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const tooltipUnitTabs = ref("后缀1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.tooltipUnitTabsName.indexOf(tooltipUnitTabs.value);
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
