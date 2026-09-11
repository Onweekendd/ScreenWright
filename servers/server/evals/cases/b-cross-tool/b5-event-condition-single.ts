/**
 * B5 · 带条件的事件（单条件）
 *
 * B1 测的是「事件配出来了」，本 case 往前一步：**条件的字段名得取自源组件真实抛得出的东西**。
 *
 * 选项卡点击抛的是被点中的那一项（`useSubtabs.ts:104` 抛 `info`），也就是 data 里的
 * `{ label, value }`。条件的 `field` 只能在这两个里挑——填 `name` 之类不存在的字段时，
 * `checkCondition` 取不到值，条件恒不满足，事件**看着配好了但永远不触发**，而且不报错。
 * 这与 cbArgs 的 `origin.value` 填错是同一类静默失效，只是发生在条件侧。
 *
 * 判据刻意留了余地：`label == "Tab B"` 和 `value == 2` 都算对——用户说的是「选中 Tab B」，
 * 这两种表达都能正确命中那一项。断言只拒绝「字段根本不存在」和「期望值对不上 Tab B」。
 */

import { extractComponentId } from "@screenwright/core";
import { ActionTypeEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent, readScreenJson } from "../../harness/case";

const SOURCE_ID = 4182; // 选项卡，data 为 [{label:"Tab A",value:1},{label:"Tab B",value:2},{label:"Tab C",value:3}]
const TARGET_ID = 4183; // 条形图

/** 选项卡点击抛出对象上真实存在的键 */
const THROWN_FIELDS = ["label", "value"];
/** 「Tab B」这一项的两种合法表达 */
const TAB_B_VALUES = ["Tab B", "tab b", "2"];

const VISIBILITY_ACTIONS: string[] = [ActionTypeEnum.Show, ActionTypeEnum.Hide, ActionTypeEnum.ShowHide];

interface EventFlowFile {
  sourceId: string;
  trigger: string;
  targets: Array<{ id: string; name: string; actionType: string }>;
}

export const b5EventConditionSingle: EvalCase = {
  id: "b5-event-condition-single",
  title: "带条件的事件（单条件）",
  fixture: "event",

  prompt:
    "给这块大屏的「选项卡」配一个点击事件：只有当用户选中的是「Tab B」这一项时，才把「条形图」隐藏起来；" +
    "选中其它项时不要有任何反应。",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const source = findComponent(ctx.screen, SOURCE_ID);
    const events = source?.events ?? [];
    const clickEvents = events.filter((e) => e.trigger === "click");
    const conditions = clickEvents.flatMap((e) => e.conditions ?? []);
    const actions = clickEvents.flatMap((e) => e.actions ?? []);
    const targeting = actions.filter((a) => (a.component ?? []).some((ref) => extractComponentId(ref) === TARGET_ID));

    const flows = readScreenJson<EventFlowFile[]>(ctx.workspace.screenDir, `_event_flows/${SOURCE_ID}.json`);

    const describeCond = (c: (typeof conditions)[number]) =>
      `${c.field || "(空)"} ${c.compare || "(空)"} ${c.expected ?? "(空)"}`;
    const matchesTabB = (c: (typeof conditions)[number]) =>
      TAB_B_VALUES.some((v) => String(c.expected ?? "").toLowerCase() === v.toLowerCase());

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "选项卡上配出了 click 事件",
        passed: clickEvents.length > 0,
        detail: source ? `events = ${events.map((e) => `${e.trigger}/${e.name}`).join(", ") || "空"}` : "选项卡不在树上"
      },
      {
        name: "事件带了条件（不是无条件触发）",
        passed: conditions.length > 0,
        detail:
          conditions.length > 0 ? conditions.map(describeCond).join("；") : "conditions 为空，等于点哪一项都会隐藏"
      },
      {
        name: "条件的 field 是选项卡真抛得出的字段",
        passed: conditions.length > 0 && conditions.every((c) => THROWN_FIELDS.includes(c.field)),
        detail:
          `实际 field：${conditions.map((c) => c.field || "(空)").join(", ") || "无"}；` +
          `选项卡 click 抛的是被点中的那一项，只有 ${THROWN_FIELDS.join(" / ")} 两个键。` +
          `填别的会让条件恒不满足且不报错`
      },
      {
        name: "期望值指向 Tab B",
        passed: conditions.some(matchesTabB),
        detail: `实际 expected：${conditions.map((c) => String(c.expected ?? "(空)")).join(", ") || "无"}；可接受 ${TAB_B_VALUES.join(" / ")}`
      },
      {
        name: "动作指向条形图且是显隐那一族",
        passed: targeting.length > 0 && targeting.some((a) => VISIBILITY_ACTIONS.includes(a.action)),
        detail:
          targeting.length > 0
            ? `动作类型 ${targeting.map((a) => a.action || "(空)").join(", ")}`
            : `没有动作指向 #${TARGET_ID}，全部目标：${actions.flatMap((a) => a.component ?? []).join(", ") || "无"}`
      },
      {
        name: `_event_flows/${SOURCE_ID}.json 跟着生成了`,
        passed: Array.isArray(flows) && flows.length > 0,
        detail: flows === undefined ? "文件不存在" : `${flows.length} 条链路`
      }
    ];
  }
};
