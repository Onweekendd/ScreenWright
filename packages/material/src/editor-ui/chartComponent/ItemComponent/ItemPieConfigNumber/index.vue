<!-- 饼图数值标签配置 -->
<template>
  <SwCollapseItem
    @change="update"
    v-model="selectTargetData[0].option.seriesLabelShow"
    title="数值标签"
    :showIcon="showIcon"
    :open="!showIcon"
  >
    <template #content>
      <configPieNumber :showSeriesLabelOrient="showSeriesLabelOrient" v-if="showConfigPieNumber" />
      <el-form-item label="间距" v-if="showSeriesLabelValueBottomPadding" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.seriesLabelValueBottomPadding"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <SwCollapseItem title="类目" @change="update" v-model="selectTargetData[0].option.seriesLabelSeriesShow" showIcon>
        <template #content>
          <el-form-item label="文本样式" label-width="45">
            <configTextStyle v-model="input" @change="handleConfigTextChange" />
          </el-form-item>
        </template>
      </SwCollapseItem>

      <SwCollapseItem
        @change="update"
        title="占比值"
        v-model="selectTargetData[0].option.seriesLabelPercentShow"
        showIcon
      >
        <template #content>
          <el-form-item label="小数位数" label-width="45">
            <SwInputNumber controls @change="update" v-model="selectTargetData[0].option.seriesLabelPercentValue" />
          </el-form-item>
          <!-- 占比值的文本样式 -->
          <percentConfigText />
        </template>
      </SwCollapseItem>
      <!-- 真实值配置 -->
      <pieRealConfig :showSeriesLabelValueLeftPadding="showSeriesLabelValueLeftPadding" />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import configPieNumber from "../../../components/configPieNumber/index.vue";
import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import percentConfigText from "./percentConfigText.vue";
import pieRealConfig from "./pieRealConfig.vue";

// import ItemPieConfigReal from "../ItemPieConfigReal/index.vue"
// import realConfigText from "../ItemPieConfigReal/realConfigText.vue"
// import suffixConfig from "../ItemPieConfigReal/suffixConfig.vue"
// import { ref } from "vue"
const { selectTargetData, update } = useUpdateInstance();
interface Props {
  title?: string;
  showSeriesLabelOrient?: boolean;
  showConfigPieNumber?: boolean;
  showSeriesLabelValueBottomPadding?: boolean;
  showSeriesLabelValueLeftPadding?: boolean;
  showIcon?: boolean;
}
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelSeriesFontFamily",
  fontStyle: "seriesLabelSeriesFontStyle",
  fontWeight: "seriesLabelSeriesFontWeight",
  fontSize: "seriesLabelSeriesFontSize",
  color: "seriesLabelSeriesColor"
});
withDefaults(defineProps<Props>(), {
  title: "条形样式",
  showSeriesLabelOrient: true,
  showConfigPieNumber: true,
  showSeriesLabelValueBottomPadding: false,
  showSeriesLabelValueLeftPadding: true,
  showIcon: true
});
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
