<template>
  <div class="ft-signature-pad-control">
    <el-form-item label="显示画笔颜色" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.configControls.penColor" @change="update" />
    </el-form-item>

    <el-form-item label="显示背景颜色" :label-width="firstLabelWidth">
      <el-switch
        class="ft-switch"
        v-model="selectTargetData[0].option.configControls.backgroundColor"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="显示线条宽度" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.configControls.lineWidth" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
