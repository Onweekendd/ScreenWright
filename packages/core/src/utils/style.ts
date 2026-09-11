/**
 * 渐变色/对齐方式相关的纯字符串处理函数，框架无关。
 */
interface LinearGradient {
  type: string;
  angle: string;
  colors: { color: string; per: number }[];
}

/**
 * 解析颜色字符串为RGB或RGBA对象
 */
const parseColor = (color: string): { r: number; g: number; b: number; a: number } => {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }

  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: 1
    };
  }

  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d*\.?\d+)\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: parseFloat(rgbaMatch[4])
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
};

const applyOpacity = (color: { r: number; g: number; b: number; a: number }, alpha: number): string => {
  const finalAlpha = color.a * alpha;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${finalAlpha.toFixed(2)})`;
};

/**
 * 处理渐变色并调整整体透明度
 * @param color 渐变色配置或颜色字符串
 * @param opacity 整体透明度（0-100）
 */
export const lineargradientHandle = (color: LinearGradient | string | null | undefined, opacity = 100): any => {
  if (color === null || color === undefined) {
    return "";
  }

  if (typeof color === "string") {
    return color;
  }

  if (color.type === "linear-gradient") {
    const alpha = Math.max(0, Math.min(1, opacity / 100));
    let gradient = `linear-gradient(${color.angle}deg`;

    color.colors.forEach((stop: { color: string; per: number }) => {
      const stopColor = parseColor(stop.color);
      const adjustedColor = applyOpacity(stopColor, alpha);
      gradient += `, ${adjustedColor} ${stop.per}%`;
    });

    return gradient + ")";
  }

  return color;
};

/** 纵向对齐方式映射为 flex 布局值 */
export const getAlign = (align: string) => {
  switch (align) {
    case "top":
      return "flex-start";
    case "center":
      return "center";
    case "bottom":
      return "flex-end";
    default:
      return "center";
  }
};

/**
 * 解析 linear-gradient 色带字符串，返回指定百分比位置处插值后的 rgba 颜色。
 * 模块内私有 helper，供 getPartialGradientCSS 使用。
 */
const getColorAtPercentage = (gradient: string, percentage: number) => {
  // 解析渐变色带信息
  const colorStops = [];
  const regex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)\s*(\d+)%/g;
  let match;
  while ((match = regex.exec(gradient)) !== null) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;
    const p = parseInt(match[5]);
    colorStops.push({ r, g, b, a, p });
  }

  // 处理colorStops为空的情况，返回默认颜色
  if (colorStops.length === 0) {
    return "rgba(0, 0, 0, 1)";
  }

  // 确保 percentage 在 0-100 范围内，避免越界
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // 找到指定百分比所在的两个相邻色标
  let startStop, endStop;
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (clampedPercentage >= colorStops[i].p && clampedPercentage <= colorStops[i + 1].p) {
      startStop = colorStops[i];
      endStop = colorStops[i + 1];
      break;
    }
  }

  // 如果没有找到合适的相邻色标，返回第一个或最后一个色标
  if (!startStop || !endStop) {
    if (clampedPercentage < colorStops[0].p) {
      return `rgba(${colorStops[0].r}, ${colorStops[0].g}, ${colorStops[0].b}, ${colorStops[0].a})`;
    } else {
      return `rgba(${colorStops[colorStops.length - 1].r}, ${colorStops[colorStops.length - 1].g}, ${
        colorStops[colorStops.length - 1].b
      }, ${colorStops[colorStops.length - 1].a})`;
    }
  }

  // 计算插值比例
  const ratio = (clampedPercentage - startStop.p) / (endStop.p - startStop.p);

  // 进行线性插值计算颜色
  const r = Math.round(startStop.r + ratio * (endStop.r - startStop.r));
  const g = Math.round(startStop.g + ratio * (endStop.g - startStop.g));
  const b = Math.round(startStop.b + ratio * (endStop.b - startStop.b));
  const a = startStop.a + ratio * (endStop.a - startStop.a);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * 根据百分比截取渐变色带：取百分比处颜色作为终点，水平方向（90deg/270deg）
 * 重新构造从高亮色到该色的渐变；其余方向原样返回。
 */
export const getPartialGradientCSS = (gradient: string, percentage: number) => {
  // 获取指定百分比处的颜色
  const endColor = getColorAtPercentage(gradient, percentage);

  // 提取原始渐变的方向
  const directionMatch = gradient.match(/linear-gradient\(([^,]+),/);
  const direction = directionMatch ? directionMatch[1] : "0deg";

  // 构建新的渐变色带 CSS 代码
  const partialGradient =
    direction === "90deg" || direction === "270deg"
      ? `linear-gradient(${direction}, rgba(255,201,100,1) 0%, ${endColor} 100%)`
      : gradient;
  return partialGradient;
};
