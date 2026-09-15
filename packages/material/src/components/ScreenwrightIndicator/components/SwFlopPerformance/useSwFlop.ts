import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { lineargradientHandle, setPx } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import type { FlopDataItem } from "../types";

export function useSwFlop(props: { element: ComponentType }) {
  const { dataChart, styleSizeName, option, width, height, clickFormatter } =
    useBaseData(props.element);

  const statusDIC = ref([".", ","]);
  const dataChartItem = ref<any>({});
  const prevValue = ref(0);
  const prevTimer = ref<NodeJS.Timeout | null>(null);
  const autoIncrementTimer = ref<NodeJS.Timeout | null>(null);
  const ftCountUpRef = ref();
  // 保存初始的目标值，用于重新初始化时恢复
  const decimals = computed(() => option.value.decimals || 0);
  const currentValue = ref(0);
  const listData = computed(() => {
    if (isArray(dataChartItem.value)) {
      return dataChartItem.value;
    } else {
      return [dataChartItem.value];
    }
  });

  const isWhole = computed(() => option.value.whole || false);
  const type = computed(() => option.value.type);
  const isBorder = computed(() => type.value === "border");
  const isImg = computed(() => type.value === "img");
  const span = computed(() => option.value.span || 1);
  const filterStyle = computed(() => ({
    filter: option.value.shadowShow
      ? `drop-shadow(${option.value.shadowColor} ${option.value.shadowX ? option.value.shadowX + "px" : 0} ${
          option.value.shadowY ? option.value.shadowY + "px" : 0
        } ${option.value.shadowFuzzy ? option.value.shadowFuzzy + "px" : 0})`
      : "",
  }));
  const imgStyles = computed<CSSProperties>(() => ({
    borderStyle: option.value.backgroundBorder ? "solid" : undefined,

    borderImageSource: option.value.backgroundBorder
      ? `url(${setMinioUrl(option.value.backgroundBorder)})`
      : undefined,
    borderImageSlice: `${option.value.borderTopWidth || 0} ${option.value.borderRightWidth || 0} ${
      option.value.borderBottomWidth || 0
    } ${option.value.borderLeftWidth || 0}`,
    borderWidth: `${option.value.borderTopWidth || 0}px ${option.value.borderRightWidth || 0}px ${
      option.value.borderBottomWidth || 0
    }px ${option.value.borderLeftWidth || 0}px`,
    boxSizing: "border-box",
  }));

  const borderStyles = computed<CSSProperties>(() => {
    if (!isBorder.value) {
      return {};
    }
    return {
      borderColor: option.value.borderColor || "#fff",
      borderStyle: "solid",
      borderWidth: `${option.value.borderTopWidth || 0}px ${option.value.borderRightWidth || 0}px ${
        option.value.borderBottomWidth || 0
      }px ${option.value.borderLeftWidth || 0}px`,
    };
  });

  const styleName = computed<CSSProperties>(() => {
    const targetStyle =
      type.value === "img" ? imgStyles.value : borderStyles.value;
    return {
      letterSpacing: `${option.value.letterSpace}px`,
      textAlign: option.value.textAlign,
      backgroundColor: option.value.backgroundColor,
      color: option.value.color || "#fff",
      fontSize: setPx(option.value.fontSize || 64),
      fontWeight: option.value.fontWeight,
      fontStyle: option.value.fontStyle,
      fontFamily: option.value.fontFamily,
      ...targetStyle,
    };
  });

  const styleParentSize = computed<CSSProperties>(() => ({
    boxSizing: "border-box" as const,
    display: "inline-block",
    width: `${100 / (span.value || 1) - 1}%`,
    // ...(option.value.splitx && { paddingRight: setPx(option.value.splitx) }),
    // ...(option.value.splity && { paddingBottom: setPx(option.value.splity) })
  }));

  const styleParentName = computed(() => ({
    marginLeft: `${((option.value.splitx / 100) * width.value) / 2}px`,
    marginTop: `${((option.value.splity / 100) * height.value) / 2}px`,
    ...{
      backgroundImage: option.value.backgroundImage
        ? `url(${setMinioUrl(option.value.backgroundImage)})`
        : undefined,
      backgroundColor: option.value.backgroundColor,
    },
    ...(option.value.padding && { padding: setPx(option.value.padding) }),
  }));

  const fontColorLinear = computed(() => {
    if (!option.value.setFontLinear) {
      return {};
    } else {
      return {
        color: "white",
        background: lineargradientHandle(option.value.fontLinearColor),
        textFillColor: "transparent",
        boxDecorationBreak: "clone",
        "-webkit-background-clip": "text",
        "background-clip": "text",
        display: "inline-block",
        // "padding-right": "20px"
      };
    }
  });

  const isWholeStyle = computed<CSSProperties>(() => ({
    width: "100%",
    height: "100%",
    alignItems: "center",
    textAlign: option.value.textAlign,
    justifyContent:
      option.value.textAlign === "left"
        ? "flex-start"
        : option.value.textAlign === "right"
          ? "flex-end"
          : "center",
    flexWrap:
      option.value.prefixInline === "block" ||
      option.value.suffixInline === "block"
        ? "wrap"
        : "nowrap",
  }));

  const prefixStyle = computed<CSSProperties>(() => ({
    display: option.value.prefixInline,
    flex: option.value.prefixInline === "block" ? "1 0 100%" : "inherit",
    textAlign: option.value.prefixTextAlign,
    marginRight: `${((option.value.prefixSplitx / 100) * width.value) / 2}px`,
    marginBottom: `${((option.value.prefixSplity / 100) * height.value) / 2}px`,
    color: option.value.prefixColor || "#fff",
    fontSize: setPx(option.value.prefixFontSize || 64),
    fontWeight: option.value.prefixFontWeight,
    fontStyle: option.value.prefixFontStyle,
    fontFamily: option.value.prefixFontFamily,
  }));

  const suffixStyle = computed(() => {
    let styleObj: any = {
      display: option.value.suffixInline,
      flex: option.value.suffixInline === "block" ? "1 0 100%" : "inherit",
      textAlign: option.value.suffixTextAlign,
      marginLeft: `${((option.value.suffixSplitx / 100) * width.value) / 2}px`,
      marginTop: `${((option.value.suffixSplity / 100) * height.value) / 2}px`,
      color: option.value.suffixColor || "#fff",
      fontSize: setPx(option.value.suffixFontSize || 64),
      fontWeight: option.value.suffixFontWeight,
      fontStyle: option.value.suffixFontStyle,
      fontFamily: option.value.suffixFontFamily,
    };

    if (!option.value.suffixSetFontLinear) {
      return styleObj;
    } else {
      styleObj = {
        ...styleObj,
        color: "white",
        background: lineargradientHandle(option.value.suffixFontLinearColor),
        textFillColor: "transparent",
        boxDecorationBreak: "clone",
        "-webkit-background-clip": "text",
        "background-clip": "text",
        display: "inline-block",
      };

      return styleObj;
    }
  });

  const handleClick = (item: FlopDataItem, index: number) => {
    if (clickFormatter) {
      clickFormatter({
        type: index,
        value: item,
        data: dataChartItem.value,
      });
    }
  };

  const getformatterData = (value: number | undefined) => {
    if (
      option.value.makeComplete &&
      value !== undefined &&
      value.toString().length <= option.value.completeCount
    ) {
      const count = option.value.completeCount - value.toString().length;
      return `${Array.from({ length: count }).fill(0).join("")}`;
    }
    return "";
  };

  const getValByProp = (item: any, prop: string) => {
    return item[prop] ? item[prop] : option.value[prop];
  };

  const setDelayLoading = () => {
    prevValue.value = cloneDeep(dataChartItem.value.value);
    dataChartItem.value.value = null;
    if (option.value.delayLoading && option.value.delayTime) {
      prevTimer.value = setTimeout(() => {
        dataChartItem.value.value = prevValue.value;
        if (prevTimer.value) {
          clearTimeout(prevTimer.value);
        }
        setAutoIncrement();
      }, option.value.delayTime * 1000);
    } else {
      dataChartItem.value.value = prevValue.value;
      setAutoIncrement();
    }
  };

  const setAutoIncrement = () => {
    const { autoIncrement, randomRange, incrementFrequency } = option.value;
    if (!autoIncrement || !randomRange || !incrementFrequency) {
      if (autoIncrementTimer.value) {
        clearInterval(autoIncrementTimer.value);
      }
      return;
    }
    if (autoIncrementTimer.value) {
      clearInterval(autoIncrementTimer.value);
    }

    if (isArray(dataChartItem.value)) {
      if (
        dataChartItem.value[0] &&
        (dataChartItem.value[0].value !== undefined ||
          dataChartItem.value[0].value !== null)
      ) {
        currentValue.value = dataChartItem.value[0].value;
      } else {
        return;
      }
    } else {
      if (
        dataChartItem.value &&
        (dataChartItem.value.value !== undefined ||
          dataChartItem.value.value !== null)
      ) {
        currentValue.value = dataChartItem.value.value;
      } else {
        return;
      }
    }
    console.log("setAutoIncrement", currentValue.value);
    autoIncrementTimer.value = setInterval(() => {
      const randowValue = parseInt((Math.random() * randomRange).toString());
      currentValue.value += randowValue;
      ftCountUpRef.value[0].update(currentValue.value);
      console.log("setAutoIncrement", currentValue.value);
    }, incrementFrequency * 1000);
  };

  return {
    dataChart,
    option,
    dataChartItem,
    styleSizeName,
    statusDIC,
    listData,
    ftCountUpRef,
    decimals,
    isWhole,
    type,
    isBorder,
    isImg,
    styleName,
    styleParentSize,
    styleParentName,
    fontColorLinear,
    isWholeStyle,
    prefixStyle,
    suffixStyle,
    filterStyle,
    handleClick,
    getformatterData,
    getValByProp,
    setDelayLoading,
  };
}
