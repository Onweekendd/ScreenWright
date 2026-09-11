<template>
  <div class="ft-multi-subtabs" ref="multiSubtabs" :style="styleSizeName">
    <ul
      :class="{
        'grid-ul': true,
        'has-bind': events.length && isBuild.value
      }"
      :style="styleGrid"
    >
      <li
        :class="['flex-li', item.disabled ? 'is-disabled' : '', option.isHovered ? 'hasHover' : '', `hover-${index}`]"
        :style="[
          styleFlex,
          isSelect(item.value)
            ? styleSeriesList.activeList[index as number] || styleActiveItem
            : styleSeriesList.defaultList[index as number] || styleDefaultItem,
          liMinHeight
        ]"
        v-for="(item, index) in dataChart"
        :key="index"
        @click.stop="(handleClick(item), handleEncode(item))"
        @mouseenter="handleMouseEvent('mouseEnter', item)"
        @mouseleave="handleMouseEvent('mouseLeave', item)"
      >
        <div
          class="text-font"
          :style="[
            isSelect(item.value)
              ? styleSeriesList.activeFontList[index as number] || styleActiveFont
              : styleSeriesList.defaultFontList[index as number] || styleDefaultFont
          ]"
          v-html="item.label"
          :data-translate="item.label"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { isObject } from "lodash-es";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent } from "@screenwright/composables";

import type { MultiSubtabsProps } from "./multiSubtabs";
import useMultiSubtabs from "./useMultiSubtabs";

const { addEvent } = useActionEvent();
defineOptions({
  name: "multiSubtabs"
});

const props = defineProps<MultiSubtabsProps>();

// 获取组合式函数
const {
  multiSubtabs,
  dataChart,
  option,
  styleGrid,
  styleFlex,
  styleDefaultFont,
  styleDefaultItem,
  styleActiveFont,
  styleActiveItem,
  styleSeriesList,
  liMinHeight,
  events,
  isBuild,
  styleSizeName,
  styleHoverFont,
  currentActive,
  isSelect,
  handleClick,
  handleEncode,
  handleMouseEvent,
  initData
} = useMultiSubtabs(props.element);
const handleActionClick = (info: any) => {
  console.log("multiSubtabs click info:", info, isObject(info));
  if (isObject(info)) {
    // 说明是单选
    currentActive.value = `${(info as any).value}` || "";
  } else {
    // 说明是多选
    let dataChartValue = dataChart.value.map((item: any) => `${item.value}`);
    let infoArr = typeof info === "string" && info.includes(",") ? info.split(",") : [`${info}`];
    let validInfoArr = infoArr.filter((i: string) => dataChartValue.includes(i));

    if (validInfoArr && validInfoArr.length > 0) {
      currentActive.value = info;
    } else {
      currentActive.value = "";
    }
    initData();
  }

  // if (!info || !dataChart.value.some((item: any) => `${item.value}` === `${info}`)) {
  //   currentActive.value = "";
  // } else if (typeof info === "string" && info.includes(",")) {
  //   currentActive.value = info;
  // } else {
  //   currentActive.value = `${info}`;
  // }
};
onMounted(() => {
  addEvent({
    [`${interactiveEnum.MultiSubtabs}-${props.element.id}`]: {
      handleClick: handleActionClick
    }
  });
});
</script>

<style lang="scss" scoped>
.ft-multi-subtabs {
  overflow: auto;
  --hover-color: v-bind("styleHoverFont.color");
  --hover-fontSize: v-bind("styleHoverFont.fontSize");
  --hover-fontWeight: v-bind("styleHoverFont.fontWeight");
  --hover-fontFamily: v-bind("styleHoverFont.fontFamily");
  --hover-fontStyle: v-bind("styleHoverFont.fontStyle");
  --hover-textShadow: v-bind("styleHoverFont.textShadow");
  --hover-transform: v-bind("styleHoverFont.transform");
  --hover-border: v-bind("styleHoverFont.border");
  --hover-background: v-bind("styleHoverFont.background");
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
