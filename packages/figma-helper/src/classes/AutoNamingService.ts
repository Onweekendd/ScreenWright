/// <reference types="@figma/plugin-typings" />

/**
 * AutoNamingService 服务类
 *
 * 「一键规范命名」：选中顶层文件帧后，递归遍历整棵子树，按 Figma 节点类型
 * 批量打上 BI 命名后缀，产出可直接喂进 Screenwright 规则分类的结构。
 *
 * 规则见 shared/naming.ts 的 classifyBiSuffix：
 * - 选中的顶层帧 → -exhibition（大屏根，Screenwright 跳过、子节点落大屏）
 * - 含 image 填充的节点（含 FRAME）→ -image，停止递归
 * - FRAME（无 image 填充）→ -panel，继续递归
 * - TEXT → 保持原名
 * - 其它一切 → -image，停止递归（整棵子树压成一张图）
 *
 * 幂等：改名前先用 NamingService.getBaseName(replace) 去掉已有后缀，重复点击不叠加。
 */

import { classifyBiSuffix } from "../shared/index";
import { NamingService } from "./NamingService";

export class AutoNamingService {
  constructor(private readonly naming = new NamingService()) {}

  /**
   * 对指定根节点递归执行一键规范命名。
   * @param rootId 选中的顶层文件帧 ID
   * @returns 实际改名的节点数量
   */
  async autoName(rootId: string): Promise<number> {
    const root = await figma.getNodeByIdAsync(rootId);
    if (!root || !("type" in root)) return 0;

    let count = 0;
    const walk = (node: SceneNode, isRoot: boolean): void => {
      const suffix = classifyBiSuffix(node.type, this.hasImageFill(node), isRoot);

      if (suffix !== null) {
        const base = this.naming.getBaseName(node.name, "replace");
        const targetName = base.endsWith(suffix) ? node.name : base + suffix;
        if (node.name !== targetName) {
          node.name = targetName;
          count++;
        }
      }

      // -image（规则 2/5）截断递归：整棵子树压成一张图，不再细分。
      const stopRecursion = suffix === "-image";
      if (!stopRecursion && "children" in node) {
        for (const child of (node as ChildrenMixin).children) {
          walk(child as SceneNode, false);
        }
      }
    };

    walk(root as SceneNode, true);
    return count;
  }

  /**
   * 判断节点是否带有可见的 image 填充。
   * mixed（多段填充）视为非纯图片，返回 false。
   */
  private hasImageFill(node: SceneNode): boolean {
    if (!("fills" in node)) return false;
    const fills = (node as GeometryMixin).fills;
    if (fills === figma.mixed) return false;
    return fills.some((paint) => paint.type === "IMAGE" && paint.visible !== false);
  }
}
