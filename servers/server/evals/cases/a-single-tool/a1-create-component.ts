/**
 * A1 · 创建组件（根级）
 *
 * 最简单的正向路径：空屏 → 一句话 → 画布上多出一个词云。跟 C1（同一条 prompt，假前端
 * 回拒绝，断言工作区一个字节没动）成对，一正一反把「延迟落盘」这套机制钉住。
 *
 * 断言只看终态。达成「左边放个词云」可以直接 create_component，也可以先 search_component
 * 再建，还可能建完又 edit_files 调位置——都算对。所以这里不断言用了哪个工具、几轮完成，
 * 那些是 L2 指标（只看趋势，不设阈值）。
 */

import { TextEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, hasProp, newComponents, withinCanvas } from "../../harness/case";

export const a1CreateComponent: EvalCase = {
  id: "a1-create-component",
  title: "创建组件（根级）",
  fixture: "empty-screen",

  // 不说位置尺寸，让 agent 自己定——位置合不合理由「在画布内」兜底，
  // 说死了就变成在测它会不会复述参数。
  prompt: "在这块大屏上放一个词云组件",

  // 走自动模式：ASK 模式多一次审批往返，那是 A6 要测的东西，不该混进最短路径。
  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const wordClouds = hasProp(created, TextEnum.SwTextWordCloud);

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "画布上多了组件",
        passed: created.length > 0,
        detail: `新增 ${created.length} 个：${created.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "无"}`
      },
      {
        name: "其中有词云",
        passed: wordClouds.length > 0,
        detail:
          wordClouds.length > 0
            ? `id=${wordClouds.map((c) => c.id).join(",")}`
            : `新增组件的类型是 ${created.map((c) => c.component.prop).join(", ") || "（无）"}，期望含 ${TextEnum.SwTextWordCloud}`
      },
      // 位置不较真「是不是在左边」——那是审美判断，agent 每次给的值都不一样。
      // 真正会坏事的是把组件放到画布外面，那是能精确判定的。
      ...wordClouds.map(
        (c): Assertion => ({
          name: `词云 ${c.id} 落在画布内`,
          passed: withinCanvas(c, ctx.screen),
          detail: `left=${c.left} top=${c.top} ${c.component.width}×${c.component.height}，画布 ${ctx.screen.detail.width}×${ctx.screen.detail.height}`
        })
      )
    ];
  }
};
