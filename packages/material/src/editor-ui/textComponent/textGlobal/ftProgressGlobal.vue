<template>
  <div class="ft-progress-global">
    <el-form-item label="行数" label-width="100">
      <sw-input-number v-model.number="selectTargetData[0].option.count" @change="update" />
    </el-form-item>
    <el-form-item label="行间距" label-width="100">
      <sw-input-number
        v-model.number="selectTargetData[0].option.lineMarginBottom"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <sw-collapse-item title="动画" showIcon v-model="selectTargetData[0].option.animationShow" @change="update">
      <template #content>
        <el-form-item label="开启滚动" label-width="73">
          <el-switch class="ft-switch" v-model="selectTargetData[0].option.scroll" @change="update" />
        </el-form-item>
        <template v-if="selectTargetData[0].option.scroll">
          <el-form-item label="滚动间隔" label-width="73">
            <sw-input-number
              v-model.number="selectTargetData[0].option.scrollTime"
              unit="s"
              :min="2"
              :controls="false"
              @change="update"
            />
          </el-form-item>
        </template>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
