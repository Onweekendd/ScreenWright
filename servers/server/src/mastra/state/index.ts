import { StateKeyEnum } from "../types";
import { ComponentConversionState } from "./componentConversionState";
import { FlattenedNodesState } from "./flattenedNodesState";
import { ImageCandidatesState } from "./imageCandidatesState";
import { NodeClassificationState } from "./nodeClassificationState";
import { StateManager } from "./stateManager";
import { SubtabsRecognitionState } from "./subtabsRecognitionState";
import { TodoState } from "./todoState";
import { TokenUsageState } from "./tokenUsageState";

const stateManager = new StateManager();
const nodeClassificationState = new NodeClassificationState();
const componentConversionState = new ComponentConversionState();
const tokenUsageState = new TokenUsageState();
const imageCandidatesState = new ImageCandidatesState();
const flattenedNodesState = new FlattenedNodesState();
const subtabsRecognitionState = new SubtabsRecognitionState();
const todoState = new TodoState();

stateManager.setStore(StateKeyEnum.NODE_CLASSIFICATIONS, nodeClassificationState);
stateManager.setStore(StateKeyEnum.COMPONENT_CONVERSIONS, componentConversionState);
stateManager.setStore(StateKeyEnum.TOKEN_USAGES, tokenUsageState);
stateManager.setStore(StateKeyEnum.IMAGE_CANDIDATES, imageCandidatesState);
stateManager.setStore(StateKeyEnum.FLATTENED_NODES, flattenedNodesState);
stateManager.setStore(StateKeyEnum.SUBTABS_RECOGNITION, subtabsRecognitionState);

stateManager.setStore(StateKeyEnum.TODO, todoState);

export { FlattenedNodesState } from "./flattenedNodesState";
export type { ImageCandidate, SerializedImageCandidatesState } from "./imageCandidatesState";
export { ImageCandidatesState } from "./imageCandidatesState";
export { stateManager };
export { TodoState } from "./todoState";
export type { WorkflowStateBundle } from "./workflowStateRegistry";
export { workflowStateRegistry } from "./workflowStateRegistry";
