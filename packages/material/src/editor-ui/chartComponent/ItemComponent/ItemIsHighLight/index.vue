<template>
  <div class="item-is-high-light">
    <el-form-item :label-width="labelWidth" :label="label">
      <el-checkbox v-model="selectTargetData[0].option.isHover" @change="update" />
    </el-form-item>
    <el-form-item label="柱体颜色" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.isHover">
      <sw-color-picker
        v-model:color="selectTargetData[0].option.hoverColor"
        v-model:opacity="selectTargetData[0].option.seriesOpacity"
        field="hoverColor"
        :options="{ colorTypeOption: 'linear-gradient,single' }"
        inputDisabled
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
withDefaults(
  defineProps<{
    labelWidth: string;
    label: string;
  }>(),
  {
    labelWidth: "100",
    label: "是否高亮"
  }
);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
