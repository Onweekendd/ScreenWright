<!-- 多数值标签配置 -->
<template>
  <div
    class="item-config-number"
    v-if="selectTargetData[0].option.seriesLabelShow && selectTargetData[0].option.seriesLabelShow.length > 0"
  >
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.seriesLabelShow[index]"
      :title="title"
      showIcon
    >
      <template #content>
        <configNumericalLabel v-bind="$attrs" :index="index" :labelWidth="labelWidth" :type="type" />
        <el-form-item label="背景" :label-width="labelWidth" v-if="isUpload">
          <SwUpload
            v-model="selectTargetData[0].option.defaultSeriesLabelBackground"
            @delete="update"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configNumericalLabel from "../../../components/configNumericalLabel/index.vue";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const labelWidth = ref("73");
interface Props {
  index: number;
  title: string;
  type?: "custom-text" | "custom-suffix" | "none";
  isUpload?: boolean;
}
withDefaults(defineProps<Props>(), {
  labelWidth: "73",
  type: "custom-text",
  isUpload: false
});
</script>
