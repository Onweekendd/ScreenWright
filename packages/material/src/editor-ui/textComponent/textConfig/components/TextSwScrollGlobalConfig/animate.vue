<template>
  <sw-collapse-item title="动画" v-model="selectTargetData[0].option.animationShow" @change="update" showIcon>
    <template #content>
      <el-form-item label="开启滚动" :label-width="secondLabelWidth">
        <el-switch class="ft-switch" v-model="selectTargetData[0].option.scroll" @change="update" />
      </el-form-item>
      <template v-if="selectTargetData[0].option.scroll">
        <el-form-item label="单行时长优先" :label-width="63" title="单行时长优先">
          <el-checkbox style="margin-left: 10px" v-model="selectTargetData[0].option.scrollTimeType" @change="update" />
        </el-form-item>
      </template>
      <template v-if="selectTargetData[0].option.scroll">
        <el-form-item
          label="总滚动时长"
          v-if="!selectTargetData[0].option.scrollTimeType"
          :label-width="secondLabelWidth"
        >
          <sw-input-number
            v-model.number="selectTargetData[0].option.scrollTime"
            unit="s"
            :min="1"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="行滚动时长" v-else :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.scrollSingleTime"
            unit="s"
            :min="1"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { secondLabelWidth } from "../../../../constants";
import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
