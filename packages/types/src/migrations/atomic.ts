/**
 * 原子组件（swtext / swimg）旧数据升级为当前 schema 的兼容层。
 *
 * 这不是维护"另一个组件类型"：swtext/swimg 的 schema 已经原地替换成新的 CSS 词汇版本，
 * 这里的函数只是把历史上已经存进数据库/大屏 JSON 的旧形状数据，在读取时转换成当前 schema
 * 能识别的形状。纯函数、幂等，不依赖 Vue/DOM，前后端可共用。
 *
 * 判断"是不是旧格式"用的是方案文档 §8.1 的方案 B：检测当前 schema 里已经不存在的旧字段名。
 * 两边 schema 都是 `.strict()` 且基本不重叠字段名，误判风险低。
 *
 * 注：@screenwright/core 依赖 @screenwright/types（反向依赖），这里不能 import core 里的
 * lineargradientHandle，渐变字符串拼接在本文件内自成一套最小实现。
 */

// ==================== 颜色/渐变工具（内部，供 upgradeSwTextOption 使用） ====================

interface LegacyLinearGradient {
  type?: string;
  angle?: string | number;
  colors?: { color: string; per: number }[];
}

const parseColorToRgba = (color: string): { r: number; g: number; b: number; a: number } | null => {
  if (!color) return null;
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1
    };
  }
  const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    };
  }
  return null;
};

/** 把一个颜色字符串的 alpha 乘上 factor（0-1），非法/无法解析的颜色原样返回 */
const scaleColorAlpha = (color: string, factor: number): string => {
  const parsed = parseColorToRgba(color);
  if (!parsed) return color;
  const alpha = Math.max(0, Math.min(1, parsed.a * factor));
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha.toFixed(3)})`;
};

/** 旧版 selectedTextColor（渐变对象/字符串）转成 CSS linear-gradient 字符串，opacity 为整体透明度(0-100) */
const legacyGradientToCss = (color: LegacyLinearGradient | string | null | undefined, opacity = 100): string => {
  if (color === null || color === undefined) return "";
  if (typeof color === "string") return opacity < 100 ? scaleColorAlpha(color, opacity / 100) : color;
  if (color.type === "linear-gradient" && Array.isArray(color.colors)) {
    const alpha = Math.max(0, Math.min(1, opacity / 100));
    const stops = color.colors
      .map((stop) => `${alpha < 1 ? scaleColorAlpha(stop.color, alpha) : stop.color} ${stop.per}%`)
      .join(", ");
    return `linear-gradient(${color.angle}deg, ${stops})`;
  }
  return "";
};

interface LegacyMultiGradientItem {
  id?: string;
  color: string;
  opacity: number;
  isShowColor?: boolean;
}

/** 多渐变图层数组 -> 多层 CSS 渐变/颜色字符串（逗号分隔），过滤隐藏图层，opacity 乘进 alpha */
const legacyMultiGradientToCss = (items: LegacyMultiGradientItem[] | undefined): string => {
  if (!Array.isArray(items) || !items.length) return "";
  return items
    .filter((item) => item.isShowColor !== false)
    .map((item) => scaleColorAlpha(item.color, Math.max(0, Math.min(1, (item.opacity ?? 100) / 100))))
    .join(", ");
};

// ==================== swtext ====================

/** 只在旧 schema 里出现、当前 schema 已经不再使用的字段名 */
const LEGACY_SWTEXT_KEYS = [
  "type",
  "link",
  "linkHref",
  "linkTarget",
  "iswrap",
  "selectedTextType",
  "selectedTextColor",
  "selectedTextOpacity",
  "multiGradientColors",
  "textAlignVertical",
  "split",
  "backgroundColor",
  "shadowShow",
  "shadowColor",
  "shadowX",
  "shadowY",
  "shadowFuzzy",
  "shadowExtension",
  "isLineHeight",
  "rotateShow",
  "rotateX",
  "rotateY",
  "rotateZ",
  "scroll",
  "step",
  "speed",
  "textAnimationType",
  "textAnimationTiming",
  "textAnimationDelay",
  "clickFormatter"
] as const;

export const isLegacySwTextOption = (option: Record<string, unknown> | null | undefined): boolean => {
  if (!option || typeof option !== "object") return false;
  return LEGACY_SWTEXT_KEYS.some((key) => key in option);
};

/** 旧字段里明确标注为 TBD、暂时保留原样透传（不在当前 schema 类型声明范围内） */
const SWTEXT_PASSTHROUGH_KEYS = new Set(["textAnimationType", "textAnimationTiming", "textAnimationDelay", "clickFormatter"]);

/**
 * 把旧格式 swtext option 升级为当前 schema。对已经是当前格式（或空）的输入是恒等函数。
 *
 * 实现上以 `{...src}` 打底而不是从空对象重建：option 上完全可能同时混着"已经是新格式的字段"
 * 和"一个孤立的旧字段"（比如状态动画系统往一个已迁移的组件上直接写了一个旧的 rotateX），
 * 从空对象重建会把前者一起丢掉；打底之后只删掉已经被消费/改名的旧字段，其它字段原样保留。
 *
 * 未能明确映射的字段（跑马灯换算公式、clickFormatter、textAnimation*）按文档 TBD 处理：
 * 不静默丢弃，原样透传到返回对象上。
 */
export const upgradeSwTextOption = (option: Record<string, unknown> | null | undefined): Record<string, unknown> => {
  const src = (option ?? {}) as Record<string, any>;
  if (!isLegacySwTextOption(src)) return src;

  const result: Record<string, unknown> = { ...src };

  // split -> letterSpacing
  if (src.split !== undefined) result.letterSpacing = src.split;

  // isLineHeight + lineHeight(px) -> lineHeight（无单位倍数）；isLineHeight 为 false 时不写。
  // lineHeight 这个字段名旧/新 schema 都有但单位不同（旧: px，新: 无单位倍数），
  // 不在 LEGACY_SWTEXT_KEYS 里（因为它本身不是"只在旧 schema 出现"的字段名），
  // 所以要显式清掉 {...src} 打底带过来的旧 px 值，避免把旧单位的数值当新单位直接透出去。
  delete result.lineHeight;
  if (src.isLineHeight && typeof src.lineHeight === "number" && typeof src.fontSize === "number" && src.fontSize > 0) {
    result.lineHeight = src.lineHeight / src.fontSize;
  }

  // 颜色：normal / gradient / multiGradient
  const opacityPct = typeof src.selectedTextOpacity === "number" ? src.selectedTextOpacity : 100;
  if (src.selectedTextType === "gradient") {
    result.color = legacyGradientToCss(src.selectedTextColor, opacityPct);
  } else if (src.selectedTextType === "multiGradient") {
    result.color = legacyMultiGradientToCss(src.multiGradientColors);
  } else if (src.color !== undefined) {
    result.color = opacityPct < 100 ? scaleColorAlpha(src.color, opacityPct / 100) : src.color;
  }

  // 阴影
  if (src.shadowShow) {
    const x = src.shadowX ?? 0;
    const y = src.shadowY ?? 0;
    const fuzzy = src.shadowFuzzy ?? 0;
    const color = src.shadowColor ?? "rgba(0,0,0,1)";
    result.textShadow = `${x}px ${y}px ${fuzzy}px ${color}`;
  }

  // 垂直对齐
  if (src.textAlignVertical !== undefined) {
    result.verticalAlign = src.textAlignVertical === "center" ? "middle" : src.textAlignVertical;
  }

  // 换行
  if (src.iswrap !== undefined) {
    result.whiteSpace = src.iswrap ? "pre-line" : "nowrap";
  }

  // 背景色
  if (src.backgroundColor !== undefined) result.background = src.backgroundColor;

  // 旋转 -> transform
  if (src.rotateShow) {
    result.transform = `rotateX(${src.rotateX ?? 0}deg) rotateY(${src.rotateY ?? 0}deg) rotateZ(${src.rotateZ ?? 0}deg)`;
  }

  // 跑马灯：旧渲染实际按 option.scroll 触发（与 type 枚举无关，是既有实现里的不一致）
  if (src.scroll || src.type === "marquee") {
    const step = typeof src.step === "number" ? src.step : 5;
    const intervalMs = typeof src.speed === "number" && src.speed > 0 ? src.speed : 100;
    // 换算公式为近似值（原实现是"每 intervalMs 毫秒移动 step px”），标记为 TBD，后续按 §5.3 校准
    result.marquee = { speed: Math.round((step / intervalMs) * 1000) };
  }

  // 超链接
  if (src.type === "link" || src.link || src.linkHref !== undefined) {
    if (src.linkHref !== undefined) result.href = src.linkHref;
    if (src.linkTarget !== undefined) result.target = src.linkTarget === "_blank" ? "_blank" : "_self";
  }

  // 清掉已经被消费/改名的旧字段；TBD 透传字段（textAnimation*/clickFormatter）保留原样，
  // 不在当前 schema 类型范围内，供后续 §5.3/事件化处理
  for (const key of LEGACY_SWTEXT_KEYS) {
    if (!SWTEXT_PASSTHROUGH_KEYS.has(key)) delete result[key];
  }

  return result;
};

// ==================== swimg ====================

const LEGACY_SWIMG_KEYS = [
  "cover",
  "url",
  "duration",
  "rotateShow",
  "rotateX",
  "rotateY",
  "rotateZ",
  "animationShow",
  "animationLoop",
  "animationSpeed",
  "animationSpeedNum",
  "animationTime",
  "animationDelayed",
  "animationInterval",
  "animationType",
  "gaussianBlurShow",
  "gaussianBlur",
  "brightnessShow",
  "brightness",
  "contrastShow",
  "contrast",
  "grayscaleShow",
  "grayscale",
  "hueShow",
  "hue",
  "invertShow",
  "invert",
  "saturateShow",
  "saturate",
  "sepiaShow",
  "sepia",
  "shadowShow",
  "shadowColor",
  "shadowX",
  "shadowY",
  "shadowFuzzy",
  "shadowExtension",
  "openReview",
  "reviewImageWidth",
  "backdropFilterBlur",
  "backdropFilterSaturate",
  "scale",
  "animationendHidden",
  "customizeArray",
  "backgroundType",
  "backgroundImageType"
] as const;

export const isLegacySwimgOption = (option: Record<string, unknown> | null | undefined): boolean => {
  if (!option || typeof option !== "object") return false;
  return LEGACY_SWIMG_KEYS.some((key) => key in option);
};

/** 旧 animationType 关键帧名 -> 新预设关键帧名（§5.3），customize 走 keyframes 字段单独处理 */
const LEGACY_ANIMATION_TYPE_TO_PRESET: Record<string, string> = {
  clockwise: "sw-rotate",
  counterclockwise: "sw-rotate-reverse",
  opacity: "sw-breath",
  zoom: "sw-zoom",
  upOrDown: "sw-float",
  backAndForth: "sw-swing"
};

const resolveLegacyAnimationEasing = (speed: string | undefined, speedNum: number | undefined): string => {
  const k = speedNum ?? 0;
  switch (speed) {
    case "constant":
      return "linear";
    case "slow-fast-slow":
      return `cubic-bezier(0.${25 + k},0.1,0.${25 - k},1)`;
    case "start-slow":
      return `cubic-bezier(0.${42 + k},0,1,1)`;
    case "end-slow":
      return `cubic-bezier(0,0,0.${58 - k},1)`;
    default:
      return "linear";
  }
};

/** 旧字段里语义未确认、暂时保留原样透传（不在当前 schema 类型声明范围内） */
const SWIMG_PASSTHROUGH_KEYS = new Set(["cover"]);

/**
 * 把旧格式 swimg option 升级为当前 schema。对已经是当前格式（或空）的输入是恒等函数。
 * 以 `{...src}` 打底而不是从空对象重建，原因同 upgradeSwTextOption：避免一个孤立的旧字段
 * （如状态动画系统直接写入的 rotateX）把已经是新格式的其它字段一起冲掉。
 */
export const upgradeSwimgOption = (option: Record<string, unknown> | null | undefined): Record<string, unknown> => {
  const src = (option ?? {}) as Record<string, any>;
  if (!isLegacySwimgOption(src)) return src;

  const result: Record<string, unknown> = { ...src };

  // filter：把各开关+数值拼成一条 CSS filter 字符串
  const filterParts: string[] = [];
  for (const item of ["contrast", "brightness", "grayscale", "invert", "saturate", "sepia"]) {
    if (src[`${item}Show`]) filterParts.push(`${item}(${src[item]}%)`);
  }
  if (src.gaussianBlurShow) filterParts.push(`blur(${src.gaussianBlur}px)`);
  if (src.hueShow) filterParts.push(`hue-rotate(${src.hue}deg)`);
  if (src.shadowShow) {
    filterParts.push(`drop-shadow(${src.shadowColor ?? "rgba(0,0,0,1)"} ${src.shadowX ?? 0}px ${src.shadowY ?? 0}px ${src.shadowFuzzy ?? 0}px)`);
  }
  if (filterParts.length) result.filter = filterParts.join(" ");

  // 旋转/位移 -> transform
  if (src.rotateShow) {
    result.transform = `rotateX(${src.rotateX ?? 0}deg) rotateY(${src.rotateY ?? 0}deg) rotateZ(${src.rotateZ ?? 0}deg)`;
  }

  // 动画
  if (src.animationShow) {
    if (src.animationType === "customize") {
      if (Array.isArray(src.customizeArray)) {
        result.keyframes = src.customizeArray;
      }
      const duration = typeof src.animationTime === "number" ? src.animationTime : 1;
      result.animation = `${duration}s ${resolveLegacyAnimationEasing(src.animationSpeed, src.animationSpeedNum)} ${src.animationDelayed ?? 0}s ${
        src.animationLoop ? "infinite" : "1"
      }`;
    } else {
      const preset = LEGACY_ANIMATION_TYPE_TO_PRESET[src.animationType] ?? src.animationType;
      const duration = typeof src.animationTime === "number" ? src.animationTime : 1;
      result.animation = `${preset} ${duration}s ${resolveLegacyAnimationEasing(src.animationSpeed, src.animationSpeedNum)} ${
        src.animationDelayed ?? 0
      }s ${src.animationLoop ? "infinite" : "1"}`;
    }
  }

  // 过渡
  if (src.duration !== undefined) {
    const ms = typeof src.duration === "string" ? src.duration : `${src.duration}`;
    result.transition = `opacity ${ms}ms`;
  }

  // 清掉已经被消费的旧字段；cover 语义未确认，保留原样透传，不丢弃
  for (const key of LEGACY_SWIMG_KEYS) {
    if (!SWIMG_PASSTHROUGH_KEYS.has(key)) delete result[key];
  }

  return result;
};

// ==================== 顶层分发（供后续 app 侧读取入口接入，本次未接线） ====================

export interface UpgradableComponent {
  component: { prop: string };
  option?: Record<string, unknown> | null;
}

/**
 * 按组件 prop 分发到对应的升级函数。当前只覆盖 swtext / swimg；
 * swimgBorder 的合并已从本次范围移除，保持独立、不做处理。
 */
export function upgradeComponentOption<T extends UpgradableComponent>(c: T): T {
  switch (c.component.prop) {
    case "swtext":
      return { ...c, option: upgradeSwTextOption(c.option) };
    case "swimg":
      return { ...c, option: upgradeSwimgOption(c.option) };
    default:
      return c;
  }
}
