<!-- 数据路线组件 -->
<template>
  <SwCollapseItem title="数据路线" open>
    <template #content>
      <el-form-item label="宽度基数" :label-width="secondLabelWidth">
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.seriesLinksLineWidth"
          :controls="false"
          :min="0"
          width="100%"
        />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
