import { editScreenInfoInTree, validateScreenInfoContent } from "@/mastra/services/bi-data-sync/screen-file-edit";

import { isScreenInfoFilePath } from "../file-kind";
import {
  CONFLICT,
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

    // 编辑后的 info.json 已经过校验，拿它建树而不是去读磁盘上的旧版：旧版要是本身就不合 schema
    // （历史脏数据），照常读会在动手之前就抛错，这次修复永远落不了地
    const screenInfo = validation.data;
    const tree = ctx.trees.open(ctx.absPath, screenInfo);
    if (!tree) {
      return notWritten(ctx, "无法定位所属大屏");
    }
    if (!ctx.trees.claim(tree, "screenInfo")) {
      return CONFLICT;
    }
    const { detail, id: screenId } = editScreenInfoInTree(tree, screenInfo);

    return {
      ok: true,
      kind: "screenInfo",
      commit: async (trees) => {
        const commitTree = trees.open(ctx.absPath, screenInfo);
        if (!commitTree) {
          throw new Error("已无法定位屏幕配置所属大屏");
        }
        editScreenInfoInTree(commitTree, screenInfo);
        trees.markDirty(commitTree);
        invalidateReadState(ctx.absPath);
      },
      op: {
        op: "update_screen_info",
        screenId,
        detail,
        minioIds: detail.minioIds ?? []
      },
      purpose: "推送屏幕配置到前端"
    };
  }
};
