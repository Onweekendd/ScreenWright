<template>
  <el-form-item label="背景图" :label-width="firstLabelWidth">
    <SwUpload v-model="selectTargetData[0].option.backgroudImage" @change="update" @delete="update" />
  </el-form-item>
</template>

<script setup lang="ts">
import SwUpload from "@editor/base/SwUpload/index.vue";
import { useUpdateInstance } from "@editor/useUpdateInstance";

import { firstLabelWidth } from "../../../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>
