<template>
  <div class="ftPeriodictableGlobal">
    <el-form-item label="图片列表" :label-width="firstLabelWidth">
      <ftPeriodictableUpload v-model="selectTargetData[0].option.images" @change="update" />
    </el-form-item>

    <el-form-item label="偏移" :label-width="firstLabelWidth">
      <div class="flex flex-justify-between fullWidth">
        <sw-input-number
          v-model="selectTargetData[0].option.offsetX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          width="90"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.offsetY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          width="90"
          @change="update"
        />
      </div>
    </el-form-item>

    <el-form-item label="行数" :label-width="firstLabelWidth">
      <sw-input-number @change="update" controls v-model="selectTargetData[0].option.rows" :min="1" />
    </el-form-item>

    <el-form-item label="图片尺寸" :label-width="firstLabelWidth">
      <div class="flex flex-center-between fullWidth">
        <sw-input-number
          v-model="selectTargetData[0].option.imageWidth"
          bottomLabel="宽度"
          :min="0"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.imageHeight"
          bottomLabel="高度"
          :min="0"
          width="90"
          @change="update"
        />
      </div>
    </el-form-item>

    <el-form-item label="间距" :label-width="firstLabelWidth">
      <div class="flex flex-center-between fullWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rowSpace"
          bottomLabel="行"
          @change="update"
          :min="0"
          width="90"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.columnSpace"
          bottomLabel="列"
          width="90"
          :min="0"
          @change="update"
        />
      </div>
    </el-form-item>

    <el-form-item label="动画时间" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.duration" unit="ms" :min="0" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
// import SwUpload from "@editor/base/SwUpload/index.vue"
import { SwInputNumber } from "@screenwright/ui/input-number";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ftPeriodictableUpload from "../component/ftPeriodictableUpload.vue";

// import Icon from "@editor/base/Icon/index.vue"
const { selectTargetData, update } = useUpdateInstance();
</script>
