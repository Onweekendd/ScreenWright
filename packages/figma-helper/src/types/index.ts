/**
 * Screenwright Figma 插件类型定义
 */

// ═══════════════════════════════════════════════════════════════════════════
// 插件消息类型
// ═══════════════════════════════════════════════════════════════════════════

export type PluginMessage =
  | { type: "applySuffix"; suffix: string; mode: "append" | "replace" }
  | { type: "autoNameStructure"; nodeId: string } // 一键规范命名：递归自动打后缀
  | { type: "getSelection" }
  | { type: "analyzePanelMerge"; nodeId: string }
  | { type: "selectNodes"; nodeIds: string[] }
  | { type: "syncNodeName"; nodeId: string; newName: string }
  | { type: "scanImageNodes"; nodeId: string }
  | { type: "exportImages"; nodeIds: string[] }
  | { type: "exportImagesForMinio"; nodeIds: string[] }
  | { type: "minioUploadNext" } // UI 上传完一张后通知主线程继续导出
  | { type: "scanNamingIssues"; nodeId: string }
  | { type: "scanStructureTree"; nodeId: string }
  | { type: "getNodeRawData"; nodeId: string } // 获取节点原始数据用于简化
  | { type: "getNodeRawDataForDownload"; nodeId: string } // 获取节点原始数据用于下载
  | { type: "httpRequest"; requestId: string; url: string; method: string; headers?: Record<string, string>; body?: string }
  | { type: "createSubtabTemplate" }
  | { type: "close" };

// ═══════════════════════════════════════════════════════════════════════════
// UI 消息类型
// ═══════════════════════════════════════════════════════════════════════════

export type UIMessage =
  | { type: "selectionChange"; nodes: NodeInfo[] }
  | { type: "applyResult"; count: number }
  | { type: "autoNameResult"; count: number }
  | { type: "panelMergeResult"; sourceInfo: MergeSourceInfo | null; matches: PanelMatchInfo[] }
  | { type: "syncResult"; nodeId: string; newName: string }
  | { type: "scanImageResult"; nodes: NodeInfo[] }
  | { type: "exportProgress"; current: number; total: number }
  | { type: "exportImageData"; items: { nodeId: string; fileName: string; bytes: number[] }[] }
  | {
      type: "exportImagesForMinioData";
      fileKey: string | null;
      items: { nodeId: string; fileName: string; bytes: number[] }[];
    }
  | { type: "minioUploadSkipped"; skipped: { nodeId: string; nodeName: string }[]; message: string }
  | { type: "scanNamingIssuesResult"; issues: NamingIssueItem[] }
  | { type: "scanStructureTreeResult"; tree: StructureTreeNode | null }
  | { type: "getNodeRawDataResult"; nodeId: string; fileKey: string | null; bytes: number[] }
  | { type: "getNodeRawDataForDownloadResult"; nodeId: string; bytes: number[] }
  | { type: "httpResponse"; requestId: string; ok: boolean; status: number; body: string }
  | { type: "createSubtabTemplateResult"; success: boolean };

// ═══════════════════════════════════════════════════════════════════════════
// 节点信息
// ═══════════════════════════════════════════════════════════════════════════

export interface NodeInfo {
  id: string;
  name: string;
  nodeType: string;
  parentPath?: string;
  /** 是否为顶层节点（父节点为 PAGE），用于判断能否一键规范命名 */
  isTopLevel?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Merge 相关类型
// ═══════════════════════════════════════════════════════════════════════════

export interface MergeSourceInfo {
  mergeFrameName: string;
  path: string[];
  isMergeFrame: boolean;
  mode: "merge" | "status" | "inner";
}

export interface PanelMatchInfo {
  mergeFrameId: string;
  mergeFrameName: string;
  status: "confirmed" | "suspected" | "missing";
  matchedNodeId: string | null;
  matchedNodeName: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 命名校验相关类型
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 不符合命名规范的子节点信息
 */
export interface NamingIssueItem {
  /** 父容器节点 ID */
  parentId: string;
  /** 父容器节点名称 */
  parentName: string;
  /** 问题子节点 ID */
  childId: string;
  /** 问题子节点名称 */
  childName: string;
  /** 问题子节点类型 */
  childNodeType: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 结构树相关类型
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 扁平化处理后的节点树节点
 * 每个节点携带 reason 标签，描述其在 BI 中的语义角色
 */
export interface StructureTreeNode {
  /** 节点 ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** Figma 节点类型 */
  nodeType: string;
  /** 语义角色描述（如"动态面板"、"图片组件"等） */
  reason: string;
  /** 所属状态索引（-1 表示公共节点） */
  stateIndex: number;
  /** 子节点列表 */
  children: StructureTreeNode[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 边界相关类型
// ═══════════════════════════════════════════════════════════════════════════

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  /** 选项卡选中状态 */
  ACTIVE = "-active"
}