<template>
  <SwCollapseItem @change="update" title="类目" show-icon v-model="selectTargetData[0].option.legendSeriesShow">
    <template #content>
      <el-form-item label="宽度" label-width="43">
        <SwRadio
          class="config-padding"
          direction="row"
          :option="legendSeriesWidthOption"
          v-model="selectTargetData[0].option.legendSeriesWidthType"
          @change="update"
        />
      </el-form-item>
      <template v-if="selectTargetData[0].option.legendSeriesWidthType === 'custom'">
        <el-form-item label="" label-width="43">
          <SwInputNumber v-model="selectTargetData[0].option.legendSeriesWidth" @change="update" />
        </el-form-item>
      </template>
      <el-form-item label="文本样式" label-width="43">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "legendSeriesFontFamily",
  fontStyle: "legendSeriesFontStyle",
  fontWeight: "legendSeriesFontWeight",
  fontSize: "legendSeriesFontSize",
  color: "legendSeriesColor"
});
const legendSeriesWidthOption = ref([
  { label: "自适应", value: "auto" },
  { label: "自定义", value: "custom" }
]);
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
