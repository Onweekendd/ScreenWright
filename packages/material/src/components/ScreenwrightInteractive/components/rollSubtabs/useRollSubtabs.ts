import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import type { ChartDataItem } from "./rollSubtabs";

export default function useRollSubtabs(element: ComponentType) {
  const {
    option,
    isBuild,
    cbArgs,
    events,
    dataChart,
    height,
    width,
    handleEncode,
    handleEventAndCallbackEvent,
  } = useBaseData(element);
  const { addEvent } = useActionEvent();
  const rollSubtabsRef = ref<HTMLElement | null>(null);

  const translateXY = ref(0);
  const defaultH = ref(0);
  const defaultW = ref(0);
  const currentActive = ref("");
  const eventStatus = ref(false);
  const encodeStatus = ref(false);
  let timer: NodeJS.Timeout | null = null;
  // 计算属性

  const isHorizontal = computed(() => {
    return option.value.direction === "horizontal";
  });

  const autoPlay = computed(() => {
    return option.value.playVisible;
  });

  const liMinHeight = computed(() => {
    const borderW = option.value.defaultObj.isBorder
      ? option.value.defaultObj.borderWidth
      : 0;
    const minHeight = isHorizontal.value
      ? height.value
      : height.value / option.value.directionNum;
    defaultH.value = minHeight;
    return {
      minHeight: `${minHeight - borderW * 2 - option.value.rowGap}px`,
    };
  });

  const liMinWidth = computed(() => {
    const borderW = option.value.defaultObj.isBorder
      ? option.value.defaultObj.borderWidth
      : 0;
    const minWidth = !isHorizontal.value
      ? width.value
      : width.value / option.value.directionNum;
    defaultW.value = minWidth;
    return {
      minWidth: `${minWidth - borderW * 2 - option.value.columnGap}px`,
    };
  });

  const styleGrid = computed(() => {
    const rowsNum = isHorizontal.value ? 1 : dataChart.value.length;
    const columnsNum = isHorizontal.value ? dataChart.value.length : 1;
    return {
      gridTemplateRows: `repeat(${rowsNum}, 1fr)`, // 行数
      gridTemplateColumns: `repeat(${columnsNum}, 1fr)`, // 列数
      rowGap: `${option.value.rowGap}px`,
      columnGap: `${option.value.columnGap}px`,
      gap: `${rowsNum}px ${columnsNum}px`,
    };
  });

  const styleFlex = computed(() => {
    return {
      padding: `${option.value.paddingTop}px ${option.value.paddingRight}px ${option.value.paddingBottom}px ${option.value.paddingLeft}px`,
      writingMode: option.value.writingMode, // tb-rl 文字方向
      alignItems: option.value.alignItems, //flex-start, flex-end
    };
  });

  const arrowContainStyle = computed<CSSProperties>(() => {
    return {
      position: "absolute",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: isHorizontal.value
        ? `calc(100% + ${parseFloat(String(option.value.arrowWidth * 2))}px)`
        : `${height.value + parseFloat(String(option.value.arrowWidth * 2))}px`,
      height: isHorizontal.value
        ? "100%"
        : `calc(100% + ${parseFloat(String(option.value.arrowWidth * 2))}px)`,
      top: isHorizontal.value
        ? 0
        : `-${parseFloat(String(option.value.arrowHeight))}px`,
      left: isHorizontal.value
        ? `-${parseFloat(String(option.value.arrowWidth))}px`
        : "50%",
      transform: isHorizontal.value
        ? `rotate(0deg)`
        : `rotate(90deg) translateY(50%)`,
    };
  });

  const arrowLStyle = computed<CSSProperties>(() => {
    return {
      width: `${option.value.arrowWidth}px`,
      height: `${option.value.arrowHeight}px`,
      backgroundImage: `url(${setMinioUrl(option.value.imgLeft)})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
    };
  });

  const arrowRStyle = computed<CSSProperties>(() => {
    return {
      width: `${option.value.arrowWidth}px`,
      height: `${option.value.arrowHeight}px`,
      backgroundImage: `url(${setMinioUrl(option.value.imgRight)})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
    };
  });

  // 样式方法
  const styleDefaultItem = (index: number) => {
    const returnStyle = {
      border: option.value.defaultObj.isBorder
        ? `${option.value.defaultObj.borderWidth || 0}px solid ${option.value.defaultObj.borderColor}`
        : `none`,
      background:
        option.value.defaultObj.backgroundType == "color"
          ? option.value.defaultObj.backgroundColor
          : `url(${setMinioUrl(option.value.defaultObj.backgroundImage)}) 50% 50% / ${
              option.value.defaultObj.backgroundImageType
            } no-repeat`,
    };
    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.value.defaultObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.border = `${targetItem.defaultObj.borderWidth || 0}px solid ${targetItem.defaultObj.borderColor}`;
        returnStyle.background =
          targetItem.defaultObj.backgroundType == "color"
            ? targetItem.defaultObj.backgroundColor
            : `url(${setMinioUrl(targetItem.defaultObj.backgroundImage)}) 50% 50% / ${
                targetItem.defaultObj.backgroundImageType
              } no-repeat`;
      }
    }
    return returnStyle;
  };

  const styleDefaultFont = (index: number) => {
    const returnStyle = {
      color: option.value.defaultObj.fontColor,
      fontSize: `${option.value.defaultObj.fontSize || 12}px`,
      fontWeight: option.value.defaultObj.fontWeight,
      fontFamily: option.value.defaultObj.fontFamily,
      fontStyle: option.value.defaultObj.fontStyle,
      textShadow: option.value.defaultObj.isTextShadow
        ? `${option.value.defaultObj.textShadow.color} ${option.value.defaultObj.textShadow.x || 0}px ${
            option.value.defaultObj.textShadow.y || 0
          }px ${option.value.defaultObj.textShadow.blur}px`
        : "none",
      transform: `translate(${option.value.defaultObj.textTranslateX || 0}px, ${
        option.value.defaultObj.textTranslateY || 0
      }px)`,
    };
    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.value.defaultObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.color = `${targetItem.defaultObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.defaultObj.fontSize || 12}px`;
        returnStyle.fontWeight = `${targetItem.defaultObj.fontWeight}`;
        returnStyle.fontFamily = `${targetItem.defaultObj.fontFamily}`;
        returnStyle.fontStyle = `${targetItem.defaultObj.fontStyle}`;
        returnStyle.textShadow = `${
          targetItem.defaultObj.isTextShadow
            ? `${targetItem.defaultObj.textShadow.color} ${targetItem.defaultObj.textShadow.x || 0}px ${
                targetItem.defaultObj.textShadow.y || 0
              }px ${targetItem.defaultObj.textShadow.blur}px`
            : "none"
        }`;
        returnStyle.transform = `translate(${targetItem.defaultObj.textTranslateX || 0}px, ${
          targetItem.defaultObj.textTranslateY || 0
        }px)`;
      }
    }
    return returnStyle;
  };

  const styleActiveItem = (index: number) => {
    const returnStyle = {
      border: option.value.activeObj.isBorder
        ? `${option.value.activeObj.borderWidth || 0}px solid ${option.value.activeObj.borderColor}`
        : `none`,
      background:
        option.value.activeObj.backgroundType == "color"
          ? option.value.activeObj.backgroundColor
          : `url(${setMinioUrl(option.value.activeObj.backgroundImage)}) 50% 50% / ${
              option.value.activeObj.backgroundImageType
            } no-repeat`,
    };
    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.value.activeObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.border = `${targetItem.activeObj.borderWidth || 0}px solid ${targetItem.activeObj.borderColor}`;
        returnStyle.background =
          targetItem.activeObj.backgroundType == "color"
            ? targetItem.activeObj.backgroundColor
            : `url(${setMinioUrl(targetItem.activeObj.backgroundImage)}) 50% 50% / ${
                targetItem.activeObj.backgroundImageType
              } no-repeat`;
      }
    }
    return returnStyle;
  };

  const styleActiveFont = (index: number) => {
    const returnStyle = {
      color: option.value.activeObj.fontColor,
      fontSize: `${option.value.activeObj.fontSize || 12}px`,
      fontWeight: option.value.activeObj.fontWeight,
      fontFamily: option.value.activeObj.fontFamily,
      fontStyle: option.value.activeObj.fontStyle,
      textShadow: option.value.activeObj.isTextShadow
        ? `${option.value.activeObj.textShadow.color} ${option.value.activeObj.textShadow.x || 0}px ${
            option.value.activeObj.textShadow.y || 0
          }px ${option.value.activeObj.textShadow.blur}px`
        : "none",
      transform: `translate(${option.value.activeObj.textTranslateX || 0}px, ${
        option.value.activeObj.textTranslateY || 0
      }px)`,
    };
    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.value.activeObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.color = `${targetItem.activeObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.activeObj.fontSize || 12}px`;
        returnStyle.fontWeight = `${targetItem.activeObj.fontWeight}`;
        returnStyle.fontFamily = `${targetItem.activeObj.fontFamily}`;
        returnStyle.fontStyle = `${targetItem.activeObj.fontStyle}`;
        returnStyle.textShadow = `${
          targetItem.activeObj.isTextShadow
            ? `${targetItem.activeObj.textShadow.color} ${targetItem.activeObj.textShadow.x || 0}px ${
                targetItem.activeObj.textShadow.y || 0
              }px ${targetItem.activeObj.textShadow.blur}px`
            : "none"
        }`;
        returnStyle.transform = `translate(${targetItem.activeObj.textTranslateX || 0}px, ${
          targetItem.activeObj.textTranslateY || 0
        }px)`;
      }
    }
    return returnStyle;
  };

  const styleHoverFont = (index: number) => {
    // 样式里开启了悬停后，系列里面才有悬停选项，然后渲染默认设置样式里的悬停，如果系列里开启了系列样式优先且有对应系列的悬停样式则用对应样式
    const returnStyle = option.value.isHovered
      ? {
          color: option.value.hoverObj.fontColor,
          fontSize: `${option.value.hoverObj.fontSize || 12}px`,
          fontWeight: option.value.hoverObj.fontWeight,
          fontFamily: option.value.hoverObj.fontFamily,
          fontStyle: option.value.hoverObj.fontStyle,
          textShadow: option.value.hoverObj.isTextShadow
            ? `${option.value.hoverObj.textShadow.color} ${option.value.hoverObj.textShadow.x || 0}px ${
                option.value.hoverObj.textShadow.y || 0
              }px ${option.value.hoverObj.textShadow.blur}px`
            : "none",
          transform: `translate(${option.value.hoverObj.textTranslateX || 0}px, ${
            option.value.hoverObj.textTranslateY || 0
          }px)`,
          border: option.value.hoverObj.isBorder
            ? `${option.value.hoverObj.borderWidth || 0}px solid ${option.value.hoverObj.borderColor}`
            : "none",
          background:
            option.value.hoverObj.backgroundType == "color"
              ? option.value.hoverObj.backgroundColor
              : `url(${setMinioUrl(option.value.hoverObj.backgroundImage)}) 50% 50% / ${
                  option.value.hoverObj.backgroundImageType
                } no-repeat`,
        }
      : {};
    // 根据是否系列样式优先设置样式
    if (
      option.value.isHovered &&
      option.value.isSeriesFirst &&
      option.value.seriesTabsList?.length &&
      index !== -1
    ) {
      // 如果找不到对应系列的样式则使用全局的option.value.activeObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.color = `${targetItem.hoverObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.hoverObj.fontSize || 12}px`;
        returnStyle.fontWeight = `${targetItem.hoverObj.fontWeight}`;
        returnStyle.fontFamily = `${targetItem.hoverObj.fontFamily}`;
        returnStyle.fontStyle = `${targetItem.hoverObj.fontStyle}`;
        returnStyle.textShadow = `${
          targetItem.hoverObj.isTextShadow
            ? `${targetItem.hoverObj.textShadow.color} ${targetItem.hoverObj.textShadow.x || 0}px ${
                targetItem.hoverObj.textShadow.y || 0
              }px ${targetItem.hoverObj.textShadow.blur}px`
            : "none"
        }`;
        returnStyle.transform = `translate(${targetItem.hoverObj.textTranslateX || 0}px, ${
          targetItem.hoverObj.textTranslateY || 0
        }px)`;
        returnStyle.border = `${targetItem.hoverObj.borderWidth || 0}px solid ${targetItem.hoverObj.borderColor}`;
        returnStyle.background =
          targetItem.hoverObj.backgroundType == "color"
            ? targetItem.hoverObj.backgroundColor
            : `url(${setMinioUrl(targetItem.hoverObj.backgroundImage)}) 50% 50% / ${
                targetItem.hoverObj.backgroundImageType
              } no-repeat`;
      }
    }
    return returnStyle;
  };

  // 设置悬停样式
  const setHoverStyle = (targetIndex = -1) => {
    if (!rollSubtabsRef.value) {
      return;
    }

    const fields = [
      "color",
      "fontSize",
      "fontWeight",
      "fontFamily",
      "fontStyle",
      "textShadow",
      "transform",
      "border",
      "background",
    ];
    const index =
      option.value.isSeriesFirst && option.value.seriesTabsList?.length
        ? targetIndex
        : -1;
    const hoverStyles = styleHoverFont(index);

    fields.forEach((field) => {
      rollSubtabsRef.value?.style.setProperty(
        `--hover-${field}`,
        hoverStyles[field as keyof typeof hoverStyles] || "",
      );
    });
  };

  // 处理点击事件
  const handleClick = async (
    info: ChartDataItem,
    isExecuteOnlyConditionSatisfied = false,
    eventType = EventTypeEnum.Click,
  ) => {
    console.log("handleClick info:", info);
    if (eventStatus.value) {
      return;
    }
    eventStatus.value = true;

    if (!info || info.disabled) {
      currentActive.value = "";
      eventStatus.value = false;
      return;
    }

    if (option.value.isFixedSelectedItem) {
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: eventType,
        events: element.events,
        isExecuteOnlyConditionSatisfied,
        throwValue: info,
      });
    }

    if (currentActive.value === info.value) {
      if (option.value.isCancelSelected) {
        currentActive.value = "";
      }
      // else return; // 去除直接return 不然不能抛出交互事件
    } else {
      currentActive.value = info.value;
    }

    // handleEventAndCallbackEvent(element, { ...info, value: currentActive.value }, isMsg, type)
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: eventType,
      events: element.events,
      isExecuteOnlyConditionSatisfied,
      throwValue: info,
    });
    await sleep(500);
    eventStatus.value = false;
  };

  // 鼠标移入移出事件
  const handleMouseEvent = (
    type: string,
    info: ChartDataItem,
    index?: number,
    isExecuteOnlyConditionSatisfied = false,
  ) => {
    setHoverStyle(index);
    // handleEventAndCallbackEvent(element, info, undefined, type, true)
    const eventType =
      type === "mouseEnter"
        ? EventTypeEnum.MouseEnter
        : EventTypeEnum.MouseLeave;
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: eventType,
      events: element.events,
      isExecuteOnlyConditionSatisfied,
      throwValue: info,
    });
  };

  // 切换滚动
  const switchScroll = (type: string) => {
    const len = dataChart.value.length;
    const num = option.value.directionNum;
    const defaultWH = isHorizontal.value ? defaultW.value : defaultH.value;
    let moveXY = 0;

    switch (type) {
      case "prev":
        moveXY = -defaultWH * num;
        if (translateXY.value === 0) {
          return;
        }
        if (translateXY.value - moveXY > 0) {
          translateXY.value = 0;
        } else {
          translateXY.value = translateXY.value - moveXY;
        }
        break;
      case "next":
        moveXY = -defaultWH * num;
        if (translateXY.value < -(len - num) * defaultWH) {
          if (timer) {
            clearInterval(timer);
          }
          return;
        }
        if (translateXY.value + moveXY < -(len - num) * defaultWH) {
          translateXY.value = -(len - num) * defaultWH;
        } else {
          translateXY.value = translateXY.value + moveXY;
        }
        break;
      default:
        break;
    }
  };

  // 播放动画
  const playAnimate = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (!autoPlay.value) {
      return;
    }

    const time = parseFloat(String(option.value.playDuration || 0));
    timer = setInterval(() => {
      switchScroll("next");
    }, time * 1000);
  };

  // 更改值
  const changeValue = (info: ChartDataItem) => {
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,
      isExecuteOnlyConditionSatisfied: false,
      throwValue: info,
    });
    handleEncode(info);
  };

  // 监听
  watch(
    () => dataChart.value,
    (val) => {
      if (val && val.length > 0) {
        // 组件数据变化后 只有点击事件与请求完成或数据变化的事件才会默认触发一次交互事件
        const filterEvents = events.value.filter((item: any) =>
          ["dataChange"].includes(item.trigger),
        );
        const curInfo = val.find((c: any) => c.value == currentActive.value);
        if (cbArgs.value.length > 0) {
          handleClick(curInfo);
        }
        if (filterEvents && filterEvents.length && curInfo) {
          handleEventAndCallbackEvent({
            id: element.id,
            triggerType: EventTypeEnum.DataChange,
            events: element.events,
            isExecuteOnlyConditionSatisfied: false,
            throwValue: curInfo,
          });
          // handleEvents({
          //   info: curInfo || {},
          //   events: filterEvents,
          //   outside: false,
          //   dynamicPanel: false
          // })
        }
      }
    },
    { immediate: true },
  );

  watch(
    () => autoPlay.value,
    (v) => {
      if (v && !isBuild.value) {
        playAnimate();
      }
    },
    { immediate: true },
  );

  watch(
    () => option.value.active,
    (val) => {
      currentActive.value = val;
    },
    { immediate: true },
  );

  // 生命周期钩子
  onMounted(() => {
    currentActive.value = option.value.active || "";

    // 注册组件事件到全局事件系统
    addEvent({
      [`${interactiveEnum.RollSubtabs}-${element.id}`]: {
        handleClick: (
          info: ChartDataItem,
          isExecuteOnlyConditionSatisfied = false,
        ) => {
          eventStatus.value = false;
          encodeStatus.value = false;
          handleClick(
            info,
            isExecuteOnlyConditionSatisfied,
            EventTypeEnum.DataChange,
          );
        },
      },
    });
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    eventStatus.value = false;
    encodeStatus.value = false;
  });

  return {
    rollSubtabsRef,
    dataChart,
    option,
    isHorizontal,
    translateXY,
    currentActive,
    styleGrid,
    styleFlex,
    liMinHeight,
    liMinWidth,
    arrowContainStyle,
    arrowLStyle,
    arrowRStyle,
    events,
    isBuild,
    styleDefaultItem,
    styleDefaultFont,
    styleActiveItem,
    styleActiveFont,
    handleClick,
    handleEncode,
    handleMouseEvent,
    switchScroll,
    changeValue,
  };
}
