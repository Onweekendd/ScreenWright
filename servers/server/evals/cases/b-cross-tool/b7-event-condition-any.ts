/**
 * B7 · 多条件「任一满足」——工具做不到，必须事后改
 *
 * B6 的镜像。那边默认值恰好是对的，agent 什么都不做就能过；这边**默认值恰好是错的**：
 * `templateEvents` 把 `conditionType` 定死成 `All`（`templates/index.ts:517`），而
 * `createEventTemplate` 的入参里根本没有 conditionType（`create-event-template.ts:77-92`）。
 * 所以想要「或」，只有一条路：建完事件再 `edit_files` 改那个字段。
 *
 * 这条 case 因此同时测两件事：
 *   1. agent 知不知道「或」要靠改 conditionType，而不是配两个事件绕过去
 *   2. 它发现工具入参不支持时，会不会自己补一次 edit_files——而不是默认工具返回值就是最终形态
 *
 * prompt 明确要求「只配一个事件」，堵死「建两个事件各带一个条件」这条等效但绕开考点的路。
 * 那条路功能上也能work，但它回避了「一个事件多个条件怎么组合」这个真实存在的能力缺口。
 *
 * 判据用「行为」而不是「字面量」：`conditionType !== "all"` 即为「或」。写 `"one"` 是最规范的
 * 表达；写 `"and"` 行为上也是「或」所以放行，但 detail 里会点名——那是个名实不符的值，
 * 在这里"蒙对"了，换个场景（B6）就是错的。
 */

import { extractComponentId } from "@screenwright/core";
import { ActionTypeEnum, ConditionLogicTypeEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent } from "../../harness/case";

const SOURCE_ID = 4182; // 选项卡：Tab A(1) / Tab B(2) / Tab C(3)
const TARGET_ID = 4183; // 条形图

const VISIBILITY_ACTIONS: string[] = [ActionTypeEnum.Show, ActionTypeEnum.Hide, ActionTypeEnum.ShowHide];

export const b7EventConditionAny: EvalCase = {
  id: "b7-event-condition-any",
  title: "多条件「任一满足」（默认值是错的）",
  fixture: "event",

  prompt:
    "给「选项卡」配点击事件：选中「Tab A」**或者**「Tab C」时都把「条形图」隐藏，选中 Tab B 时不隐藏。" +
    "请只配一个事件，用两个条件表达这个「或」的关系，不要建两个事件。",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const source = findComponent(ctx.screen, SOURCE_ID);
    const events = source?.events ?? [];
    const clickEvents = events.filter((e) => e.trigger === "click");
    const withConds = clickEvents.filter((e) => (e.conditions ?? []).length > 0);
    const primary = withConds[0];
    const conditions = primary?.conditions ?? [];
    const actions = primary?.actions ?? [];
    const targeting = actions.filter((a) => (a.component ?? []).some((ref) => extractComponentId(ref) === TARGET_ID));

    const conditionType = (primary as { conditionType?: string } | undefined)?.conditionType;
    const isOrBehavior = conditionType !== undefined && conditionType !== ConditionLogicTypeEnum.All;

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "只配了一个带条件的 click 事件",
        passed: withConds.length === 1,
        detail:
          withConds.length === 1
            ? undefined
            : `实际 ${withConds.length} 个带条件的 click 事件——` +
              `建多个事件各带一条件虽然也能work，但绕开了「一个事件里多条件怎么组合」这个考点`
      },
      {
        name: "一个事件里配了两个条件",
        passed: conditions.length === 2,
        detail: `实际 ${conditions.length} 个：${conditions.map((c) => `${c.field} ${c.compare} ${c.expected}`).join("；") || "无"}`
      },
      {
        // 本 case 的核心：默认值 "all" 在这里是错的，必须被改掉
        name: 'conditionType 不能是 "all"（那是「与」，Tab A 和 Tab C 不可能同时成立）',
        passed: isOrBehavior,
        detail:
          conditionType === ConditionLogicTypeEnum.All
            ? `实际是 "all" —— 这是 templateEvents 的默认值，agent 没改它。` +
              `两个条件用「与」连接时永远不可能同时满足，事件一次都不会触发`
            : conditionType === ConditionLogicTypeEnum.And
              ? `实际是 "and" —— 行为上确实是「或」（conditionChecking.ts:103 只认 "all"），` +
                `所以这里蒙对了；但这个值名实不符，规范写法是 "one"`
              : `实际 ${conditionType ?? "(缺失)"}`
      },
      {
        name: "动作指向条形图且是显隐那一族",
        passed: targeting.length > 0 && targeting.some((a) => VISIBILITY_ACTIONS.includes(a.action)),
        detail:
          targeting.length > 0
            ? `动作类型 ${targeting.map((a) => a.action || "(空)").join(", ")}`
            : `没有动作指向 #${TARGET_ID}`
      }
    ];
  }
};
