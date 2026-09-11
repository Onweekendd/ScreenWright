<template>
  <span class="component-ref-chip">
    <span class="chip-at">@</span>
    <span class="chip-path">{{ namePath }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ namePath: string }>();
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.component-ref-chip {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 1px 2px 1px 4px;
  margin: 0 4px;
  border-radius: 4px;
  background: $color-lp-25;
  border: 1px solid $color-lp-70;
  color: $color-text-white;
  font-size: 12px;
  font-weight: 500;
  vertical-align: baseline;
  white-space: nowrap;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;

  .chip-at {
    color: $color-primary-done;
    flex-shrink: 0;
  }

  .chip-path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
