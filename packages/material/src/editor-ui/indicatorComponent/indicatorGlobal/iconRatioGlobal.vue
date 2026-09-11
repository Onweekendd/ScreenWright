<template>
  <div class="icon-ratio-global" v-if="selectTargetData[0].option.globalConfig">
    <SwCollapseItem open title="数字">
      <template #content>
        <el-form-item label="保留小数" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.globalConfig.decimalPlace" controls />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              width="100"
              v-model="selectTargetData[0].option.globalConfig.positionX"
              unit="px"
              bottomLabel="X"
              @change="update"
            />
            <sw-input-number
              width="100"
              v-model="selectTargetData[0].option.globalConfig.positionY"
              unit="px"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem open title="网格布局">
      <template #content>
        <el-form-item label="行数" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.globalConfig.rowNum" controls :min="0" />
        </el-form-item>
        <el-form-item label="列数" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.globalConfig.colNum" controls :min="0" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
