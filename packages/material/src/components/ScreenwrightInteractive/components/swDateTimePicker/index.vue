<!-- 时间选择器，日期范围选择器 -->
<template>
  <div
    :class="{
      'ft-dateTimePicker': true,
      'component-bind-events': true,
      'has-bind': events?.length && isBuild.value,
      'has-encode': encodes && encodes.length && isBuild.value
    }"
    ref="mainRef"
    :style="styleMain"
  >
    <div class="datetimerange-input" :style="{ ...setDomStyle, ...styleSizeName }" :id="`dateTimePicker-${uniqueId}`">
      <span>{{ datePickerInfo.s }}</span>
      <span style="white-space: pre" v-if="type === 'datetimerange'"> {{ rangeSeparator }} </span>
      <span v-if="type === 'datetimerange'">{{ datePickerInfo.e }}</span>
      <!-- 时间选择器 -->
      <el-date-picker
        v-if="type === 'datetime'"
        v-model="datetimeValue"
        :value-format="formatData"
        :type="datePickerType"
        placeholder="选择日期时间"
        class="ft-dateTime-content"
        :style="styleSizeName"
        popper-class="ft-datetime-date"
        ref="dateTimePickerRef"
        @change="handleChange"
        :teleported="false"
      />
      <!-- 时间范围选择器 -->
      <el-date-picker
        v-else-if="type === 'datetimerange'"
        v-model="datetimerangeValue"
        type="datetimerange"
        :value-format="formatData"
        popper-class="ft-datetimerange-date"
        :range-separator="rangeSeparator"
        class="ft-datetimerange-content"
        :style="styleSizeName"
        :align="align"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        ref="dateTimePickerRef"
        @change="handleChange"
        :teleported="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import dayjs from "dayjs";
import type { DatePickerInstance } from "element-plus";
import { ElDatePicker, ElMessage } from "element-plus";
import { has, isNil } from "lodash-es";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import { uuid } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { getDateTime } from "./utils";

defineOptions({
  name: "ftDateTimePicker"
});
// 定义props
const props = defineProps<{ element: ComponentType }>();
const uniqueId = ref(uuid());
const { isBuild, option, dataChart, width, height, encodes, events, handleEventAndCallbackEvent } = useBaseData(
  props.element
);
const { addEvent } = useActionEvent();

// 引用DOM元素
const mainRef = ref<HTMLElement | null>(null);
const dateTimePickerRef = ref<DatePickerInstance | null>(null);
const inputInner = ref<HTMLElement | null>(null);

// 响应式数据
const datetimeValue = ref("");
const datetimerangeValue = ref<string[]>([]);
const datePickerInfo = reactive({
  s: "",
  e: ""
});
const dataChartItem = ref<Record<string, any>>({});

const formatDate = (timestamp: number, format: string): string => {
  if (!timestamp) return "";
  return dayjs(timestamp).format(format);
};

// 计算属性
const formatData = computed(() => {
  // 如果是yyyy-MM-dd 转成 YYYY-MM-DD
  let dateFormat = option.value.dateFormat || "";
  let timeFormat = option.value.timeFormat || "";
  if (option.value.dateFormat || option.value.timeFormat) {
    dateFormat = dateFormat.replace(/yyyy/g, "YYYY").replace(/dd/g, "DD");

    // 转换时间格式（如果需要）
    timeFormat = timeFormat.replace(/yyyy/g, "YYYY").replace(/dd/g, "DD");

    return `${dateFormat} ${timeFormat}`.trim();
  } else {
    return `${option.value.dateFormat || ""} ${option.value.timeFormat}`;
  }
  // 转换日期格式
});

const type = computed(() => {
  return option.value.type;
});

const datePickerType = computed<"year" | "month" | "date" | "datetime">(() => {
  let type: "year" | "month" | "date" | "datetime" = "date";
  if (isNil(option.value.timeFormat)) {
    switch (option.value.dateFormat) {
      case "yyyy年":
      case "yyyy":
      case "YYYY":
      case "YYYY年":
        type = "year";
        break;
      case "MM月":
      case "yyyy年MM月":
      case "yyyy-MM":
      case "yyyy/MM":
      case "yyyy.MM":
        type = "month";
        break;
      default:
        break;
    }
  } else {
    type = "datetime";
  }
  return type;
});

const styleMain = computed(() => {
  return {
    width: width.value + "px",
    height: height.value + "px"
  };
});

const styleSizeName = computed(() => {
  return {
    width: width.value + "px",
    height: height.value + "px",
    fontFamily: option.value.fontFamily,
    fontSize: option.value.fontSize + "px"
  };
});

const align = computed(() => {
  return option.value.textAlign;
});

const rangeSeparator = computed(() => {
  return option.value.rangeSeparator;
});

const setDomStyle = computed(() => {
  let bgStyle = {};
  if (option.value.backgroundType === "color") {
    bgStyle = {
      background: `${option.value.backgroundColor} !important`
    };
  } else {
    bgStyle = {
      "background-color": "transparent",
      "background-image": `url(${setMinioUrl(option.value.backgroundImage)})`,
      "background-size": option.value.backgroundImageType,
      "background-repeat": "no-repeat"
    };
  }
  return {
    fontSize: `${option.value.fontSize}px`,
    color: `${option.value.color}`,
    fontWeight: option.value.fontWeight,
    fontFamily: option.value.fontFamily,
    fontStyle: option.value.fontStyle,
    letterSpacing: `${option.value.letterSpacing}px`,
    ...bgStyle,
    border: `${option.value.borderWidth}px solid ${option.value.borderColor} !important`,
    "border-radius": option.value.borderRadius + "px !important"
  };
});

// 方法
const setProperty = (property: string, value: string) => {
  if (inputInner.value && inputInner.value.style) {
    inputInner.value.style.setProperty(property, value);
  }
};

const setStyle = () => {
  setProperty("--fontSize", `${option.value.fontSize}px`);
  setProperty("--paddingLeft", `${option.value.fontSize + 10}px`);
  setProperty("--color", option.value.color);
  setProperty("--fontWeight", option.value.fontWeight);
  setProperty("--fontFamily", option.value.fontFamily);
  setProperty("--fontStyle", option.value.fontStyle);
  setProperty("--letterSpacing", `${option.value.letterSpacing}px`);
  setProperty("--lineHeight", `${height.value - option.value.borderWidth * 2}px`);
  setProperty("--calendarShow", option.value.calendarShow ? `block` : `none`);
  setProperty(
    "--calendarposition",
    option.value.calendarPosition === "bottom"
      ? `${option.value.spacing}px`
      : `-${option.value.calendarHeight + option.value.spacing}px`
  );

  setProperty("--calendarWidth", `${option.value.calendarWidth}px`);
  setProperty("--calendarHeight", `${option.value.calendarHeight}px`);
  setProperty("--calendarBackground", option.value.calendarBackgroundColor);
  setProperty("--calendarFontFamily", option.value.calendarFontFamily);
  setProperty("--calendarFontSize", option.value.calendarFontSize + "px");
  setProperty("--calendarColor", option.value.calendarColor);
  setProperty("--calendarFontStyle", option.value.calendarFontStyle);
  setProperty("--calendarFontWeight", option.value.calendarFontWeight);

  setProperty("--lineDecorativeColor", option.value.lineDecorativeColor);

  setProperty("--selectTimeBackground", option.value.timeSelectColor);

  setProperty("--buttonFontFamily", option.value.buttonFontFamily);
  setProperty("--buttonColor", option.value.buttonColor);
  setProperty("--buttonFontSize", option.value.buttonFontSize + "px");
  setProperty("--buttonFontStyle", option.value.buttonFontStyle);
  setProperty("--buttonFontWeight", option.value.buttonFontWeight);
};

const setInputFormat = () => {
  setTimeout(() => {
    const f = formatData.value;
    // 存在点击清空、确定按钮，时间下拉列表不隐藏的现象
    if (
      dateTimePickerRef.value &&
      dateTimePickerRef.value.$el &&
      typeof dateTimePickerRef.value.$el.querySelectorAll === "function"
    ) {
      const timePanels = dateTimePickerRef.value.$el.querySelectorAll(".el-time-panel");
      if (timePanels && timePanels.length) {
        timePanels.forEach((d: HTMLElement) => {
          if (d && d.style) {
            d.style.display = "none";
          }
        });
      }
    }

    if (type.value === "datetime" && dataChartItem.value.value) {
      const time = getDateTime(dataChartItem.value.value);
      const fd = formatDate(time, f);
      if (dateTimePickerRef.value) {
        datetimeValue.value = fd;

        if (dateTimePickerRef.value.$el && typeof dateTimePickerRef.value.$el.querySelector === "function") {
          const inputDom = dateTimePickerRef.value.$el.querySelector(".el-input__inner");
          if (inputDom) {
            inputDom.value = fd;
          }
        }
      }
      datePickerInfo.s = fd;
    } else if (type.value === "datetimerange" && dataChartItem.value.startTime && dataChartItem.value.endTime) {
      const time1 = getDateTime(dataChartItem.value.startTime);
      const time2 = getDateTime(dataChartItem.value.endTime);
      const fd = [formatDate(time1, f), formatDate(time2, f)];
      if (dateTimePickerRef.value) {
        datetimerangeValue.value = fd;
        if (dateTimePickerRef.value.$el && typeof dateTimePickerRef.value.$el.querySelectorAll === "function") {
          const inputDoms = dateTimePickerRef.value.$el.querySelectorAll(".el-range-input");
          if (inputDoms && inputDoms.length >= 2) {
            inputDoms[0].value = fd[0];
            inputDoms[1].value = fd[1];
          }
        }
      }
      datePickerInfo.s = fd[0];
      datePickerInfo.e = fd[1];
    }
  }, 100);
};

const checkDateLimit = (oldval: string, newval: string) => {
  if (oldval && newval) {
    const p = getDateTime(newval);
    if (
      dataChartItem.value.startTime &&
      dataChartItem.value.endTime &&
      p >= getDateTime(dataChartItem.value.startTime) &&
      p <= getDateTime(dataChartItem.value.endTime)
    ) {
      datetimeValue.value = newval;
      dataChartItem.value.value = newval;
    } else {
      datetimeValue.value = oldval;
      dataChartItem.value.value = oldval;
      ElMessage.error(`请选择${dataChartItem.value.startTime}~${dataChartItem.value.endTime}范围的时间`);
    }
    setInputFormat();
  }
};

const handleChange = (params: any) => {
  // 时间选择器
  console.log("handleChange", params, option.value.type);
  if (option.value.type === "datetime") {
    checkDateLimit(dataChartItem.value.value, params);
  } else if (option.value.type === "datetimerange") {
    // 时间范围选择器
    dataChartItem.value.startTime = params ? params[0] : "";
    dataChartItem.value.endTime = params ? params[1] : "";
    setInputFormat();
  }
  console.log(dataChartItem.value, "dataChartItem.value");

  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: dataChartItem.value
  });
};

// 监听器
watch(
  () => width.value,
  (n) => {
    if (inputInner.value && inputInner.value.style) {
      inputInner.value.style.setProperty("--width", `${n}px`);
    }
  }
);

watch(
  () => height.value,
  (n) => {
    if (inputInner.value && inputInner.value.style) {
      inputInner.value.style.setProperty("--height", `${n}px`);
      inputInner.value.style.setProperty("--lineHeight", height.value - option.value.borderWidth * 2 + "px");
    }
  }
);

watch(
  () => option.value,
  () => {
    setStyle();
    if (isBuild.value) {
      setInputFormat();
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => option.value.calendarShow,
  (n) => {
    if (n && dateTimePickerRef.value) {
      (dateTimePickerRef.value as any).focus();
    } else if (dateTimePickerRef.value) {
      (dateTimePickerRef.value as any).handleClose();
    }
  }
);

watch(
  () => dataChart.value,
  (nv) => {
    console.log("dataChart.value", nv);
    if (Array.isArray(nv) && nv.length) {
      dataChartItem.value = nv[0];
    } else if (nv) {
      dataChartItem.value = nv;
    }

    if (type.value === "datetime" && dataChartItem.value.value) {
      datetimeValue.value = dataChartItem.value.value;
    } else if (type.value === "datetimerange" && dataChartItem.value.startTime && dataChartItem.value.endTime) {
      datetimerangeValue.value = [dataChartItem.value.startTime, dataChartItem.value.endTime];
    }
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: dataChartItem.value
    });
  },
  { deep: true, immediate: true }
);
const initAttrs = () => {
  let option = props.element.option;

  if (!has(props.element.option, "calendarWidth")) {
    option.calendarWidth = 400;
  }
};
// 生命周期钩子
onMounted(async () => {
  await nextTick();
  initAttrs();
  if (dateTimePickerRef.value) {
    if (dateTimePickerRef.value.$el) {
      // 直接使用ref获取的实例没有$el,所以改用原生方式获取
      inputInner.value = document.getElementById(`dateTimePicker-${uniqueId.value}`);
      // inputInner.value = dateTimePickerRef.value.$el
      if (inputInner.value && inputInner.value.style) {
        inputInner.value.style.setProperty("--width", `${width.value}px`);
        inputInner.value.style.setProperty("--height", `${height.value}px`);
      }
    }

    setStyle();
    if (option.value.calendarShow) {
      if (typeof (dateTimePickerRef.value as any).focus === "function") {
        (dateTimePickerRef.value as any).focus();
      }
    }

    setInputFormat();

    // 注册组件事件 - 包装handleChange为handleClick
    const handleClick = (throwValue: any) => {
      // 如果传入的是日期值，直接触发变化
      if (throwValue) {
        handleChange(throwValue);
      }
    };

    addEvent({
      [`${interactiveEnum.FtDateTimePicker}-${props.element.id}`]: { handleClick }
    });
  }
});
</script>

<style lang="scss">
.ft-dateTimePicker {
  .el-input__wrapper,
  .el-input__wrapper.is-focus,
  .el-input__wrapper:hover,
  .el-input__inner,
  .el-range-input {
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    background: transparent !important;
  }

  white-space: nowrap;
  --calendarShow: none;
  .datetimerange-input {
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: pre-wrap;
    // cursor: pointer;
    & > span {
      pointer-events: none;
    }
    .el-date-editor {
      white-space: normal;
      background: transparent;
      border: none;
      position: absolute;
      top: 0;
      left: 0;
      .el-input__icon,
      .el-range-input,
      .el-range-separator,
      .el-input__inner,
      .el-input__prefix,
      .el-input__suffix {
        opacity: 0;
        color: transparent;
        cursor: pointer;
      }
      .el-date-picker__time-header .el-input__inner,
      .el-date-range-picker__time-header .el-input__inner {
        opacity: 1;
        color: var(--color) !important;
      }
      .el-date-picker__editor-wrap > .el-input--small {
        border: 1px solid #ccc;
      }
    }
  }
}
.ft-dateTime-content,
.ft-datetimerange-content {
  --calendarShow: none; // 是否显示
  .ft-datetimerange-date,
  .el-date-picker {
    display: var(--calendarShow) !important;
  }
}
.ft-datetimerange-date .el-picker-panel {
  z-index: 9999; /* 设置一个较大的 z-index 值 */
}

.el-picker-panel__footer {
  display: block !important;
}
.ft-datePicker-content {
  .el-date-edito {
    height: 100px;
  }
}
.datetimerange-input {
  --paddingLeft: 36px;
  --fontSize: 26px;
  --width: 500px;
  --height: 60px;
  --color: rgba(255, 255, 255, 1);
  --fontWeight: "normal";
  --fontStyle: "normal";
  --fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN";
  --letterSpacing: 0;
  --lineHeight: 60px;
  width: var(--width);
  height: var(--height);
  // 日历框
  --calendarposition: 65px; // 位置

  --calendarWidth: 400px; // 高度
  --calendarHeight: 300px; // 高度

  --calendarBackground: rgba(0, 0, 0, 0.6);
  --calendarFontFamily: Source Han Sans CN-Normal, Source Han Sans CN;
  --calendarFontSize: 16px;
  --calendarColor: rgba(255, 255, 255, 1);
  --lineDecorativeColor: rgba(255, 255, 255, 1);

  --buttonFontFamily: "Source Han Sans CN-Normal, Source Han Sans CN";
  --buttonFontSize: 16px;
  --buttonColor: "rgba(255,255,255,1)";
  --buttonFontStyle: "normal";
  --buttonFontWeight: "normal";
  --selectTimeBackground: #8b58e7;

  box-sizing: border-box;
  .el-picker__popper {
    position: static;
  }
  .el-popper__arrow {
    display: none !important;
  }
  .el-picker-panel__body-wrapper {
    background: var(--calendarBackground);
    .el-input__wrapper {
      background: var(--calendarBackground);
    }
  }
  .el-range-input,
  .el-input__inner {
    width: 100%;
    height: 100%;
    border: none !important;
    background: transparent !important;
    color: var(--color) !important;
    font-weight: var(--fontWeight);
    font-style: var(--fontStyle);
    font-family: var(--fontFamily);
    letter-spacing: var(--letterSpacing);
  }
  &.ft-dateTime-content .el-input__inner {
    padding-left: var(--paddingLeft) !important;
  }
  @mixin inputStyle {
    color: var(--color) !important;
    font-size: var(--fontSize);
    border: none !important;
    background: transparent !important;
    font-weight: var(--fontWeight);
    font-style: var(--fontStyle);
    font-family: var(--fontFamily);
    letter-spacing: var(--letterSpacing);
  }
  .el-range-input {
    @include inputStyle();
    &::placeholder {
      @include inputStyle();
    }
  }
  .el-input__icon {
    font-size: var(--fontSize);
    line-height: var(--lineHeight) !important;
    color: var(--color) !important;
  }
  .el-range-separator {
    color: var(--color);
    font-size: var(--fontSize);
    line-height: var(--lineHeight);
    font-weight: var(--fontWeight);
    font-style: var(--fontStyle);
    font-family: var(--fontFamily);
    letter-spacing: var(--letterSpacing);
  }
  .el-date-range-picker,
  .el-date-picker {
    min-width: var(--calendarWidth);
    height: var(--calendarHeight);
    box-sizing: border-box;
    left: 50% !important;
    transform: translateX(-50%);
    position: absolute;
    top: var(--calendarposition) !important;
    overflow: hidden;
    .el-date-table td,
    .el-date-table td div {
      height: auto;
    }
    .el-picker-panel__body-wrapper {
      height: calc(var(--calendarHeight) - 45px);
      .el-picker-panel__body {
        // width: var(--calendarWidth);
        height: 100%;
      }
    }
    .el-picker-panel__footer {
      height: 45px;
      box-sizing: border-box;
    }
    .popper__arrow {
      display: none !important;
    }
  }

  @mixin calendarStyle {
    background: var(--calendarBackground);
    font-family: var(--calendarFontFamily);
    font-size: var(--calendarFontSize);
    color: var(--calendarColor);
  }
  .el-time-panel {
    left: -60px;
  }
  .ft-datetimerange-date,
  .ft-datetime-date,
  .el-time-panel {
    border: none;

    @include calendarStyle();
    .el-time-spinner__item:hover {
      background-color: rgba(138, 88, 231, 0.5);
    }
    .el-date-picker__header {
      padding: 0px;
      margin: 0px;
    }
    .el-picker-panel__icon-btn,
    .el-date-picker__header-label {
      color: white;
      padding: 4px 8px !important;
      margin: 0px;
      display: inline-block;
      font-weight: bold;
      border-radius: 3px;
      font-size: 14px;
      line-height: 32px;
      &:hover {
        background-color: #8b58e7;
      }
    }
    .el-date-range-picker__time-header {
      @include calendarStyle();
      .el-date-range-picker__editor {
        border: 1px solid #ccc;
      }
    }
    .el-date-range-picker__header > * {
      @include calendarStyle();
    }
    .el-picker-panel__content {
      height: calc(100% - 45px);
      overflow: auto;
      .el-date-table {
        height: calc(100% - 32px);
        position: relative;
        font-style: var(--calendarFontStyle);
        font-weight: var(--calendarFontWeight);
        &::before {
          content: "";
          width: 100%;
          height: 1px;
          background: var(--lineDecorativeColor);
          position: absolute;
          left: 0;
          top: 0px;
        }

        th {
          border: none;
          @include calendarStyle();
        }
        td {
          vertical-align: top;
          @include calendarStyle();
          > div {
            min-height: calc(var(--calendarFontSize) + 6px);
            padding: 0;
          }
          &.current,
          &.in-range {
            div {
              background-color: transparent;
              span {
                color: var(--selectTimeBackground);
                border-radius: 0;
              }
            }
          }
        }
        .prev-month,
        .next-month {
          opacity: 0.4;
        }
      }
      &.is-left {
        border-right: 1px solid var(--lineDecorativeColor);
      }
    }

    .el-time-spinner__item {
      font-family: var(--calendarFontFamily);
      font-size: var(--calendarFontSize);
      color: var(--calendarColor);
      opacity: 0.6;
      &.active {
        opacity: 1;
      }
    }
    .el-picker-panel__footer,
    .el-picker-panel__link-btn {
      @include calendarStyle();
      // border-top: 1px solid var(--lineDecorativeColor);
      button {
        font-family: var(--buttonFontFamily);
        font-size: var(--buttonFontSize);
        color: var(--buttonColor);
        font-style: var(--buttonFontStyle);
        font-weight: var(--buttonFontWeight);
        // &.is-disabled.is-plain {
        //   background-color: transparent;
        //   border: none;
        //   margin-left: 30px;
        // }
      }
      .el-button:hover {
        background: transparent !important;
      }
    }
  }
  .ft-datetime-date {
    .el-picker-panel {
      background-color: transparent !important;
    }
    .el-picker-panel__content {
      width: calc(100% - 30px) !important;
      margin: 0 15px;
    }
  }
}
</style>
