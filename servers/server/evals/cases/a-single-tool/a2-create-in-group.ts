/**
 * A2 · 创建组件（进分组）
 *
 * A1 是往空屏根级建，这里是往**已有容器**里建。差别不在工具，在派生值：组件一旦进组，
 * 分组的包围盒就必须跟着重算。TODO 把 A2/A6 的「派生值重算」和 A9 的「反向解绑」列为
 * A 类里最易被改坏的三处，这是其中之一。
 *
 * 不断言新组件是什么类型：「文本组件」在物料里对应好几个 prop，agent 选哪个都算达成。
 * 真正会坏事的是它落到了根级、或者落进去了但分组盒子还是老的——那两条才是这里要钉的。
 */

import { FolderEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import {
  type Assertion,
  containerOf,
  describeContainer,
  describeGroupBox,
  type EvalCase,
  findComponent,
  groupBoxIsTight,
  newComponents
} from "../../harness/case";

/** fixture 里的分组与它的两个成员。种屏只改大屏 id，组件 id 原样保留。 */
const GROUP_ID = 4177;
const MEMBER_IDS = [4175, 4176];

export const a2CreateInGroup: EvalCase = {
  id: "a2-create-in-group",
  title: "创建组件（进分组）",
  fixture: "a-group",

  prompt: "往这块大屏已有的那个分组里，再放一个文本组件",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const group = findComponent(ctx.screen, GROUP_ID);
    const inGroup = created.filter((c) => containerOf(ctx.screen, c.id)?.kind === "group");

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
        name: "新组件落在分组里",
        passed: created.length > 0 && inGroup.length === created.length,
        detail:
          created.map((c) => `${c.id} → ${describeContainer(containerOf(ctx.screen, c.id))}`).join("；") || "无新增"
      },
      {
        name: "分组还是那个分组，原有成员没被挤掉",
        passed:
          group?.component.prop === FolderEnum.group &&
          MEMBER_IDS.every((id) => (group.children ?? []).some((c) => c.id === id)),
        detail: group
          ? `#${GROUP_ID} children = ${(group.children ?? []).map((c) => c.id).join(",") || "空"}`
          : `#${GROUP_ID} 不在树上了`
      },
      // 成员变了盒子就得跟着变。忘了 reflow 不会报错，只是画布上分组框住的范围不对，
      // 是那种「看着像对的」故障——所以这条断言在 A2 里比「组件建出来了」更值钱。
      {
        name: "分组包围盒跟成员一致",
        passed: group !== undefined && groupBoxIsTight(group),
        detail: group ? describeGroupBox(group) : "分组不在树上"
      }
    ];
  }
};
