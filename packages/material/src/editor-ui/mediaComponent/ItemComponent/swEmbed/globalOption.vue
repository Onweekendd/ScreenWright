<template>
  <div class="global-option">
    <div class="flex flex-wrap">
      <el-form-item style="margin-right: 30px" label="控制条" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.controler" @change="update" />
      </el-form-item>
      <el-form-item label="自动播放" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
      </el-form-item>
      <el-form-item label="循环播放" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.loopPlay" @change="update" />
      </el-form-item>
    </div>

    <el-form-item label="音频" :label-width="firstLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.url"
        :selectAssets="false"
        :fileType="FileType.audio"
        :multiple="false"
        :showFileList="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
