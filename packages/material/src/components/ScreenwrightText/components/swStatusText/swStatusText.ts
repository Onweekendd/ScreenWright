import { useBaseData } from "@screenwright/composables";
import { getAlign, lineargradientHandle } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { setPx, validData } from "../utils";

export function useSwText2(props: { element: ComponentType }) {
  const {
    option,
    isEdit,
    isBuild,
    styleSizeName,
    dataChart: inputData,
  } = useBaseData(props.element);
  // 响应式数据
  const main = ref<HTMLElement>();
  const box = ref<HTMLElement>();
  const boxRef = ref<HTMLElement>();
  const left = ref(0);
  const contentTimer = ref<NodeJS.Timeout>();
  const cloneDataChart = ref<any[]>([]);
  const checkInterval = ref<NodeJS.Timeout>();

  // 计算属性
  const fontSize = computed(() => option.value.fontSize);
  const scroll = computed(() => validData(option.value.scroll, false));
  const step = computed(() => option.value.step || 5);
  const speed = computed(() => option.value.speed || 100);
  const textWidth = computed(() => {
    const regex = /<[^>]+>/g;
    const result = inputData.value?.value
      ? inputData.value?.value.replace(regex, "")
      : "";
    return result.length * fontSize.value;
  });

  const dataIsArray = computed(() => Array.isArray(inputData.value));
  // 文本对齐方式
  const textAlignVertical = computed(() => {
    return getAlign(option.value.textAlignVertical);
  });
  const styleBox = computed<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      textAlign: option.value.textAlign || "center",
      "align-items": textAlignVertical.value,
    };
  });

  // 样式相关计算属性
  const styleName = computed<CSSProperties>(() => {
    const resultColor =
      option.value.selectedTextType === "normal"
        ? {
            color: option.value.color || "rgba(255, 255, 255, 1)",
            backgroundColor: option.value.backgroundColor,
          }
        : {
            "background-clip": "text",
            "-webkit-background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            backgroundImage: lineargradientHandle(
              option.value.selectedTextColor,
            ),
          };
    return {
      ...resultColor,
      width: scroll.value
        ? textWidth.value
          ? `${textWidth.value}px`
          : "fit-content"
        : "100%",
      transform: `translateX(${left.value}px)`,
      letterSpacing: setPx(option.value.split),
      lineHeight: option.value.lineHeight2
        ? `${option.value.lineHeight2}px`
        : "unset",
      fontFamily:
        option.value.fontFamily ||
        "Source Han Sans CN-Normal, Source Han Sans CN",
      fontSize: `${option.value.fontSize}px`,
      fontWeight: option.value.fontWeight || "normal",
      fontStyle: option.value.fontStyle || "normal",
      filter: option.value.shadowShow
        ? `drop-shadow(${option.value.shadowColor} ${option.value.shadowX || 0}px ${option.value.shadowY || 0}px ${
            option.value.shadowFuzzy || 0
          }px)`
        : "",
      whiteSpace: option.value.iswrap ? "pre-line" : "nowrap",
      overflow: isEdit.value ? "" : "hidden",
      textOverflow: isEdit.value ? "" : "ellipsis",
      cursor: isEdit.value ? "text" : undefined,
    };
  });

  const textAnimation = computed<CSSProperties>(() => {
    return option.value.textAnimationType === "opacityIn"
      ? {
          animationDuration: `${option.value.textAnimationTiming ? option.value.textAnimationTiming / 1000 : 0}s`,
          animationDelay: `${option.value.textAnimationDelay ? option.value.textAnimationDelay / 1000 : 0}s`,
          animationName: `opacity-in`,
          animationTimingFunction: `ease-in`,
          animationFillMode: `forwards`,
          opacity: 0,
        }
      : {};
  });

  // 检索是否满足条件
  const checkCondition = (checkItem: any, listItem: any) => {
    // 字段
    let func;
    // 若expected为字符串 则判断内容加双引号
    if (isNaN(Number(checkItem.expected))) {
      func = `"${listItem[checkItem.field] || 0}" ${checkItem.compare} "${checkItem.expected || ""}"`;
    } else {
      func = `${listItem[checkItem.field] || 0} ${checkItem.compare} ${checkItem.expected || 0}`;
    }

    switch (checkItem.compare) {
      case "include":
        return listItem[checkItem.field]?.includes(checkItem.expected);
      case "exclude":
        return !listItem[checkItem.field]?.includes(checkItem.expected);
      default:
        break;
    }
    // 检查func是否有效
    try {
      return eval(func);
    } catch (e) {
      return false;
    }
  };

  const getAssignStyle = (item: any) => {
    let returnStyle: CSSProperties = {};
    if (item && option.value?.cardList?.length) {
      option.value.cardList.map((clItem: any) => {
        let canSetStyle = false;
        // 值类型为字符串类型，则对比值是不是一样，如果是数字类型，则判断是否在区间内
        if (clItem.mappingValueType === "number") {
          // 设置checkCondition的入参
          const checkItem = {
            expected: clItem.mappingValue,
            field: "value",
            compare: clItem.conditions,
          };
          if (checkCondition(checkItem, item)) {
            canSetStyle = true;
          }
        } else {
          if (item?.value === clItem?.mappingValue) {
            canSetStyle = true;
          }
        }
        // 是否能设置样式
        if (canSetStyle) {
          returnStyle = {
            fontFamily:
              clItem.fontFamily ||
              "Source Han Sans CN-Normal, Source Han Sans CN",
            fontSize: clItem.fontSize + "px",
            fontWeight: clItem.fontWeight || "normal",
            fontStyle: clItem.fontStyle || "normal",
          };
          if (clItem.selectedTextType === "normal") {
            returnStyle.color = clItem.color || "rgba(255, 255, 255, 1)";
            returnStyle.backgroundColor = clItem.backgroundColor;
            returnStyle["backgroundImage"] = "";
            returnStyle["background-clip"] = "";
            returnStyle["-webkit-background-clip"] = "";
            returnStyle["-webkit-text-fill-color"] = "";
          } else {
            returnStyle["background-clip"] = "text";
            returnStyle["-webkit-background-clip"] = "text";
            returnStyle["-webkit-text-fill-color"] = "transparent";
            returnStyle["backgroundImage"] = lineargradientHandle(
              clItem.selectedTextColor,
            );
          }
        }
      });
    }
    return returnStyle;
  };

  // 方法
  const move = () => {
    checkInterval.value && clearInterval(checkInterval.value);
    if (scroll.value) {
      checkInterval.value = setInterval(() => {
        if (left.value < -textWidth.value) {
          left.value = main.value?.offsetWidth || 0;
        }
        left.value -= step.value;
      }, speed.value);
    } else {
      left.value = 0;
    }
  };

  const setTypingEffect = () => {
    cloneDataChart.value = Array.isArray(inputData.value)
      ? inputData.value.map(() => ({ value: "" }))
      : [{ value: "" }];
    AniTypingEffect();
  };

  const AniTypingEffect = async () => {
    const msg = Array.isArray(inputData.value)
      ? inputData.value[0]?.value || ""
      : inputData.value?.value || "";
    if (!msg) {
      console.warn("AniTypingEffect: No message to type");
      return;
    }
    contentTimer.value && clearInterval(contentTimer.value);
    await new Promise((resolve) =>
      setTimeout(resolve, option.value.textAnimationDelay || 0),
    );

    let index = 0;
    contentTimer.value = setInterval(() => {
      if (index >= msg.length) {
        clearInterval(contentTimer.value);
        return;
      }
      cloneDataChart.value[0].value += msg[index++];
    }, option.value.textAnimationTiming || 100);
  };

  const onEditText = async (index: number) => {
    console.log(index);

    if (isBuild.value) {
      // 留空，保留原有逻辑注释，需要时可以实现
      // const textRef = textRefs.value
      // 更新图层配置
      // const objItem = props.componentMap[props.id]
      // if (index === -1) {
      //   updateData({ value: textRef[0].innerHTML })
      // } else {
      //   updateData({ value: textRef[index].innerHTML })
      // }
      // await this.main.generalUpdateLayer(objItem);
    }
  };

  // 生命周期和监听
  onMounted(() => {
    move();
    if (option.value.textAnimationType === "typingEffect" && inputData.value) {
      setTypingEffect();
    }
  });

  onBeforeUnmount(() => {
    checkInterval.value && clearInterval(checkInterval.value);
    contentTimer.value && clearInterval(contentTimer.value);
  });

  watch([() => scroll.value, () => speed.value], move);

  watch(
    [
      () => option.value.textAnimationType,
      () => option.value.textAnimationTiming,
      () => inputData.value,
    ],
    ([type, _timing, data]) => {
      clearInterval(contentTimer.value);
      if (type === "typingEffect" && data) {
        setTypingEffect();
      }
    },
  );

  return {
    main,
    box,
    boxRef,
    inputData,
    option,
    isEdit,
    styleSizeName,
    left,
    cloneDataChart,
    dataIsArray,
    styleBox,
    styleName,
    textAnimation,
    getAssignStyle,
    onEditText,
  };
}
