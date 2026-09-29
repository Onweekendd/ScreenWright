import { useBaseData } from "@screenwright/composables";
import { getAlign } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { upgradeSwTextOption } from "@screenwright/types";
// 注：FtTextOption 类型只能从 "@screenwright/types/schemas" 子路径导入 —— 包根 index.d.ts 里
// `export * from './schemas'` 与同名的 dist/schemas.js 产物撞名，导致该路径下的类型在包根解析不到
// （运行时值导出不受影响，upgradeSwTextOption 从包根导入正常）。这是 @screenwright/types 构建产物的
// 已知问题（参见 useSwImg.ts 的相同处理），不在本次 swtext 组件迁移范围内，这里绕开即可。
import type { FtTextOption } from "@screenwright/types/schemas";
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import "@material/styles/atomicPresetAnimations.css";

/**
 * 各字段的兜底默认值，集中管理（方案文档 §4.1 表格）。
 * 与归一化后的 option 合并，保证下游样式计算里不会出现 undefined/NaN。
 */
export const DEFAULTS = {
  fontFamily: "Source Han Sans CN",
  fontSize: 14,
  fontWeight: 400,
  color: "#ffffff",
  lineHeight: 1.2,
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis"
} as const satisfies Partial<FtTextOption>;

const GRADIENT_PREFIX_RE = /^(linear-gradient|radial-gradient)\(/;

/** color 是否为 CSS 渐变（linear-gradient(...) / radial-gradient(...)），而非纯色 */
export const isGradientColor = (color: string | undefined): boolean => {
  return typeof color === "string" && GRADIENT_PREFIX_RE.test(color.trim());
};

/**
 * 把 CSS text-shadow 字符串转成等价的 filter: drop-shadow(...) 字符串。
 * 渐变文字用 background-clip: text 渲染，text-shadow 对其不生效，需要转成 filter。
 * text-shadow 每层是 "offset-x offset-y blur color"，多层用逗号分隔，
 * drop-shadow() 接受同样的单层语法，逐层转换后用空格拼接（filter 支持多个函数）。
 */
export const textShadowToDropShadow = (textShadow: string): string => {
  return textShadow
    .split(",")
    .map((layer) => layer.trim())
    .filter(Boolean)
    .map((layer) => `drop-shadow(${layer})`)
    .join(" ");
};

/**
 * 数值内容格式化：decimals 保留小数位，thousands 加千分位分隔符，
 * template 用 {value} 占位符替换成最终文本；内容不是数字时 decimals/thousands 不生效。
 */
export const formatTextValue = (
  raw: unknown,
  option: Pick<FtTextOption, "template" | "decimals" | "thousands">
): string => {
  if (raw === undefined || raw === null || raw === "") {
    return option.template ? option.template.replace("{value}", "") : "";
  }

  let text = String(raw);
  const numeric = typeof raw === "number" ? raw : Number(raw);
  const isNumeric = !Number.isNaN(numeric) && (typeof raw === "number" || String(raw).trim() !== "");

  if (isNumeric && (option.decimals !== undefined || option.thousands)) {
    let formatted = option.decimals !== undefined ? numeric.toFixed(option.decimals) : String(numeric);
    if (option.thousands) {
      const [intPart, decimalPart] = formatted.split(".");
      const negative = intPart.startsWith("-");
      const digits = negative ? intPart.slice(1) : intPart;
      const withThousands = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      formatted = `${negative ? "-" : ""}${withThousands}${decimalPart !== undefined ? `.${decimalPart}` : ""}`;
    }
    text = formatted;
  }

  return option.template ? option.template.replace("{value}", text) : text;
};

/** 跑马灯每一帧的间隔（ms），speed 是 px/s，按此间隔换算每帧位移 */
const MARQUEE_TICK_MS = 50;

export function useText(element: ComponentType) {
  const { isBuild, dataChart, option: rawOption, width, clickFormatter } = useBaseData(element);

  // 归一化 option：兼容旧数据格式，对已是当前格式（或空）的数据是恒等操作
  const option = computed<FtTextOption>(
    () => upgradeSwTextOption(rawOption.value as Record<string, unknown>) as FtTextOption
  );

  // 合入默认值，保证下游样式计算读到的字段都有安全兜底
  const mergedOption = computed<FtTextOption>(() => ({ ...DEFAULTS, ...option.value }));

  const textRef = ref<HTMLElement | null>(null);
  const boxRef = ref<HTMLElement | null>(null);
  const left = ref(0);
  const checkInterval = ref<number | null>(null);

  // 判断数据是否为数组
  const dataIsArray = computed(() => Array.isArray(dataChart.value));

  // 尺寸样式（是否响应鼠标事件）
  const styleSizeName = computed<CSSProperties>(() => {
    if (isBuild.value) {
      return { pointerEvents: "visible" as CSSProperties["pointerEvents"] };
    }
    return { pointerEvents: mergedOption.value.pointerEvents ? "auto" : "none" };
  });

  // 容器旋转/位移等变换，option.transform 已经是完整的 CSS transform 字符串
  const setTransFormStyle = computed<CSSProperties>(() => {
    return mergedOption.value.transform ? { transform: mergedOption.value.transform } : {};
  });

  // 跑马灯：由 option.marquee 是否存在驱动，不再使用旧的 type/scroll 字段
  const isMarquee = computed(() => Boolean(option.value.marquee));
  const marqueeSpeed = computed(() => option.value.marquee?.speed || 100);
  const marqueeDirection = computed(() => option.value.marquee?.direction || "left");

  // 超链接：由 option.href 是否存在驱动，不再使用旧的 type==='link' 字段
  const isLink = computed(() => Boolean(option.value.href));
  const linkHref = computed(() => option.value.href || "#");
  const linkTarget = computed(() => option.value.target || "_self");

  // 文本在组件框内的垂直位置
  const textAlignVertical = computed(() => getAlign(mergedOption.value.verticalAlign as string));

  // 文本宽度计算（跑马灯位移边界用）
  const textWidth = computed(() => {
    if (!dataChart.value?.value) {
      return 0;
    }
    const regex = /<[^>]+>/g;
    const result = String(dataChart.value.value).replace(regex, "");
    return result.length * (mergedOption.value.fontSize as number);
  });

  // 容器样式
  const styleBox = computed<CSSProperties>(() => {
    return {
      width: "100%",
      height: "100%",
      textAlign: mergedOption.value.textAlign,
      alignItems: textAlignVertical.value
    };
  });

  // 是否为渐变文字（color 是 CSS 渐变而非纯色）
  const isGradientText = computed(() => isGradientColor(mergedOption.value.color));

  // 颜色相关样式：纯色走 color，渐变走 background-clip: text
  const colorStyle = computed<CSSProperties>(() => {
    if (isGradientText.value) {
      return {
        backgroundImage: mergedOption.value.color,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent"
      };
    }
    return { color: mergedOption.value.color };
  });

  // 阴影相关样式：渐变文字下 text-shadow 不生效，转成 filter: drop-shadow(...)；纯色文字走普通 text-shadow
  const shadowStyle = computed<CSSProperties>(() => {
    const shadow = mergedOption.value.textShadow;
    if (!shadow) {
      return {};
    }
    if (isGradientText.value) {
      return { filter: textShadowToDropShadow(shadow) };
    }
    return { textShadow: shadow };
  });

  // 文本样式 - 提取的公共样式逻辑
  const getTextStyle = computed<CSSProperties>(() => {
    return {
      ...colorStyle.value,
      ...shadowStyle.value,
      background: mergedOption.value.background,
      opacity: mergedOption.value.opacity,
      height: "auto",
      width: isMarquee.value ? "fit-content" : "100%",
      letterSpacing:
        mergedOption.value.letterSpacing !== undefined ? `${mergedOption.value.letterSpacing}px` : undefined,
      lineHeight: mergedOption.value.lineHeight,
      fontFamily: mergedOption.value.fontFamily,
      fontSize: `${mergedOption.value.fontSize}px`,
      fontWeight: mergedOption.value.fontWeight,
      fontStyle: mergedOption.value.fontStyle,
      overflow: "hidden",
      whiteSpace: mergedOption.value.whiteSpace,
      writingMode: mergedOption.value.writingMode,
      textOrientation: mergedOption.value.textOrientation,
      textOverflow: mergedOption.value.textOverflow,
      wordBreak: "break-all",
      transform: isMarquee.value ? `translateX(${left.value}px)` : undefined,
      animation: mergedOption.value.animation,
      pointerEvents: mergedOption.value.pointerEvents ? "auto" : "none"
    };
  });

  // 数值内容格式化：template/decimals/thousands
  const formatValue = (raw: unknown) => formatTextValue(raw, mergedOption.value);

  // 处理文字点击事件
  const handleClick = () => {
    clickFormatter({
      data: dataChart.value
    });
  };

  // 跑马灯位移处理
  const move = () => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value);
      checkInterval.value = null;
    }

    if (!isMarquee.value) {
      left.value = 0;
      return;
    }

    const distancePerTick = (marqueeSpeed.value * MARQUEE_TICK_MS) / 1000;
    checkInterval.value = window.setInterval(() => {
      if (marqueeDirection.value === "right") {
        if (left.value > (width.value || 0)) {
          left.value = -textWidth.value;
        }
        left.value = left.value + distancePerTick;
      } else {
        if (left.value < -textWidth.value) {
          left.value = width.value || 0;
        }
        left.value = left.value - distancePerTick;
      }
    }, MARQUEE_TICK_MS);
  };

  // 监听跑马灯属性变化
  watch([isMarquee, marqueeSpeed, marqueeDirection], () => {
    move();
  });

  // 挂载时初始化跑马灯
  onMounted(() => {
    move();
  });

  // 组件销毁前清理定时器
  onBeforeUnmount(() => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value);
      checkInterval.value = null;
    }
  });

  return {
    option: mergedOption,
    textRef,
    boxRef,
    styleSizeName,
    dataIsArray,
    styleBox,
    setTransFormStyle,
    handleClick,
    getTextStyle,
    formatValue,
    isMarquee,
    isLink,
    linkHref,
    linkTarget,
    dataChart,
    isBuild
  };
}
