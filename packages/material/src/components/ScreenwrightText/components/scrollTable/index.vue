<template>
  <div
    :class="{
      'parts-table': true,
      'component-bind-events': true,
      'has-bind': attrs.events && attrs.events.length && isBuild.value,
      'has-encode': attrs.encodes && attrs.encodes.length && isBuild.value
    }"
    :id="`parts-table-${id}`"
  >
    <TableHeader :option="option" :listLabel="listLabel" />

    <ScrollContainer
      ref="scrollContainerRef"
      :option="option"
      :height="height"
      :isAnimateScroll="isAnimateScroll"
      :currentList="currentList"
      :listData="listData"
      :scrollYBarStyle="scrollYBarStyle"
    >
      <template #default="{ item, index }">
        <TableRow
          :currentList="currentList"
          :element="element"
          :item="item"
          :listIndex="index"
          :listLabel="listLabel"
        />
      </template>
    </ScrollContainer>
  </div>
</template>

<script setup lang="ts">
import { EventTypeEnum, textEnum, type ComponentType } from "@screenwright/types";
import { ref, useAttrs, watch } from "vue";
import { onMounted } from "vue";

import { useActionEvent, useBaseData, useBaseFilter } from "@screenwright/composables";

import type { Attrs } from "../types";
import ScrollContainer from "./ScrollContainer.vue";
import TableHeader from "./TableHeader.vue";
import TableRow from "./TableRow.vue";
import { useScrollTable } from "./useScrollTable";

defineOptions({
  name: "ftScroll"
});
const props = defineProps<{ element: ComponentType }>();

const { height, option, isBuild, id, handleEventAndCallbackEvent } = useBaseData(props.element);
const { inputData } = useBaseFilter(props.element);
const { addEvent } = useActionEvent();

const attrs: Attrs = useAttrs();
const scrollContainerRef = ref<InstanceType<typeof ScrollContainer>>();
// 使用封装的hook
const { listLabel, listData, isAnimateScroll, currentList, scrollYBarStyle, cursorShow, initRowList, setInit } =
  useScrollTable(props.element, inputData, option, scrollContainerRef);
watch(inputData, () => {
  if (inputData.value && inputData.value.length) {
    initRowList();
    setInit();
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: props.element
    });
  }
});

// 点击处理函数（供外部调用）
const handleClick = (info: any) => {
  // 模拟行点击事件
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: info || {}
  });
};
const transformFtScroll = (item: ComponentType): ComponentType => {
  if (item.component.prop === textEnum.SwScroll) {
    if (item.option && !item.option.progressYConfig) {
      const column = item.option.column || [];
      item.option.progressYConfig = column.map(() => ({
        type: "line",
        "text-inside": false,
        status: "custom",
        indeterminate: false,
        duration: 3,
        showText: false,
        "stroke-linecap": "round",
        striped: false,
        color: "#88FC8D",
        outerBgColor: "#ebeef5",
        linearGradientColor: "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0%)",
        fontFamily: "siayuan-normal",
        fontSize: 18,
        fontColor: "#fff",
        fontStyle: "normal",
        fontWeight: "normal",
        borderRadius: 100,
        commonColor: "#409EFF"
      }));
    }
  }
  return item;
};
onMounted(() => {
  console.log("scrollTable onMounted");
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: props.element
  });
  transformFtScroll(props.element);

  // 注册组件事件到全局事件系统
  addEvent({
    [`${textEnum.SwScroll}-${props.element.id}`]: {
      handleClick
    }
  });
});
</script>

<style lang="scss" scoped>
.parts-table {
  width: 100%;
  font-size: 20px;
  color: #ffffff;
  letter-spacing: 1px;
  overflow: hidden;
  --visibility: v-bind("cursorShow");

  * {
    box-sizing: border-box !important;
  }
  :deep(.table-head) {
    width: fit-content !important;
    position: relative;
    &::before,
    &::after {
      content: "▶";
      visibility: var(--visibility);
      color: #ffffff;
      position: absolute;
      right: 0;
      top: 50%;
      width: 50px;
      transform: translate(0, -50%) rotate(180deg) scale(0.5);
      text-shadow: 0 0 20px #00feff;
      z-index: 1;
    }
    &::before {
      transform: translate(0, -50%) rotate(0deg) scale(0.5);
      left: 2px;
    }
    .list-item {
      height: 100%;
      width: 100% !important;
      @mixin border($value) {
        &::before,
        &::after {
          content: "";
          width: 5px;
          height: 100%;
          visibility: $value !important;
          background-color: #0160be86;
          position: absolute;
          top: 0;
          right: 0;
          transform: none;
        }
        &::before {
          left: 0;
        }
      }
      &.border-show {
        @include border(visible);
      }
      &.border-hide {
        @include border(hidden);
      }

      display: flex;
      align-items: center;
      position: relative;
      &:nth-child(even) {
        background-color: rgba(0, 138, 255, 0.1);
      }
      & > span {
        margin: 10px 0;
        position: relative;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      &::before {
        content: "▶";
        visibility: var(--visibility);
        color: #ffffff;
        position: absolute;
        left: 0;
        top: 50%;
        width: 50px;
        transform: translate(0, -50%) scale(0.5);
        text-shadow: 0 0 20px #00feff;
        z-index: 1;
      }
    }
  }
  .list-item {
    display: flex;
    align-items: center;
    position: relative;
    &:nth-child(even) {
      background-color: rgba(0, 138, 255, 0.1);
    }
    & > span {
      margin: 10px 0;
      position: relative;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    &::before {
      content: "▶";
      visibility: var(--visibility);
      color: #ffffff;
      position: absolute;
      left: 0;
      top: 50%;
      width: 50px;
      transform: translate(0, -50%) scale(0.5);
      text-shadow: 0 0 20px #00feff;
      z-index: 1;
    }
  }
}

.parts-table:hover {
  .slideAni {
    animation-play-state: paused;
  }
}
</style>
