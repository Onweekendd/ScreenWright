import { FolderEnum, InteractiveEnum, mediaEnum, PanelEnum, textEnum } from "@screenwright/types";

import type { ConvertedComponent } from "@/mastra/state/componentConversionState";
import type { BfsTraversalStepNode } from "@/mastra/types/bfs-traversal-types";

import type { NodeClassificationOutput } from "../steps/classification/rule-based-classification-step";
import { SwImgStrategy } from "../steps/node-convert/strategies/SwImgStrategy";
import { FtPanelStrategy } from "../steps/node-convert/strategies/FtPanelStrategy";
import { SwRichtextStrategy } from "../steps/node-convert/strategies/SwRichtextStrategy";
import { FtSubtabStrategy } from "../steps/node-convert/strategies/FtSubtabStrategy";
import { GroupStrategy } from "../steps/node-convert/strategies/GroupStrategy";
import { isSimpleImageNode, isTextNode } from "./node-type-guards";

export interface ConvertNodeParams {
  classification: NodeClassificationOutput;
  postOrderNode: BfsTraversalStepNode;
  workflowId: string;
}

export interface ConvertResult {
  component: ConvertedComponent | null;
  message: string;
}

export async function convertNodeByStrategy(params: ConvertNodeParams): Promise<ConvertResult> {
  const { classification, postOrderNode } = params;
  const { targetType, nodeId } = classification;
  const { node } = postOrderNode;

  try {
    switch (targetType) {
      case textEnum.SwRichtext: {
        if (!isTextNode({ node })) {
          console.warn(`⚠️ 节点 ${nodeId} 被分类为 SwRichtext，但不是文本节点`);
        }
        const strategy = new SwRichtextStrategy();
        return strategy.convert({ node: postOrderNode, fileKey: "", workflowId: params.workflowId });
      }

      case mediaEnum.SwImg: {
        const strategy = new SwImgStrategy();
        if (isSimpleImageNode({ node })) {
          return strategy.convert({ node: postOrderNode, fileKey: "", workflowId: params.workflowId });
        }
        return strategy.convert({ node: postOrderNode, fileKey: "", workflowId: params.workflowId });
      }

      case InteractiveEnum.Subtabs: {
        const strategy = new FtSubtabStrategy();
        const result = await strategy.convert({ node: postOrderNode, fileKey: "", workflowId: params.workflowId });
        return { component: result.component as ConvertedComponent, message: result.message };
      }

      case FolderEnum.group: {
        const strategy = new GroupStrategy();
        return strategy.convert({ node: postOrderNode, fileKey: "", workflowId: params.workflowId });
      }

      case PanelEnum.dynamicPanel: {
        const strategy = new FtPanelStrategy();
        return strategy.convert({ node: postOrderNode, fileKey: "", workflowId: params.workflowId });
      }

      case "merge": {
        return { component: null, message: `跳过 merge 类型节点` };
      }

      default:
        return { component: null, message: `未知的目标类型: ${targetType}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ 转换节点 ${nodeId} 失败:`, errorMessage);
    return { component: null, message: `转换失败: ${errorMessage}` };
  }
}
