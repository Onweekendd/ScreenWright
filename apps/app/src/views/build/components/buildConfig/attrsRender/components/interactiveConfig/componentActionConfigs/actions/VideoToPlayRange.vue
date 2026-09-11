<template>
  <div>
    <el-form-item label="区间范围" :label-width="85">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model="action.videoStartTime"
          unit="s"
          :min="0"
          :controls="false"
          bottomLabel="开始时间"
          @change="update"
        />
        <sw-input-number
          v-model="action.videoEndTime"
          unit="s"
          :min="0"
          :controls="false"
          bottomLabel="结束时间"
          @change="update"
        />
        <el-tooltip class="item" effect="dark" placement="left">
          <i class="el-icon-question" style="font-size: 14px; margin: -10px 0 0 5px" />
          <template #content>
            <p>若结束时间为0或者小于开始时间，默认为视频总时间时长</p>
          </template>
        </el-tooltip>
      </div>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
</script>
