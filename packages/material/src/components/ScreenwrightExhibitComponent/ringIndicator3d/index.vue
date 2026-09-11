<template>
  <div class="ringIndicator3d" :style="ringStyle">
    <div
      :class="{
        contentBox: true,
        ...componentClasses
      }"
      :style="getMarkStyle"
    >
      <div
        :ref="uid + 'carousel'"
        class="carousel"
        :style="carouselStyle"
        @mouseenter="mouseenter"
        @mouseleave="mouseleave"
      >
        <figure :id="uid + '-spinner'" class="spinner">
          <div
            alt=""
            v-for="(item, index) in styleList"
            :key="'spinner-item-' + index"
            :style="{
              ...item
            }"
            :class="`${uid}-spinner-item spinner-item ${activeSpinnerIndex === index ? 'activeSpinner' : ''}`"
            @click="(e) => handleClickSpinner(index)"
          >
            <div
              :style="{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }"
            >
              <div
                class="spIcon"
                :style="{
                  width: '100%',
                  position: 'absolute',
                  ...getIconStyle(dataChartItemList[index], index)
                }"
              />
              <div
                class="spNum"
                :style="{
                  position: 'absolute',
                  ...item.numStyle
                }"
                v-if="item.numStyle.showNum"
              >
                {{ dataChartItemList[index].value }}
                <span
                  class="spUnit"
                  :style="{
                    display: 'inline-block',
                    position: 'absolute',
                    ...item.numStyle.unitStyle
                  }"
                  v-if="item.numStyle.unitStyle.showNumUnit"
                >
                  {{ item.numStyle.unitStyle.numUnitText }}
                </span>
              </div>
              <div
                class="spName"
                :style="{
                  position: 'absolute',
                  ...item.nameStyle
                }"
                v-if="item.nameStyle.showName"
              >
                {{ dataChartItemList[index].name }}
              </div>
            </div>
          </div>
        </figure>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";

import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { useRingIndicator } from "./useRingIndicator";

const props = defineProps<{
  element: ComponentType;
}>();

const {
  option,
  dataChart,
  isReset,
  uid,
  ringStyle,
  componentClasses,
  getMarkStyle,
  carouselStyle,
  styleList,
  activeSpinnerIndex,
  dataChartItemList,
  timer,
  mouseleave,
  mouseenter,
  handleClickSpinner,
  getIconStyle,
  handleEventAndCallbackEvent,
  init
} = useRingIndicator(props.element);

watch(
  () => option.value,
  (nv) => {
    if (nv) {
      isReset.value = true;
      init();
    }
  },
  { deep: true }
);

watch(
  () => dataChart.value,
  (nv) => {
    if (nv) {
      let info;
      if (Array.isArray(nv)) {
        info = nv;
      } else {
        info = [nv];
      }
      dataChartItemList.value = info;
      isReset.value = true;
      init();
      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: EventTypeEnum.DataChange,
        events: props.element.events,

        throwValue: dataChartItemList.value
      });
    } else {
      dataChartItemList.value = [];
      isReset.value = true;
      init();
    }
  },
  { deep: true }
);
onMounted(() => {
  console.log("组件注册成功");
});
onBeforeUnmount(() => {
  if (timer.value !== null) {
    clearInterval(timer.value);
    timer.value = null;
  }
});
</script>

<style lang="scss" scoped>
.ringIndicator3d {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .contentBox {
    width: 100%;
    height: 100%;
    .carousel {
      width: 100%;
      height: 100%;
      figure.spinner {
        z-index: 1;
        transform-style: preserve-3d;
        width: 100%;
        height: 100%;
        // transition-duration: var(--transitionTime);
        transform: translateZ(var(--matrix3dZ))
          matrix3d(1, 0, 0, 0, 0, -0.957826, 0.287348, 0, 0, 0.287348, 0.957826, 0, 0, 0, -2088.06, 1)
          translate(var(--matrix3dX), var(--matrix3dY)) rotateX(var(--matrix3dRoateX)) rotateY(var(--matrix3dRoateY))
          rotateZ(var(--matrix3dRoateZ));
      }
      figure.spinner .spinner-item {
        position: absolute;
        left: 40%;
        outline: 1px solid transparent;
        transition-duration: var(--transitionTime);
        &.activeSpinner {
          // opacity: 1 !important;
        }
      }
    }
  }
}
</style>
