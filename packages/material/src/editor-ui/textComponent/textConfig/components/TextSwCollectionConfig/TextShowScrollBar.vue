<template>
  <el-form-item label="滚动方向" v-if="selectTargetData[0].option.scroll">
    <el-select
      popper-class="sw-select-dropdown"
      v-model="selectTargetData[0].option.speedPosition"
      @change="update"
    >
      <el-option v-for="item in textDeraction" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { useUpdateInstance } from "../../../../useUpdateInstance";
import { textDeraction } from "../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
