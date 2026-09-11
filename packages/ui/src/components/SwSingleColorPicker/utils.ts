function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  if (Number.isNaN(+r) || Number.isNaN(+g) || Number.isNaN(+b)) {
    return "";
  }
  const INT_HEX_MAP: Record<string, string> = {
    10: "A",
    11: "B",
    12: "C",
    13: "D",
    14: "E",
    15: "F"
  };

  const hexOne = (value: number) => {
    value = Math.min(Math.round(value), 255);
    const high = Math.floor(value / 16);
    const low = value % 16;
    return `${INT_HEX_MAP[high] || high}${INT_HEX_MAP[low] || low}`;
  };

  return `#${hexOne(r)}${hexOne(g)}${hexOne(b)}`;
}

function rgbaToHex(r: number, g: number, b: number): string {
  return toHex({ r, g, b });
}

function parseRgbaString(rgbaString: string): { r: number; g: number; b: number; a: number } | null {
  // 去除字符串两端的空格
  if (typeof rgbaString !== "string") {
    return null;
  }
  const trimmedString = rgbaString.trim();
  // 调整正则表达式，允许数字之间有零个或多个空格
  const match = trimmedString.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = parseFloat(match[4]);
    return { r, g, b, a };
  }
  return null;
}

// 新增：将十六进制颜色字符串转换为 RGB 对象
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== "string") {
    return null;
  }
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (match) {
    const r = parseInt(match[1], 16);
    const g = parseInt(match[2], 16);
    const b = parseInt(match[3], 16);
    return { r, g, b };
  }
  return null;
}

function convertRgbaToHexAndAlpha(rgbaString: string): { hex: string | null; alpha: number | null } {
  // 先尝试解析为 rgba 格式
  const rgba = parseRgbaString(rgbaString);
  if (rgba) {
    const hex = rgbaToHex(rgba.r, rgba.g, rgba.b);
    return { hex, alpha: rgba.a };
  }

  // 再尝试解析为十六进制格式
  const rgb = hexToRgb(rgbaString);
  if (rgb) {
    const hex = toHex(rgb);
    return { hex, alpha: 1 }; // 十六进制颜色默认透明度为 1
  }

  return { hex: null, alpha: null };
}

// 改变 rgba 颜色透明度的函数
function changeRgbaAlpha(colorString: string, newAlpha: number): string | null {
  // 尝试解析为 rgba 格式
  const rgba = parseRgbaString(colorString);
  if (rgba) {
    const { r, g, b } = rgba;
    return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
  }

  // 尝试解析为十六进制格式
  const hexRgba = hexToRgba(colorString);
  if (hexRgba) {
    const { r, g, b } = hexRgba;
    return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
  }

  return null;
}

/**
 * 将十六进制颜色字符串转换为 RGBA 对象（含透明度）
 * @param hex 十六进制颜色字符串（支持 #FFF、#FFFFFF、#ff0000aa 格式）
 * @returns { r: number, g: number, b: number, a: number } | null
 */
function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } | null {
  // 标准化格式：去除空格并转为小写（可选）
  const normalizedHex = hex.trim().replace(/\s+/g, "").toLowerCase();

  // 匹配 3 位、6 位十六进制颜色，支持末尾带 2 位透明度（如 #fff8、#ffffff88）
  const match = normalizedHex.match(/^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{0,2})$/i);

  if (!match) {
    return null;
  }

  const r = parseInt(match[1].padEnd(2, match[1]), 16); // 处理 3 位格式（如 #fff → #ffffff）
  const g = parseInt(match[2].padEnd(2, match[2]), 16);
  const b = parseInt(match[3].padEnd(2, match[3]), 16);
  const a = match[4]
    ? parseInt(match[4], 16) / 255 // 透明度转为 0-1 数值（如 '88' → 0.533）
    : 1; // 无透明度时默认不透明

  return { r, g, b, a };
}

export { toHex, convertRgbaToHexAndAlpha, changeRgbaAlpha, hexToRgba };
