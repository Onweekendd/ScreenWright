import { StateKeyEnum } from "../types";
import { FlattenedNodesState } from "./flattenedNodesState";
import { StateManager } from "./stateManager";
import { TodoState } from "./todoState";

const stateManager = new StateManager();
const flattenedNodesState = new FlattenedNodesState();
const todoState = new TodoState();

stateManager.setStore(StateKeyEnum.FLATTENED_NODES, flattenedNodesState);

stateManager.setStore(StateKeyEnum.TODO, todoState);

export { FlattenedNodesState } from "./flattenedNodesState";
export { stateManager };
export { TodoState } from "./todoState";
