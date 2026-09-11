/**
 * NamingValidationService 服务类
 *
 * 遍历以 -panel / -merge / -group 结尾的容器节点，
 * 检查其直接子节点是否符合命名规范：
 *   - 以 -panel / -merge / -group 结尾 → 嵌套容器，合法且递归继续检查 ✓
 *   - 以 -image  结尾 → 图片节点   ✓
 *   - 以 -subtab 结尾 → 选项卡节点 ✓
 *   - type === "TEXT" → 文字节点（不依赖名称）✓
 * 其余子节点视为不符合规范，收集后返回。
 */

import type { NamingIssueItem } from "../types/index";

/** 容器节点后缀（既是父节点扫描范围，也是合法子节点后缀） */
const CONTAINER_SUFFIXES = ["-panel", "-merge", "-group"] as const;

/** 叶子节点合法后缀（通过名称判断，不含文字节点） */
const LEAF_VALID_SUFFIXES = ["-image", "-subtab"] as const;

/**
 * 判断节点名称是否属于容器节点
 * 容器节点作为子节点时合法，且需要继续递归校验其子节点
 */
function isContainerNode(name: string): boolean {
  return CONTAINER_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/**
 * 判断子节点是否合法：
 *   - 容器节点（-panel / -merge / -group）
 *   - 叶子节点名称符合规范（-image / -subtab）
 *   - Figma 文字节点（type === "TEXT"，不依赖名称）
 */
function isValidChild(node: SceneNode): boolean {
  if (node.type === "TEXT") return true;
  if (isContainerNode(node.name)) return true;
  return LEAF_VALID_SUFFIXES.some((suffix) => node.name.endsWith(suffix));
}

export class NamingValidationService {
  /**
   * 从指定根节点开始，递归遍历所有容器节点（-panel/-merge/-group），
   * 收集其中命名不合规的直接子节点。
   *
   * @param rootId 根节点 ID，传入当前选中节点（通常为页面顶层或 -panel/-group 节点）
   * @returns 不符合规范的子节点列表
   */
  async scan(rootId: string): Promise<NamingIssueItem[]> {
    const root = await figma.getNodeByIdAsync(rootId);
    if (!root) return [];

    const issues: NamingIssueItem[] = [];
    this.traverse(root as SceneNode, issues);
    return issues;
  }

  /**
   * 递归遍历节点树，收集命名问题
   */
  private traverse(node: SceneNode, issues: NamingIssueItem[]): void {
    // 当前节点是容器节点，检查其直接子节点
    if (isContainerNode(node.name) && "children" in node) {
      const container = node as SceneNode & ChildrenMixin;
      for (const child of container.children) {
        const childScene = child as SceneNode;
        if (!isValidChild(childScene)) {
          issues.push({
            parentId: node.id,
            parentName: node.name,
            childId: childScene.id,
            childName: childScene.name,
            childNodeType: childScene.type
          });
        }
      }
    }

    // 继续递归遍历子节点（无论当前节点是否为容器）
    if ("children" in node) {
      for (const child of (node as SceneNode & ChildrenMixin).children) {
        this.traverse(child as SceneNode, issues);
      }
    }
  }
}
