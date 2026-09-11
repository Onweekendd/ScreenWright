// import { handleEventAndCallbackEventHook } from "@screenwright/core"
import { setMinioUrl } from "@material/minioUrl";
import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { cloneDeep } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

export const useScrollPicker = (element: ComponentType) => {
  // 使用基础数据hook
  const {
    option,
    dataChart,
    componentClasses,
    isBuild,
    width,
    height,
    events,
    encodes,
    handleEncode,
    handleEventAndCallbackEvent,
  } = useBaseData(element);
  const listData = ref<any[]>([]);
  const showListData = ref<any[]>([]); // 展示数据数量由option.globalConfig.showNum决定
  const activeTabIndex = ref<number>(-1);
  const defaultSelectedIndex = ref<number>(0);
  const timer = ref<any>(null);
  const isInit = ref(true);

  // 计算样式
  const containerStyle = computed<CSSProperties>(() => ({
    "pointer-events": isBuild.value ? "none" : "auto",
    width: `${width.value}px`,
    height: `${height.value}px`,
  }));

  const contentBoxStyle = computed<CSSProperties>(() => ({
    flexDirection: option.value.globalConfig.permutationType,
  }));

  const contentBoxClass = computed(() => ({
    contentBox: true,
    ...componentClasses,
  }));

  // 在组件卸载前清除定时器
  onBeforeUnmount(() => {
    if (timer.value) {
      clearInterval(timer.value);
    }
  });

  // 初始化滚动选择器
  const initScrollPicker = () => {
    if (option.value.globalConfig.showNum) {
      // 奇数
      if (option.value.globalConfig.showNum % 2) {
        activeTabIndex.value = (option.value.globalConfig.showNum - 1) / 2 + 1;
      } else {
        // 偶数
        activeTabIndex.value = option.value.globalConfig.showNum / 2;
      }
    }
    if (option.value.globalConfig.defaultSelected) {
      refreshShowListData(
        activeTabIndex.value - 1,
        option.value.globalConfig.defaultSelected,
      );
    } else {
      refreshShowListData(-1, option.value.globalConfig.defaultSelected);
    }

    if (option.value.globalConfig.autoCarousel) {
      defaultSelectedIndex.value = option.value.globalConfig.defaultSelected;
      timer.value = setInterval(() => {
        defaultSelectedIndex.value++;
        refreshShowListData(
          activeTabIndex.value - 1,
          defaultSelectedIndex.value,
        );
      }, option.value.globalConfig.tabIntervalTime * 1000);
    } else {
      clearInterval(timer.value);
      timer.value = null;
    }
  };
  // 滚动面板事件交互
  const handleActionClick = (actionSelect: {
    label: string;
    value: string;
    s: string;
  }) => {
    const selectIndex = activeTabIndex.value - 1;
    if (!actionSelect) {
      refreshShowListData(selectIndex, listData.value.length - 1);
    } else {
      const value = actionSelect.value;
      const defaultSelected =
        listData.value.findIndex(
          (it) => (it.value || it.s) === (value || actionSelect.s),
        ) + 1;
      refreshShowListData(selectIndex, defaultSelected);
    }

    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,
      throwValue:
        showListData.value && showListData.value.length > 0
          ? showListData.value[selectIndex]
          : "",
    });
  };

  const handleClick = (dataItem: any) => {
    isInit.value = false;
    defaultSelectedIndex.value =
      listData.value.findIndex(
        (it) => (it.value || it.s) === (dataItem.value || dataItem.s),
      ) + 1;
    const selectIndex = activeTabIndex.value - 1;
    refreshShowListData(selectIndex, defaultSelectedIndex.value);
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,
      throwValue:
        showListData.value && showListData.value.length > 0
          ? showListData.value[selectIndex]
          : "",
    });

    handleEncode(dataItem);
  };

  // 刷新显示列表数据
  const refreshShowListData = (
    seldctedIndex: number,
    defaultSelected: number,
  ) => {
    console.log(seldctedIndex, "seldctedIndex");
    console.log(defaultSelected, "defaultSelected");
    if (seldctedIndex < 0) {
      showListData.value = [
        ...listData.value,
        ...listData.value,
        ...listData.value,
      ].splice(
        listData.value.length - activeTabIndex.value + 1,
        option.value.globalConfig.showNum,
      );
    } else {
      showListData.value = [
        ...listData.value,
        ...listData.value,
        ...listData.value,
      ].splice(
        listData.value.length -
          seldctedIndex +
          ((defaultSelected % listData.value.length) - 1),
        option.value.globalConfig.showNum,
      );
    }
  };

  // 获取数据项样式
  const getDataItemStyle = (dataItem: any, dataIndex: number) => {
    let returnStyle: any = {};
    returnStyle = {
      height: `${
        (parseInt(`${height.value}`) -
          (option.value.globalConfig.showNum - 1) *
            option.value.globalConfig.tabInterval) /
        option.value.globalConfig.showNum
      }px`,
      background:
        option.value.defaultObj.backgroundType === "color"
          ? option.value.defaultObj.backgroundColor
          : `url(${setMinioUrl(option.value.defaultObj.backgroundImage)}) no-repeat center/100% 100%`,
      fontFamily: `${option.value.defaultObj.textFontFamily}`,
      fontSize: `${option.value.defaultObj.textFontSize}px`,
      lineHeight: `${option.value.defaultObj.textLineHeight}px`,
      letterSpacing: `${option.value.defaultObj.textLetterSpacing}px`,
      color: `${option.value.defaultObj.textColor}`,
      fontStyle: `${option.value.defaultObj.textFontStyle}`,
      fontWeight: `${option.value.defaultObj.textFontWeight}`,
      textAlign: `${option.value.defaultObj.textAlign}`,
      textShadow: option.value.defaultObj.isTextShadow
        ? `${option.value.defaultObj.textShadowColor} ${option.value.defaultObj.textShadowX}px ${option.value.defaultObj.textShadowY}px ${option.value.defaultObj.textShadowBlur}px`
        : "",
    };
    if (option.value.globalConfig.permutationType === "column") {
      returnStyle.marginBottom = `${
        dataIndex === showListData.value.length - 1
          ? 0
          : option.value.globalConfig.tabInterval
      }px`;
    }
    if (option.value.globalConfig.permutationType === "row") {
      returnStyle.marginRight = `${
        dataIndex === showListData.value.length - 1
          ? 0
          : option.value.globalConfig.tabInterval
      }px`;
    }
    return returnStyle;
  };

  // 计算数据项的最终样式（包含基础样式和尺寸样式）
  const getComputedItemStyle = (dataItem: any, dataIndex: number) => {
    const baseStyle = getDataItemStyle(dataItem, dataIndex);

    let activeStyle;
    if (isInit.value) {
      activeStyle =
        dataIndex === activeTabIndex.value - 1 &&
        option.value.globalConfig.defaultSelected
          ? getActiveDataItemStyle.value
          : {};
    } else {
      activeStyle =
        dataIndex === activeTabIndex.value - 1
          ? getActiveDataItemStyle.value
          : {};
    }

    const dimensionStyle =
      option.value.globalConfig.permutationType === "column"
        ? { width: "100%" }
        : { height: "100%" };

    return {
      ...baseStyle,
      ...activeStyle,
      ...dimensionStyle,
    };
  };

  // 获取活动数据项样式
  const getActiveDataItemStyle = computed(() => {
    let returnStyle: any = {};
    returnStyle = {
      background:
        option.value.activeObj.backgroundType === "color"
          ? option.value.activeObj.backgroundColor
          : `url(${setMinioUrl(option.value.activeObj.backgroundImage, true)}) no-repeat center/100% 100%`,
      fontFamily: `${option.value.activeObj.textFontFamily}`,
      fontSize: `${option.value.activeObj.textFontSize}px`,
      lineHeight: `${option.value.activeObj.textLineHeight}px`,
      letterSpacing: `${option.value.activeObj.textLetterSpacing}px`,
      color: `${option.value.activeObj.textColor}`,
      fontStyle: `${option.value.activeObj.textFontStyle}`,
      fontWeight: `${option.value.activeObj.textFontWeight}`,
      textAlign: `${option.value.activeObj.textAlign}`,
      textShadow: option.value.activeObj.isTextShadow
        ? `${option.value.activeObj.textShadowColor} ${option.value.activeObj.textShadowX}px ${option.value.activeObj.textShadowY}px ${option.value.activeObj.textShadowBlur}px`
        : "",
    };
    return returnStyle;
  });

  // 测试滚轮事件
  const testWheel = (val: WheelEvent) => {
    // 滚轮向下滚动100，向上滚动-100
    if (Number(val.deltaY) > 0) {
      defaultSelectedIndex.value = defaultSelectedIndex.value + 1;
    } else {
      defaultSelectedIndex.value = defaultSelectedIndex.value - 1;
    }
    refreshShowListData(activeTabIndex.value - 1, defaultSelectedIndex.value);
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
        clearInterval(timer.value);
        timer.value = null;
        initScrollPicker();

        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.DataChange,
          events: element.events,

          throwValue:
            dataChart.value && dataChart.value.length > 0
              ? dataChart.value[0]
              : "",
        });
      } else {
        listData.value = [];
        clearInterval(timer.value);
        timer.value = null;
        initScrollPicker();
      }
    },
    { deep: true, immediate: true },
  );

  // 监听选项变化
  watch(
    () => option.value,
    () => {
      clearInterval(timer.value);
      timer.value = null;
      initScrollPicker();
    },
    { deep: true },
  );
  onMounted(() => {
    defaultSelectedIndex.value = option.value.globalConfig.defaultSelected || 0;
  });

  return {
    width,
    height,
    isBuild,
    events,
    encodes,
    listData,
    showListData,
    activeTabIndex,
    defaultSelectedIndex,
    option,
    containerStyle,
    contentBoxStyle,
    contentBoxClass,
    getComputedItemStyle,
    initScrollPicker,
    refreshShowListData,
    handleActionClick,
    getDataItemStyle,
    handleClick,
    getActiveDataItemStyle,
    testWheel,
  };
};
