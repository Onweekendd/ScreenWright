import { ComponentConversionState } from "./componentConversionState";
import { FlattenedNodesState } from "./flattenedNodesState";
import { ImageCandidatesState } from "./imageCandidatesState";
import { NodeClassificationState } from "./nodeClassificationState";
import { SubtabsRecognitionState } from "./subtabsRecognitionState";
import { TokenUsageState } from "./tokenUsageState";

export interface WorkflowStateBundle {
  nodeClassificationState: NodeClassificationState;
  componentConversionState: ComponentConversionState;
  tokenUsageState: TokenUsageState;
  imageCandidatesState: ImageCandidatesState;
  flattenedNodesState: FlattenedNodesState;
  subtabsRecognitionState: SubtabsRecognitionState;
}

class WorkflowStateRegistry {
  private registry = new Map<string, WorkflowStateBundle>();

  create(workflowId: string): WorkflowStateBundle {
    const bundle: WorkflowStateBundle = {
      nodeClassificationState: new NodeClassificationState(),
      componentConversionState: new ComponentConversionState(),
      tokenUsageState: new TokenUsageState(),
      imageCandidatesState: new ImageCandidatesState(),
      flattenedNodesState: new FlattenedNodesState(),
      subtabsRecognitionState: new SubtabsRecognitionState()
    };
    this.registry.set(workflowId, bundle);
    return bundle;
  }

  get(workflowId: string): WorkflowStateBundle {
    const bundle = this.registry.get(workflowId);
    if (!bundle) {
      throw new Error(`[WorkflowStateRegistry] No state bundle for workflowId: ${workflowId}`);
    }
    return bundle;
  }

  cleanup(workflowId: string): void {
    this.registry.delete(workflowId);
  }

  has(workflowId: string): boolean {
    return this.registry.has(workflowId);
  }
}

export const workflowStateRegistry = new WorkflowStateRegistry();
