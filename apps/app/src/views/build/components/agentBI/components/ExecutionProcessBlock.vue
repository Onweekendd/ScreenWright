<template>
  <section class="execution-process" :class="{ 'is-running': running }">
    <button type="button" class="execution-process__toggle" :aria-expanded="expanded" @click="$emit('toggle')">
      <svg
        class="execution-process__chevron"
        :class="{ 'is-open': expanded }"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m4.5 2.5 3.5 3.5-3.5 3.5"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ toolCount ? "执行过程" : "思考过程" }}</span>
      <span v-if="toolCount" class="execution-process__count">{{ toolCount }} 次工具调用</span>
      <span v-if="running" class="execution-process__status">进行中</span>
    </button>
  </section>
</template>

<script setup lang="ts">
defineProps<{ toolCount: number; running?: boolean; expanded: boolean }>();
defineEmits<{ toggle: [] }>();
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.execution-process {
  min-width: 0;

  &__toggle {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 100%;
    padding: 2px 0;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: $color-text-dim;
    font: inherit;
    font-size: 11px;
    line-height: 1.5;
    cursor: pointer;

    &:hover {
      color: $color-text-secondary;
    }

    &:focus-visible {
      outline: 1px solid $color-primary-40;
      outline-offset: 3px;
    }
  }

  &__chevron {
    flex-shrink: 0;
    transition: transform 0.15s ease;

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__count {
    color: $color-text-dim;
    font-size: 11px;
  }

  &__status {
    color: $color-primary;
    font-size: 11px;
  }
}
</style>
