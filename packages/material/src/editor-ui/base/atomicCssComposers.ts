/**
 * 原子组件（swBox/swtext/swimg）面板共用的 CSS 字符串 <-> 结构化字段 互转纯函数。
 *
 * 这些组件的 schema 按方案文档的设计原则，复合属性（阴影/边框/动画等）只存一份完整的
 * CSS 字符串，不拆成离散字段。但面板需要给用户结构化的控件（滑块/选择器/数字输入）编辑，
 * 所以这里提供"从字符串解析出结构化值 / 把结构化值合成回字符串"的一对函数，
 * 供各组件面板里的 computed getter/setter 调用，避免三处重复实现同一套正则。
 */

// ============ animation：CSS animation 简写 ============
// 关键帧名取内置预设（方案文档 §5.3），对应 packages/material/src/styles/atomicPresetAnimations.css

export const ANIMATION_PRESET_OPTIONS = [
  { label: "顺时针旋转", value: "sw-rotate" },
  { label: "逆时针旋转", value: "sw-rotate-reverse" },
  { label: "透明度呼吸", value: "sw-breath" },
  { label: "缩放脉冲", value: "sw-zoom" },
  { label: "上下浮动", value: "sw-float" },
  { label: "左右摆动", value: "sw-swing" }
];

export const ANIMATION_EASING_OPTIONS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"];

export interface AnimationParts {
  preset: string;
  duration: number;
  easing: string;
  delay: number;
  loop: boolean;
}

const ANIMATION_RE = /^(\S+)\s+([\d.]+)s\s+(\S+)\s+([\d.]+)s\s+(infinite|1)$/;

export const parseAnimationShorthand = (val: unknown): AnimationParts => {
  const match = typeof val === "string" ? val.match(ANIMATION_RE) : null;
  return match
    ? { preset: match[1], duration: Number(match[2]), easing: match[3], delay: Number(match[4]), loop: match[5] === "infinite" }
    : { preset: "sw-breath", duration: 2, easing: "ease-in-out", delay: 0, loop: true };
};

export const buildAnimationShorthand = (parts: AnimationParts): string =>
  `${parts.preset} ${parts.duration}s ${parts.easing} ${parts.delay}s ${parts.loop ? "infinite" : "1"}`;

// ============ shadow：CSS text-shadow / box-shadow（box-shadow 支持可选 inset 前缀） ============

export interface ShadowParts {
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  color: string;
}

const SHADOW_RE = /^(inset\s+)?(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)$/;

export const parseShadow = (val: unknown): ShadowParts => {
  const match = typeof val === "string" ? val.match(SHADOW_RE) : null;
  return match
    ? { inset: Boolean(match[1]), x: Number(match[2]), y: Number(match[3]), blur: Number(match[4]), color: match[5] }
    : { inset: false, x: 0, y: 0, blur: 20, color: "rgba(69,131,255,.5)" };
};

/** insetSupported=false 时忽略 inset（用于 text-shadow，CSS 不支持 inset） */
export const buildShadow = (parts: ShadowParts, insetSupported = true): string =>
  `${insetSupported && parts.inset ? "inset " : ""}${parts.x}px ${parts.y}px ${parts.blur}px ${parts.color}`;

// ============ border：CSS border 简写（宽度 + 样式 + 颜色） ============

export const BORDER_STYLE_OPTIONS = [
  { label: "实线", value: "solid" },
  { label: "虚线", value: "dashed" },
  { label: "点线", value: "dotted" },
  { label: "双线", value: "double" }
];

export interface BorderParts {
  width: number;
  style: string;
  color: string;
}

const BORDER_RE = /^(\d+(?:\.\d+)?)px\s+(\S+)\s+(.+)$/;

export const parseBorder = (val: unknown): BorderParts => {
  const match = typeof val === "string" ? val.match(BORDER_RE) : null;
  return match ? { width: Number(match[1]), style: match[2], color: match[3] } : { width: 1, style: "solid", color: "rgba(69,131,255,.4)" };
};

export const buildBorder = (parts: BorderParts): string => `${parts.width}px ${parts.style} ${parts.color}`;

// ============ filter：多个 CSS filter 函数拼接（含末尾可选的 drop-shadow） ============
// swimg 的 filter 字段是任意多个 filter 函数拼接的字符串，drop-shadow 的颜色参数自带括号，
// 不能用简单的“不含右括号”正则去切，所以阴影单独按“允许一层嵌套括号”解析，其余函数用通用 token 解析。

export interface FilterToken {
  name: string;
  args: string;
}

const FILTER_TOKEN_RE = /([\w-]+)\(([^()]*)\)/g;

/** 解析不含 drop-shadow 的简单 filter 函数列表（contrast/brightness/.../blur/hue-rotate 等，参数都是单个数值） */
export const parseFilterList = (val: unknown): FilterToken[] => {
  const tokens: FilterToken[] = [];
  if (typeof val !== "string") return tokens;
  const re = new RegExp(FILTER_TOKEN_RE);
  let match: RegExpExecArray | null;
  while ((match = re.exec(val))) tokens.push({ name: match[1], args: match[2] });
  return tokens;
};

export const buildFilterList = (tokens: FilterToken[]): string => tokens.map((t) => `${t.name}(${t.args})`).join(" ");

export const getFilterNumber = (tokens: FilterToken[], name: string): number | undefined => {
  const token = tokens.find((t) => t.name === name);
  if (!token) return undefined;
  const num = parseFloat(token.args);
  return Number.isNaN(num) ? undefined : num;
};

export const hasFilterFunction = (tokens: FilterToken[], name: string): boolean => tokens.some((t) => t.name === name);

export const setFilterFunction = (tokens: FilterToken[], name: string, args: string): FilterToken[] => {
  const idx = tokens.findIndex((t) => t.name === name);
  const next = [...tokens];
  if (idx >= 0) next[idx] = { name, args };
  else next.push({ name, args });
  return next;
};

export const removeFilterFunction = (tokens: FilterToken[], name: string): FilterToken[] => tokens.filter((t) => t.name !== name);

const DROP_SHADOW_TRAILING_RE = /\s*drop-shadow\(((?:[^()]|\([^()]*\))*)\)\s*$/;
const SHADOW_INNER_RE = /^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)$/;

/** filter 字符串拆成「不含 drop-shadow 的部分」和「末尾的 drop-shadow（如果有）」；drop-shadow 约定放在最后 */
export const splitFilterAndShadow = (val: unknown): { rest: string; shadow: ShadowParts | null } => {
  if (typeof val !== "string") return { rest: "", shadow: null };
  const match = val.match(DROP_SHADOW_TRAILING_RE);
  if (!match) return { rest: val.trim(), shadow: null };
  const innerMatch = match[1].match(SHADOW_INNER_RE);
  const rest = val.slice(0, match.index).trim();
  const shadow = innerMatch
    ? { inset: false, x: Number(innerMatch[1]), y: Number(innerMatch[2]), blur: Number(innerMatch[3]), color: innerMatch[4] }
    : null;
  return { rest, shadow };
};

export const joinFilterAndShadow = (rest: string, shadow: ShadowParts | null): string => {
  const parts = [rest.trim()].filter(Boolean);
  if (shadow) parts.push(`drop-shadow(${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color})`);
  return parts.join(" ");
};

// ============ backdropFilter：CSS backdrop-filter（模糊 + 饱和度） ============

export interface BackdropFilterParts {
  blur: number;
  saturate: number;
}

const BACKDROP_FILTER_RE = /blur\((\d+(?:\.\d+)?)px\)(?:\s+saturate\((\d+(?:\.\d+)?)%\))?/;

export const parseBackdropFilter = (val: unknown): BackdropFilterParts => {
  const match = typeof val === "string" ? val.match(BACKDROP_FILTER_RE) : null;
  return { blur: match ? Number(match[1]) : 8, saturate: match?.[2] ? Number(match[2]) : 100 };
};

export const buildBackdropFilter = (parts: BackdropFilterParts): string =>
  parts.saturate !== 100 ? `blur(${parts.blur}px) saturate(${parts.saturate}%)` : `blur(${parts.blur}px)`;
