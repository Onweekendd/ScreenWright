import fsp from "node:fs/promises";

import type { ComponentType } from "@screenwright/types";

import { applyComponentEdit, previewComponentEdit } from "@/mastra/services/bi-data-sync/component-edit";

import { parseSFCToParts } from "../../../services/bi-data-sync/vue-part-sfc";
import { isVuePartFilePath } from "../file-kind";
import { validateComponentContent } from "../utils";
import { pushComponentUpdate } from "./component";
import { type EditContext, invalidateReadState, notWritten, type PreparedEdit, type SyncHandler } from "./contract";

/**
 * vue-part 组件的伴生 SFC：component/ 下的 .vue。
 *
 * 改的是 .vue，进树的却是它的伴生 json——两个文件描述同一个组件，所以这里要先把 SFC 拆回
 * option.{template,js,css}、合进 json，再按组件那条路走。
 */
export const vuePartHandler: SyncHandler = {
  matches: isVuePartFilePath,

  prepare: async (ctx: EditContext): Promise<PreparedEdit> => {
    const jsonPath = ctx.absPath.replace(/\.vue$/, ".json");
    let component: ComponentType;
    try {
      component = JSON.parse(await fsp.readFile(jsonPath, "utf-8")) as ComponentType;
    } catch (error) {
      // 伴生 json 缺失或损坏：.vue 单独落盘没有意义（json 里的 option 还指向旧模板），整条编辑作废
      return notWritten(ctx, `读取伴生组件 json 失败 (${(error as Error).message})`);
    }

    const { template, js, css } = parseSFCToParts(ctx.result.content);
    const mergedComponent: ComponentType = {
      ...component,
      option: {
        ...(typeof component.option === "object" && component.option !== null ? component.option : {}),
        template,
        js,
        css
      }
    };

    const validation = validateComponentContent(JSON.stringify(mergedComponent));
    if (!validation.ok) {
      return { ok: false, message: validation.message, validationErrors: validation.validationErrors };
    }

    const editedId = mergedComponent.id;
    // 喂对象而不是 JSON 文本：文本会让 core 按磁盘形态重新读一遍伴生 .vue，
    // 把刚编辑出来的 option 又用盘上那份旧源码盖回去。
    const applied = await previewComponentEdit(jsonPath, mergedComponent);
    if (!applied) {
      return notWritten(ctx, `组件 ${editedId} 不在大屏树上`);
    }

    return {
      ok: true,
      kind: "component",
      notice: applied.notice,
      commit: async () => {
        const committed = await applyComponentEdit(jsonPath, mergedComponent);
        if (!committed) {
          throw new Error(`组件 ${editedId} 已不在大屏树上`);
        }
        // .vue 与伴生 json 都被整屏回写换过，两份快照一起作废
        invalidateReadState(ctx.absPath, jsonPath);
        return { notice: committed.notice };
      },
      payload: pushComponentUpdate(ctx, "推送 vue-part 组件更新到前端", applied.component)
    };
  }
};
