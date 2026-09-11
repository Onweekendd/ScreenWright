<template>
  <el-form-item label="字体" label-width="73">
    <el-select v-model="selectTargetData[0].option.fontFamily" @change="update" popper-class="sw-select-dropdown">
      <el-option v-for="item in fontFamily" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>
<script setup lang="ts">
import { fontFamily } from "@editor/fontFamily";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
