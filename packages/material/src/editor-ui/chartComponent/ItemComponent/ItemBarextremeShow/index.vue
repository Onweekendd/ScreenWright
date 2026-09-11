<template>
  <sw-collapse-item title="极值高亮" v-model="selectTargetData[0].option.extremeShow[currentIndex]" showIcon>
    <template #content>
      <el-form-item label="极值" :label-width="thirdLabelWidth">
        <el-select
          v-model="selectTargetData[0].option.extremeType[currentIndex]"
          popper-class="sw-select-dropdown"
          @change="update"
        >
          <el-option v-for="item in extremeType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="颜色" :label-width="thirdLabelWidth">
        <sw-color-picker
          :key="selectTargetData[0].option.extremeColor[currentIndex]"
          v-model:color="selectTargetData[0].option.extremeColor[currentIndex]"
          v-model:opacity="selectTargetData[0].option.extremeOpacity[currentIndex]"
          @change="update"
          :options="{ colorTypeOption: 'linear-gradient,single' }"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";

import { thirdLabelWidth } from "../../../constants";
import { extremeType } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
defineProps<{
  currentIndex: number;
}>();
</script>

<style scoped lang="scss">
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
