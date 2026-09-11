import { setMinioUrl } from "@screenwright/composables";
import { has, isArray } from "lodash-es";

import type { Option } from "../type";

/** @description 自定义HTML元素类型，包含弹幕相关属性 */
export interface CustomHTMLDivElement extends HTMLDivElement {
  timer: number | null;
  distance: number;
}

/** @description 文本阴影配置 */
export interface TextShadow {
  /** @description 阴影颜色 */
  color: string;
  /** @description X轴偏移 */
  x: number;
  /** @description Y轴偏移 */
  y: number;
  /** @description 模糊半径 */
  blur: number;
}

/** @description 文本样式配置 */
export interface TextStyle {
  /** @description 样式名称 */
  name: string;
  /** @description 字体颜色 */
  fontColor: string;
  /** @description 字体大小 */
  fontSize: number;
  /** @description 字体族 */
  fontFamily: string;
  /** @description 字间距 */
  letterSpacing: number;
  /** @description 是否加粗 */
  fontWeight: boolean;
  /** @description 是否斜体 */
  fontStyle: boolean;
  /** @description 是否启用文本阴影 */
  isTextShadow: boolean;
  /** @description 文本阴影配置 */
  textShadow: TextShadow;
  /** @description 背景图片 */
  backgroundImage: string;
}

/** @description 文本配置接口 */
export interface TextConfig {
  text: string;
  position?: string;
  top?: number;
  left?: number;
  width?: number;
  isTextShadow?: boolean;
  borderRadius?: number;
  padding?: [number, number, number, number];
  textStyle: TextStyle;
}

/** @description 网格位置参数接口 */
export interface GridPositionParams {
  domWidth: number;
  fontSize: number;
  width: number;
  height: number;
  lineNum: number;
  barrageGrid: Array<Array<GridCell>>;
  type?: "text" | "image";
  imageSpacing?: number;
}

/** @description 网格单元格接口 */
export interface GridCell {
  row: number;
  col: number;
  width?: number;
  top?: number;
  left?: number;
}

/** @description 图片元素配置接口 */
export interface ImageElementConfig {
  position?: string;
  imageUrl: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  objectFit?: string;
}

/**
 * 创建文本元素
 * @param config 文本配置
 * @param isForCalc 是否仅用于计算
 * @returns 自定义HTML元素
 */
export function createTextElement(
  config: TextConfig,
  isForCalc = false,
): CustomHTMLDivElement {
  const { text, position, top, left, width, isTextShadow, textStyle } = config;
  const {
    fontColor,
    fontSize,
    fontFamily,
    letterSpacing,
    fontWeight,
    fontStyle,
    // padding,
    textShadow,
    backgroundImage,
  } = textStyle;
  // console.log("createTextElement", textStyle);

  const div = document.createElement("div") as CustomHTMLDivElement;
  div.innerHTML = text;
  div.style.position = position || "absolute";
  div.style.display = "inline-block";
  div.style.fontSize = fontSize + "px";
  div.style.fontFamily = fontFamily;
  div.style.letterSpacing = letterSpacing + "px";
  div.style.fontWeight = fontWeight ? "bold" : "normal";
  div.style.fontStyle = fontStyle ? "italic" : "";
  div.style.whiteSpace = "nowrap";
  div.style.padding =
    has(config, "padding") && isArray(config.padding)
      ? `${config.padding[0]}px ${config.padding[1]}px ${config.padding[2]}px ${config.padding[3]}px`
      : "8px 16px";

  div.style.borderRadius = (config.borderRadius || 0) + "px";
  div.style.backgroundSize = "100% 100%";
  div.style.backgroundImage = `url(${setMinioUrl(backgroundImage)})`;
  if (isTextShadow && textShadow) {
    div.style.textShadow = `${textShadow.x}px ${textShadow.y}px ${textShadow.blur}px ${textShadow.color}`;
  }

  if (!isForCalc) {
    div.style.color = fontColor;
    div.style.transform = "translate3d(0px, 0, 0px)";
    if (typeof top === "number") {
      div.style.top = top + "px";
    }
    if (typeof left === "number") {
      div.style.left = left + "px";
    }
    if (typeof width === "number") {
      div.style.width = width + "px";
    }
    div.distance = 0;
    div.timer = null;
  }

  return div;
}

/**
 * 计算文本宽度
 * @param config 文本配置
 * @returns 文本宽度
 */
export function calculateTextWidth(config: TextConfig): number {
  const div = createTextElement(config, true);
  document.body.appendChild(div);
  const rect = div.getBoundingClientRect();
  document.body.removeChild(div);
  return Math.ceil(rect.width);
}

/**
 * 计算网格位置
 * @param params 网格位置参数
 * @returns 网格位置信息
 */
export function calculateGridPosition(params: GridPositionParams): GridCell {
  const {
    domWidth,
    fontSize,
    width,
    height,
    lineNum,
    barrageGrid,
    type = "text",
    imageSpacing = 200, // 默认图片间距
  } = params;

  let colPosition: GridCell[] = [];

  for (let i = 0, l = barrageGrid.length; i < l; i++) {
    const _colPosition = barrageGrid[i].filter((item) => !item.width);
    if (_colPosition.length > 0) {
      colPosition = _colPosition;
      break;
    }
  }

  if (!colPosition?.length) {
    return { row: 0, col: 0 };
  }

  const labelSpacing = 20;
  const gridPosition =
    colPosition[Math.floor(Math.random() * colPosition.length)];

  if (!gridPosition) {
    return { row: 0, col: 0 };
  }

  const result: GridCell = {
    row: gridPosition.row,
    col: gridPosition.col,
    width: domWidth,
    top: 0,
    left: 0,
  };

  const perHeight = Math.floor(height / lineNum);
  result.top =
    gridPosition.col * perHeight + Math.floor(perHeight / 2) - fontSize / 2;

  if (type === "image") {
    const randomSpacing = Math.floor(+Math.random() * imageSpacing);

    if (gridPosition.row === 0) {
      result.left = width + randomSpacing;
    } else {
      const prevCell = barrageGrid[gridPosition.row - 1]?.[gridPosition.col];
      const prevLeft = prevCell?.left || 0;
      const prevWidth = prevCell?.width || 0;
      result.left = prevLeft + prevWidth + randomSpacing;
    }
  } else {
    // 文字使用基于字体大小的动态间距
    if (gridPosition.row === 0) {
      result.left = width + Math.ceil(fontSize * labelSpacing * Math.random());
    } else {
      const prevCell = barrageGrid[gridPosition.row - 1]?.[gridPosition.col];
      const prevLeft = prevCell?.left || 0;
      const prevWidth = prevCell?.width || 0;
      result.left =
        domWidth +
        prevLeft +
        prevWidth +
        Math.ceil(fontSize * labelSpacing * Math.random());
    }
  }

  return result;
}

/**
 * 执行弹幕动画
 * @param element 弹幕元素
 * @param speed 移动速度
 * @param maxWidth 最大宽度
 * @param loop 是否循环
 * @param onComplete 动画完成回调
 */
export function animateBarrage(
  element: CustomHTMLDivElement,
  speed: number,
  maxWidth: number,
  loop: boolean,
  onComplete: () => void,
): void {
  element.distance = element.distance - 10 * speed;
  element.style.transform = `translate3d(${element.distance}px, 0, 0px)`;
  if (element.timer) {
    cancelAnimationFrame(element.timer);
  }

  if (
    Math.abs(element.distance) < maxWidth &&
    Math.abs(element.distance) > -maxWidth
  ) {
    element.timer = requestAnimationFrame(() => {
      animateBarrage(element, speed, maxWidth, loop, onComplete);
    });
    return;
  }

  if (loop) {
    element.distance = 0;
    element.style.transform = `translate3d(${element.distance}px, 0, 0px)`;
    onComplete();
    return;
  }

  if (Math.abs(element.distance) < -maxWidth) {
    element.parentNode?.removeChild(element);
    onComplete();
  }
}

/**
 * 清理弹幕元素
 * @param element 弹幕元素
 */
export function cleanupBarrageElement(element: CustomHTMLDivElement): void {
  if (element.timer) {
    cancelAnimationFrame(element.timer);
  }
  element.onclick = null;
  element.parentNode?.removeChild(element);
}

/**
 * 创建图片元素
 * @param config 图片配置参数
 * @returns 自定义HTML元素
 */
export function createImageElement(
  config: ImageElementConfig,
): CustomHTMLDivElement {
  const { position, imageUrl, top, left, width, height, objectFit } = config;

  const div = document.createElement("div") as CustomHTMLDivElement;
  div.style.position = position || "absolute";
  if (typeof top === "number") {
    div.style.top = top + "px";
  }
  if (typeof left === "number") {
    div.style.left = left + "px";
  }
  if (typeof width === "number") {
    div.style.width = width + "px";
  }
  if (typeof height === "number") {
    div.style.height = height + "px";
  }
  div.style.overflow = "hidden";

  const img = document.createElement("img");
  img.src = setMinioUrl(imageUrl);
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = objectFit || "cover";

  div.appendChild(img);
  return div;
}

/**
 * 计算图片宽度
 * @param height 图片高度
 * @returns 图片宽度
 */
export function calculateImageWidth(height: number): number {
  // 假设图片宽高比为 16:9
  return Math.ceil(height * (16 / 9));
}

/**
 * 创建图片弹幕元素
 * @param config 图片配置
 * @returns 自定义HTML元素
 */
export function createBarrageImageElement(
  config: ImageElementConfig,
): CustomHTMLDivElement {
  const {
    position,
    imageUrl,
    top,
    left,
    width,
    height,
    objectFit = "cover",
  } = config;

  const div = document.createElement("div") as CustomHTMLDivElement;
  div.style.position = position || "absolute";
  div.style.display = "inline-block";
  div.style.transform = "translate3d(0px, 0, 0px)";

  if (typeof top === "number") {
    div.style.top = top + "px";
  }
  if (typeof left === "number") {
    div.style.left = left + "px";
  }
  if (typeof width === "number") {
    div.style.width = width + "px";
  }
  if (typeof height === "number") {
    div.style.height = height + "px";
  }

  const img = document.createElement("img");
  img.src = setMinioUrl(imageUrl);
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = objectFit;

  div.appendChild(img);
  div.distance = 0;
  div.timer = null;

  return div;
}

/**
 * 计算图片弹幕尺寸
 * @param containerHeight 容器高度
 * @param lineNum 行数
 * @param options 配置选项
 * @returns 图片尺寸
 */
export function calculateBarrageImageSize(
  containerHeight: number,
  lineNum: number,
  options?: Pick<Option, "imageMinHeight" | "imageMaxHeight">,
): { width: number; height: number } {
  // 计算基础高度（行高的80%）作为默认最大高度
  const baseHeight = Math.floor((containerHeight / lineNum) * 0.8);

  // 获取配置的最小/最大高度，如果未设置则使用默认值
  const minHeight = options?.imageMinHeight || 20; // 默认最小高度20px
  const maxHeight = Math.min(options?.imageMaxHeight || 200, baseHeight); // 默认最大高度200px，且不超过基础高度

  // 在最小和最大高度之间随机选择一个高度
  const height = Math.floor(
    minHeight + Math.random() * (maxHeight - minHeight),
  );

  // 使用16:9的宽高比
  const width = Math.ceil(height * (16 / 9));

  return { width, height };
}
