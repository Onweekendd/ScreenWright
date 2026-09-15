<template>
  <div class="image-item-container">
    <el-form-item label="层级" :label-width="secondLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.column[index].seriesYZIndex"
        :controls="false"
        :min="1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="图片尺寸" :label-width="secondLabelWidth">
      <div class="input-wrap flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetWidth"
          unit="px"
          bottomLabel="宽度"
          :controls="false"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetHeight"
          unit="px"
          bottomLabel="高度"
          :controls="false"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <el-form-item label="图片位置" :label-width="secondLabelWidth">
      <div class="input-wrap flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.column[index].seriesYOffsetY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <el-form-item label="默认图片" :label-width="secondLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.column[index].icon"
        :multiple="false"
        :showFileList="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
    <seriesYIsMapping :index="index" />
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { secondLabelWidth } from "../../../textConfig";
import seriesYIsMapping from "./seriesYIsMapping.vue";

const { update, selectTargetData } = useUpdateInstance();
defineProps<{
  index: number;
}>();
</script>

<style lang="scss" scoped>
.image-item-container {
  width: 100%;
  .input-wrap {
    width: 100%;
  }
}
</style>
