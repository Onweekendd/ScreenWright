/**
 * B1 · 配置事件（选项卡控制条形图显隐）
 *
 * A 类查的是「一个工具把事情干对了」，B 类查的是「干完之后派生索引跟着重算了」。事件配好之后
 * 有两份产物：组件自己的 events 数组，和 _event_flows/{sourceId}.json 这份链路索引。后者是
 * agent 下次读事件链路时唯一的入口，它没跟着重算，就等于这条链路对 agent 不存在——而组件文件
 * 里明明是有的，于是表现成「昨天配好的事件今天 agent 看不见」。
 *
 * 所以这里两边都要断言，且索引那一份必须读盘。用 buildEventFlowGraph 现算一遍是没有意义的：
 * 那算的是内存里的树，正好绕开了「有没有写出去」这个问题本身。
 *
 * 动作类型只认显隐那一族（show / hide / show/hide）——具体挑哪个由 agent 决定，
 * 「点一下就隐藏」和「点一下切换显隐」都算达成。
 */

import { extractComponentId } from "@screenwright/core";
import { ActionTypeEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent, readScreenJson } from "../../harness/case";

const SOURCE_ID = 4182; // 选项卡
const TARGET_ID = 4183; // 条形图

const VISIBILITY_ACTIONS: string[] = [ActionTypeEnum.Show, ActionTypeEnum.Hide, ActionTypeEnum.ShowHide];

/** _event_flows/{sourceId}.json 的形状（flow-graphs.ts 的 EventFlowEntry） */
interface EventFlowFile {
  sourceId: string;
  trigger: string;
  targets: Array<{ id: string; name: string; actionType: string }>;
}

export const b1EventVisibility: EvalCase = {
  id: "b1-event-visibility",
  title: "配置事件（选项卡控制条形图显隐）",
  fixture: "event",

  prompt: "给这块大屏的「选项卡」配一个点击事件：点它的时候把「条形图」隐藏起来",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const source = findComponent(ctx.screen, SOURCE_ID);
    const events = source?.events ?? [];
    const actions = events.flatMap((e) => e.actions ?? []);
    const targeting = actions.filter((a) => (a.component ?? []).some((ref) => extractComponentId(ref) === TARGET_ID));

    const flows = readScreenJson<EventFlowFile[]>(ctx.workspace.screenDir, `_event_flows/${SOURCE_ID}.json`);
    const flowTargets = (flows ?? []).flatMap((f) => f.targets ?? []);

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "选项卡上配出了事件",
        passed: events.length > 0,
        detail: source ? `events = ${events.map((e) => `${e.trigger}/${e.name}`).join(", ") || "空"}` : "选项卡不在树上"
      },
      {
        name: "有动作指向条形图",
        passed: targeting.length > 0,
        detail:
          targeting.length > 0
            ? `${targeting.length} 个动作指向 #${TARGET_ID}`
            : `全部动作的目标：${actions.flatMap((a) => a.component ?? []).join(", ") || "无"}`
      },
      {
        name: "动作类型是显隐那一族",
        passed: targeting.length > 0 && targeting.some((a) => VISIBILITY_ACTIONS.includes(a.action)),
        detail: `实际 ${targeting.map((a) => a.action || "(空)").join(", ") || "无"}，期望其中之一：${VISIBILITY_ACTIONS.join(" / ")}`
      },
      // 派生索引这一半。组件文件对了但索引没重算，agent 下次就读不到这条链路。
      {
        name: `_event_flows/${SOURCE_ID}.json 跟着生成了`,
        passed: Array.isArray(flows) && flows.length > 0,
        detail: flows === undefined ? "文件不存在" : `${flows.length} 条链路`
      },
      {
        name: "索引里记着条形图这个目标",
        passed: flowTargets.some((t) => Number(t.id) === TARGET_ID),
        detail: `索引里的目标：${flowTargets.map((t) => `${t.id}/${t.actionType}`).join(", ") || "无"}`
      }
    ];
  }
};
