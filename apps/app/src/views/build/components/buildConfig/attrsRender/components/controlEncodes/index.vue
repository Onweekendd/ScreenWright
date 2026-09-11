<template>
  <div class="control-encodes">
    <el-form-item label="控制编码" :label-width="'90px'">
      <template #label>
        <span
          >控制编码
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>控制编码是提供给第三方对接消息发送指令使用</p>
            </template>
          </el-tooltip>
        </span>
      </template>

      <!-- 输入区域 -->
      <el-input v-model="codeValue" class="control-encodes__input" @change="handleCodeChange" />
    </el-form-item>
    <!-- 标题区域 -->
  </div>
</template>

<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

import { useControlEncodes } from "./useControlEncodes";

// 使用业务逻辑 hooks
const { codeValue, handleCodeChange } = useControlEncodes();
</script>

<style lang="scss" scoped>
.control-encodes {
  :deep(.el-form-item__label) {
    color: white !important;
  }

  &__input {
    width: 100%;

    height: 28px;
    line-height: 28px;

    background-color: rgba(24, 27, 36, 0.8) !important;
    border: 1px solid #393b4a !important;
    border-radius: 4px !important;
    color: #b4b7c1;

    :deep(.el-input__wrapper) {
      background-color: rgba(24, 27, 36, 0.8) !important;
      box-shadow: none !important;
    }

    :deep(.el-input__inner) {
      color: #f3f4f6;
      font-size: 12px;
      line-height: 1.4;

      &::placeholder {
        color: #9ca3af;
        font-size: 12px;
      }
    }
  }
}
</style>
