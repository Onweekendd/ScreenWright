<script setup lang="ts">
defineProps<{
  label: string;
  variant: "active" | "noaction";
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button :class="['template-tabitem', variant]" @click="$emit('click')">
    <div class="tabitem-image">
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <rect width="32" height="24" rx="3" :fill="variant === 'active' ? '#4F46E5' : '#E5E7EB'" />
        <rect x="4" y="8" width="24" height="2" rx="1" :fill="variant === 'active' ? '#fff' : '#9CA3AF'" />
        <rect x="4" y="13" width="16" height="2" rx="1" :fill="variant === 'active' ? '#C7D2FE' : '#D1D5DB'" />
      </svg>
    </div>
    <span class="tabitem-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.template-tabitem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1.5px solid transparent;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: all 0.15s;
  flex: 1;
}

.template-tabitem.active {
  border-color: #4F46E5;
  background: #EEF2FF;
}

.template-tabitem.noaction {
  border-color: #E5E7EB;
  background: #F9FAFB;
}

.template-tabitem.noaction:hover {
  border-color: #C7D2FE;
  background: #F5F3FF;
}

.tabitem-label {
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
}

.template-tabitem.active .tabitem-label {
  color: #4338CA;
  font-weight: 600;
}
</style>
