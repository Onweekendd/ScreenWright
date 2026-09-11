/**
 * Figma 节点命名规则检查工具
 *
 * 根据 Figma 转 BI 规范，提供节点命名后缀的检查方法。
 * 参数均为可选字符串，兼容 FigmaNode.name 的 optional 字段。
 */

/**
 * 节点命名后缀枚举
 */
export enum NodeSuffix {
  /** 展项节点 */
  EXHIBITION = "-exhibition",
  /** 选项卡节点 */
  SUBTAB = "-subtab",
  /** 面板节点 */
  PANEL = "-panel",
  /** 状态节点 */
  STATUS = "-status",
  /** 合并节点 */
  MERGE = "-merge",
  /** 图片节点 */
  IMAGE = "-image",
  /** 分组节点 */
  GROUP = "-group",
  /** 组件节点 */
  COMPONENTS = "-components",
  /** 文本节点 */
  TEXT = "-text",
  /** 选项卡选中状态 */
  ACTIVE = "-active",
  /** 选项卡未选中状态 */
  NO_ACTIVE = "-noActive"
}

/** 节点命名后缀列表 */
export const NODE_SUFFIXES = Object.values(NodeSuffix);

/**
 * 检查节点名称是否以指定后缀结尾
 * @param name 节点名称
 * @param suffix 后缀
 */
export function endsWithSuffix(name: string | undefined, suffix: string): boolean {
  return !!name && name.endsWith(suffix);
}

/** 检查是否为展项节点 */
export function isExhibitionNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.EXHIBITION);
}

/** 检查是否为选项卡节点 */
export function isSubtabNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.SUBTAB);
}

/** 检查是否为面板节点 */
export function isPanelNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.PANEL);
}

/** 检查是否为状态节点 */
export function isStatusNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.STATUS);
}

/** 检查是否为合并节点 */
export function isMergeNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.MERGE);
}

/** 检查是否为图片节点 */
export function isImageNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.IMAGE);
}

/** 检查是否为分组节点 */
export function isGroupNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.GROUP);
}

/** 检查是否为组件节点 */
export function isComponentNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.COMPONENTS);
}

/** 检查是否为文本节点 */
export function isTextNode(node?: { type: string }): NodeSuffix | null {
  return node && node.type === "TEXT" ? NodeSuffix.TEXT : null;
}

/** 检查是否为选项卡选中状态节点 */
export function isActiveNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.ACTIVE);
}

/** 检查是否为选项卡未选中状态节点 */
export function isNoActiveNode(name?: string): boolean {
  return endsWithSuffix(name, NodeSuffix.NO_ACTIVE);
}

/** 检查是否为选项卡状态节点（-active 或 -noActive） */
export function isSubtabStateNode(name?: string): boolean {
  return isActiveNode(name) || isNoActiveNode(name);
}

/**
 * 根据节点名称获取对应的命名后缀
 * @param name 节点名称
 * @returns 命名后缀，如果没有匹配返回 null
 */
export function getNodeSuffix(name?: string): NodeSuffix | null {
  if (!name) return null;
  for (const suffix of NODE_SUFFIXES) {
    if (name.endsWith(suffix)) {
      return suffix;
    }
  }
  return null;
}

/**
 * 检查节点是否有任何已知的命名后缀
 * @param name 节点名称
 */
export function hasKnownSuffix(name?: string): boolean {
  if (!name) return false;
  return NODE_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/**
 * 一键规范命名：根据 Figma 节点类型 + 是否含原生 image 填充，推断应打的 BI 后缀。
 *
 * 纯函数，不依赖 Figma 插件 API，便于单测与 Screenwright 复用。规则优先级：
 * 1. isRoot（选中的顶层文件帧）→ EXHIBITION（大屏根，Screenwright 跳过、子节点落大屏）
 * 2. 含可见 image 填充（含 FRAME）→ IMAGE（用 frame 承载的图片判为图片而非面板）
 * 3. FRAME（无 image 填充）→ PANEL（动态面板）
 * 4. TEXT → null（保持原名，不加后缀）
 * 5. 其它一切（GROUP/INSTANCE/VECTOR/RECTANGLE/BOOLEAN…）→ IMAGE（整棵子树压成一张图）
 *
 * @param nodeType Figma 节点 type
 * @param hasImageFill 节点是否带可见 image 填充
 * @param isRoot 是否为选中的顶层帧
 * @returns 应打的后缀；返回 null 表示保持原名
 */
export function classifyBiSuffix(nodeType: string, hasImageFill: boolean, isRoot: boolean): NodeSuffix | null {
  if (isRoot) return NodeSuffix.EXHIBITION;
  if (hasImageFill) return NodeSuffix.IMAGE;
  if (nodeType === "FRAME") return NodeSuffix.PANEL;
  if (nodeType === "TEXT") return null;
  return NodeSuffix.IMAGE;
}
