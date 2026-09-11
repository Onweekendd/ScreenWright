import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { uuid } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { cloneDeep } from "lodash-es";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";

import type { ListDataItem, TimeLineItem } from "./pointTimeline";

export function usePointTimeline(element: ComponentType) {
  const {
    option,
    dataChart,
    isBuild,
    width,
    height,
    events,
    encodes,
    handleEventAndCallbackEvent,
  } = useBaseData(element);
  const { addEvent } = useActionEvent();

  const svgRef = ref<HTMLElement | null>(null);
  const svgLayout = ref<HTMLElement | null>(null);
  const uuidVal = ref(uuid());
  const listData = ref<ListDataItem[]>([]);
  const timeLineList = ref<TimeLineItem[]>([]);
  const activeIndex = ref(0);
  const timer = shallowRef<NodeJS.Timeout | null>(null);
  const svgTranslate = ref(0);

  const getSvgWidthOrHeight = computed(() => {
    return (
      option.value.globalConfig.initMargin * 2 +
      option.value.globalConfig.shaftMargin * listData.value.length
    );
  });

  // 获取SVG项的边距
  const getSvgItemMargin = (index: number) => {
    return (
      option.value.globalConfig.initMargin +
      option.value.globalConfig.shaftMargin * (0.5 + index)
    );
  };

  // 初始化时间轴
  const initpointTimeline = (
    currentTranslate?: number,
    currentActiveIndex?: number,
  ) => {
    activeIndex.value =
      currentActiveIndex || option.value.globalConfig.defaultSelected - 1;
    setTimeLineList(activeIndex.value);
    clearInterval(timer.value as NodeJS.Timeout);
    timer.value = null;
    svgTranslate.value = currentTranslate || 0;

    if (option.value.animationConfig.loop) {
      timer.value = setInterval(() => {
        // 当隐藏时，暂停滚动，避免因为clientWidth或者clientHeight=0导致位置异常
        if (
          !svgRef.value ||
          svgRef.value.clientWidth === 0 ||
          svgRef.value.clientHeight === 0
        ) {
          return;
        }

        let svgCanScrollLong = 0;
        if (option.value.globalConfig.arrangementDirection === "row") {
          svgCanScrollLong = (svgRef.value.clientWidth || 0) - width.value;
          if (
            svgLayout.value &&
            svgLayout.value.offsetWidth > getSvgWidthOrHeight.value
          ) {
            clearInterval(timer.value as NodeJS.Timeout);
            return;
          }
        }
        if (option.value.globalConfig.arrangementDirection === "column") {
          svgCanScrollLong = (svgRef.value.clientHeight || 0) - height.value;
          if (svgLayout.value && svgLayout.value.offsetHeight > height.value) {
            clearInterval(timer.value as NodeJS.Timeout);
            return;
          }
        }

        // 为了先设置样式再改变activeIndex，否则切换结束时样式可能还没设置完
        if (
          activeIndex.value < timeLineList.value.length - 1 &&
          activeIndex.value !== -1
        ) {
          activeIndex.value++;
          svgTranslate.value -= option.value.globalConfig.shaftMargin;
          if (-svgTranslate.value > svgCanScrollLong) {
            svgTranslate.value = -svgCanScrollLong;
          }
        } else {
          activeIndex.value = 0;
          svgTranslate.value = 0;
        }

        setTimeLineList(activeIndex.value);
      }, option.value.animationConfig.loopInterval * 1000);
    }
  };

  // 设置时间轴列表
  const setTimeLineList = (activeIdx = 0) => {
    timeLineList.value = [];
    listData.value.forEach((listItem, listIndex) => {
      let pushObj: TimeLineItem;
      const isActive = listIndex === activeIdx;
      const configObj = isActive
        ? option.value.timeLineConfig.activeObj
        : option.value.timeLineConfig.defaultObj;

      if (option.value.globalConfig.arrangementDirection === "row") {
        pushObj = {
          imgX: getSvgItemMargin(listIndex),
          imgY: height.value / 2,
          imglinkHref: setMinioUrl(configObj.axialPointImgSrc),
          imgWidth: configObj.axialPointWidth,
          imgHeight: configObj.axialPointHeight,
          imgTransform: `translate(-${configObj.axialPointWidth / 2}, -${configObj.axialPointHeight / 2})translate(${
            configObj.axialPointTranslateX
          }, ${configObj.axialPointTranslateY})`,
          axialSpindleX: getSvgItemMargin(listIndex),
          axialSpindleY: height.value / 2,
          axialSpindleWidth: configObj.axialSpindleWidth,
          axialSpindleHeight: configObj.axialSpindleTextFontSize,
          axialSpindleFontFamily: configObj.axialSpindleTextFontFamily,
          axialSpindleFontSize: configObj.axialSpindleTextFontSize,
          axialSpindleLineHeight: configObj.axialSpindleTextLineHeight,
          axialSpindleLetterSpacing: configObj.axialSpindleTextLetterSpacing,
          axialSpindleColor: configObj.axialSpindleTextColor,
          axialSpindleFontStyle: configObj.axialSpindleTextFontStyle,
          axialSpindleFontWeight: configObj.axialSpindleTextFontWeight,
          axialSpindleTextAlign: configObj.axialSpindleTextAlign,
          axialSpindleTransform: `translate(calc(-50% + ${configObj.axialSpindleTranslateX}px), calc(0% + ${configObj.axialSpindleTranslateY}px))`,
          axialTitleX:
            getSvgItemMargin(listIndex) - getSvgWidthOrHeight.value / 2,
          axialTitleY: -option.value.globalConfig.centralAxisMargin,
          axialTitleWidth: configObj.axialTitleWidth,
          axialTitleHeight: configObj.axialTitleTextFontSize,
          axialTitleFontFamily: configObj.axialTitleTextFontFamily,
          axialTitleFontSize: configObj.axialTitleTextFontSize,
          axialTitleLineHeight: configObj.axialTitleTextLineHeight,
          axialTitleLetterSpacing: configObj.axialTitleTextLetterSpacing,
          axialTitleColor: configObj.axialTitleTextColor,
          axialTitleFontStyle: configObj.axialTitleTextFontStyle,
          axialTitleFontWeight: configObj.axialTitleTextFontWeight,
          axialTitleTextAlign: configObj.axialTitleTextAlign,
          axialTitleTransform: `translate(calc(-50% + ${configObj.axialTitleTranslateX}px), calc(-50% + ${configObj.axialTitleTranslateY}px))`,
        };
      } else {
        pushObj = {
          imgX: width.value / 2,
          imgY: getSvgItemMargin(listIndex),
          imglinkHref: setMinioUrl(configObj.axialPointImgSrc),
          imgWidth: configObj.axialPointWidth,
          imgHeight: configObj.axialPointHeight,
          imgTransform: `translate(-${configObj.axialPointWidth / 2}, -${configObj.axialPointHeight / 2})translate(${
            configObj.axialPointTranslateX
          }, ${configObj.axialPointTranslateY})`,
          axialSpindleX: width.value / 2,
          axialSpindleY: getSvgItemMargin(listIndex),
          axialSpindleWidth: configObj.axialSpindleWidth,
          axialSpindleHeight: configObj.axialSpindleTextFontSize,
          axialSpindleFontFamily: configObj.axialSpindleTextFontFamily,
          axialSpindleFontSize: configObj.axialSpindleTextFontSize,
          axialSpindleLineHeight: configObj.axialSpindleTextLineHeight,
          axialSpindleLetterSpacing: configObj.axialSpindleTextLetterSpacing,
          axialSpindleColor: configObj.axialSpindleTextColor,
          axialSpindleFontStyle: configObj.axialSpindleTextFontStyle,
          axialSpindleFontWeight: configObj.axialSpindleTextFontWeight,
          axialSpindleTextAlign: configObj.axialSpindleTextAlign,
          axialSpindleTransform: `translate(calc(-50% + ${configObj.axialSpindleTranslateX}px), calc(-50% + ${configObj.axialSpindleTranslateY}px))`,
          axialTitleX: (width.value - getSvgWidthOrHeight.value) / 2,
          axialTitleY:
            getSvgItemMargin(listIndex) -
            height.value / 2 -
            option.value.globalConfig.shaftMargin / 4,
          axialTitleWidth: configObj.axialTitleWidth,
          axialTitleHeight: configObj.axialTitleTextFontSize,
          axialTitleFontFamily: configObj.axialTitleTextFontFamily,
          axialTitleFontSize: configObj.axialTitleTextFontSize,
          axialTitleLineHeight: configObj.axialTitleTextLineHeight,
          axialTitleLetterSpacing: configObj.axialTitleTextLetterSpacing,
          axialTitleColor: configObj.axialTitleTextColor,
          axialTitleFontStyle: configObj.axialTitleTextFontStyle,
          axialTitleFontWeight: configObj.axialTitleTextFontWeight,
          axialTitleTextAlign: configObj.axialTitleTextAlign,
          axialTitleTransform: `translate(calc(-50% + ${configObj.axialTitleTranslateX}px), calc(0% + ${configObj.axialTitleTranslateY}px))`,
        };
      }

      // 处理交叉显示配置
      if (option.value.globalConfig.crossDisplay) {
        if (option.value.globalConfig.arrangementDirection === "row") {
          if (listIndex % 2) {
            pushObj.axialTitleY = 0;
            pushObj.axialTitleTransform = `translate(calc(-50% + ${configObj.axialTitleTranslateX}px), calc(-50% - ${
              option.value.globalConfig.centralAxisMargin +
              configObj.axialTitleTranslateY
            }px))`;
          } else {
            pushObj.axialTitleY = 0;
            pushObj.axialTitleTransform = `translate(calc(-50% + ${configObj.axialTitleTranslateX}px), calc(-50% + ${
              option.value.globalConfig.centralAxisMargin +
              configObj.axialTitleTranslateY
            }px))`;
          }
        } else {
          pushObj.axialTitleY = getSvgItemMargin(listIndex) - height.value / 2;
          if (listIndex % 2) {
            pushObj.axialTitleX =
              (width.value - getSvgWidthOrHeight.value) / 2 +
              option.value.globalConfig.centralAxisMargin;
          } else {
            pushObj.axialTitleX =
              (width.value - getSvgWidthOrHeight.value) / 2 -
              option.value.globalConfig.centralAxisMargin;
          }
        }
      }

      timeLineList.value.push(pushObj);
    });
  };

  // 点击选择时间点
  const selectSvgPointer = (index: number) => {
    setTimeLineList(index);
    activeIndex.value = index;
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,

      throwValue: listData.value[index],
    });
  };

  // 监听数据变化
  watch(
    () => dataChart.value,
    (val) => {
      if (val) {
        let info;
        if (Object.prototype.toString.call(val) === "[object Array]") {
          info = cloneDeep(val);
        } else {
          info = cloneDeep([val]);
        }
        listData.value = info;
        initpointTimeline();

        // 触发数据变化事件
        // handleEventAndCallbackEventHook(instance, { info }, "dataChange")
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.DataChange,
          events: element.events,

          throwValue: listData.value[activeIndex.value],
        });
      } else {
        listData.value = [];
        initpointTimeline();
      }
    },
    { deep: true, immediate: true },
  );

  // 监听配置变化
  watch(
    () => option.value,
    () => {
      initpointTimeline();
    },
    { deep: true },
  );

  // 监听宽高变化
  watch(
    [width, height],
    () => {
      initpointTimeline();
    },
    { deep: true },
  );

  // 组件卸载时清除定时器
  onBeforeUnmount(() => {
    if (timer.value) {
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
    }
  });

  const setupPatrolAction = (action: string) => {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
    switch (action) {
      case "turnOnPatrol":
        initpointTimeline(svgTranslate.value, activeIndex.value);
        break;
      case "pausePatrol":
        break;
      case "restartPatrol":
        initpointTimeline();
        break;
      default:
        break;
    }
  };

  // 挂载时初始化
  onMounted(() => {
    initpointTimeline();

    // 注册组件事件 - 包装selectSvgPointer为handleClick
    const handleClick = (throwValue: any) => {
      // 从数据中找到对应索引
      const index = listData.value.findIndex(
        (item) =>
          item.value === throwValue.value || item.text === throwValue.text,
      );
      if (index !== -1) {
        selectSvgPointer(index);
      }
    };

    addEvent({
      [`${interactiveEnum.PointTimeline}-${element.id}`]: {
        handleClick,
        setupPatrolAction,
      },
    });
  });

  return {
    svgRef,
    svgLayout,
    uuidVal,
    listData,
    timeLineList,
    activeIndex,
    svgTranslate,
    getSvgWidthOrHeight,
    isBuild,
    encodes,
    events,
    height,
    width,
    option,
    dataChart,
    selectSvgPointer,
    initpointTimeline,
    handleEventAndCallbackEvent,
  };
}
