<template>
  <div class="config-numerical-label" v-if="selectTargetData[0].option">
    <SwCollapseItem title="数值标签" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="labelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="labelWidth">
          <div class="legend-size-wrapper flex flex-justify-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.valueOffSetX"
              :controls="false"
              unit="px"
              bottom-label="X"
              width="100"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.valueOffSetY"
              :controls="false"
              unit="px"
              bottom-label="Y"
              width="100"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";

interface Props {
  labelWidth?: string;
}

withDefaults(defineProps<Props>(), {
  labelWidth: "73"
});

const { selectTargetData, update } = useUpdateInstance();

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "valueFontFamily",
  fontStyle: "valueFontStyle",
  fontWeight: "valueFontWeight",
  fontSize: "valueFontSize",
  color: "valueColor"
});
</script>

<style lang="scss" scoped>
.legend-size-wrapper {
  width: 100%;
  .custom-icon {
    position: relative;
    top: 2px;
  }
}
</style>
