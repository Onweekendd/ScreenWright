import type { ComponentType } from "@screenwright/types";

import { applyComponentEdit, previewComponentEdit } from "@/mastra/services/bi-data-sync/component-edit";

import { SuspendType } from "../../../types/suspend";
import { isComponentFilePath } from "../file-kind";
import { formatValidationWarnings, validateComponentContent } from "../utils";
import {
  askOrPush,
  type EditContext,
  type EditFilesSuspendPayload,
  invalidateReadState,
  notWritten,
  type PreparedEdit,
  type SyncHandler
} from "./contract";

/**
 * 组件更新的挂起载荷。component json 与 vue-part 两条路都推这一种，只有 purpose 不同——
 * 前端收到的是同一个组件对象，不该因为 agent 改的是 .json 还是 .vue 而走两套协议。
 */
export const pushComponentUpdate = (
  ctx: EditContext,
  purpose: string,
  component: ComponentType
): EditFilesSuspendPayload =>
  askOrPush(
    ctx,
    {
      approvalType: SuspendType.AskApprovalPushComponentUpdate,
      autoType: SuspendType.PushComponentUpdate,
      purpose
    },
    { component, replacements: ctx.result.replacements }
  );

/**
 * 组件 json：component/ 下的 {id}_{name}.json。
 *
 * 推给前端的是 **core 树上那一份**，不是 agent 写进文本的那一份：core 会重算由树结构唯一决定的
 * 派生值（分组包围盒）。派生值本身不随协议下发——前端拿到组件后自己再跑一遍同一个 reflowGroup
 * （core 写入 API 约定④，传过来的一律不采信）。
 */
export const componentHandler: SyncHandler = {
  matches: isComponentFilePath,

  prepare: async (ctx: EditContext): Promise<PreparedEdit> => {
    const validation = validateComponentContent(ctx.result.content);
    if (!validation.ok) {
      return { ok: false, message: validation.message, validationErrors: validation.validationErrors };
    }

    const editedId = (validation.data as ComponentType).id;
    let applied: Awaited<ReturnType<typeof previewComponentEdit>>;
    let failureReason: string | undefined;
    try {
      // 只算不写：编辑后的文本交给 core 合进内存中的整屏树，得到要推给前端的那一份
      applied = await previewComponentEdit(ctx.absPath, ctx.result.content);
    } catch (error) {
      applied = null;
      failureReason = (error as Error).message;
    }
    if (!applied) {
      // core 接不上（组件不在树上、或整屏读取失败）：这次编辑一个字节都没落盘
      return notWritten(ctx, failureReason ?? `组件 ${editedId} 不在大屏树上`);
    }

    return {
      ok: true,
      kind: "component",
      // 属性层的警告要说出来：放行不等于装作没事。不说的话 agent 永远不知道这个组件的
      // option/data 跟它的 prop schema 对不上，也就没机会顺手修好。
      notice: [applied.notice, formatValidationWarnings(validation.warnings).trim()].filter(Boolean).join(" "),
      // 落盘时重新过一遍 core（而不是复用刚才预览算好的那棵树）是刻意的：中间隔着一次前端往返，
      // 工作区可能已被别的操作改过，拿陈旧快照去覆盖会吞掉那些改动。
      commit: async () => {
        const committed = await applyComponentEdit(ctx.absPath, ctx.result.content);
        if (!committed) {
          throw new Error(`组件 ${editedId} 已不在大屏树上`);
        }
        invalidateReadState(ctx.absPath);
        return { notice: committed.notice };
      },
      payload: pushComponentUpdate(ctx, "推送组件更新到前端", applied.component)
    };
  }
};
