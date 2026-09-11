import { setMinioUrl } from "@screenwright/composables";
import { lineargradientHandle, setPx } from "@screenwright/core";
import { cloneDeep, isArray, isNil } from "lodash-es";
import type { CSSProperties, Ref } from "vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";

export function useCountUpV2(option: Ref<any>, dataChart: Ref<any>) {
  // 响应式数据
  const countupV2Ref = ref<HTMLElement | null>(null);
  const spaceNum = ref<string[]>(["0", "0", "0", "0", "0", "0"]);
  const dataItem = ref<Record<string, any>>({});
  const autoIncrementTimer = ref<number | null>(null);
  // const rgbaColor = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // const rgbaRegex = /rgba?\(\d{1,3},\d{1,3},\d{1,3},\d{1}\)/gi;

  // 计算属性
  const pointIds = computed(() => {
    const indices: number[] = [];
    const length = `${option.value.completeCount}`.padStart(
      option.value.completeCount,
      option.value.completeCount,
    ).length;
    if (length > 3) {
      for (let i = length - 3; i > 0; i -= 3) {
        indices.push(i);
      }
    }
    return indices.reverse();
  });

  const prefixStyle = computed<CSSProperties>(() => ({
    position: "absolute",
    top: setPx(option.value.prefixSplity),
    left: setPx(option.value.prefixSplitx),
    color: option.value.prefixColor || "#fff",
    fontSize: setPx(option.value.prefixFontSize || 64),
    fontWeight: option.value.prefixFontWeight,
    fontStyle: option.value.prefixFontStyle,
    fontFamily: option.value.prefixFontFamily,
  }));

  const styleName = computed(() => {
    const baseStyle = {
      width: `${option.value.spanWidth}px`,
      height: `${option.value.spanHeight}px`,
      margin: `0 ${option.value.spanMangin}px`,
      backgroundColor: option.value.backgroundColor,
      color: option.value.color || "#fff",
      fontSize: setPx(option.value.fontSize || 64),
      fontWeight: option.value.fontWeight,
      fontStyle: option.value.fontStyle,
      fontFamily: option.value.fontFamily,
    };

    const dynamicStyle = {
      ...(option.value.splitx && { marginRight: setPx(option.value.splitx) }),
      ...(option.value.splity && { marginBottom: setPx(option.value.splity) }),
      ...(option.value.backgroundImage && {
        backgroundImage: `url(${setMinioUrl(option.value.backgroundImage)})`,
        backgroundSize: "100% 100%",
      }),
    };

    const typeStyle = (() => {
      if (option.value.type === "img") {
        return {
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
        };
      }
      if (option.value.type === "border") {
        return {
          borderColor: option.value.borderColor || "#fff",
          borderStyle: "solid",
          borderWidth: `${option.value.borderTopWidth || 0}px ${option.value.borderRightWidth || 0}px ${
            option.value.borderBottomWidth || 0
          }px ${option.value.borderLeftWidth || 0}px`,
          boxShadow: `inset 0 0 10px ${option.value.borderColor}`,
        };
      }
      return {};
    })();

    return {
      ...baseStyle,
      ...dynamicStyle,
      ...typeStyle,
    };
  });

  const fontColorLinear = computed<CSSProperties>(() => {
    // debugger;
    console.log(lineargradientHandle(option.value.fontLinearColor), "zzz");
    if (!option.value.setFontLinear) {
      return {};
    } else {
      // const rgbas = option.value.fontLinearColor.match(rgbaRegex);
      // console.log(option.value.fontLinearColor, "option.value.fontLinearColoroption.value.fontLinearColor");
      // const linearColor = rgbaColor.map((a, i) => {
      //   return `${rgbas[0]} ${i * 10}%, ${rgbas[1]} ${(i + 1) * 10}%`;
      // });
      // console.log(linearColor, "linearColor");
      return {
        // transform: "translate(-150%, 0%)",
        color: "white",
        background: lineargradientHandle(option.value.fontLinearColor),
        textFillColor: "transparent",
        boxDecorationBreak: "clone",
        "-webkit-background-clip": "text",
        "background-clip": "text",
        display: "inline-block",
      };
      // return {
      //   color: "white",
      //   background: `${option.value.fontLinearColor.split(",")[0]}, ${linearColor.join()}) text`,
      //   textFillColor: "transparent",
      //   boxDecorationBreak: "clone"
      // };
    }
  });

  const suffixStyle = computed(() => {
    let styleObj: any = {
      display: option.value.suffixInline,
      transform: `translate(${setPx(option.value.suffixSplitx)}, ${setPx(option.value.suffixSplity)})`,
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

  // 方法
  const getValByProp = (item: any, prop: string) => {
    return item[prop] ? item[prop] : option.value[prop];
  };

  const toOrderNum = (value: number | string) => {
    let num = value.toString();
    const { completeCount } = option.value;
    while (num.length < completeCount) {
      num = "0" + num;
    }

    if (num.length === completeCount) {
      spaceNum.value = num.split("");
    } else if (num.length > completeCount) {
      spaceNum.value = num.slice(-completeCount).split("");
    }
  };

  const setNumberTransform = async () => {
    const numberItems = countupV2Ref.value?.querySelectorAll(".item");
    const numberArr: any = spaceNum.value.filter(
      (item) => !isNaN(Number(item)),
    );
    numberItems?.forEach((elem, index) => {
      // 增加动画时间
      (elem as HTMLElement).style.transform =
        `translate(-50%, -${numberArr[index] * 10}%)`;
    });
  };

  const renderCountup = (count?: number) => {
    if (isNil(count)) {
      return;
    }
    toOrderNum(count);
    setNumberTransform();
  };

  const setAutoIncrement = () => {
    const { autoIncrement, randomRange, incrementFrequency, incrementTotal } =
      option.value;
    if (!autoIncrement || !randomRange || !incrementFrequency) {
      clearInterval(autoIncrementTimer.value!);
      return;
    }

    if (autoIncrementTimer.value) {
      clearInterval(autoIncrementTimer.value);
    }

    let currentValue = cloneDeep(dataItem.value.value);

    const incrementTotalAll = incrementTotal + currentValue;

    autoIncrementTimer.value = window.setInterval(() => {
      const randowValue = parseInt(`${Math.random() * randomRange}`);
      currentValue = currentValue + randowValue;
      renderCountup(
        currentValue > incrementTotalAll ? incrementTotalAll : currentValue,
      );
      if (currentValue > incrementTotalAll) {
        clearInterval(autoIncrementTimer.value!);
      }
    }, incrementFrequency * 1000);
  };

  // 监听数据变化
  watch(
    () => dataChart.value,
    (nv) => {
      console.log("dataChart changed", nv);
      if (isArray(nv) && nv.length) {
        dataItem.value = nv[0];
      } else {
        dataItem.value = nv;
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    () => dataItem.value,
    (nv) => {
      console.log("dataItem changed", nv);
      if (isNil(nv.value)) {
        return;
      }
      renderCountup(nv.value);
      setAutoIncrement();
    },
    { immediate: true },
  );

  watch(
    () => option.value.completeCount,
    () => {
      if (dataItem.value?.value !== undefined) {
        renderCountup(dataItem.value.value);
      }
    },
  );

  // 清理资源
  onBeforeUnmount(() => {
    if (autoIncrementTimer.value) {
      clearInterval(autoIncrementTimer.value);
    }
  });

  return {
    countupV2Ref,
    spaceNum,
    dataItem,
    pointIds,
    prefixStyle,
    styleName,
    fontColorLinear,
    suffixStyle,
    getValByProp,
    renderCountup,
    setAutoIncrement,
  };
}
