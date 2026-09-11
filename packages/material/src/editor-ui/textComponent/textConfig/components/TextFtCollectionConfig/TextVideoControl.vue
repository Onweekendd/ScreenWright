<template>
  <SwCollapseItem title="视频控制" open>
    <template #content>
      <div class="flex flex-wrap">
        <el-form-item label="控制条" :label-width="labelWidth">
          <el-checkbox v-model="selectTargetData[0].option.controls" @change="update" />
        </el-form-item>
        <el-form-item label="自动播放" :label-width="labelWidth">
          <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
        </el-form-item>
        <el-form-item label="循环播放" :label-width="labelWidth">
          <el-checkbox v-model="selectTargetData[0].option.loopPlay" @change="update" />
        </el-form-item>
        <el-form-item label="静音" :label-width="labelWidth">
          <el-checkbox v-model="selectTargetData[0].option.muted" @change="update" />
        </el-form-item>
      </div>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const labelWidth = ref(73);
</script>
<style lang="scss" scoped>
</style>
