import { prismaClient } from "@/mastra/storage/prisma";

import type { ModelRole } from "../../provider/model-registry";
import type { ThreadModelRole, ThreadModelSelection } from "../../types/thread-model";
import { AiModelNotFoundError } from "./ai-model.server";

/**
 * 对话级模型选择（`thread_model` 表）。只记「这个对话的这个角色不用默认」，没有行 = 用默认。
 * embedding 不在其中：它与向量索引维度绑定，只能全局切换。
 */

// satisfies：类型定义在 types/ 不依赖 provider，这里编译期确认它们仍是 ModelRole 的子集
export const THREAD_MODEL_ROLES: readonly ThreadModelRole[] = ["reasoning", "image", "video"] satisfies ModelRole[];

export const isThreadModelRole = (v: string): v is ThreadModelRole =>
  (THREAD_MODEL_ROLES as readonly string[]).includes(v);

export class ThreadModelRoleMismatchError extends Error {
  constructor(role: ThreadModelRole, actual: string) {
    super(`配置角色不符：要求 ${role}，实际是 ${actual}`);
  }
}

export async function getThreadModels(threadId: string): Promise<ThreadModelSelection> {
  const rows = await prismaClient.threadModel.findMany({ where: { threadId } });
  const selection: ThreadModelSelection = {};
  for (const row of rows) {
    if (isThreadModelRole(row.role)) {
      selection[row.role] = row.aiModelId;
    }
  }
  return selection;
}

/** 选定某角色的配置；`aiModelId` 为 null 表示改回默认（删行） */
export async function setThreadModel(
  threadId: string,
  role: ThreadModelRole,
  aiModelId: string | null
): Promise<ThreadModelSelection> {
  if (aiModelId === null) {
    await prismaClient.threadModel.deleteMany({ where: { threadId, role } });
    return getThreadModels(threadId);
  }
  const model = await prismaClient.aiModel.findUnique({ where: { id: aiModelId } });
  if (!model) {
    throw new AiModelNotFoundError(aiModelId);
  }
  if (model.role !== role) {
    throw new ThreadModelRoleMismatchError(role, model.role);
  }
  await prismaClient.threadModel.upsert({
    where: { threadId_role: { threadId, role } },
    create: { threadId, role, aiModelId },
    update: { aiModelId }
  });
  return getThreadModels(threadId);
}

/** 新建对话时一次写入前端预选的模型（对话创建前用户就可能在输入框里选好了） */
export async function initThreadModels(threadId: string, selection: ThreadModelSelection): Promise<void> {
  for (const role of THREAD_MODEL_ROLES) {
    const aiModelId = selection[role];
    if (aiModelId) {
      await setThreadModel(threadId, role, aiModelId);
    }
  }
}
