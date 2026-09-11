/**
 * B6 · 多条件「同时满足」——`conditionType` 是个真陷阱
 *
 * `checkConditionSatisfied`（`packages/core/src/selectors/conditionChecking.ts:103`）只认一个值：
 *
 * ```ts
 * if (conditionType === "all") return conditions.every(...);
 * return conditions.some(...);          // ← 其余一切都走这里，即「或」
 * ```
 *
 * 而 `ConditionLogicTypeEnum` 里明明白白有一个 `And = "and"`（`types/action.ts:705`）。
 * **写 `"and"` 得到的是「或」**——名字叫 And、行为是 Or，且不报错、不校验、不提示。
 * 一个把"同时满足"翻译成 `conditionType: "and"` 的 agent，配出来的事件会在只满足其中一条时
 * 就触发，症状是「偶尔莫名其妙就隐藏了」，极难归因。
 *
 * 好消息是 `templateEvents` 的默认值就是 `All`，所以**只要 agent 不自作主张去改它就是对的**。
 * 这条 case 测的正是这个：面对"同时满足"这种字眼，它会不会多此一举地把 conditionType 改成 "and"。
 *
 * `createEventTemplate` 的入参里没有 conditionType，要改只能事后 `edit_files`——
 * 所以一旦断言红了，录制里必然能看到那次多余的 edit_files。
 */

import { extractComponentId } from "@screenwright/core";
import { ActionTypeEnum, ConditionLogicTypeEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent } from "../../harness/case";

const SOURCE_ID = 4182; // 选项卡
const TARGET_ID = 4183; // 条形图

const VISIBILITY_ACTIONS: string[] = [ActionTypeEnum.Show, ActionTypeEnum.Hide, ActionTypeEnum.ShowHide];

export const b6EventConditionAll: EvalCase = {
  id: "b6-event-condition-all",
  title: "多条件「同时满足」（conditionType 陷阱）",
  fixture: "event",

  prompt:
    "给「选项卡」配一个点击事件：**同时满足**「标签是 Tab B」和「值等于 2」这两个条件时，才把「条形图」隐藏。" +
    "两个条件缺一不可，只满足其中一个不能触发。",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const source = findComponent(ctx.screen, SOURCE_ID);
    const events = source?.events ?? [];
    const clickEvents = events.filter((e) => e.trigger === "click");
    // 带条件的那个事件才是本 case 的主角；agent 可能顺手建了别的事件
    const withConds = clickEvents.filter((e) => (e.conditions ?? []).length > 0);
    const primary = withConds[0];
    const conditions = primary?.conditions ?? [];
    const actions = primary?.actions ?? [];
    const targeting = actions.filter((a) => (a.component ?? []).some((ref) => extractComponentId(ref) === TARGET_ID));

    const conditionType = (primary as { conditionType?: string } | undefined)?.conditionType;
    const isTrapValue = conditionType === ConditionLogicTypeEnum.And; // "and" —— 名字是与，行为是或

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "选项卡上配出了带条件的 click 事件",
        passed: withConds.length > 0,
        detail: source
          ? `events = ${events.map((e) => `${e.trigger}/${e.name}/${(e.conditions ?? []).length}个条件`).join(", ") || "空"}`
          : "选项卡不在树上"
      },
      {
        name: "配了两个条件",
        passed: conditions.length === 2,
        detail: `实际 ${conditions.length} 个：${conditions.map((c) => `${c.field} ${c.compare} ${c.expected}`).join("；") || "无"}`
      },
      {
        // 本 case 的核心
        name: 'conditionType 必须是 "all"（唯一的「与」）',
        passed: conditionType === ConditionLogicTypeEnum.All,
        detail: isTrapValue
          ? `实际是 "and" —— 这是陷阱值：conditionChecking.ts:103 只把 "all" 当「与」，` +
            `"and" 落进 else 分支变成「或」，于是只满足一个条件就会触发`
          : `实际 ${conditionType ?? "(缺失)"}，期望 "all"。除 "all" 外的一切值都会被当成「或」`
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
