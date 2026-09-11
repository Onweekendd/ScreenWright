<template>
  <div class="config-axis-label" v-if="selectTargetData[0].option">
    <SwCollapseItem title="轴标签" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="labelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="宽度" :label-width="labelWidth" v-if="showLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.nameWidth" :max="200" @change="update" />
        </el-form-item>
        <el-form-item label="左边距" :label-width="labelWidth">
          <sw-slider v-model="selectTargetData[0].option.nameLeftPadding" :max="1000" :min="-1000" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSlider } from "@screenwright/ui/slider";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";

interface Props {
  labelWidth?: string;
  showLabelWidth?: boolean;
}

withDefaults(defineProps<Props>(), {
  labelWidth: "73",
  showLabelWidth: true
});

const { selectTargetData, update } = useUpdateInstance();

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "nameFontFamily",
  fontStyle: "nameFontStyle",
  fontWeight: "nameFontWeight",
  fontSize: "nameFontSize",
  color: "nameColor"
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
