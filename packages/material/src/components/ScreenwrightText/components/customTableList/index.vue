<!-- 自定义表格组件 -->
<template>
  <div
    class="custom-table-list"
    :class="containerClasses"
    :style="{
      '--globalBg': `${option.globalConfig.globalBgShow ? globalBgValue : ''}`,
      '--globalTranslateY': `${option.globalConfig.globalTranslateY}px`,
      '--globalTranslateX': `${option.globalConfig.globalTranslateX}px`
    }"
  >
    <el-scrollbar
      ref="scrollbarRef"
      :class="{ 'not-scroll': isScroll }"
      class="customTableList-scrollbar"
      :always="true"
      :style="scrollBarStyle"
    >
      <div
        :class="scrollbarBoxClasses"
        ref="customTableListScrollbarBoxRef"
        :style="{
          height: `${customTableListScrollbarConfig.height}px`
        }"
      >
        <TableRowItem
          v-for="(item, index) in currentList"
          :key="index"
          :listItem="item"
          :listIndex="index"
          :listData="listData"
          :id="id"
          :column-config="option.column"
          :row-style="getRowStyles(index)"
          :option="option"
          @row-click="handleRowEvent('click', index)"
          @row-hover="handleRowEvent('hover', index)"
          @row-leave="handleRowEvent('leave', index)"
          @button-click="handleButtonClick"
          @switch-change="handleSwitchChange"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { type AllComponentType, EventTypeEnum, textEnum, type ComponentType } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import { computed, nextTick, onMounted, ref, useAttrs, watch } from "vue";
import { onBeforeUnmount } from "vue";

import { useActionEvent, useBaseData, useBaseFilter } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";

import type { Attrs } from "../types";
import TableRowItem from "./components/TableRowItem.vue";
import type { Option } from "./types";
import { useTableScroll } from "./useTableScroll";
import { useTableStyles } from "./useTableStyles";

defineOptions({
  name: "ftCustomTableList"
});
const props = defineProps<{ element: ComponentType }>();
const { option, id, isBuild, component, handleEventAndCallbackEvent } = useBaseData(props.element) as ReturnType<
  typeof useBaseData<AllComponentType, Option>
>;
const { inputData } = useBaseFilter(props.element);
const { addEvent } = useActionEvent();
// 定义响应式变量
const listData = ref(isArray(inputData.value) ? [...inputData.value] : []);
const scrollHeight = ref("0px");

// 使用组合式API

const { scrollbarRef, initScroll } = useTableScroll(option.value.globalConfig);
const { getRowStyle, setRowBaseStyle } = useTableStyles(props.element, isBuild.value);
const attrs: Attrs = useAttrs();

const customTableListScrollbarBoxRef = ref<HTMLElement | null>(null);
// requestAnimationFrame animation id
let rafId: number | null = null;
let rafStart = 0;
let rafDistance = 0;
let rafDuration = 0; // ms
let rafDurationSeconds: number | null = null; // seconds
let rafPxPerSecond = 60;
// 当暂停时记录当前偏移（单位：px，通常为负值）以便恢复时平滑继续
let rafPausedOffset: number | null = null;

const stopRaf = (el?: HTMLElement | null) => {
  // 如果正在运行，计算当前偏移并保存，然后停止 RAF
  if (rafId != null) {
    try {
      // 计算当前偏移：优先使用时间基的计算（更准确），否则尝试从元素样式读取
      if (rafDuration > 0 && rafStart > 0) {
        const now = performance.now();
        const elapsed = now - rafStart;
        const progress = (elapsed % rafDuration) / rafDuration;
        const y = -progress * rafDistance;
        rafPausedOffset = y;
      } else if (el) {
        const tf = el.style.transform || "";
        const m = tf.match(/translate3d\(0,\s*(-?\d+(?:\.\d+)?)px,\s*0\)/);
        if (m) {
          rafPausedOffset = parseFloat(m[1]);
        }
      }
    } catch (_e) {
      // 忽略任何计算错误，保持 rafPausedOffset 为 null
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _err = _e;
    }

    cancelAnimationFrame(rafId);
    rafId = null;
  } else if (el) {
    // 如果没有 RAF 正在运行，仍尝试从样式读取当前 transform 作为 pausedOffset
    const tf = el.style.transform || "";
    const m = tf.match(/translate3d\(0,\s*(-?\d+(?:\.\d+)?)px,\s*0\)/);
    if (m) {
      rafPausedOffset = parseFloat(m[1]);
    }
  }

  // 不清零 rafStart，保留以便后续计算（startRafLoop 会根据 pausedOffset 调整）
};

const startRafLoop = (
  el: HTMLElement,
  distance: number,
  pxPerSecond: number,
  startOffset?: number | null,
  durationSeconds?: number | null
) => {
  // stop existing RAF but preserve paused offset from that element
  stopRaf(el);
  rafDistance = distance;
  rafPxPerSecond = pxPerSecond;
  // prefer explicit duration (seconds) when provided, otherwise compute from pxPerSecond
  rafDurationSeconds = typeof durationSeconds === "number" ? durationSeconds : rafDistance / rafPxPerSecond;
  rafDuration = Math.max(0.001, rafDurationSeconds) * 1000; // ms

  const now = performance.now();
  // 如果外部传入了 startOffset（例如来自 pause 时保存的值），使用它来计算 rafStart，使得动画从该偏移继续
  if (typeof startOffset === "number") {
    // startOffset 是当前已应用的 translateY（通常为负值），所以进度 = (-startOffset)/distance
    const progress = -startOffset / rafDistance;
    // 保证进度在 [0,1)
    const normProgress = ((progress % 1) + 1) % 1;
    rafStart = now - normProgress * rafDuration;
    // 立即设置 transform 为传入偏移，避免在下一帧之前出现跳动
    el.style.transform = `translate3d(0, ${startOffset}px, 0)`;
    // 清除 paused offset（因为我们已经用它恢复）
    rafPausedOffset = null;
  } else if (rafPausedOffset !== null) {
    // 遇到未传入 startOffset，但全局有 paused 值时使用之
    const progress = -rafPausedOffset / rafDistance;
    const normProgress = ((progress % 1) + 1) % 1;
    rafStart = now - normProgress * rafDuration;
    el.style.transform = `translate3d(0, ${rafPausedOffset}px, 0)`;
    rafPausedOffset = null;
  } else {
    // 正常从当前时间开始
    rafStart = now;
  }

  const step = (nowTime: number) => {
    const elapsed = nowTime - rafStart;
    // progress in [0,1)
    const progress = (elapsed % rafDuration) / rafDuration;
    const y = -progress * rafDistance;
    // apply transform
    el.style.transform = `translate3d(0, ${y}px, 0)`;
    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);
};
const setScrollAnimate = async () => {
  await nextTick();
  const scrollbarBox = customTableListScrollbarBoxRef.value;
  if (scrollbarBox) {
    // 只有在 isScroll 为 true 时才启动/维持滚动动画；否则确保 RAF 停止并清理样式
    if (!isScroll.value) {
      // 停止任何正在运行的 RAF
      stopRaf(scrollbarBox);
      // 移除可能残留的动画类并清理内联动画样式
      scrollbarBox.classList.remove("slideAni");
      try {
        scrollbarBox.style.animationDuration = "";
        scrollbarBox.style.webkitAnimationDuration = "";
        scrollbarBox.style.transform = "";
      } catch (e) {
        // ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _err = e;
      }
      // 恢复交互（非构建模式下）
      scrollbarBox.style.pointerEvents = isBuild.value ? "none" : "auto";
      return;
    }

    // 从 DOM 测量实际内容高度（更可靠），当启用无缝滚动时 contentHeight 包含两份数据
    const contentHeight = (scrollbarBox && (scrollbarBox.scrollHeight || scrollbarBox.offsetHeight)) || 0;
    const originalHeight = isScroll.value && contentHeight > 0 ? contentHeight / 2 : contentHeight;
    if (originalHeight > 0) {
      // 使用测量到的像素高度作为位移来源
      scrollHeight.value = `-${originalHeight}px`;
      try {
        scrollbarBox.style.setProperty("--scrollHeight", scrollHeight.value);
      } catch {
        // 忽略在某些环境下的只读 style 情况
      }

      // 使用 requestAnimationFrame 驱动动画以保证像素/秒一致
      const userDuration = option.value.globalConfig.globalScrollTime;
      // const _cfg = option.value.globalConfig as unknown as { globalScrollPxPerSecond?: number };
      const pxPerSecond = option.value.globalConfig.globalScrollTime || 60; // 可由配置覆盖
      const duration = userDuration || originalHeight / Math.max(1, pxPerSecond);

      // 计算实际速度（像素/秒）用于调试
      const speedPxPerSec = originalHeight / Math.max(0.0001, duration);

      console.log("setScrollAnimate", {
        originalCount: listData.value?.length || 0,
        currentListLength: currentList.value.length,
        contentHeight,
        originalHeight,
        duration,
        pxPerSecond,
        speedPxPerSec
      });

      // 停用 CSS 动画并启用 RAF 动画
      scrollbarBox.classList.remove("slideAni");
      scrollbarBox.style.animationDuration = "";
      scrollbarBox.style.webkitAnimationDuration = "";
      scrollbarBox.style.pointerEvents = isBuild.value ? "none" : "visible";

      // start RAF-driven loop: distance equals originalHeight (pixels)
      startRafLoop(scrollbarBox, originalHeight, pxPerSecond);
    }
  }
};

onMounted(() => {
  initScroll(option.value.rowConfig.listRowHeight);
  setScrollAnimate();

  // 注册组件事件 - 使用handleButtonClick作为点击处理
  const handleClick = (throwValue: unknown) => {
    handleButtonClick({ item: throwValue as unknown });
  };

  addEvent({
    [`${textEnum.CustomTableList}-${props.element.id}`]: { handleClick }
  });

  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: listData.value
  });
});

onBeforeUnmount(() => {
  stopRaf(customTableListScrollbarBoxRef.value);
});

watch(
  () => inputData.value,
  (newVal) => {
    listData.value = isArray(newVal)
      ? newVal.map((it, itIndex) => {
          return {
            ...it,
            index: itIndex + 1
          };
        })
      : [];
    initScroll(option.value.rowConfig.listRowHeight);
    setScrollAnimate();
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: listData.value
    });
  },
  { deep: true }
);

// 计算属性
const isScroll = computed(() => {
  const totalHeight = component.value.height;
  const globalColCount = Math.max(
    1,
    option.value.globalConfig.globalColCount ? option.value.globalConfig.globalColCount : 1
  );
  const itemHeight =
    (totalHeight / (option.value.globalConfig.globalRowCount * globalColCount)) * listData.value.length;
  return option.value.globalConfig.globalScroll && totalHeight < itemHeight;
});
const isGrid = computed(() => {
  return option.value.globalConfig.globalColCount && option.value.globalConfig.globalColCount > 1;
});
const colCount = computed(() => {
  return option.value.globalConfig.globalColCount || 1;
});

const currentList = computed(() => {
  const curData = cloneDeep(listData.value);
  return isScroll.value ? [...listData.value.concat(curData)] : [...listData.value];
});

// 事件处理
const handleRowEvent = (type: "click" | "hover" | "leave" | "mouseout", listIndex: number) => {
  const doms = document.getElementsByClassName(`customTableList_${id.value}`);
  Array.from(doms).map((dom, domIndex) => {
    if (!(dom instanceof HTMLElement)) return;
    // 设置默认背景函数
    const setDefaultBg = () => {
      // 区分是否开启行状态
      dom.style.background = setRowBaseStyle(domIndex, currentList.value).background;
      if (!option.value.rowConfig.listRowStatusShow) {
        dom.className = dom.className.replace(" hover", "");
      }
    };
    // 优先级：悬浮=>选中=>行状态=>默认
    switch (type) {
      case "click":
        if (option.value.rowConfig.selectedShow) {
          console.log(dom.className);

          if (dom.className.indexOf(` row-item_${id.value}_${listIndex}`) !== -1) {
            if (Array.from(dom.classList).includes("active")) {
              dom.className = dom.className.replace(" active", "");
              setDefaultBg();
            } else {
              // 设置高亮样式
              dom.className = dom.className + " active";
              dom.style.background =
                option.value.rowConfig.selectedBgType === "color"
                  ? option.value.rowConfig.selectedBgColor
                  : `url(${setMinioUrl(option.value.rowConfig.selectedBgImage)}) no-repeat center/100% 100%`;
            }
          } else {
            // 移除高亮样式
            dom.className = dom.className.replace(" active", "");
            setDefaultBg();
          }
        }
        break;
      case "hover": {
        if (option.value.rowConfig.hoverShow) {
          if (dom.className.indexOf(` row-item_${id.value}_${listIndex}`) !== -1) {
            // 非高亮项，设置hover样式
            if (!Array.from(dom.classList).includes("active") && !Array.from(dom.classList).includes("hover")) {
              // 设置hover样式
              dom.className = dom.className + " hover";
              dom.style.background =
                option.value.rowConfig.hoverBgType === "color"
                  ? option.value.rowConfig.hoverBgColor
                  : `url(${setMinioUrl(option.value.rowConfig.hoverBgImage)}) no-repeat center/100% 100%`;
            }
          } else {
            if (!Array.from(dom.classList).includes("active")) {
              dom.className = dom.className.replace(" hover", "");
              setDefaultBg();
            }
          }
        }
        if (option.value.globalConfig.globalScroll) {
          const scrollbarBox = customTableListScrollbarBoxRef.value;
          if (scrollbarBox) {
            // pause RAF animation and record current offset from this element
            stopRaf(scrollbarBox);
          }
        }
        break;
      }
      case "leave": {
        // 移除hover样式，设置默认样式
        if (!Array.from(dom.classList).includes("active")) {
          dom.className = dom.className.replace(" hover", "");
          setDefaultBg();
        }
        if (option.value.globalConfig.globalScroll) {
          const scrollbarBox = customTableListScrollbarBoxRef.value;
          if (scrollbarBox) {
            // resume RAF animation with previous paused offset (if any)
            if (rafDistance > 0) {
              startRafLoop(scrollbarBox, rafDistance, rafPxPerSecond, rafPausedOffset ?? null);
            }
          }
        }
        break;
      }
    }
  });
};

const handleButtonClick = (item: Record<string, unknown>) => {
  // 实现按钮点击处理逻辑
  console.log(`Button click for item`, item);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (item as { item?: any }).item || {};
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: payload
  });
};

const handleSwitchChange = (data: Record<string, unknown>) => {
  // 实现开关切换处理逻辑
  console.log(`Switch change for item`, data, option.value, currentList.value);
};

// 计算动态值
const globalBgValue = computed(() => {
  return option.value.globalConfig.globalBgType === "color"
    ? option.value.globalConfig.globalBgColor
    : `url(${setMinioUrl(option.value.globalConfig.globalBgImage)}) no-repeat center/100% 100%`;
});

const scrollYBarStyle = computed(() => {
  return {
    show: option.value.globalConfig.scrollYBarShow && !option.value.globalConfig.globalScroll,
    trackWidth: option.value.globalConfig.globalScrollYTrackWidth + "px",
    trackBackground: option.value.globalConfig.globalScrollYTrackBackground,
    trackBorderRadius:
      (Number(option.value.globalConfig?.globalScrollYTrackBorderRadius || 0) *
        Number(option.value.globalConfig?.globalScrollYTrackWidth || 0)) /
        100 /
        2 +
      "px", // 跟easyv的一样
    thumbWidth: option.value.globalConfig.globalScrollYThumbWidth + "px",
    thumbBackground: option.value.globalConfig.globalScrollYThumbBackground,
    thumbBorderRadius:
      (Number(option.value.globalConfig?.globalScrollYThumbBorderRadius || 0) *
        Number(option.value.globalConfig?.globalScrollYThumbWidth || 0)) /
        100 /
        2 +
      "px"
  };
});
const customTableListScrollbarConfig = computed(() => {
  console.log(option.value.rowConfig.listRowHeight, " option.value.rowConfig.listRowHeight");
  return {
    height:
      option.value.rowConfig.listRowHeight * option.value.globalConfig.globalRowCount +
      (option.value.globalConfig.globalRowCount > 0 ? option.value.globalConfig.globalRowCount - 1 : 0) *
        option.value.globalConfig.globalRowLineMarginBottom,
    width: option.value.rowConfig.listRowWidth
  };
});

const containerClasses = computed(() => ({
  "component-bind-events": true,
  "has-bind": attrs.events?.length && isBuild.value,
  "has-encode": attrs.encodes?.length && isBuild.value
}));

const scrollbarBoxClasses = computed(() => {
  return {
    "customTableList-scrollbar-box": true,
    grid: isGrid.value
  };
});
const scrollBarStyle = computed(() => {
  //  height: `${customTableListScrollbarConfig.value.height}px`,
  // let scrollBarHeight =
  //   option.value.rowConfig.listRowHeight * option.value.globalConfig.globalRowCount +
  //   (option.value.globalConfig.globalRowCount > 0 ? option.value.globalConfig.globalRowCount - 1 : 0) *
  //     option.value.globalConfig.globalRowLineMarginBottom;

  const obj = {
    pointerEvents: `${option.value.globalConfig.globalScroll ? "none" : "visible"}`,
    "--scrollHeight": `${scrollHeight.value}`,
    "--scrollYBarShow": `${scrollYBarStyle.value.show ? "block" : "none"}`,
    "--trackWidth": `${scrollYBarStyle.value.trackWidth}`,
    "--trackBackground": `${scrollYBarStyle.value.trackBackground}`,
    "--trackBorderRadius": `${scrollYBarStyle.value.trackBorderRadius}`,
    "--thumbWidth": `${scrollYBarStyle.value.thumbWidth}`,
    "--thumbHeight": `${(option.value.globalConfig.globalRowCount / listData.value.length) * 100}%`,
    "--thumbBackground": `${scrollYBarStyle.value.thumbBackground}`,
    "--thumbBorderRadius": `${scrollYBarStyle.value.thumbBorderRadius}`,
    height: `100%`
  };
  return obj;
});

const getRowStyles = (index: number) => ({
  background: option.value.rowConfig.background,
  width: option.value.rowConfig.width,
  height: option.value.rowConfig.height,
  marginBottom: getRowStyle.value(index).marginBottom
});

watch(
  () => option.value,
  () => {
    setScrollAnimate();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.custom-table-list {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: v-bind("option.globalConfig.globalBgShow ? globalBgValue : ''");
  transform: translate(
    v-bind("option.globalConfig.globalTranslateX + 'px'"),
    v-bind("option.globalConfig.globalTranslateY + 'px'")
  );
  :deep(.el-scrollbar__wrap) {
    margin-bottom: 0 !important;
    margin-right: 0 !important;
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }

  .auto-scroll {
    :deep(.el-scrollbar__view) {
      animation: scrollAnimation 10s linear infinite;
      will-change: transform;
    }
  }

  .customTableList-scrollbar-box {
    &.grid {
      display: grid;
    }
  }

  .customTableList-scrollbar {
    text-align: center;
    width: 100%;
    overflow: hidden;
    position: absolute;
    top: var(--globalTranslateY);
    left: var(--globalTranslateX);
    // 原生滚动条隐藏
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
    :deep(.el-scrollbar__bar) {
      width: var(--trackWidth);
      background: var(--trackBackground);
      border-radius: var(--trackBorderRadius);
      right: 0;
      top: 0;
      // 横向滚动条
      &.is-horizontal {
        display: none;
      }
      // 纵向滚动条
      &.is-vertical {
        display: var(--scrollYBarShow);
        .el-scrollbar__thumb {
          width: var(--thumbWidth);
          height: var(--thumbHeight) !important;
          background-color: var(--thumbBackground);
          border-radius: var(--thumbBorderRadius);
        }
      }
    }

    .customTableList-scrollbar-box {
      .customTableList-scrollbar-box-item {
        position: relative;
        overflow: hidden;
        .item-child {
          position: absolute;
        }
      }
    }
    .customTableList-scrollbar-box.grid {
      display: grid;
      grid-template-columns: repeat(v-bind(colCount), 1fr);
    }
  }
  // 滚动动画
  .slideAni {
    animation: slideAni 10s linear infinite;
    transition: all 0.3s linear;
    transform-style: preserve-3d;
  }

  @keyframes slideAni {
    0% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, var(--scrollHeight), 0);
    }
  }
}

// 跑马灯组件样式覆盖
:deep(.parts-marquee) {
  .row-content {
    text-align: unset !important;
    letter-spacing: unset !important;
  }
}
</style>
