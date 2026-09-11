import {
  applyScreenInfoEdit,
  previewScreenInfoEdit,
  validateScreenInfoContent
} from "@/mastra/services/bi-data-sync/screen-file-edit";

import { SuspendType } from "../../../types/suspend";
import { isScreenInfoFilePath } from "../file-kind";
import {
  askOrPush,
  type EditContext,
  invalidateReadState,
  notWritten,
  type PreparedEdit,
  type SyncHandler
} from "./contract";

/** 大屏配置：某块大屏根目录下的 info.json。 */
export const screenInfoHandler: SyncHandler = {
  matches: isScreenInfoFilePath,

  prepare: async (ctx: EditContext): Promise<PreparedEdit> => {
    // 落盘前先过 schema：读的时候 ScreenReader 是会因为校验不过直接抛的，写的时候不挡就会写出
    // 一份自己再也读不回来的 info.json，整块大屏随后全瘫。校验不过 = 这次编辑没发生。
    const validation = validateScreenInfoContent(ctx.result.content);
    if (!validation.ok) {
      return {
        ok: false,
        message: validation.message,
        frontendSynced: false,
        validationErrors: validation.validationErrors
      };
    }

    const applied = await previewScreenInfoEdit(ctx.absPath, ctx.result.content);
    if (!applied) {
      return notWritten(ctx, "无法定位所属大屏");
    }

    const { detail, id: screenId } = applied;
    return {
      ok: true,
      kind: "screenInfo",
      commit: async () => {
        const committed = await applyScreenInfoEdit(ctx.absPath, ctx.result.content);
        if (!committed) {
          throw new Error("已无法定位屏幕配置所属大屏");
        }
        invalidateReadState(ctx.absPath);
      },
      payload: askOrPush(
        ctx,
        {
          approvalType: SuspendType.AskApprovalUpdateScreenInfo,
          autoType: SuspendType.UpdateScreenInfo,
          purpose: "推送屏幕配置到前端"
        },
        { screenId, detail, minioIds: detail.minioIds ?? [], replacements: ctx.result.replacements }
      )
    };
  }
};
