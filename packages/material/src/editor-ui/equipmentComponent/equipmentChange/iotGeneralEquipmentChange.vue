<template>
  <div class="iot-general-equipment-change">
    <el-form-item label="X旋转" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number class="flex-1-0-auto" v-model="selectTargetData[0].option.rotateX" @change="update" controls />
      </div>
    </el-form-item>
    <el-form-item label="Y旋转" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number class="flex-1-0-auto" v-model="selectTargetData[0].option.rotateY" @change="update" controls />
      </div>
    </el-form-item>
    <el-form-item label="Z旋转" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number class="flex-1-0-auto" v-model="selectTargetData[0].option.rotateZ" @change="update" controls />
      </div>
    </el-form-item>
    <el-form-item label="X倾斜" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number class="flex-1-0-auto" v-model="selectTargetData[0].option.skewX" @change="update" controls />
      </div>
    </el-form-item>
    <el-form-item label="Y倾斜" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number class="flex-1-0-auto" v-model="selectTargetData[0].option.skewY" @change="update" controls />
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
