<!-- 单个状态渲染组件 - 用于 Keep-Alive 缓存 -->
<template>
  <div class="status-view">
    <!-- 滚动模式 -->
    <template v-if="shouldScroll">
      <Transition
        :name="animationClassName"
        @before-enter="animationCallbacks.onBeforeEnter"
        @enter="animationCallbacks.onEnter"
        @after-enter="animationCallbacks.onAfterEnter"
        @enter-cancelled="animationCallbacks.onEnterCancelled"
      >
        <div v-show="previewFlag" class="scrolling-content" :style="scrollingContentStyle">
          <template v-for="(item, index) in scrollComponents" :key="item.__scrollKey">
            <!-- 组组件 -->
            <edit-group
              v-if="item.children && item.children.length > 0"
              :disabled="!isBuild"
              :groupData="item"
              :groupIndex="index"
              :panel-id="panelId"
              :status-id="statusId"
              :is-dynamic-panel="true"
              :isBuild="isBuild"
            />

            <!-- 普通组件 -->
            <EditShapeBox
              v-else
              :data-id="item.id"
              :width="item.component.width"
              :height="item.component.height"
              :left="item.left"
              :top="item.top"
              :id="`${item.id}`"
              :isLock="item.isLock"
              :display="item.display"
              :disabled="true"
              :unitPavenType="item.unitPavenType"
              :enterActiveAnimation="item.loadAnimation"
              :renderWidth="renderWidth"
              :renderHeight="renderHeight"
              :style="{
                ...pointerEventStyle(item, isBuild)
              }"
              :panel-id="panelId"
              :status-id="statusId"
            >
              <component
                :is="renderComponent(item.component.prop)"
                :element="item"
                v-bind="item.props"
                :is-active="false"
                :style="{ overflow: item.component.width === 0 && item.component.height === 0 ? 'hidden' : '' }"
              />
            </EditShapeBox>
          </template>
        </div>
      </Transition>
    </template>

    <!-- 非滚动模式：保持原有结构 -->
    <template v-else>
      <template v-for="(item, index) in sortedComponents" :key="item.id">
        <!-- 组组件 -->
        <edit-group
          v-if="item.children && item.children.length > 0"
          :disabled="!isBuild"
          :groupData="item"
          :groupIndex="index"
          :panel-id="panelId"
          :status-id="statusId"
          :is-dynamic-panel="true"
          :isBuild="isBuild"
          :class="{ 'ft-panel-opacity-in': canAnimation }"
        />

        <!-- 普通组件 -->
        <EditShapeBox
          v-else
          :data-id="item.id"
          :width="item.component.width"
          :height="item.component.height"
          :left="item.left"
          :top="item.top"
          :id="`${item.id}`"
          :isLock="item.isLock"
          :display="item.display"
          :disabled="true"
          :unitPavenType="item.unitPavenType"
          :enterActiveAnimation="item.loadAnimation"
          :renderWidth="renderWidth"
          :renderHeight="renderHeight"
          :style="{
            ...pointerEventStyle(item, isBuild)
          }"
          :panel-id="panelId"
          :status-id="statusId"
          :class="{ 'ft-panel-opacity-in': canAnimation }"
        >
          <component
            :is="renderComponent(item.component.prop)"
            :element="item"
            v-bind="item.props"
            :is-active="false"
            :style="{ overflow: item.component.width === 0 && item.component.height === 0 ? 'hidden' : '' }"
          />
        </EditShapeBox>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

import { useEvent } from "@/hooks/useEvent";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { renderComponent } from "@/views/build/components/buildRender/core/utils";
import EditShapeBox from "@/views/build/components/buildRender/EditShapeBox.vue";
import EditGroup from "@/views/build/components/buildRender/Group.vue";
import { useAnimation } from "@/views/build/components/buildRender/hooks/useAnimation";
import type { Event } from "@/views/build/components/buildRender/type";
import { pointerEventStyle } from "@/views/build/components/buildRender/utils";

interface Props {
  /** 状态数据 */
  statusData: PanelState;
  /** 是否在编辑模式 */
  isBuild: boolean;
  /** 面板ID */
  panelId: number;
  /** 渲染宽度 */
  renderWidth: number;
  /** 渲染高度 */
  renderHeight: number;
  /** 当前激活的ID */
  activeStatusId: string | null;
  /** 是否启用横向循环滚动 */
  enableHorizontalScroll?: boolean;
  /** 横向滚动速度 (像素/秒) */
  horizontalScrollSpeed?: number;
  /** 横向滚动方向 */
  horizontalScrollDirection?: "scrollLeft" | "scrollRight" | "scrollUp" | "scrollDown";
  /** 是否有动画效果 */
  canAnimation: boolean;
  /** 面板事件 */
  event?: Event[];
}

const props = withDefaults(defineProps<Props>(), {
  enableHorizontalScroll: false,
  horizontalScrollSpeed: 50,
  event: () => [],
  canAnimation: false
});

const animationKey = computed(() => `${props.panelId}-${props.statusData.id}`);
const { animationCallbacks, previewFlag, animationClassName, triggerAnimation, isPlay } = useAnimation(
  animationKey.value
);
const { handleEventAndCallbackEvent } = useEvent();

const animationName = ref<string>("");
const initAnimationName = ref<string>("");
const loopTimerId = ref<number | null>(null);
const isScrollPaused = ref(false);
/**
 * 滚动次数
 */
const scrollCount = ref(0);
// type scrollDirectionType = "scrollLeft" | "scrollRight" | "scrollUp" | "scrollDown";
const scrollDirection = computed(() => {
  return props.horizontalScrollDirection ?? "scrollLeft";
}); // 初始滚动方向
const statusId = computed(() => {
  return props.activeStatusId ?? undefined;
});

/**
 * 按 zIndex 排序的组件列表
 */
const sortedComponents = computed(() => {
  return [...props.statusData.config].sort((a, b) => b.zIndex - a.zIndex).reverse();
});

type ScrollComponent = (typeof sortedComponents.value)[number] & {
  __scrollKey: string;
};

const cloneChildrenWithSuffix = (
  children: ScrollComponent["children"],
  suffix: string,
  offsetX: number,
  offsetY: number
): ScrollComponent["children"] => {
  if (!children || children.length === 0) {
    return children;
  }
  return children.map((child): typeof child => {
    const nextChild = {
      ...child,
      id: `${child.id}${suffix}` as unknown as number,
      left: Number(child.left ?? 0) + offsetX,
      top: Number(child.top ?? 0) + offsetY
    } as typeof child;

    if (child.children && child.children.length > 0) {
      return {
        ...nextChild,
        children: cloneChildrenWithSuffix(child.children, suffix, offsetX, offsetY)
      } as typeof child;
    }
    return nextChild;
  }) as ScrollComponent["children"];
};

const withCopySuffix = (
  item: ScrollComponent,
  copyIndex: number,
  offsetX: number,
  offsetY: number
): ScrollComponent => {
  if (!item.children || item.children.length === 0) {
    return item;
  }
  if (copyIndex === 0) {
    return item;
  }
  const suffix = `-copy-${copyIndex}`;
  return {
    ...item,
    children: cloneChildrenWithSuffix(item.children, suffix, offsetX, offsetY)
  } as ScrollComponent;
};

/**
 * 无缝滚动所需的数据（复制一份并平移一屏）
 */
const scrollComponents = computed<ScrollComponent[]>(() => {
  const isVertical = scrollDirection.value === "scrollUp" || scrollDirection.value === "scrollDown";
  const distance = scrollLoopDistance.value;

  if (!shouldScroll.value || distance <= 0) {
    return sortedComponents.value.map(
      (item) =>
        ({
          ...withCopySuffix(item as ScrollComponent, 0, 0, 0),
          left: item.left,
          top: item.top,
          __scrollKey: `${item.id}-0`
        }) as ScrollComponent
    );
  }

  const firstCopy = sortedComponents.value.map(
    (item) =>
      ({
        ...withCopySuffix(item as ScrollComponent, 0, 0, 0),
        left: item.left,
        top: item.top,
        __scrollKey: `${item.id}-0`
      }) as ScrollComponent
  );
  const secondCopy = sortedComponents.value.map(
    (item) =>
      ({
        ...withCopySuffix(item as ScrollComponent, 1, isVertical ? 0 : distance, isVertical ? distance : 0),
        left: item.left + (isVertical ? 0 : distance),
        top: item.top + (isVertical ? distance : 0),
        __scrollKey: `${item.id}-1`
      }) as ScrollComponent
  );

  const thirdCopy = sortedComponents.value.map(
    (item) =>
      ({
        ...withCopySuffix(item as ScrollComponent, 2, isVertical ? 0 : distance * 2, isVertical ? distance * 2 : 0),
        left: item.left + (isVertical ? 0 : distance * 2),
        top: item.top + (isVertical ? distance * 2 : 0),
        __scrollKey: `${item.id}-2`
      }) as ScrollComponent
  );
  return [...firstCopy, ...secondCopy, ...thirdCopy];
});

/**
 * 计算内容总宽度（最右侧组件的右边界）
 */
const contentWidth = computed(() => {
  if (!props.statusData.config || props.statusData.config.length === 0) {
    return 0;
  }

  const maxRight = Math.max(...props.statusData.config.map((comp) => comp.left + comp.component.width));

  return maxRight;
});

const contentHeight = computed(() => {
  if (!props.statusData.config || props.statusData.config.length === 0) {
    return 0;
  }

  const maxBottom = Math.max(...props.statusData.config.map((comp) => comp.top + comp.component.height));

  return maxBottom;
});

/**
 * 计算最靠前元素的 left 值（最小 left）
 */
const minLeft = computed(() => {
  if (!props.statusData.config || props.statusData.config.length === 0) {
    return 0;
  }

  return Math.min(...props.statusData.config.map((comp) => comp.left));
});

const minTop = computed(() => {
  if (!props.statusData.config || props.statusData.config.length === 0) {
    return 0;
  }

  return Math.min(...props.statusData.config.map((comp) => comp.top));
});

/**
 * 计算滚动总距离（确保最后一个元素完全离开可视区域）
 */
const scrollDistanceX = computed(() => {
  const distance = contentWidth.value - minLeft.value;
  if (distance <= 0) {
    return 0;
  }
  return Math.ceil(distance) + 1;
});

const scrollDistanceY = computed(() => {
  const distance = contentHeight.value - minTop.value;
  if (distance <= 0) {
    return 0;
  }
  return Math.ceil(distance) + 1;
});

const scrollDistance = computed(() => {
  return scrollDirection.value === "scrollUp" || scrollDirection.value === "scrollDown"
    ? scrollDistanceY.value
    : scrollDistanceX.value;
});

const SCROLL_COPY_COUNT = 3;
const SCROLL_GAP = 20;

const scrollLoopDistance = computed(() => {
  if (scrollDistance.value <= 0) {
    return 0;
  }
  const viewportSize =
    scrollDirection.value === "scrollUp" || scrollDirection.value === "scrollDown"
      ? props.renderHeight
      : props.renderWidth;

  return Math.ceil(Math.max(scrollDistance.value, viewportSize) + SCROLL_GAP);
});

/**
 * 是否应该启用滚动（内容宽度 > 容器宽度 且非编辑模式）
 */
const shouldScroll = computed(() => {
  return props.enableHorizontalScroll;
});
const canAnimation = computed(() => {
  return props.canAnimation;
});

/**
 * 动画持续时间 (秒)
 */
const animationDuration = computed(() => {
  if (!shouldScroll.value || props.horizontalScrollSpeed <= 0) {
    return 0;
  }

  return scrollLoopDistance.value / props.horizontalScrollSpeed;
});

/**
 * 无缝滚动容器宽度
 */
const scrollingContentStyle = computed(() => {
  if (!shouldScroll.value || scrollLoopDistance.value <= 0) {
    return {};
  }
  return {
    animationPlayState: isScrollPaused.value ? "paused" : "running",
    width:
      scrollDirection.value === "scrollUp" || scrollDirection.value === "scrollDown"
        ? "100%"
        : `${scrollLoopDistance.value * SCROLL_COPY_COUNT}px`,
    height:
      scrollDirection.value === "scrollUp" || scrollDirection.value === "scrollDown"
        ? `${scrollLoopDistance.value * SCROLL_COPY_COUNT}px`
        : "100%"
  };
});

/**
 * 创建并挂载全局滚动动画
 * @returns 动画名称
 */
const createGlobalScrollAnimation = ({
  statusId,
  startOffset,
  endOffset
}: {
  statusId: string;
  startOffset: number;
  endOffset: number;
}) => {
  const animationName = `horizontal-scroll-${statusId}`;

  const styleElement = document.createElement("style");
  styleElement.id = `animation-${statusId}`;
  styleElement.innerHTML = createScrollAnimation({
    name: animationName,
    startPosition: startOffset,
    endPosition: endOffset
  });
  document.head.appendChild(styleElement);

  return animationName;
};

const createGlobalInitScrollAnimation = ({
  statusId,
  startPosition,
  endPosition
}: {
  statusId: string;
  startPosition: number;
  endPosition: number;
}) => {
  const animationName = `horizontal-scroll-init-${statusId}`;

  const styleElement = document.createElement("style");
  styleElement.id = `animation-init-${statusId}`;
  styleElement.innerHTML = createScrollAnimation({
    name: animationName,
    startPosition,
    endPosition
  });
  document.head.appendChild(styleElement);

  return animationName;
};

const createScrollAnimation = ({
  name,
  startPosition,
  endPosition
}: {
  name: string;
  startPosition: number;
  endPosition: number;
}) => {
  const isVertical = scrollDirection.value === "scrollUp" || scrollDirection.value === "scrollDown";
  const directionSign = scrollDirection.value === "scrollRight" || scrollDirection.value === "scrollDown" ? 1 : -1;
  const fromValue = startPosition * directionSign;
  const toValue = endPosition * directionSign;
  const fromTransform = isVertical ? `translate3d(0, ${fromValue}px, 0)` : `translate3d(${fromValue}px, 0, 0)`;
  const toTransform = isVertical ? `translate3d(0, ${toValue}px, 0)` : `translate3d(${toValue}px, 0, 0)`;

  return `
    @keyframes ${name} {
      0% {
        transform: ${fromTransform};
      }
      100% {
        transform: ${toTransform};
      }
    }
  `;
};

/**
 * 移除全局滚动动画
 * @param animationId 动画唯一标识
 */
const removeGlobalAnimation = (styleElementId: string) => {
  const styleElement = document.getElementById(styleElementId);
  if (styleElement) {
    document.head.removeChild(styleElement);
  }
};

/**
 * 触发循环滚动动画
 */
const triggerLoopAnimation = () => {
  triggerAnimation({
    animation: {
      type: scrollCount.value === 0 ? initAnimationName.value : animationName.value,
      delay: 0,
      timingFunction: "linear",
      duration: animationDuration.value * 1000
    },
    triggerType: "preview",
    newAnimationCallback: {
      onAfterEnter: () => {
        if (shouldScroll.value) {
          // 动画结束后，使用 nextTick 重新触发动画，实现循环播放
          scrollCount.value++;
          handleEventAndCallbackEvent({
            throwValue: {},
            events: props.event,
            id: props.panelId,
            triggerType: EventTypeEnum.ScrollEnd
          });

          nextTick(() => {
            triggerLoopAnimation();
          });
        }
      }
    }
  });
};

const mountAnimation = () => {
  const scrollDistanceVal = scrollLoopDistance.value;
  const isReverse = scrollDirection.value === "scrollRight" || scrollDirection.value === "scrollDown";
  const startOffset = isReverse ? -scrollDistanceVal : 0;
  const endOffset = isReverse ? 0 : scrollDistanceVal;

  animationName.value = createGlobalScrollAnimation({
    statusId: animationKey.value,
    startOffset,
    endOffset
  });

  initAnimationName.value = createGlobalInitScrollAnimation({
    statusId: animationKey.value,
    startPosition: startOffset,
    endPosition: endOffset
  });
};

const unMountAnimation = () => {
  scrollCount.value = 0;
  removeGlobalAnimation(`animation-${animationKey.value}`);
  removeGlobalAnimation(`animation-init-${animationKey.value}`);
  if (loopTimerId.value) {
    window.clearInterval(loopTimerId.value);
    loopTimerId.value = null;
  }
};

const startLoopTimer = () => {
  if (loopTimerId.value) {
    window.clearInterval(loopTimerId.value);
  }
  const checkIntervalMs = 200;
  loopTimerId.value = window.setInterval(() => {
    if (!shouldScroll.value || animationDuration.value <= 0) {
      return;
    }
    if (!isPlay.value) {
      triggerLoopAnimation();
    }
  }, checkIntervalMs);
};

const restartScroll = async () => {
  if (!shouldScroll.value || scrollLoopDistance.value <= 0) {
    return;
  }
  scrollCount.value = 0;
  unMountAnimation();
  previewFlag.value = false;
  await nextTick();
  previewFlag.value = true;
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  mountAnimation();
  startLoopTimer();
  nextTick(() => {
    triggerLoopAnimation();
  });
};

const pauseScroll = () => {
  if (!shouldScroll.value) {
    return;
  }
  isScrollPaused.value = true;
};

const startScroll = () => {
  if (!shouldScroll.value || animationDuration.value <= 0) {
    return;
  }

  isScrollPaused.value = false;
  startLoopTimer();

  if (!isPlay.value) {
    triggerLoopAnimation();
  }
};

defineExpose({
  pauseScroll,
  startScroll
});

/**
 * 初始化：挂载全局动画
 */
onMounted(() => {
  if (shouldScroll.value) {
    restartScroll();
  }
});

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  // 清理全局动画样式
  unMountAnimation();
});

watch(
  () => [
    props.enableHorizontalScroll,
    props.horizontalScrollSpeed,
    scrollDirection.value,
    scrollLoopDistance.value,
    props.renderWidth,
    props.renderHeight
  ],
  async () => {
    if (shouldScroll.value) {
      await restartScroll();
    } else {
      isScrollPaused.value = false;
      unMountAnimation();
    }
  }
);

watch(
  () => props.statusData.config,
  async () => {
    if (!shouldScroll.value) {
      return;
    }
    await restartScroll();
  }
);
</script>
<style>
.ft-panel-opacity-in {
  animation-name: opacity-in;
  animation-duration: 1s;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-fill-mode: both;
}
</style>
<style lang="scss" scoped>
.status-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // overflow: hidden;
}

.scrolling-container {
  position: absolute;
  top: 0;
  left: 0;
  width: auto;
  height: 100%;
  --start-offset: 0px;
  --scroll-distance: 0px;
  --content-width: 0px;
  --animation-duration: 10s;
}

.scrolling-content {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--content-width);
  will-change: transform;
}
</style>
