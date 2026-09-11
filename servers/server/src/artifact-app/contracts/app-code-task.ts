import type z from "zod";

import { type Task, TaskSchema } from "@/task-management";

import { ArtifactAppTaskMetadataSchema } from "./artifact-app-task-metadata";

/**
 * A generic task whose metadata has been validated for Artifact App.
 * Task.description is the coding instruction given to the Pi agent.
 */
export const AppCodeTaskSchema = TaskSchema.extend({
  metadata: ArtifactAppTaskMetadataSchema
});

export type AppCodeTask = z.infer<typeof AppCodeTaskSchema>;

/** 尝试把通用任务解析为 Artifact App 编码任务；schema 不匹配时返回 undefined。 */
export function parseAppCodeTask(task: Task): AppCodeTask | undefined {
  const result = AppCodeTaskSchema.safeParse(task);
  return result.success ? result.data : undefined;
}

/** 读取任务 metadata 中的任务类型标识。 */
export function getTaskKind(task: Task): unknown {
  return task.metadata?.task_kind;
}

/** 读取任务 metadata 中的 appId；缺失或不是字符串时返回 undefined。 */
export function getTaskAppId(task: Task | undefined): string | undefined {
  const appId = task?.metadata?.appId;
  return typeof appId === "string" ? appId : undefined;
}
