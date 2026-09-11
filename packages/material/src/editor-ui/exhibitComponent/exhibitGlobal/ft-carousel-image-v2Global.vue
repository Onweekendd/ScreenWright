<template>
  <div class="ft-carousel-image-v2-global">
    <div class="flex flex-justify-between" style="width: 80%">
      <el-form-item label="自动轮播" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
      </el-form-item>
      <el-form-item label="循环播放">
        <el-checkbox v-model="selectTargetData[0].option.loop" @change="update" />
      </el-form-item>
    </div>
    <el-form-item label="轮播间隔" :label-width="firstLabelWidth">
      <sw-input-number
        :label-width="firstLabelWidth"
        v-model="selectTargetData[0].option.delay"
        :controls="false"
        unit="s"
      />
    </el-form-item>
    <el-form-item label="动效类型" :label-width="firstLabelWidth">
      <el-checkbox-group v-model="selectTargetData[0].option.effects" @change="update">
        <el-checkbox label="ws_blinds">百叶窗</el-checkbox>
        <el-checkbox label="ws_seven">七巧板</el-checkbox>
        <el-checkbox label="ws_cube">立方体</el-checkbox>
        <el-checkbox label="ws_brick">小方块</el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="动效时长" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.duration" :controls="false" unit="s" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
:deep(.el-checkbox__label) {
  color: #bfbfbf !important;
}
</style>
