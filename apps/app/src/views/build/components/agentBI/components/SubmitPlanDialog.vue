<template>
  <div class="submit-plan-dialog">
    <div class="dialog-header">
      <span class="dialog-title">计划审批</span>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <div class="dialog-summary">{{ summary }}</div>

    <div class="dialog-plan">
      <MarkdownContent :content="plan" />
    </div>

    <div class="dialog-footer">
      <div class="approve-actions">
        <button class="action-btn btn-auto" @click="emit('select', { action: 'auto_edit' })">自动编辑</button>
        <button class="action-btn btn-ask" @click="emit('select', { action: 'ask_before_edit' })">修改前询问</button>
        <button class="action-btn btn-keep" @click="emit('select', { action: 'keep_plan' })">保持计划模式</button>
      </div>
      <button class="action-btn btn-reject" @click="handleReject">拒绝</button>
      <textarea v-model="feedbackText" class="feedback-textarea" placeholder="请输入拒绝意见（可选）..." rows="2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { SubmitPlanAction } from "../hooks/useConfirm";
import MarkdownContent from "./MarkdownContent.vue";

defineProps<{ summary: string; plan: string }>();
const emit = defineEmits<{ select: [result: SubmitPlanAction]; close: [] }>();

const feedbackText = ref("");

const handleReject = () => {
  emit("select", { action: "reject", feedback: feedbackText.value });
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.submit-plan-dialog {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: $color-bg-dropdown;
  border: 1px solid $color-primary-50;
  border-radius: 10px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid $color-primary-20;
  flex-shrink: 0;
}

.dialog-title {
  font-size: 13px;
  font-weight: 600;
  color: $color-primary-name;
  letter-spacing: 0.4px;
}

.close-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: $color-text-dim;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition:
    color $transition-fast,
    background $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-primary-18;
  }
}

.dialog-summary {
  padding: 8px 14px 6px;
  font-size: 12px;
  color: $color-text-secondary;
  border-bottom: 1px solid $color-primary-20;
  flex-shrink: 0;
  line-height: 1.5;
}

.dialog-plan {
  padding: 10px 14px;
  max-height: 40vh;
  overflow-y: auto;
  font-size: 13px;
  color: $color-text-msg;
  border-bottom: 1px solid $color-primary-20;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-primary-25;
    border-radius: 2px;

    &:hover {
      background: $color-primary-40;
    }
  }
}

.dialog-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  flex-shrink: 0;
}

.approve-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity $transition-fast;
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }
}

.btn-auto {
  background: $color-primary;
  color: $color-text-white;
}

.btn-ask {
  background: $color-primary-35;
  color: $color-primary-name;
  border: 1px solid $color-primary-50;
}

.btn-keep {
  background: $color-primary-18;
  color: $color-text-secondary;
  border: 1px solid $color-primary-25;
}

.btn-reject {
  align-self: flex-start;
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.feedback-textarea {
  width: 100%;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $color-primary-25;
  border-radius: 6px;
  color: $color-text-primary;
  font-size: 12px;
  font-family: $font-family-panel;
  line-height: 1.5;
  resize: none;
  box-sizing: border-box;
  transition: border-color $transition-fast;

  &::placeholder {
    color: $color-text-dim;
  }

  &:focus {
    outline: none;
    border-color: $color-primary-50;
  }
}
</style>
