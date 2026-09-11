<template>
  <div class="confirm-part">
    <div class="confirm-header">
      <span class="confirm-title">需要确认</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="confirm-message">{{ message }}</div>
    <div class="confirm-actions">
      <button class="action-btn reject-btn" @click="$emit('reject')">拒绝</button>
      <button class="action-btn accept-btn" @click="$emit('accept')">接受</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
defineEmits<{ accept: []; reject: []; close: [] }>();
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.confirm-part {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  background: $color-bg-dropdown;
  border: 1px solid $color-primary-50;
  border-radius: 10px;
  overflow: hidden;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid $color-primary-20;
}

.confirm-title {
  font-size: 12px;
  font-weight: 500;
  color: $color-primary-name;
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

.confirm-message {
  padding: 0 16px;
  font-size: 13px;
  color: $color-text-msg;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 16px 14px;
}

.action-btn {
  padding: 7px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity $transition-fast;

  &:hover {
    opacity: 0.85;
  }
}

.reject-btn {
  background: $color-primary-18;
  color: $color-text-dim;
  border: 1px solid $color-primary-25;
}

.accept-btn {
  background: $color-primary;
  color: $color-text-white;
}
</style>
