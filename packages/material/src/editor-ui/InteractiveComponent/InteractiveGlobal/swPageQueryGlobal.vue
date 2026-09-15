<template>
  <div class="ft-page-query-global">
    <ItemSelectAlign
      label="水平对齐"
      :type="typeAttrs.default"
      v-model="selectTargetData[0].option.textAlign"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <el-form-item label="尺寸" :label-width="firstLabelWidth">
      <div class="flex flex-justify-between">
        <SwInputNumber
          v-model="selectTargetData[0].option.boxWidth"
          bottomLabel="宽度"
          controls
          :min="0"
          @change="update"
        />
        <SwInputNumber
          v-model="selectTargetData[0].option.boxHeight"
          bottomLabel="高度"
          controls
          :min="0"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="圆角" :label-width="firstLabelWidth">
      <SwSlider v-model="selectTargetData[0].option.borderRadius" unit="%" @change="update" />
    </el-form-item>
    <el-form-item label="项间距" :label-width="firstLabelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.margin" :controls="true" @change="update" />
    </el-form-item>
    <el-form-item label="显示尾部跳转页" :label-width="firstLabelWidth">
      <el-switch v-model="selectTargetData[0].option.showJumper" class="ft-switch" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider as SwSlider } from "@screenwright/ui/slider";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
