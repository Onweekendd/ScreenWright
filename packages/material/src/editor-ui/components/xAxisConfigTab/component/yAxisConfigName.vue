<!-- y轴单位 -->
<!-- y轴数值范围 -->
<template>
  <el-form-item label="内容2" :label-width="labelWidth">
    <SwInput v-model="axisName" @input="update" />
  </el-form-item>

  <el-form-item label="文本样式" :label-width="labelWidth">
    <configTextStyle v-model="input" @change="handleConfigTextChange" />
  </el-form-item>
  <el-form-item label="边距" :label-width="labelWidth">
    <div class="flex flex-justify-between" style="width: 100%">
      <template v-if="isShowNumberSlider">
        <SwSlider v-model="selectTargetData[0].option.xAxisNameGap" :min="-50" :max="50" />
      </template>
      <template v-else>
        <SwInputNumber width="40" v-model="axisNamePaddingTop" bottom-label="上" @change="update" />
        <SwInputNumber width="40" v-model="axisNamePaddingBottom" bottom-label="下" @change="update" />
        <SwInputNumber width="40" v-model="axisNamePaddingLeft" bottom-label="左" @change="update" />
        <SwInputNumber width="40" v-model="axisNamePaddingRight" bottom-label="右" @change="update" />
      </template>
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../../useUpdateInstance";
import configTextStyle from "../../configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../configTextStyle/useTextStyleAttrs";
import { useAttrsByReverse } from "../useAttrsByReverse";
import { textStyleNameByType } from "../utils";

interface Props {
  isShowNumberSlider?: boolean;
}
withDefaults(defineProps<Props>(), {
  isShowNumberSlider: true
});
const { type, axisName, axisNamePaddingTop, axisNamePaddingBottom, axisNamePaddingLeft, axisNamePaddingRight } =
  useAttrsByReverse();
const { update, selectTargetData } = useUpdateInstance();
const labelWidth = ref("73");
const { input, handleConfigTextChange } = useFontStyleAttrs(textStyleNameByType(type.value));
</script>
