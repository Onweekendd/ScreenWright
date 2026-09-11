<template>
  <div class="ftdynamicratio-global">
    <el-form-item label="阈值" :label-width="firstLabelWidth">
      <sw-input-number v-model.number="selectTargetData[0].option.thresholdValue" @change="update" :controls="false" />
    </el-form-item>
    <ItemSelectAlign
      label="水平对齐"
      :type="typeAttrs.flex"
      v-model="selectTargetData[0].option.textAlign"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <ItemSelectAlign
      label="垂直对齐"
      v-model="selectTargetData[0].option.textAlignVertical"
      :type="typeAttrs.vertical"
      @change="update"
      :label-width="firstLabelWidth"
    />
  </div>
</template>
<script setup lang="ts">
// import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
