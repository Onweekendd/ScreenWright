<template>
  <div class="ft-roll-subtabs" ref="rollSubtabsRef">
    <ul
      :class="{
        'grid-ul': true,
        'has-bind': events.length && isBuild.value
      }"
      :style="{
        ...styleGrid,
        transform: isHorizontal ? `translateX(${translateXY}px)` : `translateY(${translateXY}px)`
      }"
    >
      <li
        :class="{
          'flex-li': true,
          'is-disabled': item.disabled,
          hasHover: option.isHovered
        }"
        :style="[
          styleFlex,
          item.value == currentActive ? styleActiveItem(index) : styleDefaultItem(index),
          liMinHeight,
          liMinWidth
        ]"
        v-for="(item, index) in dataChart"
        :key="index"
        :data-index="index"
        @click.stop="(handleClick(item), handleEncode(item))"
        @mouseenter="handleMouseEvent('mouseEnter', item, index)"
        @mouseleave="handleMouseEvent('mouseLeave', item)"
      >
        <div
          class="text-font"
          :style="[item.value == currentActive ? styleActiveFont(index) : styleDefaultFont(index)]"
          v-html="item.label"
          :data-translate="item.label"
        />
      </li>
    </ul>
    <div class="panel-arrow" :style="arrowContainStyle" v-if="option.arrowShow">
      <div class="arrow-left" :style="arrowLStyle" @click="switchScroll('prev')" />
      <div class="arrow-right" :style="arrowRStyle" @click="switchScroll('next')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import useRollSubtabs from "./useRollSubtabs";

defineOptions({
  name: "rollSubtabs"
});
const props = defineProps<{
  element: ComponentType;
}>();

const {
  rollSubtabsRef,
  dataChart,
  option,
  isHorizontal,
  translateXY,
  currentActive,
  styleGrid,
  styleFlex,
  liMinHeight,
  liMinWidth,
  arrowContainStyle,
  arrowLStyle,
  arrowRStyle,
  events,
  isBuild,
  styleDefaultItem,
  styleDefaultFont,
  styleActiveItem,
  styleActiveFont,
  handleClick,
  handleEncode,
  handleMouseEvent,
  switchScroll
} = useRollSubtabs(props.element);
</script>

<style lang="scss" scoped>
.ft-roll-subtabs {
  overflow: hidden;
  --hover-color: rgba(255, 255, 255, 1);
  --hover-fontSize: 16px;
  --hover-fontWeight: normal;
  --hover-fontFamily: "sans-serif";
  --hover-fontStyle: normal;
  --hover-textShadow: none;
  --hover-transform: translate(0, 0);
  --hover-border: none;
  --hover-background: none;
  .panel-arrow {
    pointer-events: none;
    .arrow-left,
    .arrow-right {
      pointer-events: auto;
      cursor: pointer;
    }
  }
}
.grid-ul {
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-rows: repeat(1, 1fr);
  grid-template-columns: repeat(2, 1fr);
  row-gap: 0;
  column-gap: 0;
  transition: transform 0.5s ease;
  &.has-bind::after {
    content: "\e658";
    color: #ffffff;
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal;
    width: 16px;
    height: 16px;
    background: #e8aa2e;
    position: absolute;
    right: 0;
    top: 0;
  }
  .flex-li {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    writing-mode: horizontal-tb;
    cursor: pointer;
    .text-font {
      letter-spacing: 0px;
      text-align: center;
      text-orientation: upright;
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
