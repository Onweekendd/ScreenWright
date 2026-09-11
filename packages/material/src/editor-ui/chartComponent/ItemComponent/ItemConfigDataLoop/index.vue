<template>
  <SwCollapseItem @change="update" v-model="selectTargetData[0].option.dataLoop" title="轮播动画" showIcon>
    <template #content>
      <el-form-item label="间隔时长" :labelWidth="secondLabelWidth">
        <SwInputNumber
          v-model="selectTargetData[0].option.dataLoopInterval"
          :controls="false"
          unit="s"
          width="100%"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="显示个数" :labelWidth="secondLabelWidth">
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.dataLoopDisplayRows"
          controls
          width="100%"
        />
      </el-form-item>
      <el-form-item label="轮播个数" :labelWidth="secondLabelWidth">
        <SwInputNumber @change="update" v-model="selectTargetData[0].option.dataLoopRollNum" controls width="100%" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
