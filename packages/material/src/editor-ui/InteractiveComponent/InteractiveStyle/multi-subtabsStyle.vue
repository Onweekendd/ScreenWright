<template>
  <div class="multi-subtabs-style">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <el-form-item :label-width="firstLabelWidth" label="启用" v-if="tabsActive === 'hoverObj'">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.isHovered" />
    </el-form-item>
    <textBackgroundShadow :attrs="tabsActive" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCoordinateTabs as SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";

import { firstLabelWidth } from "@editor/textComponent/textConfig/textConfig";
import { useUpdateInstance } from "../../useUpdateInstance";
import textBackgroundShadow from "../itemComponent/textBackgroundShadow/index.vue";

const { selectTargetData, update } = useUpdateInstance();

const tabsActive = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "悬停",
    value: "hoverObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);
</script>
