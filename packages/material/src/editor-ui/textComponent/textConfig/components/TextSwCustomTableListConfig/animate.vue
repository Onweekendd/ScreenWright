<template>
  <sw-collapse-item title="动画" v-if="selectTargetData[0].option.globalConfig">
    <template #content>
      <el-form-item label="开启滚动" label-width="73">
        <el-switch class="ft-switch" v-model="selectTargetData[0].option.globalConfig.globalScroll" @change="update" />
      </el-form-item>
      <template v-if="selectTargetData[0].option.globalConfig.globalScroll">
        <el-form-item label="动画时长">
          <sw-input-number
            v-model.number="selectTargetData[0].option.globalConfig.globalScrollTime"
            unit="s"
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

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
