<template>
  <div class="full-screen-switch-global">
    <SwCollapseItem title="基础配置" open>
      <template #content>
        <el-form-item label="点击前" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.unFullScreenImg"
            :multiple="false"
            :showFileList="false"
            :showDel="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="点击后" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.fullScreenImg"
            :multiple="false"
            :showFileList="false"
            :showDel="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { secondLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
</script>
