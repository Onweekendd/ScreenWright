import type { Node as FigmaDocumentNode } from "@figma/rest-api-spec";

import { buildSimplifiedEffects } from "@/mastra/mcp/figma-context-mcp/server/transformers/effects";
import { buildSimplifiedLayout } from "@/mastra/mcp/figma-context-mcp/server/transformers/layout";
import { buildSimplifiedStrokes, parsePaint } from "@/mastra/mcp/figma-context-mcp/server/transformers/style";
import {
  extractCharacterStyleOverrides,
  extractNodeText,
  extractTextStyle,
  hasTextStyle,
  isTextNode
} from "@/mastra/mcp/figma-context-mcp/server/transformers/text";
import { generateVarId } from "@/mastra/mcp/figma-context-mcp/server/utils/common";
import { hasValue, isRectangleCornerRadii } from "@/mastra/mcp/figma-context-mcp/server/utils/identity";

import type { ExtractorFn, GlobalVars, SimplifiedNode, StyleTypes, TraversalContext } from "./types";

/**
 * 查找或创建全局样式变量的辅助函数。
 *
 * 该函数会检查全局变量池中是否已存在相同的样式值，
 * 如果存在则返回现有变量 ID，否则创建新变量并存储。
 *
 * @example
 * ```ts
 * const globalVars: GlobalVars = { styles: {} };
 * const style = { color: '#ff0000' };
 * const varId = findOrCreateVar(globalVars, style, 'color');
 * // varId 格式: "color_1"
 * ```
 *
 * @param globalVars - 全局样式变量池
 * @param value - 要存储的样式值
 * @param prefix - 变量 ID 前缀（如 "layout"、"fill"）
 * @returns 样式变量的唯一 ID
 */
function findOrCreateVar(globalVars: GlobalVars, value: StyleTypes, prefix: string): string {
  // 检查是否已存在相同的值
  const [existingVarId] =
    Object.entries(globalVars.styles).find(
      ([_, existingValue]) => JSON.stringify(existingValue) === JSON.stringify(value)
    ) ?? [];

  if (existingVarId) {
    return existingVarId;
  }

  // 如果不存在则创建新变量
  const varId = generateVarId(prefix, JSON.stringify(value));
  globalVars.styles[varId] = value;
  return varId;
}

/**
 * 从节点中提取布局相关属性。
 *
 * 提取包括布局模式、对齐方式、间距、尺寸等布局信息。
 * 提取的布局会存储为全局样式变量，实现样式的复用。
 *
 * @example
 * ```ts
 * const result: SimplifiedNode = {};
 * const context: TraversalContext = { globalVars, parent: null };
 * layoutExtractor(figmaNode, result, context);
 * // result.layout = "layout_1"
 * // globalVars.styles["layout_1"] = { display: 'flex', flexDirection: 'row', ... }
 * ```
 *
 * @param node - Figma 文档节点
 * @param result - 正在构建的简化节点对象
 * @param context - 遍历上下文，包含全局变量和父节点信息
 */
export const layoutExtractor: ExtractorFn = (node, result, context) => {
  const layout = buildSimplifiedLayout(node, context.root);
  if (Object.keys(layout).length > 1) {
    result.layout = findOrCreateVar(context.globalVars, layout, "layout");
  }
};

/**
 * 从节点中提取文本内容和文本样式。
 *
 * 该提取器会处理三种内容：
 * 1. 文本内容 - 从 TEXT 节点提取纯文本
 * 2. 文本样式 - 字体、大小、行高等排版属性
 * 3. 字符级样式覆盖 - 如部分文字的渐变色等特殊样式
 *
 * @example
 * ```ts
 * const result: SimplifiedNode = {};
 * textExtractor(figmaTextNode, result, context);
 * // result.text = "Hello World"
 * // result.textStyle = "style_1"
 * // result.characterStyleOverrides = [{ "0-5": { fills: [...] } }]
 * ```
 *
 * @param node - Figma 文档节点
 * @param result - 正在构建的简化节点对象
 * @param context - 遍历上下文
 */
export const textExtractor: ExtractorFn = (node, result, context) => {
  // 提取文本内容
  if (isTextNode(node)) {
    result.text = extractNodeText(node);
  }

  // 提取文本样式
  if (hasTextStyle(node)) {
    const textStyle = extractTextStyle(node);
    if (textStyle) {
      // 优先使用 Figma 命名样式
      const styleName = getStyleName(node, context, ["text", "typography"]);
      if (styleName) {
        context.globalVars.styles[styleName] = textStyle;
        result.textStyle = styleName;
      } else {
        result.textStyle = findOrCreateVar(context.globalVars, textStyle, "style");
      }
    }
  }

  // 提取字符级样式覆盖（例如特定文字上的渐变）
  const characterOverrides = extractCharacterStyleOverrides(node);
  if (characterOverrides) {
    result.characterStyleOverrides = characterOverrides;
  }
};

/**
 * 从节点中提取视觉外观属性。
 *
 * 包括以下样式类型：
 * - **fills** - 填充色/背景（支持渐变、图片等）
 * - **strokes** - 描边颜色和样式
 * - **effects** - 阴影、模糊等视觉效果
 * - **opacity** - 不透明度
 * - **borderRadius** - 圆角半径
 *
 * 如果节点有子元素，填充颜色会被转换为 CSS 样式；
 * 如果是叶子节点，可能会使用背景图片等实现方式。
 *
 * @example
 * ```ts
 * const result: SimplifiedNode = {};
 * visualsExtractor(figmaRectangle, result, context);
 * // result.fills = "fill_1"
 * // result.strokes = "stroke_1"
 * // result.effects = "effect_1"
 * // result.borderRadius = "8px"
 * // result.opacity = 0.5
 * ```
 *
 * @param node - Figma 文档节点
 * @param result - 正在构建的简化节点对象
 * @param context - 遍历上下文
 */
export const visualsExtractor: ExtractorFn = (node, result, context) => {
  // 检查节点是否有子元素，以确定 CSS 属性
  const hasChildren = hasValue("children", node) && Array.isArray(node.children) && node.children.length > 0;

  // 填充
  if (hasValue("fills", node) && Array.isArray(node.fills) && node.fills.length) {
    const fills = node.fills.map((fill) => parsePaint(fill, hasChildren)).reverse();
    const styleName = getStyleName(node, context, ["fill", "fills"]);
    if (styleName) {
      context.globalVars.styles[styleName] = fills;
      result.fills = styleName;
    } else {
      result.fills = findOrCreateVar(context.globalVars, fills, "fill");
    }
  }

  // 描边
  const strokes = buildSimplifiedStrokes(node, hasChildren);
  if (strokes.colors.length) {
    const styleName = getStyleName(node, context, ["stroke", "strokes"]);
    if (styleName) {
      // 只有颜色可以设置为样式；其他描边属性保留在节点上
      context.globalVars.styles[styleName] = strokes.colors;
      result.strokes = styleName;
      if (strokes.strokeWeight) {
        result.strokeWeight = strokes.strokeWeight;
      }
      if (strokes.strokeDashes) {
        result.strokeDashes = strokes.strokeDashes;
      }
      if (strokes.strokeWeights) {
        result.strokeWeights = strokes.strokeWeights;
      }
    } else {
      result.strokes = findOrCreateVar(context.globalVars, strokes, "stroke");
    }
  }

  // 效果
  const effects = buildSimplifiedEffects(node);
  if (Object.keys(effects).length) {
    const styleName = getStyleName(node, context, ["effect", "effects"]);
    if (styleName) {
      context.globalVars.styles[styleName] = effects;
      result.effects = styleName;
    } else {
      result.effects = findOrCreateVar(context.globalVars, effects, "effect");
    }
  }

  // 不透明度
  if (hasValue("opacity", node) && typeof node.opacity === "number" && node.opacity !== 1) {
    result.opacity = node.opacity;
  }

  // 圆角半径
  if (hasValue("cornerRadius", node) && typeof node.cornerRadius === "number") {
    result.borderRadius = `${node.cornerRadius}px`;
  }
  if (hasValue("rectangleCornerRadii", node, isRectangleCornerRadii)) {
    result.borderRadius = `${node.rectangleCornerRadii[0]}px ${node.rectangleCornerRadii[1]}px ${node.rectangleCornerRadii[2]}px ${node.rectangleCornerRadii[3]}px`;
  }
};

/**
 * 从 INSTANCE 节点中提取组件相关属性。
 *
 * 该提取器专门处理组件实例，提取：
 * - **componentId** - 组件的主组件 ID
 * - **componentProperties** - 组件实例的属性覆盖值
 *
 * @example
 * ```ts
 * const result: SimplifiedNode = {};
 * componentExtractor(figmaInstance, result, context);
 * // result.componentId = "1:2"
 * // result.componentProperties = [
 * //   { name: "buttonText", value: "Click me", type: "TEXT" }
 * // ]
 * ```
 *
 * @param node - Figma 文档节点
 * @param result - 正在构建的简化节点对象
 * @param _context - 遍历上下文（未使用）
 */
export const componentExtractor: ExtractorFn = (node, result, _context) => {
  if (node.type === "INSTANCE") {
    if (hasValue("componentId", node)) {
      result.componentId = node.componentId;
    }

    // 添加组件实例的特定属性
    if (hasValue("componentProperties", node)) {
      result.componentProperties = Object.entries(node.componentProperties ?? {}).map(([name, { value, type }]) => ({
        name,
        value: value.toString(),
        type
      }));
    }
  }
};

/**
 * 获取节点上指定类型的 Figma 样式名称。
 *
 * Figma 允许用户为样式命名（如 "Heading 1"、"Primary Button"）。
 * 该函数会查找节点上指定样式类型对应的命名样式。
 *
 * @example
 * ```ts
 * const styleName = getStyleName(node, context, ["fill", "fills"]);
 * // 返回: "Primary Background" 或 undefined
 * ```
 *
 * @param node - Figma 文档节点
 * @param context - 遍历上下文，包含 extraStyles 元数据
 * @param keys - 要查找的样式键列表（按优先级顺序）
 * @returns 样式名称，如果未找到则返回 undefined
 */
function getStyleName(node: FigmaDocumentNode, context: TraversalContext, keys: string[]): string | undefined {
  if (!hasValue("styles", node)) {
    return undefined;
  }
  const styleMap = node.styles as Record<string, string>;
  for (const key of keys) {
    const styleId = styleMap[key];
    if (styleId) {
      const meta = context.globalVars.extraStyles?.[styleId];
      if (meta?.name) {
        return meta.name;
      }
    }
  }
  return undefined;
}

// -------------------- 便捷组合 --------------------

/**
 * 所有提取器组合 - 完整复制当前 parseNode 的行为。
 *
 * 使用该组合可以提取节点的全部属性：布局、文本、视觉和组件。
 */
export const allExtractors = [layoutExtractor, textExtractor, visualsExtractor, componentExtractor];

/**
 * 仅布局和文本 - 适用于内容分析和布局规划。
 *
 * 跳过视觉样式提取，专注于内容和结构信息。
 */
export const layoutAndText = [layoutExtractor, textExtractor];

/**
 * 仅文本内容 - 适用于内容审计和文案提取。
 *
 * 仅提取文本，忽略所有样式和布局信息。
 */
export const contentOnly = [textExtractor];

/**
 * 仅视觉效果 - 适用于设计系统分析和样式提取。
 *
 * 提取所有视觉样式，忽略文本内容和布局信息。
 */
export const visualsOnly = [visualsExtractor];

/**
 * 仅布局 - 适用于结构分析。
 *
 * 只提取布局属性，忽略内容和样式。
 */
export const layoutOnly = [layoutExtractor];

// -------------------- 子节点处理后的辅助函数 --------------------

/**
 * 可导出为 SVG 图像的节点类型集合。
 *
 * 当 FRAME、GROUP 或 INSTANCE 仅包含这些类型的子节点时，
 * 可以将整个容器折叠为单个 IMAGE-SVG 节点，减少数据量。
 *
 * @example
 * ```ts
 * SVG_ELIGIBLE_TYPES.has("RECTANGLE") // true
 * SVG_ELIGIBLE_TYPES.has("FRAME")     // false
 * ```
 */
export const SVG_ELIGIBLE_TYPES = new Set([
  "IMAGE-SVG", // VECTOR 节点会被转换为 IMAGE-SVG，或被折叠的容器
  "STAR",
  "LINE",
  "ELLIPSE",
  "REGULAR_POLYGON",
  "RECTANGLE"
]);

/**
 * 将 SVG 容器折叠为 IMAGE-SVG 的后处理回调函数。
 *
 * 该函数在处理完子节点后被调用。如果一个容器（FRAME/GROUP/INSTANCE）
 * 的所有子节点都是 SVG 可导出类型，则将容器本身标记为 IMAGE-SVG，
 * 并丢弃子节点列表。这样可以显著减少输出的数据量。
 *
 * @example
 * ```ts
 * // 输入: 一个包含 5 个矩形的 FRAME
 * const children = [
 *   { type: "RECTANGLE", ... },
 *   { type: "ELLIPSE", ... },
 *   // ...
 * ];
 * collapseSvgContainers(frameNode, result, children);
 * // result.type = "IMAGE-SVG"
 * // 返回 [] // 子节点被省略
 * ```
 *
 * @param node - 原始 Figma 节点
 * @param result - 正在构建的 SimplifiedNode
 * @param children - 已处理的子节点列表
 * @returns 要包含的子节点数组，折叠时返回空数组
 */
export function collapseSvgContainers(
  _node: FigmaDocumentNode,
  _result: SimplifiedNode,
  children: SimplifiedNode[]
): SimplifiedNode[] {
  return children;
}
