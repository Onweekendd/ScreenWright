<template>
  <div class="config-pie-number">
    <el-form-item label="偏移距离" :labelWidth="labelWidth">
      <SwInputNumber
        @change="update"
        v-model="selectTargetData[0].option.seriesDistanceToLabelLine"
        :controls="false"
        unit="px"
      />
    </el-form-item>
    <el-form-item label="线长" :labelWidth="labelWidth">
      <SwInputNumber
        @change="update"
        v-model="selectTargetData[0].option.seriesLabelLineLength"
        :controls="false"
        unit="px"
      />
    </el-form-item>
    <el-form-item label="布局" :labelWidth="labelWidth" v-if="showSeriesLabelOrient">
      <SwRadio
        direction="row"
        :option="legendOrient"
        v-model="selectTargetData[0].option.seriesLabelOrient"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

const legendOrient = ref([
  { label: "水平", value: "horizontal" },
  { label: "垂直", value: "vertical" }
]);
const { selectTargetData, update } = useUpdateInstance();
interface Props {
  title?: string;
  showSeriesLabelOrient?: boolean;
}
withDefaults(defineProps<Props>(), {
  title: "条形样式",
  showSeriesLabelOrient: true
});
const labelWidth = ref("73");
</script>
