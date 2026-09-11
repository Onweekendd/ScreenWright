<template>
  <li
    :class="[
      'page-list-item',
      isSpecial ? 'page-list-item-prev' : '',
      isActive ? 'active' : '',
      isDisabled ? 'disbled' : ''
    ]"
    @click="onClick"
    :title="title"
    :style="computedStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <slot>{{ content }}</slot>
  </li>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

interface PageItemProps {
  content: string | number;
  isActive?: boolean;
  isDisabled?: boolean;
  isSpecial?: boolean;
  style?: CSSProperties;
  activeStyle?: CSSProperties;
  hoverStyle?: CSSProperties;
  isHovering?: boolean;
}

const props = withDefaults(defineProps<PageItemProps>(), {
  isActive: false,
  isDisabled: false,
  isSpecial: false,
  isHovering: false
});

const emit = defineEmits<{
  (e: "click", value: string | number): void;
  (e: "mousemove", event: MouseEvent): void;
  (e: "mouseleave"): void;
}>();

const title = computed(() => {
  return typeof props.content === "string" ? "" : String(props.content);
});

const computedStyle = computed<CSSProperties>(() => {
  if (props.isActive && props.activeStyle) {
    return props.activeStyle;
  }
  if (props.isHovering && props.hoverStyle) {
    return props.hoverStyle;
  }
  return props.style || {};
});

const onClick = () => {
  if (props.isDisabled) return;
  emit("click", props.content);
};

const onMouseMove = (e: MouseEvent) => {
  emit("mousemove", e);
};

const onMouseLeave = () => {
  emit("mouseleave");
};
</script>
