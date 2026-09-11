<template>
  <div class="iot-general-equipment-event">
    <el-form-item label="高亮面积" :label-width="firstLabelWidth">
      <sw-radio
        direction="row"
        :option="changeTypeArea"
        v-model="selectTargetData[0].option.highlightArea"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwRadio } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const changeTypeArea = ref([
  { label: "滑动结束", value: "1" },
  { label: "实时变化", value: "2" }
]);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
