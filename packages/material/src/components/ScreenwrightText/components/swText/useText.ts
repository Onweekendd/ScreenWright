import { useBaseData } from "@screenwright/composables";
import { getAlign, lineargradientHandle, sleep } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isUndefined } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

export function useText(element: ComponentType) {
  const { isBuild, dataChart, option, width } = useBaseData(element);
  const textRef = ref<HTMLElement | null>(null);
  const boxRef = ref<HTMLElement | null>(null);
  const left = ref(0);
  const checkInterval = ref<number | null>(null);
  const contentTimer = ref<number | null>(null);
  const cloneDataChart = ref<any>([]);
  // 判断数据是否为数组
  const dataIsArray = computed(() => {
    return Array.isArray(dataChart.value);
  });

  // 尺寸样式
  const styleSizeName = computed<CSSProperties>(() => {
    if (isBuild.value) {
      let val: "auto" | "none" | "inherit" | "visible" = "inherit";
      val = "visible";
      return { pointerEvents: val };
    }
    return { pointerEvents: option.value.pointerEvents ? "auto" : "none" };
  });

  const setTransFormStyle = computed<CSSProperties>(() => {
    if (option.value.rotateShow) {
      return {
        transform: `rotateX(${option.value.rotateX}deg) rotateY(${option.value.rotateY}deg) rotateZ(${option.value.rotateZ}deg)`,
      };
    }
    return {};
  });

  // 文字滚动相关
  const scroll = computed(() => {
    return option.value.scroll || false;
  });

  const step = computed(() => {
    return option.value.step || 5;
  });

  const speed = computed(() => {
    return option.value.speed || 100;
  });

  // 这个变量在某些地方可能会用到，暂时标记为未使用
  const _split = computed(() => {
    return option.value.split;
  });

  // 链接相关
  const linkHref = computed(() => {
    return option.value.linkHref || "#";
  });

  const linkTarget = computed(() => {
    return option.value.linkTarget || "_self";
  });

  // 文本对齐方式
  const textAlignVertical = computed(() => {
    return getAlign(option.value.textAlignVertical);
  });

  // 文本宽度计算
  const textWidth = computed(() => {
    if (!dataChart.value?.value) {
      return 0;
    }
    const regex = /<[^>]+>/g;
    const result = dataChart.value.value.replace(regex, "");
    const textLen = result.length;
    return textLen * (option.value.fontSize || 14);
  });

  // 容器样式
  const styleBox = computed<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      textAlign: option.value.textAlign || "center",
      alignItems: textAlignVertical.value,
    };
  });

  // 判断是否使用打字效果
  const isTypingEffect = computed(() => {
    return option.value.textAnimationType === "typingEffect";
  });

  // 文字动画样式
  const textAnimation = computed<CSSProperties>(() => {
    return option.value.textAnimationType === "opacityIn"
      ? {
          animationDuration: `${option.value.textAnimationTiming ? option.value.textAnimationTiming / 1000 : 0}s`,
          animationDelay: `${option.value.textAnimationDelay ? option.value.textAnimationDelay / 1000 : 0}s`,
          animationName: "opacity-in",
          animationTimingFunction: "ease-in",
          animationFillMode: "forwards",
          opacity: 0,
        }
      : {};
  });

  // 文本样式 - 提取的公共样式逻辑
  const getTextStyle = computed<CSSProperties>(() => {
    let resultColor = {};

    if (option.value.selectedTextType === "normal") {
      resultColor = {
        color: option.value.color || "rgba(255, 255, 255, 1)",
        backgroundColor: option.value.backgroundColor,
      };
    } else {
      resultColor = {
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundImage: lineargradientHandle(option.value.selectedTextColor),
      };
    }

    return {
      ...resultColor,
      height: option.value.isLineHeight ? "100%" : "auto",
      width: option.value.scroll ? "fit-content" : "100%",
      letterSpacing: option.value.split ? `${option.value.split}px` : undefined,
      lineHeight: option.value.isLineHeight
        ? `${option.value.lineHeight}px`
        : "unset",
      fontFamily:
        option.value.fontFamily ||
        "Source Han Sans CN-Normal, Source Han Sans CN",
      fontSize: option.value.fontSize
        ? `${option.value.fontSize}px`
        : undefined,
      fontWeight: option.value.fontWeight || "normal",
      fontStyle: option.value.fontStyle || "normal",
      filter: option.value.shadowShow
        ? `drop-shadow(${option.value.shadowColor} ${option.value.shadowX ? option.value.shadowX + "px" : "0"} ${
            option.value.shadowY ? option.value.shadowY + "px" : "0"
          } ${option.value.shadowFuzzy ? option.value.shadowFuzzy + "px" : "0"})`
        : "",
      overflow: "hidden",
      whiteSpace: option.value.iswrap ? "pre-line" : "nowrap",
      writingMode: option.value.writingMode || undefined,
      textOrientation: option.value.textOrientation || "mixed",
      textOverflow: "ellipsis",
      cursor: undefined,
      wordBreak: "break-all",
      transform: option.value.scroll
        ? `translateX(${left.value}px)`
        : undefined,
    };
  });

  // 处理文字点击事件
  const handleClick = () => {
    if (option.value.clickFormatter) {
      option.value.clickFormatter({
        data: dataChart.value,
      });
    }
  };

  // 文字滚动处理
  const move = () => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value);
      checkInterval.value = null;
    }

    if (scroll.value) {
      checkInterval.value = window.setInterval(() => {
        if (left.value < -textWidth.value) {
          left.value = width.value || 0;
        }
        left.value = left.value - step.value;
      }, speed.value);
    } else {
      left.value = 0;
    }
  };

  // 设置打字效果
  const setTypingEffect = () => {
    if (!dataChart.value) {
      return;
    }

    cloneDataChart.value = dataIsArray.value
      ? cloneDeep(
          dataChart.value.map(() => {
            return {
              value: "",
            };
          }),
        )
      : { value: "" };

    AniTypingEffect();
  };

  // 执行打字效果动画
  const AniTypingEffect = async () => {
    if (contentTimer.value) {
      clearInterval(contentTimer.value);
      contentTimer.value = null;
    }

    if (
      !dataChart.value ||
      (Array.isArray(dataChart.value) &&
        (!dataChart.value.length || dataChart.value.length > 1))
    ) {
      return;
    }

    await sleep(option.value.textAnimationDelay || 0);

    let index = 0;
    let curTxt = "";
    const duration = option.value.textAnimationTiming || 100;
    const msg = dataIsArray.value
      ? dataChart.value[0]?.value || ""
      : dataChart.value.value || "";

    if (dataIsArray.value) {
      contentTimer.value = window.setInterval(() => {
        curTxt += msg[index++];
        if (cloneDataChart.value[0]) {
          cloneDataChart.value[0].value = curTxt;
        }
        if (index === msg.length) {
          if (contentTimer.value) {
            clearInterval(contentTimer.value);
            contentTimer.value = null;
          }
        }
      }, duration);
    } else {
      contentTimer.value = window.setInterval(() => {
        curTxt += msg[index++];
        if (cloneDataChart.value) {
          cloneDataChart.value.value = curTxt;
        }
        if (index === msg.length) {
          if (contentTimer.value) {
            clearInterval(contentTimer.value);
            contentTimer.value = null;
          }
        }
      }, duration);
    }
  };

  // 监听滚动属性变化
  watch([scroll, speed], () => {
    move();
  });

  // 监听动画类型变化
  watch(
    () => option.value.textAnimationType,
    (value) => {
      if (contentTimer.value) {
        clearInterval(contentTimer.value);
        contentTimer.value = null;
      }
      if (value === "typingEffect") {
        setTypingEffect();
      }
    },
  );

  // 监听动画时间变化
  watch(
    () => option.value.textAnimationTiming,
    () => {
      if (contentTimer.value) {
        clearInterval(contentTimer.value);
        contentTimer.value = null;
      }
      if (option.value.textAnimationType === "typingEffect") {
        setTypingEffect();
      }
    },
  );

  // 监听数据变化
  watch(dataChart, (val) => {
    if (val && option.value.textAnimationType === "typingEffect") {
      setTypingEffect();
    }
  });

  // 挂载时初始化滚动
  onMounted(() => {
    move();
    // 添加多渐变字段
    if (
      !option.value.multiGradientColors ||
      isUndefined(option.value.multiGradientColors)
    ) {
      option.value.multiGradientColors = [];
    }
  });

  // 组件销毁前清理定时器
  onBeforeUnmount(() => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value);
      checkInterval.value = null;
    }
    if (contentTimer.value) {
      clearInterval(contentTimer.value);
      contentTimer.value = null;
    }
  });

  return {
    option,
    textRef,
    boxRef,
    cloneDataChart,
    styleSizeName,
    dataIsArray,
    styleBox,
    isTypingEffect,
    textAnimation,
    setTransFormStyle,
    handleClick,
    getTextStyle,
    linkHref,
    linkTarget,
    dataChart,
    isBuild,
  };
}
