<template>
  <div class="panel-header">
    <div class="panel-header-title">
      <div class="title-content">
        <span v-if="!isEditing" :key="animationKey" class="title-text">
          <span
            v-for="(char, index) in titleChars"
            :key="index"
            class="title-char"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            {{ char }}
          </span>
          <el-icon v-if="generating" class="title-loading"><Loading /></el-icon>
        </span>
        <input
          v-else
          ref="inputRef"
          v-model="editingText"
          class="title-input"
          @keydown.enter="confirm"
          @keydown.escape="cancel"
          @blur="confirm"
        />
        <Icon
          v-if="!isEditing && !isNew && !generating"
          type="iconfont-bianji"
          style="font-size: 15px"
          class="edit-icon"
          @click="startEdit"
        />
      </div>
    </div>
    <div class="panel-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import { Loading } from "@element-plus/icons-vue";

import Icon from "@/components/Icon/index.vue";

const props = defineProps<{
  title: string;
  generating?: boolean;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  "update:title": [value: string];
}>();

const animationKey = ref(0);
watch(
  () => props.title,
  () => animationKey.value++
);

const titleChars = computed(() => props.title.split(""));

const isEditing = ref(false);
const editingText = ref("");
const inputRef = ref<HTMLInputElement>();

const startEdit = async () => {
  if (props.isNew) return;
  editingText.value = props.title;
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
};

const confirm = () => {
  const trimmed = editingText.value.trim();
  if (!trimmed || trimmed === props.title) {
    isEditing.value = false;
    return;
  }
  emit("update:title", trimmed);
  isEditing.value = false;
};

const cancel = () => {
  isEditing.value = false;
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;

  .panel-header-title {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .title-content {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;

      &:hover .edit-icon {
        opacity: 1;
      }
    }

    .title-text {
      margin-left: 5px;
      font-size: 14px;
      font-weight: 500;
      font-family: $font-family-panel;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-flex;
      align-items: center;
      transition: border-color $transition-fast;
    }

    .title-char {
      color: $color-text-primary;
      display: inline-block;
    }

    .title-loading {
      margin-left: 6px;
      font-size: 14px;
      color: $color-text-secondary;
      animation: title-spin 1s linear infinite;
    }

    @keyframes title-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .title-input {
      flex: 1;
      min-width: 100px;
      max-width: 300px;
      padding: 4px 6px;
      font-size: 14px;
      font-weight: 500;
      font-family: $font-family-panel;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid $color-text-primary;
      border-radius: 4px;
      color: $color-text-primary;
      outline: none;

      &:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: $color-primary-80;
      }
    }

    .edit-icon {
      font-size: 14px;
      cursor: pointer;
      color: $color-text-secondary;
      opacity: 0;
      transition:
        opacity $transition-fast,
        color $transition-fast;

      &:hover {
        color: $color-text-primary;
      }
    }
  }

  .panel-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
