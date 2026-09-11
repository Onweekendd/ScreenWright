<!-- 柱状样式组件 -->
<template>
  <SwCollapseItem title="柱状样式" open>
    <template #content>
      <el-form-item label="柱体宽度" :label-width="73">
        <SwSlider :max="40" :min="1" v-model="selectTargetData[0].option.seriesWidth" @change="update" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
