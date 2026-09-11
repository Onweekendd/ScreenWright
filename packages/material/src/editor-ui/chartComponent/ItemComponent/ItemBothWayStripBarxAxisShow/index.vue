<template>
  <el-form-item label="启用" :label-width="firstLabelWidth">
    <el-checkbox v-model="show" @change="handleChange" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import type { CheckboxValueType } from "element-plus";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const props = defineProps<{ type: string }>();
const show = ref(false);

const { selectTargetData, update } = useUpdateInstance();

const handleChange = (value: CheckboxValueType) => {
  if (props.type == "Y") {
    selectTargetData.value[0].option.yAxisShow = Boolean(value);
  } else {
    selectTargetData.value[0].option.xAxisShow[props.type == "X_L" ? 0 : 1] = Boolean(value);
  }
  update();
};
watch(
  () => props.type,
  (val) => {
    if (val == "Y") {
      show.value = selectTargetData.value[0].option.yAxisShow;
    } else {
      show.value = selectTargetData.value[0].option.xAxisShow[props.type == "X_L" ? 0 : 1];
    }
  },
  {
    immediate: true
  }
);
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
