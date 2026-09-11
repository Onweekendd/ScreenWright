<template>
  <SwCollapseItem title="线样式" open>
    <template #content>
      <el-form-item label="取色方式" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.series.lineStyle.color"
          placeholder="Select"
          style="width: 100%"
          @change="update"
        >
          <el-option v-for="item in sankeyLineColor" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="自定义颜色"
        :label-width="secondLabelWidth"
        v-if="
          selectTargetData[0].option.series.lineStyle.color !== 'source' &&
          selectTargetData[0].option.series.lineStyle.color !== 'target'
        "
      >
        <sw-single-color-picker
          v-model="selectTargetData[0].option.series.lineStyle.customColor"
          field="pointColor"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="透明度" :label-width="secondLabelWidth">
        <SwSlider
          @change="update"
          v-model="selectTargetData[0].option.series.lineStyle.opacity"
          :min="0"
          :max="1"
          :step="0.1"
        />
      </el-form-item>
      <el-form-item label="曲度" :label-width="secondLabelWidth">
        <SwSlider
          @change="update"
          v-model="selectTargetData[0].option.series.lineStyle.curveness"
          :min="0"
          :max="1"
          :step="0.1"
        />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const sankeyLineColor = ref([
  { label: "与source相同", value: "source" },
  { label: "与target相同", value: "target" },
  { label: "自定义", value: "自定义" }
]);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
