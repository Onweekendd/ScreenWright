import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { cloneDeep, isUndefined } from "lodash-es";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import type { StyleObject } from "./multiSubtabs";

export default function useMultiSubtabs(element: any) {
  const {
    option,
    isBuild,
    events,
    encodes,
    dataChart,
    styleSizeName,
    handleEventAndCallbackEvent,
    handleEncode,
  } = useBaseData(element);
  const { addEvent } = useActionEvent();

  const multiSubtabs = ref<HTMLElement | null>(null);

  // 响应式状态
  const currentActive = ref("");
  const isFirst = ref(true);
  const eventStatus = ref(false);
  const encodeStatus = ref(false);

  // 计算属性
  const defaultActive = computed(() => {
    return currentActive.value?.split(",").filter(Boolean);
  });

  const liMinHeight = computed(() => {
    return {
      minHeight: option.value.setMinHeight
        ? `${element.height / option.value.rows}px`
        : "auto",
    };
  });

  const styleGrid = computed(() => {
    return {
      gridTemplateRows: `repeat(${option.value.rows}, 1fr)`,
      gridTemplateColumns: `repeat(${option.value.columns}, 1fr)`,
      rowGap: `${option.value.rowGap}px`,
      columnGap: `${option.value.columnGap}px`,
    };
  });

  const styleFlex = computed(() => {
    return {
      padding: `${option.value.paddingTop}px ${option.value.paddingRight}px ${option.value.paddingBottom}px ${option.value.paddingLeft}px`,
      writingMode: option.value.writingMode,
      alignItems: option.value.alignItems,
    };
  });

  const styleDefaultFont = computed(() => {
    return getStyleFont(option.value.defaultObj);
  });

  const styleDefaultItem = computed(() => {
    return getStyleItem(option.value.defaultObj);
  });

  const styleActiveFont = computed(() => {
    return getStyleFont(option.value.activeObj);
  });

  const styleActiveItem = computed(() => {
    return getStyleItem(option.value.activeObj);
  });

  const styleSeriesList = computed(() => {
    const hoverList: any[] = [];
    const activeList: any[] = [];
    const activeFontList: any[] = [];
    const defaultList: any[] = [];
    const defaultFontList: any[] = [];

    for (let i = 0; i < option.value.seriesTabsList.length; i++) {
      if (!option.value.isSeriesFirst) {
        break;
      }
      const cItem = option.value.seriesTabsList[i];

      if (option.value.isHovered) {
        hoverList.push({
          ...getStyleFont(cItem.hoverObj),
          ...getStyleItem(cItem.hoverObj),
        });
      }

      defaultList.push(getStyleItem(cItem.defaultObj));
      defaultFontList.push(getStyleFont(cItem.defaultObj));
      activeList.push(getStyleItem(cItem.activeObj));
      activeFontList.push(getStyleFont(cItem.activeObj));
    }

    return {
      hoverList,
      activeList,
      activeFontList,
      defaultList,
      defaultFontList,
    };
  });

  const styleHoverFont = computed(() => {
    if (option.value.isHovered) {
      return {
        ...getStyleFont(option.value.hoverObj),
        ...getStyleItem(option.value.hoverObj),
      };
    } else {
      // 返回带有所有必需属性的对象，但值为默认值或空
      return {
        color: "",
        fontSize: "",
        fontWeight: "",
        fontFamily: "",
        fontStyle: "",
        textShadow: "",
        transform: "",
        border: "",
        background: "",
      };
    }
  });

  // 辅助函数来生成样式
  function getStyleFont(styleObj: StyleObject = {}) {
    return {
      color: styleObj.fontColor,
      fontSize: `${styleObj.fontSize || 12}px`,
      fontWeight: styleObj.fontWeight,
      fontFamily: styleObj.fontFamily,
      fontStyle: styleObj.fontStyle,
      textShadow: styleObj.isTextShadow
        ? `${styleObj.textShadow?.color} ${styleObj.textShadow?.x || 0}px ${styleObj.textShadow?.y || 0}px ${
            styleObj.textShadow?.blur
          }px`
        : "none",
      transform: `translate(${styleObj.textTranslateX || 0}px, ${styleObj.textTranslateY || 0}px)`,
    };
  }

  function getStyleItem(styleObj: StyleObject = {}) {
    return {
      border: styleObj.isBorder
        ? `${styleObj.borderWidth || 0}px solid ${styleObj.borderColor}`
        : "none",
      background:
        styleObj.backgroundType === "color"
          ? styleObj.backgroundColor
          : `url(${setMinioUrl(styleObj.backgroundImage || "")}) 50% 50% / ${styleObj.backgroundImageType} no-repeat`,
    };
  }

  // 方法
  function isSelect(value: string | number) {
    if (isUndefined(defaultActive.value) || `${defaultActive.value}` === "0") {
      return false;
    }
    return defaultActive.value.includes(String(value));
  }

  async function handleClick(info: any) {
    if (eventStatus.value) {
      return;
    }
    eventStatus.value = true;
    if (!info || info.disabled) {
      return;
    }

    if (isSelect(info.value)) {
      const idx = defaultActive.value.findIndex(
        (a) => a === String(info.value),
      );
      const nActive = cloneDeep(defaultActive.value);
      nActive.splice(idx, 1);
      currentActive.value = nActive.join(",");
    } else {
      const newActive = [...defaultActive.value, String(info.value)];
      currentActive.value = newActive.join(",");
    }

    const isChecked = isSelect(info.value);
    info.isChecked = isChecked;
    const selectArr = dataChart.value
      .filter((v: any) => v.isChecked)
      .map((v: any) => v.value);

    console.log("切换组件状态监听", dataChart.value, {
      ...info,
      isChecked,
      list: selectArr.join(","),
    });

    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,
      isExecuteOnlyConditionSatisfied: true,
      throwValue: {
        ...info,
        isChecked,
        list: selectArr.join(","),
      },
    });

    await sleep(200);
    eventStatus.value = false;
  }

  async function changeValue(info: any) {
    let vals = info.value?.split(",") || [];
    if (!parseInt(info.value)) {
      vals = [...defaultActive.value];
    }
    for (const val of vals) {
      // await handleClick({ value: val }, isMsg, "dataChange")
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.Change,
        events: element.events,

        throwValue: { value: val },
      });
      // await handleEncode({ value: val })
      await sleep(220);
    }
  }

  function initData() {
    console.log(
      "触发initData",
      dataChart.value,
      !currentActive.value,
      typeof currentActive.value,
      currentActive.value,
    );
    // 重置
    dataChart.value.map((item: any) => {
      return (item.isChecked = false);
    });
    if (!currentActive.value) {
      return;
    }
    if (
      typeof currentActive.value === "string" &&
      currentActive.value.length > 0
    ) {
      const dataArr = currentActive.value.split(",");
      for (let i = 0; i < dataArr.length; i++) {
        const itemValue = Number(dataArr[i]);
        const index = dataChart.value.findIndex((item: any) => {
          return item.value === itemValue;
        });

        dataChart.value[index].isChecked = true;
      }
    }
  }

  function setHoverStyle() {
    if (!multiSubtabs.value) {
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

    fields.forEach((field) => {
      if (multiSubtabs.value) {
        multiSubtabs.value.style.setProperty(
          `--hover-${field}`,
          (styleHoverFont.value as any)[field] || "",
        );
      }
    });
  }

  function handleMouseEvent(type: string, info: any) {
    const eventType =
      type === "mouseEnter"
        ? EventTypeEnum.MouseEnter
        : EventTypeEnum.MouseLeave;
    console.log(eventType, eventType);
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: eventType,
      events: element.events,

      throwValue: info,
    });
    // handleEventAndCallbackEvent(element, info, undefined, type, true)
  }

  // 监听与生命周期
  watch(
    () => dataChart.value,
    (val) => {
      if (val && val.length > 0) {
        // initData();
        // const filterEvents = events.value.filter((item: any) => ["click", "dataChange"].includes(item.trigger))

        for (let i = 0; i < defaultActive.value.length; i++) {
          const checked = defaultActive.value[i];
          const curInfo = val.find((c: any) => String(c.value) === checked);

          if (!curInfo) {
            continue;
          }

          // if (cbArgs.value.length > 0 && isFirst.value) {
          //   handleClick(curInfo)
          // }
          const isChecked = isSelect(curInfo.value);
          // if (filterEvents && filterEvents.length) {
          handleEventAndCallbackEvent({
            id: element.id,
            triggerType: EventTypeEnum.DataChange,
            events: element.events,

            throwValue: { ...curInfo, isChecked },
          });
          // const isChecked = isSelect(curInfo.value)
          // handleEvents({
          //   info: { ...curInfo, isChecked },
          //   events: filterEvents,
          //   outside: quotePanel,
          //   dynamicPanel: dynamicPanel,
          //   isCheck: true
          // })
          // }
        }
      }
      isFirst.value = false;
    },
    { immediate: true },
  );

  watch(
    () => option.value.isHovered,
    (val) => {
      if (val) {
        setHoverStyle();
      }
    },
  );

  watch(
    () => option.value.active,
    (val) => {
      currentActive.value = val;
    },
    { immediate: true },
  );

  onMounted(async () => {
    currentActive.value = option.value.active;
    nextTick(() => {
      setHoverStyle();
    });

    // 注册组件事件到全局事件系统
    addEvent({
      [`${interactiveEnum.MultiSubtabs}-${element.id}`]: {
        handleClick,
      },
    });

    await sleep(100);
    initData();
  });

  onBeforeUnmount(() => {
    eventStatus.value = false;
    encodeStatus.value = false;
  });

  return {
    multiSubtabs,
    dataChart,
    option,
    currentActive,
    defaultActive,
    liMinHeight,
    styleGrid,
    styleFlex,
    styleDefaultFont,
    styleDefaultItem,
    styleActiveFont,
    styleActiveItem,
    styleSeriesList,
    styleHoverFont,
    events,
    encodes,
    isBuild,
    styleSizeName,
    isSelect,
    handleClick,
    changeValue,
    setHoverStyle,
    handleEventAndCallbackEvent,
    handleMouseEvent,
    handleEncode,
    initData,
  };
}
