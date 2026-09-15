import type { ComponentFlatSchema } from "@screenwright/types/schemas";
import type z from "zod";

import type { FlattenedNodesState } from "../state";
import { stateManager } from "../state";
import { prismaClient } from "../storage/prisma";
import { ComponentSchema, type ComponentType } from "../types";
import { StateKeyEnum } from "../types";
import type { BfsTraversalStepNode } from "../types/bfs-traversal-types";
import { bfsTraversalStepOutputNode } from "../types/bfs-traversal-types";
import type { NormalizedNode } from "../types/normalized-node-types";

let _idSeq = Date.now();
const nextId = (): number => ++_idSeq;

export const SW_IMG_MODULE_ID = 43;

export const SW_RICHTEXT_MODULE_ID = 113;

export const FT_PANEL_MODULE_ID = 69;

export const FT_GROUP_MODULE_ID = 75;

export const FT_SUBTABS_MODULE_ID = 49;
/**
 * 工具执行结果类型
 */
export interface ToolResult<T> {
  component: T | null;
  success: boolean;
  message?: string;
  [key: string]: any; // 允许额外的字段
}

export type ComponentFlatSchemaType = z.infer<typeof ComponentFlatSchema>;

export function parseAndValidateNode(nodeJson: string): {
  postOrderNode: BfsTraversalStepNode | null;
  error?: string;
} {
  try {
    // 解析 JSON 字符串
    const postOrderNode = JSON.parse(nodeJson);

    // 验证节点数据
    const validationResult = bfsTraversalStepOutputNode.safeParse(postOrderNode);
    if (!validationResult.success) {
      return {
        postOrderNode: null,
        error: `节点数据验证失败: ${JSON.stringify(validationResult.error.issues)}`
      };
    }

    return { postOrderNode: validationResult.data };
  } catch (parseError) {
    return {
      postOrderNode: null,
      error: `无效的 JSON 字符串: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    };
  }
}

/**
 * 提取节点布局信息
 */
export function extractLayout(node: NormalizedNode) {
  const layout = node.layout;
  return {
    left: layout?.absolutePosition?.x ?? 0,
    top: layout?.absolutePosition?.y ?? 0,
    width: layout?.dimensions?.width ?? 100,
    height: layout?.dimensions?.height ?? 100
  };
}

/**
 * 设置组件基础属性
 */
export function setComponentBaseProps<T extends ComponentType | ComponentFlatSchemaType>(
  component: T,
  node: NormalizedNode,
  layout: { left: number; top: number; width: number; height: number }
): void {
  component.id = nextId();
  component.name = node.name || component.name;
  component.left = layout.left;
  component.top = layout.top;
  component.isLock = node.locked ?? false;
  component.display = node.visible ?? true;
  component.component.width = layout.width;
  component.component.height = layout.height;
}

/**
 * 创建错误结果
 */
export function createErrorResult<T>(message: string): ToolResult<T> {
  return {
    component: null,
    success: false,
    message
  };
}

/**
 * 创建成功结果
 */
export function createSuccessResult<T>(component: T, message: string, extra?: Record<string, any>): ToolResult<T> {
  return {
    component,
    success: true,
    message,
    ...extra
  };
}

/**
 * 将本地文件路径转换为资源路径
 * @param extension 文件扩展名
 * @example c:\screenwright-monorepo\servers\server\src\assets\expert-team-test.png
 * => ./assets/expert-team-test.png
 */
export function generateFileName(extension: string): string {
  return `figma-${crypto.randomUUID()}.${extension}`;
}

/**
 * 将本地文件路径转换为资源路径
 * @example c:\screenwright-monorepo\servers\server\src\assets\expert-team-test.png
 * => ./assets/expert-team-test.png
 */
export function localPathToResourcePath(localPath: string): string {
  // 如果是带有 IP/域名 和端口号的 URL，直接返回原值
  if (/^https?:\/\/.+:\d+/.test(localPath) || /^https?:\/\/[^/]+/.test(localPath)) {
    return localPath;
  }
  const fileName = localPath.split(/[\\/]/).pop() || "";
  return `./assets/${fileName}`;
}

/**
 * 解析 box-shadow CSS 字符串
 * @example "0px 24px 28px 0px rgba(0, 80, 227, 0.25)"
 * @returns { shadowX, shadowY, shadowFuzzy, shadowExtension, shadowColor }
 */
export function parseBoxShadow(boxShadow: string) {
  const shadowMatch = boxShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(.+)/);
  if (shadowMatch) {
    return {
      shadowX: parseInt(shadowMatch[1]),
      shadowY: parseInt(shadowMatch[2]),
      shadowFuzzy: parseInt(shadowMatch[3]),
      shadowExtension: parseInt(shadowMatch[4]),
      shadowColor: shadowMatch[5]
    };
  }
  return null;
}

/**
 * 解析 backdrop-filter CSS 字符串
 * @example "blur(16px)" 或 "blur(16px) saturate(150%)"
 * @returns { blur, saturate }
 */
export function parseBackdropFilter(backdropFilter: string) {
  const result: { blur?: number; saturate?: number } = {};

  const blurMatch = backdropFilter.match(/blur\((\d+)px\)/);
  if (blurMatch) {
    result.blur = parseInt(blurMatch[1]);
  }

  const saturateMatch = backdropFilter.match(/saturate\((\d+)%\)/);
  if (saturateMatch) {
    result.saturate = parseInt(saturateMatch[1]);
  }

  return result;
}

/**
 * 将 Figma RGBA 颜色对象转换为 CSS 字符串
 */
export function rgbaToCss(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? 1;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export const getComponentDefaultConfigByModuleId = async (moduleId: number) => {
  try {
    const config = await prismaClient.module.findFirst({
      where: {
        moduleId
      }
    });

    if (!config || !config.javaScript) {
      throw new Error("未找到组件配置");
    }

    const componentWithoutId = JSON.parse(config.javaScript) as Partial<ComponentType>;

    // 设置默认值
    componentWithoutId.events = componentWithoutId.events || [];
    componentWithoutId.zIndex = componentWithoutId.zIndex || 0;
    componentWithoutId.cbArgs = componentWithoutId.cbArgs || [];
    componentWithoutId.openFilter = componentWithoutId.openFilter ?? false;
    componentWithoutId.dataSource = componentWithoutId.dataSource || {};
    componentWithoutId.isLock = componentWithoutId.isLock ?? false;
    componentWithoutId.id = componentWithoutId.id || nextId();
    componentWithoutId.img = componentWithoutId.img || "";
    componentWithoutId.listenArgs = componentWithoutId.listenArgs || [];
    componentWithoutId.dataType = componentWithoutId.dataType ?? 0;
    componentWithoutId.dataRemark = componentWithoutId.dataRemark || [];
    // 布局默认值：部分组件的 DB 配置中不含 left/top（如 Subtabs）
    componentWithoutId.left = componentWithoutId.left ?? 0;
    componentWithoutId.top = componentWithoutId.top ?? 0;

    const componentConfig = ComponentSchema.parse(componentWithoutId as ComponentType);

    return {
      ...componentConfig,
      moduleId
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 通过 nodeId 向上查找父节点属性
// typeName 为选填：
//   - 不传：返回直接父节点的属性
//   - 传入（如 "-merge"）：向上遍历，跳过 name 不包含该值的节点，
//     直到找到第一个 name 包含该值的祖先节点并返回其属性
export const getParentNodeProperties = (nodeId: string, typeName?: string): BfsTraversalStepNode | null => {
  const flattenedNodesState = stateManager.getStore<FlattenedNodesState>(StateKeyEnum.FLATTENED_NODES);
  if (!flattenedNodesState) {
    return null;
  }

  // 从当前节点出发，沿 parentId 向上查找
  let currentId: string | null = nodeId;

  while (currentId !== null) {
    const current = flattenedNodesState.getNodeById(currentId);
    if (!current) {
      return null;
    }

    const parentId = current.parentId;
    if (parentId === null) {
      return null;
    }

    const parentNode = flattenedNodesState.getNodeById(parentId);
    if (!parentNode) {
      return null;
    }

    // 未传 typeName：直接返回直接父节点
    if (!typeName) {
      return parentNode;
    }

    // 传了 typeName：判断父节点 name 是否包含目标值
    if (parentNode.node.name.includes(typeName)) {
      return parentNode;
    }

    // 未命中，继续向上
    currentId = parentId;
  }

  return null;
};

type ExtractedLayout = ReturnType<typeof extractLayout>;

/**
 * 将 layout 限制在父节点（-merge）的尺寸范围内。
 * 若超出则裁剪 width / height 并将绝对定位归零。
 * 不修改入参，返回新对象（超出时）或原对象引用（未超出时）。
 */
export function clampLayoutToMergeParent(nodeId: string, layout: ExtractedLayout): ExtractedLayout {
  const parentDimensions = getParentNodeProperties(nodeId, "-merge")?.node.layout?.dimensions;
  if (
    parentDimensions?.width !== undefined &&
    parentDimensions?.height !== undefined &&
    (layout.width > parentDimensions.width || layout.height > parentDimensions.height)
  ) {
    return {
      ...layout,
      width: Math.min(layout.width, parentDimensions.width),
      height: Math.min(layout.height, parentDimensions.height),
      // 绝对定位也是错误的，直接纠偏（0, 0）
      left: 0,
      top: 0
    };
  }
  return layout;
}
