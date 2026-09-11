<template>
  <div class="iot-form-switch" :style="{ ...styleSizeName }">
    <div
      ref="switchDom"
      :class="{
        'iot-form-switch-container': true,
        ...componentClasses
      }"
      :style="containerStyle"
    >
      <div v-for="(item, index) in dataChart" :key="index" :style="textStyle">
        <!-- 开关 -->
        <el-switch
          :class="'switch-' + option.type"
          v-model="item.value"
          :disabled="iotDisabled"
          :active-color="option.activeColor"
          :inactive-color="option.inactiveColor"
          :active-text="option.activeText"
          :inactive-text="option.inactiveText"
          :width="width"
          @change="handleChange(item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

import { has } from "lodash-es";

import { setPx } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { useIotFormSwitch } from "./useIotFormSwitch";

interface Props {
  element: ComponentType;
}
const switchDom = ref<HTMLDivElement | null>(null);
const props = defineProps<Props>();
const {
  width,
  iotDisabled,
  containerStyle,
  textStyle,
  styleSizeName,
  componentClasses,
  dataChart,
  option,
  inactiveColorValue,
  activeColorValue,
  pointColorValue,
  pointColor2Value,
  borderRadiusValue,
  fontWeightValue,
  asyncDeviceStatus,
  handleIotMessageEnd,
  handleEventAndCallbackEvent,
  handleEncode
} = useIotFormSwitch(props.element);

const handleChange = (info: any) => {
  console.log(info, "fff");

  // eslint-disable-next-line vue/no-mutating-props
  props.element.data = [{ label: "开关", value: info.value }];
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: info
  });
  handleIotMessageEnd(info);
  handleEncodes(info);
};
const handleEncodes = (info: any) => {
  handleEncode(info);
};

watch(
  () => dataChart.value,
  (val) => {
    if (!val) return;
    let info;
    if (Array.isArray(val)) {
      info = val;
    } else {
      info = [val];
    }

    // asyncDeviceStatus();

    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: info
    });

    if (info && info[0] && has(info[0], "disabled")) {
      option.value.disabled = info[0].disabled;
    }
  }
);

watch(
  () => option.value.disabled,
  (val) => {
    iotDisabled.value = val;
  }
);

watch(
  () => option.value,
  (val) => {
    console.log("val===>", val);
  }
);
onMounted(async () => {
  await nextTick();
  await asyncDeviceStatus();
});
</script>

<style lang="scss" scoped>
.iot-form-switch-container {
  height: 100%;
  overflow: auto;
  background-repeat: no-repeat;
  background-size: cover;
  --inactiveColor: v-bind("inactiveColorValue");
  --activeColor: v-bind("activeColorValue");
  --pointColor: v-bind("pointColorValue");
  --pointColor2: v-bind("pointColor2Value");
  --pointSize: v-bind("setPx(option.pointSize)");
  --borderRadius: v-bind("borderRadiusValue");
  --fontColor: v-bind("option.fontColor");
  --fontSize: v-bind("setPx(option.fontSize)");
  --fontWeight: v-bind("fontWeightValue");
  & > div {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  :deep(.el-switch) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .el-switch__label {
      white-space: nowrap;
      // color: var(--fontColor);
      // font-size: var(--fontSize);
      height: fit-content;
      font-weight: var(--fontWeight);
      & > span {
        font-size: var(--fontSize);
      }
      &.is-active {
        color: var(--fontColor);
      }
    }
    .el-switch__core {
      height: 100%;
      box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);
      border-radius: var(--borderRadius);
      border-color: transparent !important;
      background: var(--inactiveColor) !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      flex: 1;
      .el-switch__action {
        width: var(--pointSize);
        height: var(--pointSize);
        left: 2%;
        top: 50%;
        transform: translateY(-50%);
        background: var(--pointColor2);
        background-size: 100% 100%;
        background-repeat: no-repeat;
      }
    }
    &.switch-image .el-switch__core {
      box-shadow: none !important;
    }
    &.is-checked {
      .el-switch__core {
        border-color: transparent !important;
        background: var(--activeColor) !important;
        background-size: 100% 100% !important;
        background-repeat: no-repeat !important;
        .el-switch__action {
          left: 98%;
          margin-left: 0;
          transform: translateX(-100%) translateY(-50%);
          background: var(--pointColor);
          background-size: 100% 100%;
          background-repeat: no-repeat;
        }
      }
    }
  }
}
</style>
