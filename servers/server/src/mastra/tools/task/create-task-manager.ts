import path from "path";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";
import { TaskManager } from "@/task-management";

function getTaskStorageRoot(): string {
  const workspaceRoot = getAgentWorkspacePath();
  return path.join(workspaceRoot, "tasks");
}

export function createTaskManager(taskListId: string): TaskManager {
  return new TaskManager({
    taskListId,
    storageRoot: getTaskStorageRoot()
  });
}
