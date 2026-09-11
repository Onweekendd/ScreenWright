<!-- 选项卡 -->
<template>
  <div class="ft-subtabs" ref="subtabs">
    <ul
      :class="{
        'grid-ul': true,
        'component-bind-events': true,
        'has-bind': events?.length && isBuild.value,
        'has-encode': encodes?.length && isBuild.value
      }"
      :style="styleGrid"
    >
      <li
        :class="{
          'flex-li': true,
          'is-disabled': item.disabled,
          hasHover: option.isHovered
        }"
        :style="[
          styleFlex,
          item.value == currentActive ? styleActiveItem(index as number) : styleDefaultItem(index as number),
          liMinHeight
        ]"
        v-for="(item, index) in dataChart"
        :key="index"
        @click.stop="(handleClick(item), handleEncode(item))"
        @mouseenter="handleMouseEvent(EventTypeEnum.MouseEnter, item, index as number)"
        @mouseleave="handleMouseEvent(EventTypeEnum.MouseLeave, item)"
      >
        <span
          class="text-font"
          :style="[item.value == currentActive ? styleActiveFont(index as number) : styleDefaultFont(index as number)]"
          v-html="item.label"
          :data-translate="item.label"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";

import type { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import type { SubtabsOption } from "./type";
import { useSubtabs } from "./useSubtabs";

defineOptions({
  name: "subtabs"
});

// 定义props
const props = defineProps<{
  element: ComponentType<interactiveEnum.Subtabs, SubtabsOption>;
}>();

// 使用 useSubtabs composable
const {
  // DOM引用
  subtabs,
  // 计算属性
  currentActive,
  liMinHeight,
  styleGrid,
  styleFlex,
  // 事件处理方法
  handleClick,
  handleMouseEvent,
  handleEncode,
  // 样式方法
  styleDefaultItem,
  styleDefaultFont,
  styleActiveItem,
  styleActiveFont,
  // 监听器回调
  onFollowCanvasSlideChange,
  onDataChartChange,
  onActiveChange,
  // 生命周期方法
  init,
  cleanup,
  // 数据和配置
  option,
  dataChart,
  events,
  encodes,
  isBuild
} = useSubtabs(props.element);

// 监听器设置
// 监听 Canvas 滑动跟随配置变化
watch(
  () => option.value.followCanvasSlide,
  (val) => onFollowCanvasSlideChange(val as boolean),
  { immediate: true }
);

// 监听数据变化，触发数据变化事件
watch(() => dataChart.value, onDataChartChange, { immediate: true });

// 监听激活项配置变化
watch(
  () => option.value.active,
  (val: number | undefined) => onActiveChange(val),
  { immediate: true }
);

// 生命周期钩子
onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.ft-subtabs {
  width: 100%;
  height: 100%;
  overflow: auto;
  --hover-color: rgba(255, 255, 255, 1);
  --hover-fontSize: 16px;
  --hover-fontWeight: normal;
  --hover-fontFamily: "sans-serif";
  --hover-fontStyle: normal;
  --hover-textShadow: none;
  --hover-transform: translate(0, 0);
  --hover-border: none;
  --hover-background: none;
}
.grid-ul {
  height: 100%;
  display: grid;
  grid-template-rows: repeat(1, 1fr);
  grid-template-columns: repeat(2, 1fr);
  row-gap: 0;
  column-gap: 0;
  margin: 0;
  padding: 0;
  .flex-li {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    writing-mode: horizontal-tb; // tb-rl
    cursor: pointer;
    .text-font {
      letter-spacing: 0px;
      text-align: center;
      text-orientation: upright;
      white-space: pre-wrap;
      vertical-align: middle;
    }
    &.is-disabled {
      cursor: not-allowed;
    }
    &.hasHover:hover {
      border: var(--hover-border) !important;
      background: var(--hover-background) !important;
    }
    &.hasHover:hover .text-font {
      color: var(--hover-color) !important;
      font-size: var(--hover-fontSize) !important;
      font-weight: var(--hover-fontWeight) !important;
      font-family: var(--hover-fontFamily) !important;
      font-style: var(--hover-fontStyle) !important;
      text-shadow: var(--hover-textShadow) !important;
      transform: var(--hover-transform) !important;
    }
  }
}
</style>
