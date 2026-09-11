import type { Node as YogaNode, Yoga } from "yoga-layout/load";
import { Align, Direction, Edge, FlexDirection, Justify, loadYoga, PositionType, Wrap } from "yoga-layout/load";

import type {
  BackgroundConfig,
  BorderConfig,
  Configuration,
  Data,
  DimensionSpec,
  TextConfig,
  VisualColor,
  VisualElement
} from "@/mastra/types/codia";
import type { fillType } from "@/mastra/types/figma-type";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { isGroupNode, isPanelNode, NodeSuffix } from "@/mastra/workflows/figma-to-bi/utils/naming-rules";

/**
 * Codia VisualElement Schema → NormalizedNode 适配器
 *
 * 目标：把 Codia image_to_design 接口产出的“相对布局意图”结构，解算成 figma-to-bi
 * 流水线 bfsTraversalStep 所需的 NormalizedNode（每个节点携带已解算的 parent-relative
 * 绝对坐标 + 尺寸），从而跳过 fetchFigma/dataProcessor/resolveStyles/normalizeLayout
 * 这几个 Figma 专属步骤，直接接入下游。
 *
 * 布局解算走 yoga（Flexbox 引擎）：Codia 主路径是 Flex 布局，widthSpec/heightSpec 只给
 * FIXED/FILL/FIT_CONTENT 意图，需要真正跑一遍 layout 才能拿到像素坐标。
 *
 * 已知盲区（先兜底跳过，等真实样本再补）：
 * - styleConfig.effectsList / overflowMode：结构未定义 → 忽略
 * - contentData.vectorData / componentSpec：结构未定义 → 忽略
 * - 图片资源：Codia 给的是 CDN 直链，与 resolveImagesStep 的 imageRef→DB 查询不兼容，
 *   这里先把 URL 塞进 imgLocalPath 透传，图片落地策略另行处理
 *
 * positionMode === "Absolute" 时用 absoluteAttrs.coord（[x, y]，相对父节点局部坐标）
 * 直接设 yoga 的绝对定位；已用真实样本核对：coord 是相对父节点的偏移，
 * orginCoord 是相对画布根的绝对偏移，二者满足 父.orginCoord + 子.coord = 子.orginCoord。
 * align 目前样本里恒为 ["LEFT","TOP"]，未见其它取值，暂不处理其语义。
 */

// ============ 类型映射表 ============

/** Codia elementType → Figma 节点类型 */
const ELEMENT_TYPE_MAP: Record<VisualElement["elementType"], NormalizedNode["type"]> = {
  Body: "FRAME",
  Layer: "FRAME",
  Group: "GROUP",
  Text: "TEXT",
  Image: "RECTANGLE", // 图片在 Figma 语义里是带 image fill 的矩形
  Vector: "IMAGE-SVG",
  Component: "INSTANCE"
};

/**
 * Codia elementType → BI 命名后缀
 *
 * 下游 rule-based-node-classifier 靠 Figma 图层命名后缀分类，Codia 不产出这类人工命名，
 * 因此在适配阶段按元素类型补上：
 * - Body（根/第一个 frame）→ -exhibition（分类为 "root"，转换时跳过，其子节点直接落到大屏）
 * - Layer（嵌套 frame）    → -panel（动态面板）
 * - group                  → -group（分组，另需打平嵌套 group，见 flattenNestedGroups）
 * - image / vector         → -image（转图片）
 * - text                   → 不加后缀，分类器靠 type==="TEXT" 自动识别为富文本
 * - component              → -panel（暂按容器处理）
 */
const ELEMENT_TYPE_SUFFIX: Record<VisualElement["elementType"], NodeSuffix | ""> = {
  Body: NodeSuffix.EXHIBITION,
  Layer: NodeSuffix.PANEL,
  Group: NodeSuffix.GROUP,
  Image: NodeSuffix.IMAGE,
  Vector: NodeSuffix.IMAGE,
  Component: NodeSuffix.PANEL,
  Text: ""
};

/** Codia fontStyle → CSS font-weight */
const FONT_STYLE_TO_WEIGHT: Record<NonNullable<TextConfig["fontStyle"]>, number> = {
  normal: 400,
  semi_bold: 600,
  bold: 700,
  italic: 400 // italic 不表示字重，斜体信息暂无落点，仅保留常规字重
};

/** Codia flexDirection → yoga FlexDirection */
function mapFlexDirection(dir?: string): FlexDirection {
  switch (dir) {
    case "row":
      return FlexDirection.Row;
    case "row-reverse":
      return FlexDirection.RowReverse;
    case "column-reverse":
      return FlexDirection.ColumnReverse;
    case "column":
    default:
      return FlexDirection.Column;
  }
}

/** Codia alignItems → yoga Align */
function mapAlignItems(align?: string): Align {
  switch (align) {
    case "center":
      return Align.Center;
    case "flex-end":
    case "end":
      return Align.FlexEnd;
    case "stretch":
      return Align.Stretch;
    case "baseline":
      return Align.Baseline;
    case "flex-start":
    case "start":
    default:
      return Align.FlexStart;
  }
}

/** 从 absoluteAttrs.coord/orginCoord 提取 [x, y] 元组（结构为 Record<string, any>，需做形状校验） */
function extractCoord(coord: unknown): [number, number] | undefined {
  if (!Array.isArray(coord) || coord.length !== 2) {
    return undefined;
  }
  const [x, y] = coord;
  return typeof x === "number" && typeof y === "number" ? [x, y] : undefined;
}

/** Codia justifyContent → yoga Justify */
function mapJustifyContent(justify?: string): Justify {
  switch (justify) {
    case "center":
      return Justify.Center;
    case "flex-end":
    case "end":
      return Justify.FlexEnd;
    case "space-between":
      return Justify.SpaceBetween;
    case "space-around":
      return Justify.SpaceAround;
    case "space-evenly":
      return Justify.SpaceEvenly;
    case "flex-start":
    case "start":
    default:
      return Justify.FlexStart;
  }
}

// ============ 样式映射 ============

function colorToHex(color?: VisualColor): string | undefined {
  if (!color) {
    return undefined;
  }
  if (color.hexCode) {
    return color.hexCode;
  }
  if (color.rgbValues) {
    const [r, g, b] = color.rgbValues;
    return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }
  return undefined;
}

/** 由渐变停止点拼 CSS linear-gradient 字符串 */
function backgroundToFills(bg: BackgroundConfig | undefined): NormalizedNode["fills"] {
  if (!bg) {
    return undefined;
  }
  switch (bg.type) {
    case "COLOR": {
      const hex = colorToHex(bg.backgroundColor);
      return hex ? [hex] : undefined;
    }
    case "LINEAR_GRADIENT": {
      const stops = bg.gradientStops
        .map((s) => {
          const hex = colorToHex(s.color);
          return hex ? `${hex} ${Math.round(s.position * 100)}%` : hex;
        })
        .filter(Boolean)
        .join(", ");
      const gradient: fillType = {
        type: "GRADIENT_LINEAR",
        gradient: `linear-gradient(${bg.deg}deg, ${stops})`
      };
      return [gradient];
    }
    case "IMAGE": {
      // 背景图：URL 无结构化落点，透传到 scaleMode 之外的信息暂丢弃，URL 由 imgLocalPath 承载
      const fill: fillType = {
        type: "IMAGE",
        scaleMode: bg.backgroundSize === "contain" ? "FIT" : "FILL"
      };
      return [fill];
    }
  }
}

/** 四角圆角数组 [TL,TR,BR,BL] → CSS border-radius 字符串 */
function borderRadiusToString(border: BorderConfig | undefined, scale: number): string | undefined {
  const r = border?.borderRadius;
  if (!r || r.length === 0) {
    return undefined;
  }
  const scaled = r.map((v) => Math.round(v * scale));
  const allEqual = scaled.every((v) => v === scaled[0]);
  return allEqual ? `${scaled[0]}px` : scaled.map((v) => `${v}px`).join(" ");
}

/** 边框 → strokes（strokeSchema 为 any，构造一个描述性对象） */
function borderToStrokes(border: BorderConfig | undefined, scale: number): NormalizedNode["strokes"] {
  if (!border || (border.borderWidth ?? 0) <= 0) {
    return undefined;
  }
  return {
    color: colorToHex(border.borderColor),
    width: Math.round((border.borderWidth ?? 0) * scale),
    style: border.borderStyle ?? "solid"
  };
}

/** textAlign 数组拆分为水平/垂直对齐 */
function mapTextAlign(
  textAlign?: string[]
): Pick<NonNullable<NormalizedNode["textStyle"]>, "textAlignHorizontal" | "textAlignVertical"> {
  const result: Pick<NonNullable<NormalizedNode["textStyle"]>, "textAlignHorizontal" | "textAlignVertical"> = {};
  if (!textAlign) {
    return result;
  }
  for (const a of textAlign) {
    switch (a) {
      case "left":
        result.textAlignHorizontal = "LEFT";
        break;
      case "center":
        // center 可能指水平也可能指垂直，优先水平；若已有水平则记为垂直
        if (!result.textAlignHorizontal) {
          result.textAlignHorizontal = "CENTER";
        } else {
          result.textAlignVertical = "CENTER";
        }
        break;
      case "right":
        result.textAlignHorizontal = "RIGHT";
        break;
      case "justify":
        result.textAlignHorizontal = "JUSTIFIED";
        break;
      case "top":
        result.textAlignVertical = "TOP";
        break;
      case "middle":
        result.textAlignVertical = "CENTER";
        break;
      case "bottom":
        result.textAlignVertical = "BOTTOM";
        break;
    }
  }
  return result;
}

function buildTextStyle(text: TextConfig | undefined, scale: number): NormalizedNode["textStyle"] {
  if (!text) {
    return undefined;
  }
  const style: NonNullable<NormalizedNode["textStyle"]> = {
    fontFamily: text.fontFamily,
    fontWeight: text.fontStyle ? FONT_STYLE_TO_WEIGHT[text.fontStyle] : undefined,
    fontSize: text.fontSize != null ? Math.round(text.fontSize * scale) : undefined,
    lineHeight: text.lineHeight != null ? `${Math.round(text.lineHeight * scale)}px` : undefined,
    letterSpacing: text.letterSpacing != null ? `${(text.letterSpacing * scale).toFixed(2)}px` : undefined,
    ...mapTextAlign(text.textAlign)
  };
  return style;
}

/** CJK 统一表意文字（含扩展 A 㐀-䶿、兼容表意文字 豈-﫿），按全角 1em 估宽 */
const CJK_CHAR = /[一-鿿㐀-䶿豈-﫿]/;

/**
 * 估算单行文本无字间距时的自然渲染宽度（像素）。
 * 逐字符按「em 占宽 × 字号」累加：CJK 全角 ≈ 1em；空格 ≈ 0.3em；其余（西文字母/数字/
 * 标点）按 0.6em 近似。西文字形宽度差异大，此为经验均值，仅用于反推字间距的量级。
 */
function estimateNaturalWidth(text: string, fontSize: number): number {
  let ems = 0;
  for (const ch of text) {
    ems += CJK_CHAR.test(ch) ? 1 : ch === " " ? 0.3 : 0.6;
  }
  return ems * fontSize;
}

/**
 * 补偿 Codia 丢失的字间距。
 *
 * Codia 的 image_to_design 响应里没有 letterSpacing 字段，但设计稿常靠字间距把标题/副标题
 * 铺满整行；缺失后文字自然宽度偏小，会在更宽的文本框里左对齐、挤在前半段（表现为
 * 「字体没有全宽、只占了一个头」）。Codia 文本框宽度紧贴实际渲染文字（含原字间距），因此
 * 「框宽（yoga 解算宽度）显著大于无字间距的自然宽度」即可反推出原本存在字间距，用
 * (框宽 - 自然宽) / 字符数 均分补偿 letterSpacing。
 *
 * 仅作用于 Codia 归一化阶段：正规 Figma 流水线会真实返回 letterSpacing，不经过此函数，
 * 不受影响。守卫条件（单行、原本无字间距、框宽显著大于自然宽）避免误伤本就紧贴内容或
 * 有意留白的文本。西文自然宽度按经验均值估算，补偿量级为近似值。
 */
function reconstructMissingLetterSpacing(node: NormalizedNode, boxWidth: number): void {
  const style = node.textStyle;
  const text = node.text;
  if (!style || style.letterSpacing != null || !text || text.includes("\n")) {
    return;
  }
  const { fontSize } = style;
  if (!fontSize || text.length < 2 || !Number.isFinite(boxWidth) || boxWidth <= 0) {
    return;
  }
  const naturalWidth = estimateNaturalWidth(text, fontSize);
  if (boxWidth - naturalWidth <= fontSize * 0.1) {
    return;
  }
  const spacing = Math.round(((boxWidth - naturalWidth) / text.length) * 100) / 100;
  style.letterSpacing = `${spacing}px`;
}

// ============ yoga 布局解算 ============

/** VisualElement 与其 yoga 节点的并行结构 */
interface YogaPair {
  el: VisualElement;
  yogaNode: YogaNode;
  children: YogaPair[];
}

/** 按 DimensionSpec 设置 yoga 宽/高 */
function applyDimension(
  yogaNode: YogaNode,
  spec: DimensionSpec | undefined,
  axis: "width" | "height",
  scale: number
): void {
  if (!spec) {
    return;
  }
  switch (spec.sizing) {
    case "FIXED":
      if (spec.value != null) {
        if (axis === "width") {
          yogaNode.setWidth(spec.value * scale);
        } else {
          yogaNode.setHeight(spec.value * scale);
        }
      }
      break;
    case "FILL":
      // 撑满父容器：交叉轴用百分比，主轴由 flexGrow 兜底
      if (axis === "width") {
        yogaNode.setWidthPercent(100);
      } else {
        yogaNode.setHeightPercent(100);
      }
      break;
    case "FIT_CONTENT":
      if (axis === "width") {
        yogaNode.setWidthAuto();
      } else {
        yogaNode.setHeightAuto();
      }
      break;
  }
}

/** 递归建 yoga 树 */
function buildYogaTree(yoga: Yoga, el: VisualElement, scale: number): YogaPair {
  const yogaNode = yoga.Node.create();
  const { layoutConfig, styleConfig } = el;

  // 布局方向
  const flex = layoutConfig.flexAttributes;
  yogaNode.setFlexDirection(mapFlexDirection(flex?.flexDirection));
  if (flex?.alignItems) {
    yogaNode.setAlignItems(mapAlignItems(flex.alignItems));
  }
  if (flex?.justifyContent) {
    yogaNode.setJustifyContent(mapJustifyContent(flex.justifyContent));
  }
  if (flex?.flexWrap === "wrap") {
    yogaNode.setFlexWrap(Wrap.Wrap);
  }

  // 绝对定位：coord 是相对父节点局部坐标；缺失/形状不符时降级为常规流
  if (layoutConfig.positionMode === "Absolute") {
    const coord = extractCoord(layoutConfig.absoluteAttrs?.coord);
    if (coord) {
      yogaNode.setPositionType(PositionType.Absolute);
      yogaNode.setPosition(Edge.Left, coord[0] * scale);
      yogaNode.setPosition(Edge.Top, coord[1] * scale);
    }
  }

  // 尺寸
  applyDimension(yogaNode, styleConfig.widthSpec, "width", scale);
  applyDimension(yogaNode, styleConfig.heightSpec, "height", scale);
  if (styleConfig.widthSpec?.sizing === "FILL") {
    yogaNode.setFlexGrow(1);
  }

  // padding [上,右,下,左]
  const p = styleConfig.paddingValues;
  if (p && p.length === 4) {
    yogaNode.setPadding(Edge.Top, p[0] * scale);
    yogaNode.setPadding(Edge.Right, p[1] * scale);
    yogaNode.setPadding(Edge.Bottom, p[2] * scale);
    yogaNode.setPadding(Edge.Left, p[3] * scale);
  }

  // 叶子文本：无显式尺寸时用估算的 measure func，避免塌成 0
  const children = el.childElements ?? [];
  if (el.elementType === "Text" && children.length === 0) {
    const textValue = el.contentData?.textValue ?? "";
    const fontSize = (styleConfig.textConfig?.fontSize ?? 14) * scale;
    const lineHeight = (styleConfig.textConfig?.lineHeight ?? fontSize * 1.2) * scale;
    yogaNode.setMeasureFunc((availableWidth) => {
      const estWidth = textValue.length * fontSize * 0.6;
      const width =
        Number.isFinite(availableWidth) && availableWidth > 0 ? Math.min(estWidth, availableWidth) : estWidth;
      const lines =
        estWidth > 0 && Number.isFinite(availableWidth) && availableWidth > 0
          ? Math.ceil(estWidth / availableWidth)
          : 1;
      return { width, height: Math.max(lineHeight, lines * lineHeight) };
    });
  }

  const pairs: YogaPair[] = [];
  children.forEach((child, i) => {
    const childPair = buildYogaTree(yoga, child, scale);
    yogaNode.insertChild(childPair.yogaNode, i);
    pairs.push(childPair);
  });

  return { el, yogaNode, children: pairs };
}

/**
 * 从解算完的 yoga 树读回坐标，构造 NormalizedNode 树。
 *
 * yoga 的 getComputedLeft/Top 始终是相对父节点的局部坐标；而管道下游（bfsTraversal /
 * classification / NodeConverter / ComponentConversionState）约定 layout.absolutePosition
 * 是相对画布根的绝对坐标（对齐真实 Figma 流水线 dataProcessor 的合并/拆分逻辑，
 * 见 data-processor.ts 的 normalizeFrameChildrenToRelative 注释），因此这里需要把父节点的
 * 累计绝对坐标一路传下去，逐层相加。
 */
function pairToNormalized(pair: YogaPair, scale: number, parentAbsX = 0, parentAbsY = 0): NormalizedNode | null {
  const { el, yogaNode } = pair;
  const absX = parentAbsX + yogaNode.getComputedLeft();
  const absY = parentAbsY + yogaNode.getComputedTop();
  const { styleConfig, contentData } = el;

  const isText = el.elementType === "Text";
  const isImage = el.elementType === "Image";

  // 文本颜色走 fills（对齐 figma 流水线 TEXT 节点用 fills 表达文字色的约定）
  let fills: NormalizedNode["fills"];
  if (isText) {
    const hex = colorToHex(styleConfig.textColor);
    fills = hex ? [hex] : undefined;
  } else {
    fills = backgroundToFills(styleConfig.backgroundConfig);
  }

  // 图片 URL：Image 节点取 contentData.imageSource；背景图取 backgroundConfig.imageUrl
  let imgLocalPath: string | undefined;
  if (isImage) {
    imgLocalPath = contentData?.imageSource;
  } else if (styleConfig.backgroundConfig?.type === "IMAGE") {
    imgLocalPath = styleConfig.backgroundConfig.imageUrl;
  }

  // Codia 把"这里应该有张图"识别成 Image 类型节点，但没能提取出实际图片资源时 imageSource
  // 是空字符串——此时没有任何可用的图片/颜色兜底数据（backgroundConfig 也不存在），保留这个
  // 节点只会在下游转换出一个占位默认图的 ftImg 组件，内容与设计稿不符，故直接丢弃整个节点。
  if (isImage && !imgLocalPath) {
    return null;
  }

  const baseName = el.elementName || contentData?.displayName || el.elementType;
  const node: NormalizedNode = {
    id: el.elementId,
    name: `${baseName}${ELEMENT_TYPE_SUFFIX[el.elementType]}`,
    type: ELEMENT_TYPE_MAP[el.elementType],
    layout: {
      mode: "none",
      absolutePosition: { x: absX, y: absY },
      dimensions: {
        width: yogaNode.getComputedWidth(),
        height: yogaNode.getComputedHeight()
      }
    },
    fills,
    strokes: borderToStrokes(styleConfig.borderConfig, scale),
    borderRadius: borderRadiusToString(styleConfig.borderConfig, scale),
    opacity: styleConfig.opacityLevel != null ? styleConfig.opacityLevel / 255 : undefined,
    visible: true
  };

  if (isText) {
    node.text = contentData?.textValue;
    node.textStyle = buildTextStyle(styleConfig.textConfig, scale);
    reconstructMissingLetterSpacing(node, yogaNode.getComputedWidth());
  }
  if (imgLocalPath) {
    node.imgLocalPath = imgLocalPath;
  }

  const children = pair.children
    .map((c) => pairToNormalized(c, scale, absX, absY))
    .filter((c): c is NormalizedNode => c !== null);
  if (children.length > 0) {
    // Codia childElements 数组的声明顺序是"越靠前越贴近底层"（如 Button 的 Background 在
    // childElements[0]，盖在它上面的文字在 [1]），与下游 bfsTraversalStep 的 zIndex 计算假设
    // 相反——那里是按 Figma 图层数组的约定校准的（数组第一个元素 zIndex 最大，即渲染在最上层），
    // 直接复用会让 Codia 的背景层盖住文字。这里反转子节点顺序，使反转后依旧是"数组第一个
    // zIndex 最大"，但语义上变成"Codia 声明顺序里最后一个在最上层"，从而让背景（声明顺序最前）
    // 落到最底层。布局已在 buildYogaTree 里按原始顺序算好，这里只调整输出树的兄弟节点顺序，
    // 不影响任何坐标结果。
    node.children = [...children].reverse();
  }
  return node;
}

// ============ 分组打平 ============

/**
 * 溶解 node 子树内的所有后代 group：把 group 的 children 上提到其父节点。
 * absolutePosition 已经是画布绝对坐标（见 pairToNormalized），提升层级不改变父子关系
 * 以外的任何坐标语义，因此无需再做偏移累加，直接重挂即可保持视觉位置不变。
 */
function dissolveDescendantGroups(node: NormalizedNode): void {
  if (!node.children) {
    return;
  }
  const result: NormalizedNode[] = [];
  for (const child of node.children) {
    // 先递归，确保 child.children 内部已无嵌套 group
    dissolveDescendantGroups(child);
    if (isGroupNode(child.name)) {
      result.push(...(child.children ?? []));
    } else {
      result.push(child);
    }
  }
  node.children = result.length > 0 ? result : undefined;
}

/**
 * 打平嵌套分组：BI 分组只能有一层。
 * 从根向下找到「顶层 group」（其祖先中不含 group），保留它，但溶解其内部的所有后代 group。
 */
function flattenNestedGroups(node: NormalizedNode): void {
  if (!node.children) {
    return;
  }
  for (const child of node.children) {
    if (isGroupNode(child.name)) {
      // child 是允许保留的一层 group → 溶解其内部嵌套 group
      dissolveDescendantGroups(child);
    } else {
      // 继续向下寻找顶层 group
      flattenNestedGroups(child);
    }
  }
}

/**
 * 让 -panel 节点的宽高至少覆盖其所有直接子节点的包围盒。
 * Codia 有些"按钮/卡片"类容器自身声明的 widthSpec/heightSpec 只框住了背景层，其余以
 * Absolute 定位叠加的内容（尤其是检测出来的文字）会大幅超出这个框——yoga 对 Absolute
 * 定位子节点不会反向撑大父节点（这是 flexbox 的标准行为），所以必须在转换阶段显式按
 * 子节点实际占用范围校正，否则转出的面板组件会比真实内容小很多（后续下游按面板自身
 * 宽高裁剪/布局，内容会被裁掉或错位）。只做"扩大"，不缩小、不改变任何节点坐标，
 * 行为良好（子节点本就在框内）的面板不受影响。
 * 自底向上处理：先修正深层嵌套面板的尺寸，外层面板的包围盒计算才能拿到子面板修正后的真实占用。
 */
function growPanelsToFitDescendants(node: NormalizedNode): void {
  if (!node.children) {
    return;
  }
  for (const child of node.children) {
    growPanelsToFitDescendants(child);
  }
  if (!isPanelNode(node.name) || !node.layout) {
    return;
  }

  const originX = node.layout.absolutePosition?.x ?? 0;
  const originY = node.layout.absolutePosition?.y ?? 0;
  let maxRight = node.layout.dimensions?.width ?? 0;
  let maxBottom = node.layout.dimensions?.height ?? 0;
  for (const child of node.children) {
    const left = (child.layout?.absolutePosition?.x ?? 0) - originX;
    const top = (child.layout?.absolutePosition?.y ?? 0) - originY;
    maxRight = Math.max(maxRight, left + (child.layout?.dimensions?.width ?? 0));
    maxBottom = Math.max(maxBottom, top + (child.layout?.dimensions?.height ?? 0));
  }

  node.layout.dimensions = { width: maxRight, height: maxBottom };
}

/**
 * 将 Codia image_to_design 的响应 data 转换为 NormalizedNode 根节点
 * @param data Codia 响应中的 data 部分（含 configuration + visualElement）
 * @returns 已解算坐标、已补 BI 命名后缀、已打平嵌套分组、已按子节点包围盒校正面板宽高的 NormalizedNode 树根
 */
export async function convertCodiaToNormalizedNode(data: Data): Promise<NormalizedNode> {
  const yoga = await loadYoga();
  const scale = data.configuration?.scalingFactor ?? 1;
  const baseWidth = (data.configuration?.baseWidth ?? 0) * scale;
  // 根节点若给了显式高度（如画布真实高度），直接用它；否则交给内容撑开（auto）。
  // 常规流场景（子节点参与自动撑高）下不设该值，避免覆盖 FIT_CONTENT 的既有行为。
  const rootHeightValue = data.visualElement.styleConfig.heightSpec?.value;
  const baseHeight = rootHeightValue != null ? rootHeightValue * scale : undefined;

  const tree = buildYogaTree(yoga, data.visualElement, scale);

  tree.yogaNode.calculateLayout(baseWidth || undefined, baseHeight, Direction.LTR);

  const normalized = pairToNormalized(tree, scale);

  // 释放 WASM 侧内存
  tree.yogaNode.freeRecursive();

  // 根节点是 Body/Layer 类型（见 buildYogaTree 的调用方 data.visualElement），永远不会命中
  // pairToNormalized 里"Image 节点缺图丢弃"的分支，null 只可能出现在子树中
  if (!normalized) {
    throw new Error("Codia 转换失败：根节点被丢弃（不应发生，说明根节点被识别成了 Image 类型）");
  }

  // BI 分组只能一层：打平嵌套 group
  flattenNestedGroups(normalized);

  // 面板宽高按子节点实际占用范围校正（必须在 flattenNestedGroups 之后：分组打平会改变
  // 面板的直接子节点集合，要用打平后的最终结构计算包围盒）
  growPanelsToFitDescendants(normalized);

  return normalized;
}

/**
 * 将 Codia 的布局容器展开为供语义重建使用的原子节点树。
 *
 * Codia 的 Layer / Group 更接近视觉还原过程中的布局中间层，不能直接决定最终 BI
 * DynamicPanel / Group。这里保留根画布，只把可独立转换的叶子节点挂到根下。
 * 带背景图片的容器会额外保留为图片原子，避免展开容器时丢失可见背景。
 */
export function atomicizeCodiaNormalizedTree(root: NormalizedNode): NormalizedNode {
  const atoms: NormalizedNode[] = [];

  const visit = (node: NormalizedNode): void => {
    const children = node.children ?? [];
    if (children.length > 0) {
      // children 已按视觉层级从上到下排序；先放子元素，容器背景最后放到底层。
      for (const child of children) {
        visit(child);
      }
      if (node.imgLocalPath) {
        atoms.push({
          ...node,
          id: `${node.id}:background`,
          name: `${node.name.replace(/-(?:panel|group)$/i, "")}${NodeSuffix.IMAGE}`,
          type: "RECTANGLE",
          children: undefined
        });
      }
      return;
    }

    if (node.type === "FRAME" || node.type === "GROUP") {
      if (node.imgLocalPath) {
        atoms.push({
          ...node,
          name: `${node.name.replace(/-(?:panel|group)$/i, "")}${NodeSuffix.IMAGE}`,
          type: "RECTANGLE",
          children: undefined
        });
      }
      return;
    }

    atoms.push({ ...node, children: undefined });
  };

  for (const child of root.children ?? []) {
    visit(child);
  }

  return {
    ...root,
    children: atoms.length > 0 ? atoms : undefined
  };
}

export async function convertCodiaToAtomicNormalizedNode(data: Data): Promise<NormalizedNode> {
  return atomicizeCodiaNormalizedTree(await convertCodiaToNormalizedNode(data));
}

export type { Configuration };
