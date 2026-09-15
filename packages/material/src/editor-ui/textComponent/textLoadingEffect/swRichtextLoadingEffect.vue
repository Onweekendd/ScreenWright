<template>
  <div class="ft-richtext-loading-effect">
    <el-form-item label="效果类型">
      <el-select
        v-model="selectTargetData[0].option.textAnimationType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in richTextAniOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="效果速率">
      <sw-slider
        v-model="selectTargetData[0].option.textAnimationTiming"
        :min="0"
        :max="100"
        unit="ms"
        :disabled="!selectTargetData[0].option.textAnimationType"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="效果延迟">
      <sw-input-number
        v-model="selectTargetData[0].option.textAnimationDelay"
        unit="ms"
        :min="0"
        :controls="false"
        :disabled="!selectTargetData[0].option.textAnimationType"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../useUpdateInstance";
import { richTextAniOption } from "../textConfig/constants";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style scoped lang="scss">
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
