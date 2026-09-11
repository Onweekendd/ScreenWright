<template>
  <el-form-item label="尺寸类型" prop="backgroudSize" :label-width="firstLabelWidth">
    <el-select
      popper-class="sw-select-dropdown"
      v-model="selectTargetData[0].option.backgroudSize"
      @change="update"
    >
      <el-option v-for="item in backgroundSizeType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>
<script lang="ts" setup>
import { useUpdateInstance } from "@editor/useUpdateInstance";

import { firstLabelWidth } from "../../../../constants";
import { backgroundSizeType } from "../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
