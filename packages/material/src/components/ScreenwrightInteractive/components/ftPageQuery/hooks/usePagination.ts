import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, onMounted, ref, watch } from "vue";

export function usePagination(props: { element: ComponentType }) {
  // 使用基础数据
  const {
    option,
    dataChart,
    events,
    encodes,
    isBuild,
    componentClasses,
    handleEventAndCallbackEvent,
  } = useBaseData(props.element);
  const { addEvent } = useActionEvent();

  // 声明响应式变量
  const current = ref(1);
  const currentPage = ref(current.value || 1);
  const prevStatus = ref(true);
  const nextStatus = ref(true);
  const showTotal = ref(false);
  const moveCurrent = ref<number | null>(null);
  const jumperCurrent = ref<number | null>(null);
  const dataChartItem = ref<{
    pageIndex: number;
    pageTotal: number;
    pageSize: number;
    [key: string]: any;
  }>({
    pageIndex: 1,
    pageTotal: 1,
    pageSize: 1,
  });

  // 计算属性
  const total = computed(() => {
    return dataChartItem.value.pageTotal;
  });

  const totalPage = computed(() => {
    return Math.ceil(
      dataChartItem.value.pageTotal / dataChartItem.value.pageSize,
    );
  });

  const pageList = computed(() => {
    //情况1： 总页码数<5的直接返回
    if (totalPage.value <= 5) {
      return Array.from({ length: totalPage.value }, (_, i) => i + 1);
    }
    //情况2： 总页码数>5页，当时当前页码数<=3
    if (currentPage.value <= 3) {
      return [1, 2, 3, "next", totalPage.value];
    }
    // 情况3：总页数-当前页数<=3
    if (currentPage.value > 3 && totalPage.value - currentPage.value <= 2) {
      return [
        1,
        "prev",
        totalPage.value - 2,
        totalPage.value - 1,
        totalPage.value,
      ];
    }
    // 情况4：排除其他的，剩下的就是有向前和向后的操作点
    return [
      1,
      "prev",
      currentPage.value - 2,
      currentPage.value - 1,
      currentPage.value,
      currentPage.value + 1,
      currentPage.value + 2,
      "next",
      totalPage.value,
    ];
  });

  const styleSizeName = computed<CSSProperties>(() => {
    return {
      width: option.value.width + "px",
      height: option.value.height + "px",
      lineHeight: option.value.height + "px",
      "flex-wrap": "nowrap",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent:
        option.value.textAlign === "justify"
          ? "center"
          : option.value.textAlign || "center",
    };
  });

  const defaultStyle = computed<CSSProperties>(() => {
    return {
      width: `${option.value.boxWidth}px`,
      height: `${option.value.boxHeight}px`,
      "line-height": `${option.value.boxHeight}px`,
      margin: `${option.value.margin}px`,
      "border-radius": `${option.value.borderRadius}% !important`,
      "box-sizing": "border-box",
    };
  });

  const bottonStyle = computed<CSSProperties>(() => {
    return {
      ...defaultStyle.value,
      ...itemStyle("default"),
    };
  });

  const hoverStyle = computed<CSSProperties>(() => {
    return {
      ...defaultStyle.value,
      ...itemStyle("hover"),
    };
  });

  const checkedStyle = computed<CSSProperties>(() => {
    return {
      ...defaultStyle.value,
      ...itemStyle("checked"),
    };
  });

  const pageJumperStyle = computed<CSSProperties>(() => {
    return {
      ...itemStyle("default"),
      width: 120 + "px",
      height: 30 + "px",
      background: "none",
      border: "none",
      margin: "0 8px",
    };
  });

  const pageJumperInputStyle = computed<CSSProperties>(() => {
    return {
      ...itemStyle("default"),
      width: 50 + "px",
      height: 30 + "px",
      "background-image": "none",
      margin: "0 5px",
      textAlign: "center",
    };
  });

  const showJumper = computed(() => {
    return option.value.showJumper;
  });

  // 方法
  const bgStyle = (type: string) => {
    let bgStyle = {};
    if (option.value[`${type}BackgroundType`] === "color") {
      bgStyle = {
        background: `${option.value[`${type}BackgroundColor`]}`,
        opacity: `${option.value[`${type}BackgroundColorOpacity`] / 100}`,
      };
    } else {
      bgStyle = {
        "background-color": "transparent",
        "background-image": `url(${setMinioUrl(option.value[`${type}BackgroundImage`])})`,
        "background-size": option.value[`${type}BackgroundImageType`],
        "background-repeat": "no-repeat",
        opacity: `${option.value[`${type}BackgroundColorOpacity`] / 100}`,
      };
    }
    return bgStyle;
  };

  const itemStyle = (type: string) => {
    const style = {
      border: `${option.value[`${type}BorderWidth`]}px solid ${option.value[`${type}BorderColor`]} !important`,
      color: option.value[`${type}Color`],
      "font-family": option.value[`${type}FontFamily`],
      "font-size": option.value[`${type}FontSize`] + "px",
      fontWeight: option.value[`${type}FontWeight`] || "normal",
      fontStyle: option.value[`${type}FontStyle`] || "normal",
      "letter-spacing": option.value[`${type}LetterSpacing`] + "px" || 0,
      ...bgStyle(type),
    };

    return style;
  };

  // 页码项点击
  const handlePageItemClick = (item: any, type?: string) => {
    // 重置向上和向下翻五页
    prevStatus.value = true;
    nextStatus.value = true;

    if (type === "prev") {
      // 向前5页
      currentPage.value -= 5;
      if (currentPage.value < 1) {
        currentPage.value = 1;
      }
    } else if (type === "next") {
      // 向后5页
      currentPage.value += 5;
      if (currentPage.value > totalPage.value) {
        currentPage.value = totalPage.value;
      }
    } else {
      // 默认常规页码点击
      if (currentPage.value === item) {
        return;
      }
      currentPage.value = item;
    }

    dataChartItem.value.pageIndex = currentPage.value;
    // 发布页码变更事件
    // handleClick(dataChartItem.value, null)
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.Click,
      events: props.element.events,

      throwValue: dataChartItem.value,
    });
  };

  // 上一页和下一页点击
  const handleBeforOrAfterClick = (type: string) => {
    if (type === "prev" || type === "before") {
      currentPage.value--;
      if (currentPage.value < 1) {
        currentPage.value = 1;
        return;
      }
    } else if (type === "next" || type === "after") {
      currentPage.value++;
      if (currentPage.value > totalPage.value) {
        currentPage.value = totalPage.value;
        return;
      }
    }

    dataChartItem.value.pageIndex = currentPage.value;
    // 发布页码变更事件
    // handleClick(dataChartItem.value, null)
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.Click,
      events: props.element.events,

      throwValue: dataChartItem.value,
    });
  };

  const handleMove = (e: MouseEvent) => {
    // 使用类型断言确保target是HTMLElement
    const target = e.target as HTMLElement;
    moveCurrent.value = parseFloat(target.innerText);
  };

  const handleLeave = () => {
    moveCurrent.value = null;
  };

  const handleJumperCurrentChange = (jumpPage: number) => {
    handlePageItemClick(jumpPage);
  };

  // 点击处理函数（供外部调用）
  const handleClick = (info: any) => {
    if (info && typeof info === "number") {
      handlePageItemClick(info);
    } else if (info && info.pageIndex) {
      handlePageItemClick(info.pageIndex);
    }
  };

  // 监听
  watch(
    () => currentPage.value,
    (nv) => {
      if (nv) {
        jumperCurrent.value = nv;
      }
    },
    { immediate: true, deep: true },
  );

  watch(
    () => dataChart.value,
    (nv) => {
      console.log("nv", nv);
      const baseDataChartItem = {
        pageIndex: 1,
        pageTotal: 1,
        pageSize: 1,
      };
      if (nv) {
        if (Array.isArray(nv)) {
          dataChartItem.value = nv?.[0] || baseDataChartItem;
        } else {
          dataChartItem.value = nv || baseDataChartItem;
        }
        currentPage.value = dataChartItem.value.pageIndex || 1;
        const info = dataChartItem.value;
        // handleEventAndCallbackEvent(info, false)
        handleEventAndCallbackEvent({
          id: props.element.id,
          triggerType: EventTypeEnum.DataChange,
          events: props.element.events,

          throwValue: info,
        });
      } else {
        dataChartItem.value = baseDataChartItem;
        currentPage.value = 1;
      }
    },
    { deep: true, immediate: true },
  );

  // 生命周期
  onMounted(() => {
    // 注册组件事件到全局事件系统
    addEvent({
      [`${interactiveEnum.FtPageQuery}-${props.element.id}`]: {
        handleClick,
        handleBeforOrAfterClick,
      },
    });
  });

  return {
    currentPage,
    total,
    totalPage,
    pageList,
    styleSizeName,
    bottonStyle,
    hoverStyle,
    checkedStyle,
    pageJumperStyle,
    pageJumperInputStyle,
    showJumper,
    jumperCurrent,
    moveCurrent,
    showTotal,
    events,
    encodes,
    isBuild,
    componentClasses,
    handlePageItemClick,
    handleBeforOrAfterClick,
    handleMove,
    handleLeave,
    handleJumperCurrentChange,
  };
}
