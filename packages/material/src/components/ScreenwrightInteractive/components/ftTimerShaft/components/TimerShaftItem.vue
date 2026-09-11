<template>
  <div
    :class="{ 'list-item': true, 'is-active': item.active }"
    :style="{
      left: `${index * percentSize}%`,
      width: `${percentSize}%`
    }"
    @click="onItemClick"
  >
    <span
      :style="{
        ...(item.active ? activeStyle : defaultStyle),
        whiteSpace: isPrewrap ? '' : 'nowrap'
      }"
      class="list-item-text"
      >{{ item.label }}</span
    >
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

defineOptions({
  name: "TimerShaftItem"
});

// Props
const props = defineProps<{
  item: {
    label: string;
    value: any;
    active: boolean;
    index: number;
  };
  index: number;
  percentSize: number;
  defaultStyle: CSSProperties;
  activeStyle: CSSProperties;
  isPrewrap?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: "itemClick", event: Event, item: typeof props.item): void;
}>();

// 点击处理
const onItemClick = (event: Event) => {
  emit("itemClick", event, props.item);
};
</script>

<style lang="scss" scoped>
.list-item {
  position: absolute;
  height: 100%;
  text-align: center;
  &::before {
    content: "";
    width: var(--defaultSize);
    height: var(--defaultSize);
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background-color: var(--defaultColor);
    box-shadow:
      0 0 10px var(--defaultColor),
      0 0 10px var(--defaultColor08),
      0 0 10px var(--defaultColor05);
  }
  &.is-active {
    .list-item-text {
      color: rgba(var(--ActiveColor), 1);
      text-shadow: 0 0 10px rgba(var(--ActiveColor), 1);
    }
    &::before {
      width: var(--ActiveSize);
      height: var(--ActiveSize);
      transform: translate(-50%, -50%);
      border: 1px solid var(--ActiveColor);
      background-color: var(--ActiveBg);
      box-shadow:
        0 0 10px var(--ActiveColor),
        0 0 10px var(--ActiveColor08),
        0 0 10px var(--ActiveColor05);
    }
  }
  .list-item-text {
    display: inline-block;
    width: 80px;
    font-size: 24px;
    cursor: pointer;
    position: absolute;
    top: 42%;
  }
}
</style>
