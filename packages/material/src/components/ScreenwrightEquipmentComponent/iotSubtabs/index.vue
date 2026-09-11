<!-- 选项卡 -->
<template>
  <div class="iot-subtabs" ref="subtabs">
    <ul
      :class="{
        'grid-ul': true,
        ...componentClasses
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
          item.value == currentActive ? styleActiveItem(index) : styleDefaultItem(index),
          liMinHeight
        ]"
        v-for="(item, index) in dataChart"
        :key="index"
        @click.stop="(handleClick(item), handleEncodes(item))"
        @mouseenter="handleMouseEvent('mouseEnter', item, index)"
        @mouseleave="handleMouseEvent('mouseLeave', item)"
      >
        <span
          class="text-font"
          :style="[item.value == currentActive ? styleActiveFont(index) : styleDefaultFont(index)]"
          v-html="item.label"
          :data-translate="item.label"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { useActionEvent } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import { EquipmentEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { useSubTabs } from "./useIotSubTabs";

// 定义事件项类型
interface EventItem {
  trigger: string;
  actions: Array<{
    customActionType: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// 定义树形数据类型
interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
  isChecked?: boolean;
  children?: TabItem[];
  [key: string]: any;
}

defineOptions({
  name: "subtabs"
});

// 定义props
const props = defineProps<{
  element: ComponentType;
}>();
const {
  currentActive,
  isFirst,
  eventStatus,
  encodeStatus,
  styleGrid,
  liMinHeight,
  styleFlex,
  componentClasses,
  option,
  dataChart,
  id,
  events,
  cbArgs,
  styleDefaultItem,
  styleActiveItem,
  styleDefaultFont,
  styleActiveFont,
  styleHoverFont,
  handleIotMessageEnd,
  handleEventAndCallbackEvent,
  handleEncode,
  asyncDeviceStatus,
  deviceId,
  _handleClickImpl,
  triggerRelated,
  registerRelatedTrigger
} = useSubTabs(props.element);

const { addEvent } = useActionEvent();

// 获取main相关的方法和数据

// DOM引用
const subtabs = ref<HTMLElement | null>(null);

// 监听Option的followCanvasSlide变化
watch(
  () => option.value.followCanvasSlide,
  (val) => {
    if (val) {
      props.element.emitter?.emit("followCanvasSlide", id.value);
    }
  },
  { immediate: true }
);

// 监听数据变化
watch(
  () => dataChart.value,
  (val) => {
    if (val && val.length > 0) {
      // 组件数据变化后 只有点击事件与请求完成或数据变化的事件才会默认触发一次交互事件
      const filterEvents = events.value.filter((item) => ["dataChange"].includes(item.trigger));
      const curInfo = val.find((c: TabItem) => c.value == currentActive.value);

      if (cbArgs.value.length > 0 && isFirst.value) {
        handleEventAndCallbackEvent({
          throwValue: curInfo || {},
          events: filterEvents,
          triggerType: EventTypeEnum.DataChange,
          id: props.element.id
        });
        isFirst.value = false;
        return;
      }

      if (filterEvents && filterEvents.length) {
        props.element.emitter?.emit("handleEvents", {
          info: curInfo || {},
          events: filterEvents,
          outside: props.element.quotePanel,
          dynamicPanel: props.element.dynamicPanelId
        });
      }
    }
  },
  { immediate: true }
);

// 监听currentActive变化
// watch(
//   () => currentActive.value,
//   (val) => {
//     if (!isBuild.value && option.value.related) {
//       subtabsRelatedKey.value = { ...subtabsRelatedKey.value, [relatedKeyKey.value]: val }
//       for (const key in subtabsRelatedKey.value) {
//         subtabsRelatedKey.value[key] = val
//       }
//     }
//   },
//   { immediate: true }
// )

// 监听option.active变化
watch(
  () => option.value.active,
  (val) => {
    currentActive.value = val;
  },
  { immediate: true }
);

watch(
  () => deviceId,
  async (newVal) => {
    if (!newVal) {
      return;
    }

    try {
      asyncDeviceStatus();
    } catch (error) {
      console.error(error);
    }
  },
  { immediate: true }
);

const handleEncodes = async (info: any) => {
  if (encodeStatus.value) return;
  encodeStatus.value = true;
  handleEncode(info);
  await sleep(500);
  encodeStatus.value = false;
};

// 方法
// Canvas滑动处理
const onCanvasSlide = (op: { id: string; index: number }) => {
  if (op.id === String(id.value)) {
    console.log("tab slide", op.index);
    const index =
      dataChart.value.findIndex((it: TabItem) => String(it.value) === String(currentActive.value)) + op.index;
    if (index >= 0 && index < dataChart.value.length) {
      handleClick(dataChart.value[index]);
    }
  }
};

// 点击处理
const handleClick = async (info: TabItem) => {
  console.log(info, "infoinfoinfo");
  if (eventStatus.value) return;
  eventStatus.value = true;

  if (!info || info.disabled) return;
  handleIotMessageEnd(info);

  // 使用新的关联触发逻辑
  _handleClickImpl(info);
  triggerRelated(info);

  await sleep(500);
  eventStatus.value = false;
};

const setHoverStyle = (targetIndex = -1) => {
  const fields = [
    "color",
    "fontSize",
    "fontWeight",
    "fontFamily",
    "fontStyle",
    "textShadow",
    "transform",
    "border",
    "background"
  ];
  const index = option.value.isSeriesFirst && option.value.seriesTabsList?.length ? targetIndex : -1;

  if (!subtabs.value) return;

  fields.forEach((field) => {
    const value = styleHoverFont(index)[field as keyof CSSProperties];
    subtabs.value?.style.setProperty(`--hover-${field}`, value?.toString() || "");
  });
};

// 鼠标移入移出事件
const handleMouseEvent = (type: string, info: TabItem, index?: number) => {
  setHoverStyle(index);
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: type == "mouseEnter" ? EventTypeEnum.MouseEnter : EventTypeEnum.MouseLeave,
    events: props.element.events,

    throwValue: info
  });
};

// 生命周期钩子
onMounted(() => {
  props.element.emitter?.on("onCanvasSlide", onCanvasSlide);
  currentActive.value = option.value.active || null;

  asyncDeviceStatus();
  addEvent({
    [`${EquipmentEnum.IotSubTabs}-${props.element.id}`]: {
      handleClick
    }
  });

  // 注册关联触发器
  registerRelatedTrigger();
});

onBeforeUnmount(() => {
  eventStatus.value = false;
  encodeStatus.value = false;
  props.element.emitter?.off("onCanvasSlide", onCanvasSlide);
});
</script>

<style lang="scss" scoped>
.iot-subtabs {
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
  width: 100%;
  height: 100%;
  display: grid;
  margin: 0;
  padding: 0;
  .flex-li {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    writing-mode: horizontal-tb; // tb-rl
    cursor: pointer;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
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
