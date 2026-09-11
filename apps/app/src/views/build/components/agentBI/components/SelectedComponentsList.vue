<template>
  <div v-if="components.length > 0" class="selected-components-wrapper">
    <div class="selected-components">
      <div class="component-tags">
        <el-tooltip
          v-for="component in components.slice(0, 2)"
          :key="component.id"
          :content="`${component.id}: ${component.name}`"
          placement="top"
        >
          <div class="component-tag" @click="emit('tag-click', component)">
            <span class="tag-name">{{ component.name }}</span>
          </div>
        </el-tooltip>
        <el-tooltip v-if="components.length > 2" placement="top">
          <template #content>
            <div class="hidden-components-list">
              <div v-for="component in components.slice(2)" :key="component.id" class="hidden-component-item">
                <span class="component-name">{{ component.name }}</span>
                <span class="component-id">#{{ component.id }}</span>
              </div>
            </div>
          </template>
          <div class="more-tag">+{{ components.length - 2 }}</div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

withDefaults(
  defineProps<{
    components: ComponentType[];
  }>(),
  {
    components: () => []
  }
);

const emit = defineEmits<{
  "tag-click": [component: ComponentType];
}>();
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.selected-components-wrapper {
  margin-top: 8px;

  .selected-components {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    .component-tags {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;

      .component-tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 6px;
        border-radius: 4px;
        background: $color-lp-20;
        border: 1px solid $color-lp-40;
        cursor: pointer;
        transition: all $transition-base ease;
        white-space: nowrap;

        &:hover {
          background: $color-lp-30;
          border-color: $color-lp-60;
          transform: translateY(-1px);
        }

        .tag-name {
          color: $color-text-white;
          font-size: 11px;
          font-weight: 500;
          margin-right: 2px;
        }
      }

      .more-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 3px 6px;
        border-radius: 4px;
        background: $color-lp-15;
        border: 1px dashed $color-lp-40;
        color: rgba(255, 255, 255, 0.5);
        font-size: 10px;
        min-width: 28px;
        cursor: pointer;
        transition: all $transition-base ease;

        &:hover {
          background: $color-lp-25;
          border-color: $color-lp-60;
          transform: translateY(-1px);
        }
      }
    }

    :deep(.el-tooltip__trigger) {
      display: inline;
    }
  }
}

.hidden-components-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;

  .hidden-component-item {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;

    .component-name {
      color: $color-text-white;
      font-size: 12px;
      font-weight: 500;
    }

    .component-id {
      color: rgba(255, 255, 255, 0.6);
      font-size: 11px;
      font-family: $font-monospace;
    }
  }
}
</style>
