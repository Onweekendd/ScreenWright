/**
 * StructuralProcessor — Figma 节点结构处理器
 *
 * 负责将多个 -merge 帧合并为公共节点 + 状态节点的统一结构。
 * 不依赖任何 Figma 插件 API 或服务端特有字段（globalVars/坐标归一化）。
 *
 * 使用方：
 * - figma-helper 插件：将 BaseNode 转换为 StructuralNode 后调用
 * - Screenwright DataProcessor：继承本类并 override mergeStructure() 以添加坐标归一化
 */

import {
  isExhibitionNode,
  isGroupNode,
  isImageNode,
  isMergeNode,
  isPanelNode,
  isStatusNode,
  isSubtabNode,
  isSubtabStateNode
} from "./naming";
import type { StructuralNode } from "./structural-node";

export class StructuralProcessor {
  /**
   * 递归处理节点，将 -merge 帧合并为统一结构
   * @param node 当前处理的节点
   * @param stateIndex 当前节点所属的状态索引（由父 -panel 在迭代子节点时传入）
   * @returns 若发生了合并，返回合并后的 mergedFrame；否则返回 undefined
   */
  process(node: StructuralNode, stateIndex?: number): StructuralNode | undefined {
    if (isStatusNode(node.name)) {
      node.stateIndex = stateIndex;
      const mergeNodes = (node.children ?? []).filter((child) => child.name && isMergeNode(child.name));

      if (mergeNodes.length === 0) {
        // status 帧没有 -merge 包装层，说明它直接就是这一个状态的内容（而不是"多份 -merge
        // 待合并"）。把 status 帧自身当作唯一状态归一化：坐标清零 + stateIndex 下发给
        // 全部子孙，效果对齐"有 -merge 包装"分支产出的 mergedFrame。
        this.normalizeFrameOrigin(node);
        this.propagateStateIndex(node, stateIndex);
        return node;
      }

      const { mergedFrame } = this.mergeStructure(mergeNodes);

      mergeNodes.forEach((n) => {
        n.stateIndex = stateIndex;
      });

      this.propagateStateIndex(mergedFrame, stateIndex);

      node.children = [mergedFrame];

      return mergedFrame;
    }

    if (isPanelNode(node.name)) {
      const mergeNodes = (node.children ?? []).filter((child) => child.name && isMergeNode(child.name));

      if (mergeNodes.length > 0) {
        // 情况1：panel 直接含 -merge 子节点
        const { mergedFrame } = this.mergeStructure(mergeNodes);
        node.children = [mergedFrame];

        // 动态面板的布局采用合并后的 frame 布局
        node.layout = mergedFrame.layout;

        return;
      }

      // 情况2：panel 含 -status 子节点，递归处理（isStatusNode 会接管）
      if (node.children && node.children.length > 0) {
        // 多个 status 状态的尺寸可能不一致（尤其是直接装内容、没有 -merge 兜底对齐的场景），
        // 面板本身的展示尺寸取"各状态里最大的那个"，避免用外接 GROUP 的联合包围盒（可能横跨
        // 所有并排状态，远大于单个状态应有的大小）当作面板尺寸。
        let panelLayout: string | undefined;
        for (const [index, child] of node.children.entries()) {
          const mergedFrame = this.process(child, index);
          if (mergedFrame) {
            panelLayout = this.pickLargerLayout(panelLayout, mergedFrame.layout);
          }
        }
        if (panelLayout) {
          node.layout = panelLayout;
        }
      }
      return;
    }

    if (node.children && node.children.length > 0) {
      for (const [index, child] of node.children.entries()) {
        this.process(child, index);
      }
    }

    return;
  }

  /**
   * 归一化单个帧自身的绝对坐标：把帧自身位移清零，并联动偏移其所有子孙节点坐标，
   * 使子孙坐标变为"相对本帧原点"。
   *
   * 基类中 StructuralNode.layout 只是不透明的引用 key，不知道具体坐标数值，因此默认空实现；
   * DataProcessor 结合 globalVars 覆写此方法，复用 mergeStructure 场景下已有的坐标归一化逻辑。
   */
  protected normalizeFrameOrigin(_frame: StructuralNode): void {}

  /**
   * 在多个候选 layout（不透明引用 key）中挑选“更大”的一个，用于给动态面板选取展示尺寸。
   * 基类无法解析 layout key 对应的实际宽高，默认按后者覆盖前者（沿用此前逐个覆盖的行为）；
   * DataProcessor 结合 globalVars 覆写此方法，按实际面积比较。
   */
  protected pickLargerLayout(current: string | undefined, candidate: string | undefined): string | undefined {
    return candidate ?? current;
  }

  /**
   * 判断节点是否为"纯分组容器"（应被展开的 group）：
   * - 名称以 -group 结尾，或
   * - Figma type 为 GROUP 且不带任何特殊命名后缀（-panel/-status/-merge 等）
   * 带特殊后缀的节点即使 type 是 GROUP 也保留原样，不展开。
   */
  private isPlainGroup(node: StructuralNode): boolean {
    if (node.name && isGroupNode(node.name)) return true;
    if (node.type === "GROUP" && node.name) {
      return (
        !isPanelNode(node.name) &&
        !isStatusNode(node.name) &&
        !isMergeNode(node.name) &&
        !isImageNode(node.name) &&
        !isSubtabNode(node.name) &&
        !isExhibitionNode(node.name) &&
        !isSubtabStateNode(node.name)
      );
    }
    return false;
  }

  /**
   * 递归遍历子树，将所有 -group 节点的子节点打平。
   * 遇到 group 时直接打平并停止向下递归（flattenGroupChildren 已处理全部后代）。
   */
  private flattenGroupsInSubtree(node: StructuralNode): void {
    if (!node.children || node.children.length === 0) return;

    for (const child of node.children) {
      if (this.isPlainGroup(child)) {
        this.flattenGroupChildren(child);
      } else {
        this.flattenGroupsInSubtree(child);
      }
    }
  }

  private flattenGroupChildren(group: StructuralNode): void {
    const flattened: StructuralNode[] = [];
    this.collectNonGroupChildren(group.children ?? [], flattened);
    group.children = flattened;
  }

  /**
   * 遍历节点列表，将其中的纯分组容器展开（递归），
   * 带特殊命名后缀的节点（-panel、-status 等）以及普通组件保持原样。
   */
  private collectNonGroupChildren(nodes: StructuralNode[], result: StructuralNode[]): void {
    for (const node of nodes) {
      if (this.isPlainGroup(node)) {
        this.collectNonGroupChildren(node.children ?? [], result);
      } else {
        result.push(node);
      }
    }
  }

  /**
   * 合并多个 -merge 帧的结构：
   * 1. 收集各帧中的 -panel 节点，按名称分组
   * 2. 收集各帧中的公共节点（非 -panel）
   * 3. 构建合并后的帧（公共节点 + 合并后的 panel）
   * 4. 打平合并帧中所有 -group 节点
   *
   * 此方法为 protected，供子类（如 DataProcessor）override 以在合并前后
   * 添加坐标归一化等服务端专有逻辑。
   *
   * @param frames -merge 帧列表
   */
  protected mergeStructure(frames: StructuralNode[]): {
    panelNodeMap: Map<string, StructuralNode[]>;
    commonNodeMap: Map<string, StructuralNode>;
    mergedFrame: StructuralNode;
  } {
    const panelNodeMap = new Map<string, StructuralNode[]>();
    const commonNodeMap = new Map<string, StructuralNode>();

    frames.forEach((frame) => {
      frame.children?.forEach((node) => {
        this.collectPanel(node, panelNodeMap);
      });
    });

    frames.forEach((frame) => {
      this.collectCommonNode(frame.children ?? [], commonNodeMap);
    });

    const mergedFrame = this.buildMergedStructure(frames, panelNodeMap, commonNodeMap);

    // 打平合并帧中所有 -group 节点的子节点
    this.flattenGroupsInSubtree(mergedFrame);

    return {
      panelNodeMap,
      commonNodeMap,
      mergedFrame
    };
  }

  /**
   * 合并面板节点，将多个帧归并为一个：
   * - 同名 -panel 的"状态子节点"（非 panel 的直接子节点）全部合并到一个 panel 中
   * - 嵌套 panel 按层级挂回其父 panel
   * - 公共节点已由 collectCommonNode 去重，直接复用
   * - 最终只保留第一个帧作为容器，填入公共节点 + 合并后的顶层 panel
   *
   * @param frames       原始 merge 帧列表
   * @param panelNodeMap 由 collectPanel 生成的 panelName → 各帧 panel 节点
   * @param commonNodeMap 由 collectCommonNode 生成的 nodeName → 公共节点
   */
  buildMergedStructure(
    frames: StructuralNode[],
    panelNodeMap: Map<string, StructuralNode[]>,
    commonNodeMap: Map<string, StructuralNode>
  ): StructuralNode {
    // 阶段1：合并同名 panel 的状态节点
    const mergedPanels = this.mergeStateNodesIntoPanels(panelNodeMap);

    // 阶段2：重建嵌套层级关系
    this.rebuildPanelHierarchy(panelNodeMap, mergedPanels);

    // 阶段3：识别顶层 panel（frame 的直接 panel 子节点）
    const topLevelPanelNames = this.collectTopLevelPanelNames(frames);

    // 阶段4：构建最终合并帧
    return this.assembleMergedStructure(frames[0], commonNodeMap, topLevelPanelNames, mergedPanels);
  }

  /**
   * 将各帧同名 panel 的状态节点合并为一个 panel。
   * 如果两个状态的节点（除了 -panel）完全相同，则去重只保留一个状态。
   * 去重后重新分配连续的 stateIndex，避免出现空位。
   * @returns panelName → 合并后的 panel 节点（children 只有状态节点，不含嵌套 panel）
   */
  private mergeStateNodesIntoPanels(panelNodeMap: Map<string, StructuralNode[]>): Map<string, StructuralNode> {
    const mergedPanels = new Map<string, StructuralNode>();

    for (const [name, panelNodes] of panelNodeMap) {
      if (!panelNodes || panelNodes.length === 0) {
        continue;
      }

      const firstPanel = panelNodes[0];
      if (!firstPanel || !firstPanel.name) {
        continue;
      }

      const mergedPanel: StructuralNode = { ...firstPanel, children: [], stateIndex: undefined };

      // 用于去重的状态签名 -> 状态节点列表
      const stateSignatureMap = new Map<string, StructuralNode[]>();

      // 新的连续 stateIndex 计数器
      let newStateIndex = 0;

      for (const panel of panelNodes) {
        const stateNodes = panel.children?.filter((child) => !child.name || !isPanelNode(child.name)) ?? [];
        const childPanelNodes = panel.children?.filter((child) => child.name && isPanelNode(child.name)) ?? [];

        // 如果没有 -panel 子节点，不合并，每个状态单独保留
        if (childPanelNodes.length === 0) {
          stateNodes.forEach((node) => {
            node.stateIndex = newStateIndex;
          });
          mergedPanel.children!.push(...stateNodes);
          newStateIndex++;
          continue;
        }

        // 有 -panel 子节点时，计算状态签名：所有非 -panel 节点的名称 + 所有 -panel 节点的名称
        const stateNodeNames = stateNodes
          .map((node) => node.name ?? "")
          .sort()
          .join("|");
        const panelNodeNames = childPanelNodes
          .map((node) => node.name ?? "")
          .sort()
          .join("|");
        const signature = `${stateNodeNames}::${panelNodeNames}`;

        if (!stateSignatureMap.has(signature)) {
          // 新的状态签名，保留这个状态，使用新的连续索引
          stateNodes.forEach((node) => {
            node.stateIndex = newStateIndex;
          });
          stateSignatureMap.set(signature, stateNodes);
          newStateIndex++;
        }
        // 如果签名已存在，跳过这个状态（去重）
      }

      // 将所有去重后的状态节点合并
      for (const stateNodes of stateSignatureMap.values()) {
        mergedPanel.children!.push(...stateNodes);
      }

      mergedPanels.set(name, mergedPanel);
    }

    return mergedPanels;
  }

  /**
   * 从原始 panel 列表中提取所有 panel 子节点的名字（用于识别嵌套关系）
   */
  private extractPanelChildNames(panels: StructuralNode[]): Set<string> {
    return new Set(
      panels.flatMap(
        (panel) =>
          panel.children?.filter((child) => child.name && isPanelNode(child.name)).map((c) => c.name as string) ?? []
      )
    );
  }

  /**
   * 重建 panel 嵌套层级：将合并后的子 panel 挂回父 panel
   * @param panelNodeMap 原始 panel 映射（提供嵌套关系信息）
   * @param mergedPanels 合并后的 panel 映射（将被修改）
   */
  private rebuildPanelHierarchy(
    panelNodeMap: Map<string, StructuralNode[]>,
    mergedPanels: Map<string, StructuralNode>
  ): void {
    for (const [, panelNodes] of panelNodeMap) {
      const mergedParent = mergedPanels.get(panelNodes[0].name!)!;
      const childPanelNames = this.extractPanelChildNames(panelNodes);

      for (const childName of childPanelNames) {
        const mergedChild = mergedPanels.get(childName);
        if (mergedChild) {
          mergedParent.children!.push(mergedChild);
        }
      }
    }
  }

  /**
   * 从各 merge 帧中收集顶层 panel 名字（frame 的直接 panel 子节点）
   */
  private collectTopLevelPanelNames(frames: StructuralNode[]): Set<string> {
    return new Set(
      frames.flatMap(
        (frame) =>
          frame.children?.filter((child) => child.name && isPanelNode(child.name)).map((c) => c.name as string) ?? []
      )
    );
  }

  /**
   * 组装最终合并帧：公共节点 + 顶层合并 panel
   */
  private assembleMergedStructure(
    baseFrame: StructuralNode,
    commonNodeMap: Map<string, StructuralNode>,
    topLevelPanelNames: Set<string>,
    mergedPanels: Map<string, StructuralNode>
  ): StructuralNode {
    const mergedFrame: StructuralNode = { ...baseFrame };
    const panels = [...topLevelPanelNames]
      .map((name) => mergedPanels.get(name))
      .filter((n): n is StructuralNode => !!n);

    mergedFrame.children = [...commonNodeMap.values(), ...panels];

    return mergedFrame;
  }

  /**
   * 递归将 stateIndex 传播到节点的所有后代（仅在未设置时写入）
   */
  private propagateStateIndex(node: StructuralNode, stateIndex: number | undefined): void {
    if (stateIndex === undefined) return;
    if (node.stateIndex === undefined) {
      node.stateIndex = stateIndex;
    }
    // panel 节点是状态语义边界，其子节点有自己的 stateIndex，不向内传播
    if (isPanelNode(node.name)) return;
    node.children?.forEach((child) => this.propagateStateIndex(child, stateIndex));
  }

  /**
   * 递归收集 -panel 节点，按名称分组存储
   * @param node 当前节点
   * @param result panelName → 各帧同名 panel 节点数组
   */
  collectPanel(node: StructuralNode, result: Map<string, StructuralNode[]>): void {
    if (node.name && isPanelNode(node.name)) {
      const stateIndex = result.get(node.name)?.length ?? 0;

      if (result.has(node.name)) {
        result.get(node.name)!.push({ ...node, stateIndex });
      } else {
        result.set(node.name, [{ ...node, stateIndex }]);
      }

      const panelChildren = node.children?.filter((child) => child.name && isPanelNode(child.name));
      if (panelChildren) {
        for (const child of panelChildren) {
          this.collectPanel(child, result);
        }
      }

      return;
    }

    if (node.children) {
      for (const child of node.children) {
        this.collectPanel(child, result);
      }
    }
  }

  /**
   * 收集公共节点（非 -panel 的直接子节点），同名节点只保留第一个
   * @param nodes 节点列表（通常是某个 -merge 帧的直接子节点）
   * @param result nodeName → 节点的 Map
   */
  collectCommonNode(nodes: StructuralNode[], result: Map<string, StructuralNode>): void {
    const commonNodes = nodes.filter((node) => !node.name || !isPanelNode(node.name));

    for (const node of commonNodes) {
      if (!node.name) {
        continue;
      }
      if (!result.has(node.name)) {
        result.set(node.name, node);
      }
    }
  }
}
