import type { ConvertedComponent } from "@/mastra/state/componentConversionState";
import type { BfsTraversalStepNode } from "@/mastra/types/bfs-traversal-types";

export interface ConvertResult {
  component: ConvertedComponent | null;
  message: string;
}

export interface ConvertParams {
  fileKey: string;
  node: BfsTraversalStepNode;
  workflowId: string;
}

export interface ConvertStrategy {
  convert(params: ConvertParams): Promise<ConvertResult>;
}
