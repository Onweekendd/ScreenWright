import fsp from "node:fs/promises";
import path from "node:path";

import {
  applyDataFilterEdit,
  type DataFilterEditInput,
  previewDataFilterEdit,
  validateDataFilterContent
} from "@/mastra/services/bi-data-sync/screen-file-edit";

import { SuspendType } from "../../../types/suspend";
import { isDataFilterFilePath } from "../file-kind";
import {
  askOrPush,
  type EditContext,
  invalidateReadState,
  notWritten,
  type PreparedEdit,
  type SyncHandler
} from "./contract";

/**
 * 数据过滤器：dataFilterArr/ 下成对的 {name}.json（元信息）与 {name}.js（dataFormatter 函数体）。
 *
 * 改哪一个都要把两个合起来看：进树、随后整屏落盘的是**合并后的那一份**，
 * 单独校验被改的那个文件没有意义。
 */
export const dataFilterHandler: SyncHandler = {
  matches: isDataFilterFilePath,

  prepare: async (ctx: EditContext): Promise<PreparedEdit> => {
    const dir = path.dirname(ctx.absPath);
    const editedIsJson = ctx.absPath.replace(/\\/g, "/").endsWith(".json");
    const baseName = path.basename(ctx.absPath, editedIsJson ? ".json" : ".js");
    const jsonPath = path.join(dir, `${baseName}.json`);
    const jsPath = path.join(dir, `${baseName}.js`);

    // 被编辑的那一个取内存里的新内容（此时还没落盘），配套的那个才读盘。
    const [jsonRaw, jsContent] = await Promise.all([
      editedIsJson ? Promise.resolve(ctx.result.content) : fsp.readFile(jsonPath, "utf-8"),
      editedIsJson ? fsp.readFile(jsPath, "utf-8").catch(() => "") : Promise.resolve(ctx.result.content)
    ]);

    let jsonContent: Record<string, unknown>;
    let originalJsonContent: Record<string, unknown>;
    try {
      jsonContent = JSON.parse(jsonRaw) as Record<string, unknown>;
      // 改名要拿编辑**之前**的名字：readRecord.content 是这次编辑开始时刚读到的原文。
      // 编辑的是伴生 .js 时名字不可能变，直接复用盘上那份。
      originalJsonContent = editedIsJson
        ? (JSON.parse(ctx.readRecord.content) as Record<string, unknown>)
        : jsonContent;
    } catch (error) {
      return notWritten(ctx, `过滤器 JSON 解析失败 (${(error as Error).message})`);
    }

    // 与 info.json 同理：读的时候 readDataFilters 会因为校验不过整屏抛错，写的时候不挡就是埋雷。
    const validation = validateDataFilterContent({ ...jsonContent, dataFormatter: jsContent });
    if (!validation.ok) {
      return {
        ok: false,
        message: validation.message,
        frontendSynced: false,
        validationErrors: validation.validationErrors
      };
    }

    const filterName = validation.data.name;
    const originalName = (originalJsonContent.name as string | undefined) ?? filterName;
    const editInput: DataFilterEditInput = { originalName, filter: validation.data };

    const applied = await previewDataFilterEdit(ctx.absPath, editInput);
    if (!applied) {
      return notWritten(ctx, "无法定位所属大屏");
    }

    return {
      ok: true,
      kind: "filter",
      commit: async () => {
        const committed = await applyDataFilterEdit(ctx.absPath, editInput);
        if (!committed) {
          throw new Error("已无法定位数据过滤器所属大屏");
        }
        // 落盘的是整屏，成对的两个文件都被换过
        invalidateReadState(jsonPath, jsPath);
      },
      payload: askOrPush(
        ctx,
        {
          approvalType: SuspendType.AskApprovalSaveFilter,
          autoType: SuspendType.SaveFilter,
          purpose: "保存数据过滤器"
        },
        {
          filterName,
          // originalName 必须随协议下发：后端这条路是支持改名的（旧 key 删掉、旧文件被 pruneStaleFiles
          // 清理），而前端的 handleSaveFilter 只按 name 做 upsert。不告诉它旧名字，画布上就会新旧两个
          // 过滤器并存，下一次整屏同步过来又把旧的写回工作区——这次改名等于白改。
          originalName,
          filter: applied,
          replacements: ctx.result.replacements
        }
      )
    };
  }
};
