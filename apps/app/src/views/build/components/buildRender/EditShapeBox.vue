<template>
  <Transition
    v-if="canExecuteAnimation"
    appear
    :name="animationClassName"
    @before-enter="animationCallbacks.onBeforeEnter"
    @enter="animationCallbacks.onEnter"
    @after-enter="animationCallbacks.onAfterEnter"
    @before-leave="animationCallbacks.onBeforeLeave"
    @leave="animationCallbacks.onLeave"
    @after-leave="animationCallbacks.onAfterLeave"
    @enter-cancelled="animationCallbacks.onEnterCancelled"
    @leave-cancelled="animationCallbacks.onLeaveCancelled"
  >
    <div
      v-show="previewFlag && display"
      class="go-shape-box"
      :style="cItemStyle"
      :class="{
        lock,
        'is-multi-selected': multiSelectOutline,
        isDragging,
        [`status-animation-transition-${id}`]: true
      }"
      :id="`${id}`"
    >
      <slot />
      <!-- 选中态框 + 缩放锚点由 SelectionTransformer 统一绘制 -->
      <!-- 选中 -->
      <!-- !disabled || !lock -->
      <div class="shape-modal" :class="{ ...eventsIconClass }" v-if="shapeModalShow" :id="`shape-modal-${id}`" />
    </div>
  </Transition>
  <div
    v-else
    v-show="previewFlag && display"
    class="go-shape-box"
    :style="cItemStyle"
    :class="{
      lock,
      'is-multi-selected': multiSelectOutline,
      isDragging,
      [`status-animation-transition-${id}`]: true
    }"
    :id="`${id}`"
  >
    <slot />
    <!-- 选中态框 + 缩放锚点由 SelectionTransformer 统一绘制 -->
    <!-- 选中 -->
    <!-- !disabled || !lock -->
    <div class="shape-modal" :class="{ ...eventsIconClass }" v-if="shapeModalShow" :id="`shape-modal-${id}`" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { computed, onMounted, watch } from "vue";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { ChainCollector } from "@/views/build/components/buildRender/core/BaseComponent/filterData/CoR/ChainCollector";
import { ChainExecutor } from "@/views/build/components/buildRender/core/BaseComponent/filterData/CoR/ChainExecutor";

import { useCustomAnimationData } from "../buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import { useStatusAnimationData } from "../buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import {
  EnterAnimationHandler,
  PanelAnimationHandler,
  ScreenAnimationHandler
} from "./core/BaseComponent/filterData/CoR/AnimationHandlers";
import { useAnimation } from "./hooks/useAnimation";
import { useEditStore } from "./hooks/useEditStore";
import type { Animation } from "./type";
import { EditCanvasTypeEnum } from "./type";
import { setSizeStyle } from "./utils";

const props = defineProps({
  eventsIconClass: {
    type: Object as PropType<Record<string, boolean>>,
    required: false,
    default: () => ({})
  },
  scale: {
    type: Number,
    required: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isDynamicPanel: {
    type: Boolean,
    default: false
  },
  width: {
    type: [Number, String],
    default: 0
  },
  height: {
    type: [Number, String],
    default: 0
  },
  left: {
    type: [Number, String],
    default: 0
  },
  top: {
    type: [Number, String],
    default: 0
  },
  id: {
    type: [String, Number],
    default: ""
  },
  isLock: {
    type: Boolean,
    default: false
  },
  display: {
    type: Boolean,
    default: true
  },
  isSelect: {
    type: Boolean,
    default: false
  },
  unitPavenType: {
    type: String,
    default: "px"
  },
  prop: {
    type: String,
    default: ""
  },
  panelId: {
    type: Number,
    default: undefined,
    required: false
  },
  statusId: {
    type: String,
    default: undefined,
    required: false
  },
  changeKey: {
    type: Number,
    default: 0
  },
  enterActiveAnimation: {
    type: Object as PropType<Animation>,
    default: () => ({
      type: "fade",
      direction: "in",
      duration: 0.3,
      delay: 0,
      timingFunction: "ease-in-out"
    })
  },
  renderWidth: {
    type: Number,
    default: 0
  },
  renderHeight: {
    type: Number,
    default: 0
  }
});

const { animationClassName, triggerAnimation, previewFlag, animationCallbacks } = useAnimation(props.id);
const { panelIdAndStatusIdToAnimationMap } = useCustomAnimationData();
const { animatedComponentIds } = useStatusAnimationData();
const { callbackArgumentsInstance } = useCallbackArguments();
const { isBuild, editCanvas, targetChart } = useEditStore();
const isDragging = computed(() => editCanvas.value[EditCanvasTypeEnum.IS_DRAG]);
// 单选态的框 + 锚点由 SelectionTransformer 统一绘制；这里只在多选时给每个成员一条 1px 细描边
const multiSelectOutline = computed(
  () => props.isSelect && !props.disabled && (targetChart.value.selectId?.length ?? 0) > 1
);

// const cursorStyle = computed(() => {
//   return window.location.href.includes("/build") ? "move" : "auto";
// });

const cItemStyle = computed(() => {
  const unitPavenType = props.unitPavenType;
  const width = props.width;
  const height = props.height;
  const renderWidth = props.renderWidth;
  const renderHeight = props.renderHeight;
  const prop = props.prop;
  return {
    ...setSizeStyle({
      width: Number(width),
      height: Number(height),
      unitPavenType,
      renderWidth: Number(renderWidth),
      renderHeight: Number(renderHeight),
      prop
    }),
    left: props.left + "px",
    top: props.top + "px"
  };
});

/**
 * 构建动画处理器链的头部
 * @param isPreview 是否为预览模式
 * @returns 责任链的头部处理器
 */
const buildAnimationChainHead = (isPreview: boolean = false) => {
  // 创建具体的动画处理器
  const enterHandler = new EnterAnimationHandler(props.enterActiveAnimation, triggerAnimation, isPreview);
  const panelHandler = new PanelAnimationHandler(
    props.panelId,
    props.statusId,
    props.id,
    () => panelIdAndStatusIdToAnimationMap.value,
    triggerAnimation
  );
  const screenHandler = new ScreenAnimationHandler(
    props.id,
    () => panelIdAndStatusIdToAnimationMap.value,
    triggerAnimation
  );

  // 使用收集器构建责任链：进入动画 -> 面板动画 -> 大屏动画
  const animationChainCollector = new ChainCollector();
  animationChainCollector.addHandler(enterHandler).addHandler(panelHandler).addHandler(screenHandler);

  // 构建并返回链的头部
  return animationChainCollector.buildChain();
};

const createAnimationChain = ({ isPreview }: { isPreview: boolean } = { isPreview: false }) => {
  // 构建动画处理责任链
  const animationChainExecutor = new ChainExecutor();

  // 构建链并设置到执行器
  const chainHead = buildAnimationChainHead(isPreview);
  animationChainExecutor.setChain(chainHead);

  return animationChainExecutor;
};

/**
 * 判断动画链是否可以执行动画
 */
const canExecuteAnimation = computed(() => {
  const eventMappingTarget = callbackArgumentsInstance.value.getEventMappingTarget();
  const bindEvents = eventMappingTarget.get(`${props.id}`) ?? [];

  const chainHead = buildAnimationChainHead(false);

  // 检查责任链是否可以处理动画
  const canChainHandle = chainHead ? chainHead.canChainHandle() : false;

  // 检查是否有绑定的事件
  const hasBindEvents = bindEvents.length > 0;

  // 检查是否在构建模式
  const isInBuildMode = isBuild();

  const isInStatusAnimation = animatedComponentIds.value.has(`${props.id}`);

  const isExitAnimation = panelIdAndStatusIdToAnimationMap.value.has(`${props.panelId}-${props.statusId}`);

  return canChainHandle || isExitAnimation || isInStatusAnimation || hasBindEvents || isInBuildMode;
});

// 动画处理器实例

onMounted(() => {
  // 执行动画处理责任链
  const animationHandler = createAnimationChain();
  animationHandler.execute();
});

// 监听动画配置变化
watch(
  () => props.enterActiveAnimation,
  () => {
    triggerAnimation({
      animation: props.enterActiveAnimation,
      triggerType: "preview"
    });
  },
  { deep: isBuild() ? true : false }
);

// 锁定
const lock = computed(() => {
  //   return props.item.status.lock
  return props.isLock;
});

const shapeModalShow = computed(() => {
  return !props.disabled;
});
</script>

<style lang="scss" scoped>
.go-shape-box {
  position: absolute;
  // cursor: v-bind("cursorStyle");

  // 多选时每个成员的 1px 细描边（整体框由 SelectionTransformer 画）
  &.is-multi-selected {
    box-shadow: 0 0 0 1px rgba(94, 98, 251, 0.5) inset;
  }

  &.lock {
    cursor: default !important;
  }

  .has-bind::after {
    content: "\e658";
    color: #ffffff;
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal;
    width: 16px;
    height: 16px;
    line-height: 16px;
    background: #e8aa2e;
    position: absolute;
    right: 0 !important;
    top: 0 !important;
    z-index: 1;
  }

  .has-encode::after {
    content: "\e658";
    color: #ffffff;
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal;
    width: 16px;
    height: 16px;
    line-height: 16px;
    background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    position: absolute;
    right: 0 !important;
    top: 0 !important;
    z-index: 1;
  }

  .has-bind.has-encode::after {
    content: "\e658\e658";
    color: #ffffff;
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal;
    width: 32px;
    height: 16px;
    line-height: 16px;
    background: linear-gradient(to right, #e8aa2e 0%, #e8aa2e 50%, #8b58e7 50%, #642cff 100%);
    position: absolute;
    right: 0 !important;
    top: 0 !important;
    z-index: 1;
  }

  .shape-modal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: move;
  }

  &:not(.isDragging) {
    .shape-modal:hover {
      box-shadow: 0 0 0 2px #5e62fb inset;
    }
  }
}
</style>
