import {
  getEchartsAxisNameAndSeriesData,
  getFunction,
  splitArray,
} from "@material/utils/chart";
import { useActionEvent, useEvent } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { useParentElement, useResizeObserver } from "@vueuse/core";
import { cloneDeep } from "lodash-es";
import type { Ref } from "vue";
import {
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  watchEffect,
} from "vue";

import { validData } from "../ScreenwrightText/components/utils";
import type { EChartsCoreOption } from "./type";
import echarts from "./utils";

// import {
//   BarEchartType,
//   pieEchartType,
//   lineEchartsType,
//   scatterEchartType,
//   projectEchartType
// } from "@/views/build/components/buildRender/core/BaseComponent/type"
type EchartsInstance = echarts.ECharts;
type EchartsDispatchAction = "downplay" | "highlight" | "showTip";

interface TooltipLoopOptions {
  time: number;
  num: number;
  countIncreaseNum: number;
}

const DEFAULT_TOOLTIP_OPTIONS: TooltipLoopOptions = {
  time: 3000,
  num: 14,
  countIncreaseNum: 1,
};

const useEcharts = (
  elRef: Ref<HTMLDivElement>,
  options: EChartsCoreOption,
  element: ComponentType,
) => {
  const { handleEventAndCallbackEvent } = useEvent();
  const { addEvent } = useActionEvent();
  const charts = shallowRef<EchartsInstance>();
  const parentEl = useParentElement();
  const dataLoopTimeTicket = ref<NodeJS.Timeout | null>(null);
  let stop: any = null;
  const curOptions = ref<EChartsCoreOption | null>(null);
  const isBuild = {
    get value() {
      return window.location.href.includes("/build");
    },
  };

  const initCharts = () => {
    charts.value = echarts.init(elRef.value);
    setOptions(options);
    // 只有支持点击事件的 ECharts 组件才注册点击事件到全局事件管理器
    addEvent({
      [`${element.component.prop}-${element.id}`]: {
        handleClick,
      },
    } as any);

    handleEventAndCallbackEvent({
      throwValue: element.data[0],
      events: element.events || [],
      triggerType: EventTypeEnum.DataChange,
      id: element.id,
    });
  };

  const setOptions = (options: EChartsCoreOption) => {
    curOptions.value = options;

    setTimeout(() => {
      if (!charts.value) {
        return;
      }
      charts.value.clear();

      // ✅ 正确触发重启动画：notMerge: true 强制重绘，动画必触发
      charts.value.setOption(options, {
        notMerge: true,
        lazyUpdate: false,
      });
      bindClick();
    }, 20);
  };

  const echartsResize = () => {
    if (charts.value) {
      charts.value.resize();
    }
  };

  /**
   * 处理图表点击事件
   * @param e 点击事件参数
   */
  const handleClick = (e: any) => {
    // 自定义事件-click
    handleEventAndCallbackEvent({
      throwValue: {
        name: e.name,
        value: e.value,
        seriesName: e.seriesName,
        data: e.data,
      },
      triggerType: EventTypeEnum.Click,
      events: element.events || [],
      id: element.id,
    });

    if (e.marker && element.clickFormatter) {
      getFunction(element.clickFormatter, () => {})({
        type: element.name,
        name: e.name,
        value: e.value[2] || e.value,
        data: element.dataChart,
      });
    }
  };

  const bindClick = () => {
    if (!charts.value?.on || !charts.value?.off) {
      return;
    }
    charts.value.off("click");
    charts.value.on("click", handleClick);
  };

  /**
   * 清除数据轮播定时器
   */
  const clearDataLoopTimer = () => {
    if (dataLoopTimeTicket.value) {
      clearInterval(dataLoopTimeTicket.value);
      dataLoopTimeTicket.value = null;
    }
  };

  /**
   * 图表事件派发器
   */
  const dispatchEchartsAction = (
    type: EchartsDispatchAction,
    seriesIndex: number,
    dataIndex?: number,
  ) => {
    if (!charts.value) {
      return;
    }

    charts.value.dispatchAction({
      type,
      seriesIndex,
      ...(dataIndex !== undefined ? { dataIndex } : {}),
    });
  };

  /**
   * 提示框自动轮播
   */
  const autoHover = async ({
    option,
    num: newNum,
    time: newTime,
    countIncreaseNum = 1,
  }: {
    option: EChartsCoreOption;
    num: number;
    time: number;
    countIncreaseNum?: number;
  }) => {
    await nextTick();
    if (!charts.value) {
      return { clearLoop: () => {} };
    }
    // 设置默认值并合并配置
    const config: TooltipLoopOptions = {
      time: newTime || DEFAULT_TOOLTIP_OPTIONS.time,
      num: newNum || DEFAULT_TOOLTIP_OPTIONS.num,
      countIncreaseNum:
        countIncreaseNum || DEFAULT_TOOLTIP_OPTIONS.countIncreaseNum,
    };

    let count = 0;
    let timeTicket: NodeJS.Timeout | null = null;

    /**
     * 关闭轮播
     */
    const stopAutoShow = () => {
      if (timeTicket) {
        clearInterval(timeTicket);
        timeTicket = null;
      }
    };

    /**
     * 清除定时器和事件监听
     */
    const clearLoop = () => {
      stopAutoShow();
      charts.value?.off("mousemove", stopAutoShow);
    };

    /**
     * 执行高亮和提示操作
     */
    const executeHighlightAndTip = (dataIndex: number) => {
      dispatchEchartsAction("downplay", 0);
      dispatchEchartsAction("highlight", 0, dataIndex);
      dispatchEchartsAction("showTip", 0, dataIndex);
    };

    // 清除可能存在的定时器
    stopAutoShow();
    // 设置轮播定时器
    timeTicket = setInterval(() => {
      executeHighlightAndTip(count);
      // 更新索引
      count += config.countIncreaseNum;
      if (count >= config.num) {
        count = 0;
      }
    }, config.time);

    // 添加鼠标交互事件
    if (option.tooltipTriggerOn) {
      // 鼠标悬停时暂停轮播
      charts.value.on("mouseover", (params: any) => {
        stopAutoShow();
        executeHighlightAndTip(params.dataIndex);
      });

      // 鼠标移出时恢复轮播
      charts.value.on("mouseout", () => {
        stopAutoShow();
        timeTicket = setInterval(() => {
          executeHighlightAndTip(count);

          // 更新索引
          count += config.countIncreaseNum;
          if (count >= config.num) {
            count = 0;
          }
        }, config.time);
      });
    }

    return {
      clearLoop,
    };
  };

  /**
   * 数据轮播动画
   */
  const handleReStart = () => {
    const option = element.option;
    clearDataLoopTimer();
    const optionData = splitArray(cloneDeep(element.data), "seriesName");
    const { axisName: yAxisName } = getEchartsAxisNameAndSeriesData(optionData);
    const row = option.dataLoopRollNum || 0;
    const len = yAxisName.length;

    dataLoopTimeTicket.value = setInterval(
      () => {
        // 检查是否需要停止轮播
        if (!validData(option.dataLoop, false)) {
          clearDataLoopTimer();
          return;
        }
        // 确保curOptions.value非空，并且dataZoom是数组
        if (!curOptions.value || !Array.isArray(curOptions.value.dataZoom)) {
          return;
        }

        // 通过类型断言处理dataZoom
        const dataZoom = curOptions.value.dataZoom as any[];

        // 更新数据区域
        dataZoom.forEach((item: any, index: number) => {
          if (item.startValue + row > len - 1 || item.endValue === len - 1) {
            // 重置到起始位置
            dataZoom[index].endValue = option.dataLoopDisplayRows - 1;
            dataZoom[index].startValue = 0;
            // 重启轮播
            handleReStart();
          } else if (item.endValue + row > len - 1) {
            // 达到数据末尾
            dataZoom[index].endValue = len - 1;
            dataZoom[index].startValue += row;
          } else {
            // 正常滚动
            dataZoom[index].endValue += row;
            dataZoom[index].startValue += row;
          }
        });
        // 更新图表
        if (curOptions.value) {
          setOptions(curOptions.value as EChartsCoreOption);
        }
      },
      option.dataLoopInterval * 1000 || 100,
    );
  };

  // 响应式监听父元素并初始化resize观察器
  watchEffect((onCleanup) => {
    if (parentEl.value) {
      stop = useResizeObserver(parentEl.value, () => {
        if (charts.value) {
          echartsResize();
        }
      });

      // 自动清理：当 parentEl 变化或组件卸载时
      onCleanup(() => {
        if (stop) {
          stop.stop();
        }
      });
    }
  });

  // 组件失活时停止监听，避免内存泄漏
  onDeactivated(() => {
    if (stop) {
      stop.stop();
    }
  });

  // 组件卸载前清理资源
  onBeforeUnmount(() => {
    if (stop) {
      stop.stop();
    }
    clearDataLoopTimer();
  });

  return {
    isBuild,
    initCharts,
    setOptions,
    echartsResize,
    handleReStart,
    autoHover,
    clearDataLoopTimer,
  };
};

export { useEcharts };
