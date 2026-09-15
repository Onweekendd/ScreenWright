import { type TextEnum } from "@screenwright/types";

import type { ComponentFlatSchemaType } from "@/mastra/tools/utils";
import {
  extractLayout,
  SW_RICHTEXT_MODULE_ID,
  getComponentDefaultConfigByModuleId,
  rgbaToCss,
  setComponentBaseProps
} from "@/mastra/tools/utils";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { isTextNode } from "@/mastra/workflows/figma-to-bi/utils/node-type-guards";

import type { ConvertParams, ConvertResult, ConvertStrategy } from "./types";

export interface SwRichtextOption {
  content: string;
  textAnimationType?: "" | "typingEffect" | "jumpingEffect" | "fallingEffect";
  textAnimationTiming?: number;
  textAnimationDelay?: number;
  startScroll?: boolean;
  scrollLoop?: boolean;
  scrollInterval?: number;
}

export type SwRichtextData = any[];

export type SwRichtext = ComponentFlatSchemaType & {
  component: {
    prop: TextEnum.SwRichtext;
    width: number;
    height: number;
    name: string;
  };
  option: SwRichtextOption;
  data: SwRichtextData;
};

type FillStyle = { type: "solid"; color: string } | { type: "gradient"; gradientCss: string };

const extractTextStyles = (node: NormalizedNode): string => {
  const styles: string[] = [];
  const textStyle = node.textStyle;

  if (!textStyle) {
    return "";
  }

  if (textStyle.fontFamily) {
    styles.push(`font-family: ${textStyle.fontFamily}`);
  }
  if (textStyle.fontSize) {
    styles.push(`font-size: ${textStyle.fontSize}px`);
  }
  if (textStyle.fontWeight) {
    styles.push(`font-weight: ${textStyle.fontWeight}`);
  }
  if (textStyle.lineHeight) {
    styles.push(`line-height: ${textStyle.lineHeight}`);
  }

  if (textStyle.letterSpacing) {
    if (textStyle.letterSpacing.endsWith("%") && textStyle.fontSize) {
      const pxValue = Math.round((parseFloat(textStyle.letterSpacing) / 100) * textStyle.fontSize * 1000) / 1000;
      styles.push(`letter-spacing: ${pxValue}px`);
    } else {
      styles.push(`letter-spacing: ${textStyle.letterSpacing}`);
    }
  }

  if (textStyle.textAlignHorizontal) {
    const alignMap: Record<string, string> = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
    styles.push(`text-align: ${alignMap[textStyle.textAlignHorizontal] || "left"}`);
  }

  if (node.fills && node.fills.length > 0) {
    const firstFill = node.fills[0];
    if (typeof firstFill === "string") {
      styles.push(`color: ${firstFill}`);
    }
  }

  if (node.strokes?.colors?.length && node.strokes.strokeWeight) {
    const firstStrokeColor = node.strokes.colors[0];
    if (typeof firstStrokeColor === "string") {
      styles.push(`-webkit-text-stroke: ${node.strokes.strokeWeight} ${firstStrokeColor}`);
    }
  }

  return styles.join("; ");
};

class RichTextHtmlGenerator {
  private readonly node: NormalizedNode;
  private readonly text: string;

  constructor(node: NormalizedNode) {
    this.node = node;
    this.text = node.text || "富文本内容";
  }

  generate(): string {
    const pStyles = this.buildPStyles();
    const overrides = this.node.characterStyleOverrides;
    const inner = overrides?.ranges?.length ? this.buildCharacterOverrideHtml(overrides) : this.text;
    return pStyles ? `<p style="${pStyles}">${inner}</p>` : `<p>${inner}</p>`;
  }

  private buildPStyles(): string {
    let styles = extractTextStyles(this.node);

    const fillStyle = this.extractNodeFillStyle();
    if (fillStyle?.type === "gradient") {
      const gradientPart = `background: ${fillStyle.gradientCss}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text`;
      styles = styles ? `${styles}; ${gradientPart}` : gradientPart;
    }

    if (!this.text.includes("\n")) {
      const containerWidth = this.node.layout?.dimensions?.width ?? 0;
      const fontSize = this.node.textStyle?.fontSize ?? 16;
      if (containerWidth === 0 || this.text.length * fontSize <= containerWidth) {
        styles = styles ? `${styles}; white-space: nowrap` : "white-space: nowrap";
      }
    }

    return styles;
  }

  private buildCharacterOverrideHtml(overrides: NonNullable<NormalizedNode["characterStyleOverrides"]>): string {
    const { ranges, styleTable } = overrides;
    const segments: { text: string; fillStyle?: FillStyle | null; extraStyle?: string }[] = [];
    let lastEnd = 0;

    for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
      if (range.start > lastEnd) {
        segments.push({ text: this.text.substring(lastEnd, range.start) });
      }
      const style = styleTable[range.styleId];
      segments.push({
        text: this.text.substring(range.start, range.end),
        fillStyle: style?.fills ? RichTextHtmlGenerator.extractCharFillStyle(style.fills) : null,
        extraStyle: RichTextHtmlGenerator.extractCharExtraStyle(style, this.node.textStyle?.fontSize)
      });
      lastEnd = range.end;
    }

    if (lastEnd < this.text.length) {
      segments.push({ text: this.text.substring(lastEnd) });
    }

    return segments
      .map(({ text, fillStyle, extraStyle }) => {
        const extra = extraStyle ?? "";
        if (fillStyle?.type === "gradient") {
          const base = `background: ${fillStyle.gradientCss}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text`;
          return `<span style="${extra ? `${extra}; ${base}` : base}">${text}</span>`;
        }
        if (fillStyle?.type === "solid") {
          const base = `color: ${fillStyle.color}`;
          return `<span style="${extra ? `${extra}; ${base}` : base}">${text}</span>`;
        }
        return extra ? `<span style="${extra}">${text}</span>` : text;
      })
      .join("");
  }

  /**
   * @param baseFontSize 所在文本节点的基础字号，字符级样式覆盖没有自带 fontSize 时用它
   * 换算 lineHeightUnit="FONT_SIZE_%" 的行高（该情况下 lineHeightPx 存的是百分比数字，
   * 不是像素，需要乘以字号 / 100 才是真实像素，语义与 transformers/text.ts 的 resolveLineHeightPx 一致）
   */
  private static extractCharExtraStyle(style: Record<string, any> | undefined, baseFontSize?: number): string {
    if (!style) {
      return "";
    }
    const parts: string[] = [];
    if (typeof style.fontSize === "number") {
      parts.push(`font-size: ${style.fontSize}px`);
    }
    if (typeof style.fontWeight === "number") {
      parts.push(`font-weight: ${style.fontWeight}`);
    }
    if (typeof style.fontFamily === "string") {
      parts.push(`font-family: ${style.fontFamily}`);
    }
    if (typeof style.letterSpacing === "number" && style.letterSpacing !== 0) {
      parts.push(`letter-spacing: ${style.letterSpacing}px`);
    }
    if (typeof style.lineHeightPx === "number") {
      const fontSize = typeof style.fontSize === "number" ? style.fontSize : baseFontSize;
      const lineHeightPx =
        style.lineHeightUnit === "FONT_SIZE_%" && fontSize ? (fontSize * style.lineHeightPx) / 100 : style.lineHeightPx;
      parts.push(`line-height: ${lineHeightPx}px`);
    }
    return parts.join("; ");
  }

  private extractNodeFillStyle(): FillStyle | null {
    const { fills } = this.node;
    if (!fills?.length) {
      return null;
    }

    const hasGradient = fills.some((f) => typeof f !== "string" && !!f.gradient);
    if (!hasGradient) {
      const first = fills[0];
      return typeof first === "string" ? { type: "solid", color: first } : null;
    }

    const cssValues = [...fills]
      .reverse()
      .map((f) => (typeof f === "string" ? `linear-gradient(to right, ${f}, ${f})` : (f.gradient ?? null)))
      .filter((v): v is string => !!v);

    return cssValues.length ? { type: "gradient", gradientCss: cssValues.join(", ") } : null;
  }

  private static extractCharFillStyle(
    fills: {
      color?: { r: number; g: number; b: number; a?: number };
      type?: string;
      gradientStops?: { position: number; color: { r: number; g: number; b: number; a?: number } }[];
      gradientHandlePositions?: { x: number; y: number }[];
    }[]
  ): FillStyle | null {
    if (!fills.length) {
      return null;
    }

    const hasGradient = fills.some((f) => !!f.gradientStops?.length);
    if (!hasGradient) {
      const first = fills[0];
      return first.color ? { type: "solid", color: rgbaToCss(first.color) } : null;
    }

    const cssValues = [...fills]
      .reverse()
      .map((f) => {
        if (f.gradientStops?.length) {
          return RichTextHtmlGenerator.computeGradientCss(
            f.type ?? "GRADIENT_LINEAR",
            f.gradientHandlePositions,
            f.gradientStops
          );
        }
        if (f.color) {
          const c = rgbaToCss(f.color);
          return `linear-gradient(to right, ${c}, ${c})`;
        }
        return null;
      })
      .filter((v): v is string => !!v);

    return cssValues.length ? { type: "gradient", gradientCss: cssValues.join(", ") } : null;
  }

  private static computeGradientCss(
    gradientType: string,
    handles?: { x: number; y: number }[],
    stops?: { position: number; color: { r: number; g: number; b: number; a?: number } }[]
  ): string {
    if (!stops?.length) {
      return "transparent";
    }

    const stopsStr = [...stops]
      .sort((a, b) => a.position - b.position)
      .map(({ position, color }) => `${rgbaToCss(color)} ${Math.round(position * 100)}%`)
      .join(", ");

    const h1 = handles?.[0] ?? { x: 0, y: 0 };
    const h2 = handles?.[1] ?? { x: 1, y: 0 };
    const angle = () => Math.round(Math.atan2(h2.y - h1.y, h2.x - h1.x) * (180 / Math.PI) + 90);
    const cx = () => Math.round(h1.x * 100);
    const cy = () => Math.round(h1.y * 100);

    switch (gradientType) {
      case "GRADIENT_LINEAR":
        return `linear-gradient(${angle()}deg, ${stopsStr})`;
      case "GRADIENT_RADIAL":
        return `radial-gradient(circle at ${cx()}% ${cy()}%, ${stopsStr})`;
      case "GRADIENT_ANGULAR":
        return `conic-gradient(from ${angle()}deg at ${cx()}% ${cy()}%, ${stopsStr})`;
      case "GRADIENT_DIAMOND":
        return `radial-gradient(ellipse at ${cx()}% ${cy()}%, ${stopsStr})`;
      default:
        return `linear-gradient(90deg, ${stopsStr})`;
    }
  }
}

function convertNodeToSwRichtextOption(_node: NormalizedNode, htmlContent: string): Partial<SwRichtextOption> {
  return {
    content: htmlContent,
    textAnimationType: "",
    textAnimationTiming: 50,
    textAnimationDelay: 0
  };
}

export class SwRichtextStrategy implements ConvertStrategy {
  async convert({ node }: ConvertParams): Promise<ConvertResult> {
    const { node: normalizedNode, zIndex, depth } = node;

    if (!isTextNode({ node: normalizedNode })) {
      console.warn(`⚠️ 节点 ${normalizedNode.id} 被分类为 SwRichtext，但不是文本节点`);
    }

    const htmlContent = new RichTextHtmlGenerator(normalizedNode).generate();
    const convertedOption = convertNodeToSwRichtextOption(normalizedNode, htmlContent);
    const layout = extractLayout(normalizedNode);

    // 富文本宽度补偿 5px：不同字体渲染宽度存在差异，原始布局宽度可能导致文字换行
    layout.width = (layout.width || 316) + 5;
    layout.height = layout.height || 268;

    const component: SwRichtext = (await getComponentDefaultConfigByModuleId(SW_RICHTEXT_MODULE_ID)) as SwRichtext;

    setComponentBaseProps(component, normalizedNode, layout);

    component.option = {
      ...component.option,
      ...convertedOption
    };
    component.zIndex = zIndex ?? depth;

    return { component, message: "成功转换为 swRichtext" };
  }
}
