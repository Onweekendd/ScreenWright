<!-- 渲染组件 -->
<template>
  <div class="ft-panel" v-if="activeStatus" :style="getFrostedStyle" :key="refreshKey">
    <BuildMask
      v-if="isBuild.value"
      :id="element.id"
      :tip-text="isPopupInScene ? '双击进入场景弹窗面板' : '双击进入动态面板'"
    />

    <!-- 箭头导航 -->
    <div
      class="panel-arrow"
      :style="[arrowContainStyle as any]"
      v-if="element.option.rotationShow && element.option.arrowShow && element.option.rotationType === ''"
    >
      <div :style="arrowLStyle" @click="switchStatus('prev')" />
      <div :style="arrowRStyle" @click="switchStatus('next')" />
    </div>

    <div class="panel-layout" :style="setPerspective">
      <!-- 正常模式 -->
      <div
        v-if="!rotationType || !element.option.rotationShow"
        class="panel-view"
        :style="[bgStyle, setTranslate3d]"
        ref="panelViewDefault"
      >
        <!-- 默认渲染方式 - 使用 StatusView 组件 -->
        <StatusView
          ref="statusViewRef"
          :status-data="activeStatus"
          :active-status-id="activeStatus.id"
          :is-build="isBuild.value"
          :panel-id="element.id"
          :render-width="Number(element.component.width)"
          :render-height="Number(element.component.height)"
          :enable-horizontal-scroll="element.option.enableHorizontalScroll"
          :horizontal-scroll-speed="element.option.horizontalScrollSpeed"
          :horizontal-scroll-direction="element.option.horizontalScrollDirection"
          :canAnimation="canAnimation"
        />
      </div>

      <!-- 轮播模式 -->
      <div
        v-if="rotationType && element.option.rotationShow"
        class="panel-view panel-view-card"
        :style="[bgStyle]"
        ref="panelViewCard"
      >
        <div
          :class="['subgroupItem', `is-ani-${index}`]"
          v-for="(status, index) in instance?.panelData || []"
          :ref="
            (el) => {
              if (el) statusCardRefs[index] = el as HTMLElement;
            }
          "
          :key="status.id"
          :style="{
            ...setAniStyle(status)
          }"
          @click.stop="($event) => handleSwitch({ event: $event })"
        >
          <template
            v-for="(item, childIndex) in status.config.sort((a, b) => a.zIndex - b.zIndex)"
            v-bind:key="item.id"
          >
            <edit-group
              :disabled="!isBuild.value"
              v-if="item.children && item.children.length > 0"
              :groupData="item"
              :groupIndex="childIndex"
              :panel-id="element.id"
              :status-id="activeStatus.id"
              :isBuild="isBuild.value"
            />

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
              :style="{
                ...pointerEventStyle(item, isBuild.value)
              }"
              :panel-id="element.id"
              :status-id="activeStatus.id"
              :renderWidth="Number(element.component.width)"
              :renderHeight="Number(element.component.height)"
            >
              <component
                :is="renderComponent(item.component.prop)"
                :element="item"
                v-bind="item.props"
                :is-active="false"
                style="width: 100%; height: 100%"
              />
            </EditShapeBox>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Ref } from "vue";
import { computed, onMounted, ref, watch } from "vue";

import { isUndefined } from "lodash-es";

import { useFrostedStyle } from "@/views/build/components/buildConfig/components/frostedGlassConfig/useFrostedStyle";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import EditShapeBox from "@/views/build/components/buildRender/EditShapeBox.vue";
import EditGroup from "@/views/build/components/buildRender/Group.vue";
import { pointerEventStyle } from "@/views/build/components/buildRender/utils";

import BuildMask from "./components/BuildMask.vue";
import StatusView from "./components/StatusView.vue";
import { useDynamicPanel } from "./useDynamicPanel";

const props = defineProps<{
  element: DynamicPanelProps;
}>();
const { getFrostedStyle } = useFrostedStyle(props.element);

// 创建DOM引用
const panelViewDefault = ref<HTMLElement | null>(null);
const panelViewCard = ref<HTMLElement | null>(null);
const statusCardRefs = ref<HTMLElement[]>([]);
const statusViewRef = ref<{ pauseScroll: () => void; startScroll: () => void } | null>(null);

// const overflowStyle = computed(() => {
//   return props.element.option.enableScroll ? { overflow: "scroll" } : { overflow: "hidden" };
// });

const isPopupInScene = computed(() => {
  return props.element.isPopupInScene;
});
const canAnimation = computed(() => {
  let option = props.element.option;
  return option.rotationShow && option.rotationType === "";
});

const {
  instance,
  isBuild,
  activeStatus,
  rotationType,
  arrowContainStyle,
  arrowLStyle,
  arrowRStyle,
  setPerspective,
  setTranslate3d,
  bgStyle,
  autoPlay,
  refreshKey,
  initPanel,
  renderComponent,
  switchStatus,
  handleSwitch,
  setAniStyle,
  startAutoPlay,
  stopAutoPlay,
  updateProperty,
  setupTouchEvents
  // provide/inject 相关数据
} = useDynamicPanel({
  dynamicPanel: props.element,
  panelViewDefault: panelViewDefault as Ref<HTMLElement | null>,
  panelViewCard: panelViewCard as Ref<HTMLElement | null>,
  statusViewRef
});

onMounted(async () => {
  let option = props.element.option;
  if (!option.horizontalScrollDirection) {
    option.horizontalScrollDirection = "scrollLeft";
  }
  if (isUndefined(option.horizontalScrollSpeed)) {
    option.horizontalScrollSpeed = 50;
  }
  await initPanel();
});

watch(
  () => props.element.option,
  () => {
    if (!instance.value) {
      return;
    }
    instance.value.updateBaseProps(props.element);
    updateProperty();
  },
  {
    deep: isBuild.value ? true : false
  }
);
watch([() => panelViewCard.value !== null, () => panelViewDefault.value !== null], () => {
  updateProperty();
  setupTouchEvents();
});

// 监听自动播放状态变化
watch(autoPlay, (newVal) => {
  if (newVal) {
    startAutoPlay();
  } else {
    stopAutoPlay();
  }
});

watch(
  () => instance.value?.activeStatusId,
  (newActiveStatusId) => {
    if (!instance.value || newActiveStatusId === undefined) {
      return;
    }
    const activeStatusIndex = instance.value.panelData.findIndex((item) => item.id === newActiveStatusId);
    if (activeStatusIndex === -1) {
      return;
    }

    if (rotationType.value !== "" && statusCardRefs.value[activeStatusIndex] && !isBuild.value) {
      statusCardRefs.value[activeStatusIndex].click();
    }
  }
);
</script>
<style lang="scss" scoped>
.ft-panel {
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  .panel-layout {
    height: 100%;
    width: 100%;
  }

  .panel-view {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0px;
    left: 0px;

    &.panel-view-card {
      background-color: transparent !important;
      --card1TranslateY: 50px;
      --card2TranslateY: -0px;
      --card3TranslateY: -50px;
      --card2TranslateX-l: -200px;
      --card2TranslateX-r: 200px;
      --card3TranslateX-l: -300px;
      --card3TranslateX-r: 300px;
      --card1Opacity: 1;
      --card2Opacity: 0.25;
      --card3Opacity: 0.1;
      --card1ScaleX: 0.7;
      --card1ScaleY: 0.7;
      --card2ScaleX: 0.6;
      --card2ScaleY: 0.6;
      --card3ScaleX: 0.5;
      --card3ScaleY: 0.5;
      overflow: visible !important;
    }
  }

  .subgroupItem {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: center;
    transition: transform 0.5s linear;
    pointer-events: visible;
    opacity: 0;

    &.is-ani-0 {
      opacity: var(--card1Opacity);
      z-index: 5;
      transform: translate(0%, var(--card1TranslateY)) scale(var(--card1ScaleX), var(--card1ScaleY));
    }

    &.is-ani-1 {
      opacity: var(--card2Opacity);
      z-index: 4;
      transform: translate(var(--card2TranslateX-r), var(--card2TranslateY))
        scale(var(--card2ScaleX), var(--card2ScaleY));
    }

    &.is-ani-2 {
      opacity: var(--card2Opacity);
      z-index: 3;
      transform: translate(var(--card2TranslateX-l), var(--card2TranslateY))
        scale(var(--card2ScaleX), var(--card2ScaleY));
    }

    &.is-ani-3 {
      opacity: var(--card3Opacity);
      z-index: 2;
      transform: translate(var(--card3TranslateX-r), var(--card3TranslateY))
        scale(var(--card3ScaleX), var(--card3ScaleY));
    }

    &.is-ani-4 {
      opacity: var(--card3Opacity);
      z-index: 1;
      transform: translate(var(--card3TranslateX-l), var(--card3TranslateY))
        scale(var(--card3ScaleX), var(--card3ScaleY));
    }

    @for $i from 5 through 20 {
      &.is-ani-#{$i} {
        opacity: 0;
        transform: translate(100%, 0) scale(0.5);
        pointer-events: none;
      }
    }
  }

  // 渐隐渐显动画
  .fading-in-by-status {
    animation: fading-in-by-status 2s linear;
    animation-fill-mode: forwards;
    opacity: 0;
  }

  @keyframes fading-in-by-status {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  // 箭头导航样式
  .panel-arrow {
    z-index: 10;
    pointer-events: none;
  }
}
</style>
