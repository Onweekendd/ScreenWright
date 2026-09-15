import { workflowStateRegistry } from "@/mastra/state";
import type { BfsTraversalStepNode } from "@/mastra/types/bfs-traversal-types";
import type { Data } from "@/mastra/types/codia";
import { convertCodiaToNormalizedNode } from "@/mastra/workflows/figma-to-bi/adapters/codia-to-normalized";
import { buildTraversalNodes, removeSubtabChildNode } from "@/mastra/workflows/figma-to-bi/steps/bfs-traversal-step";
import { RuleBasedNodeClassifier } from "@/mastra/workflows/figma-to-bi/steps/classification/rule-based-node-classifier";
import type { NodeConvertOutput } from "@/mastra/workflows/figma-to-bi/steps/node-convert/NodeConverter";
import { NodeConverter } from "@/mastra/workflows/figma-to-bi/steps/node-convert/NodeConverter";

let workflowSeq = 0;

/**
 * 复刻 figma-to-bi-v2-workflow 里 codiaAdapterStep 之后的全部步骤（bfsTraversalStep →
 * ruleBasedClassificationStep → resolveImagesStep（此样本无需 DB 图片，跳过）→
 * nodeConvertToBIStep），但绕开 createStep/mastra 运行时包装，直接调用其内部的纯逻辑，
 * 便于在测试里对一份真实 Codia 样本跑通「从设计稿到 BI 组件」的完整链路。
 *
 * DB 依赖仅剩 getComponentDefaultConfigByModuleId（由调用方在测试文件里通过
 * vi.mock("@/mastra/tools/utils") 换成真实 DB 导出的默认组件配置样本，见同目录
 * swImg.default-config.json / ftPanel.default-config.json）。
 */
export async function runCodiaToBIComponents(data: Data): Promise<NodeConvertOutput[]> {
  const root = await convertCodiaToNormalizedNode(data);

  const flattenedNodes = buildTraversalNodes(root);
  removeSubtabChildNode(flattenedNodes);

  const workflowId = `codia-text1-e2e-${++workflowSeq}`;
  const bundle = workflowStateRegistry.create(workflowId);
  bundle.flattenedNodesState.set(flattenedNodes);

  const classifier = new RuleBasedNodeClassifier(
    flattenedNodes,
    bundle.nodeClassificationState,
    bundle.imageCandidatesState
  );
  const classifications = classifier.classifyNodes(flattenedNodes);

  // 按 DFS 顺序转换（父节点先于子节点），与 node-convert-to-bi-step.ts 保持一致：
  // updateParentWithChild 依赖父节点的转换结果已存在于 componentConversionState。
  const nodeMap = new Map<string, BfsTraversalStepNode>(flattenedNodes.map((n) => [n.node.id, n]));
  const classificationMap = new Map(classifications.map((c) => [c.nodeId, c]));
  const dfsOrdered: typeof classifications = [];
  const dfsVisit = (nodeId: string) => {
    const classification = classificationMap.get(nodeId);
    if (classification) {
      dfsOrdered.push(classification);
    }
    const node = nodeMap.get(nodeId);
    if (node) {
      for (const childId of node.childrenIds) {
        dfsVisit(childId);
      }
    }
  };
  for (const rootNode of flattenedNodes.filter((n) => n.parentId === null)) {
    dfsVisit(rootNode.node.id);
  }

  const converter = new NodeConverter(workflowId);
  const results: NodeConvertOutput[] = [];
  for (const classification of dfsOrdered) {
    results.push(await converter.convert(classification));
  }

  workflowStateRegistry.cleanup(workflowId);
  return results;
}
