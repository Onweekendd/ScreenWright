<!-- 终端交互配置 -->
<template>
  <div class="config-encode-control">
    <el-form-item label="终端指令链接" label-width="85px">
      <el-input type="textarea" v-model="controlWebsocketUrl" :rows="3" resize="none" readonly />
    </el-form-item>

    <el-form-item label-width="85px">
      <template #label>
        <span
          >心跳
          <el-tooltip class="item" effect="dark" placement="left">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">设置心跳检测时间间隔，定时检查是否掉线并重连；默认为0不检测</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <SwInputNumber width="220" v-model="heartbeatInterval" unit="s" :min="0" @change="changeHeartbeatInterval" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import Icon from "@/components/Icon/index.vue";

import type { configEncodeControlProps } from "./configEncodeControl";
import { configEncodeControlEmits } from "./configEncodeControl";
import { useConfigEncodeControl } from "./useConfigEncodeControl";

const props = defineProps<configEncodeControlProps>();
const emit = defineEmits(configEncodeControlEmits);
const { controlWebsocketUrl, heartbeatInterval, changeHeartbeatInterval } = useConfigEncodeControl(props, emit);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.config-encode-control {
  :deep(.el-textarea) {
    --el-border-color-hover: var(--sw-theme-color);
  }

  :deep(.el-textarea) {
    .el-textarea__inner {
      background-color: transparent !important;
      --el-input-border-color: #333543;
      cursor: not-allowed;
      --el-input-focus-border-color: var(--el-border-color-hover);
    }
  }
}
</style>
