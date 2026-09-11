/**
 * A8 · 复制组件（复制一个分组）
 *
 * 挑分组来复制，是因为它把这条路上两个最容易出错的地方一起考了：整棵子树都得跟着复制，
 * 而且每个节点都要拿到新 id。少复制一层，或者子组件沿用了原来的 id，都会让新旧两份共用
 * 同一批组件——树上看着有两个分组，改其中一个另一个跟着变。
 *
 * id 唯一性本身由 L0 兜底，所以这里只断言「确实是新实例」：新分组 id 不等于原分组，且新旧
 * 两边的子组件 id 没有交集。
 */

import { FolderEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent, hasProp, newComponents } from "../../harness/case";

const SOURCE_GROUP_ID = 4177;
const SOURCE_MEMBER_IDS = [4175, 4176];

export const a8CopyComponent: EvalCase = {
  id: "a8-copy-component",
  title: "复制组件（分组）",
  fixture: "a-group",

  prompt: "把这块大屏上的那个分组复制一份",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const newGroups = hasProp(created, FolderEnum.group);
    const copy = newGroups[0];
    const copyChildren = copy?.children ?? [];
    const source = findComponent(ctx.screen, SOURCE_GROUP_ID);
    const sourceChildren = (source?.children ?? []).map((c) => c.id).sort((a, b) => a - b);

    const sourceProps = SOURCE_MEMBER_IDS.map((id) => findComponent(ctx.before, id)?.component.prop).sort();
    const copyProps = copyChildren.map((c) => c.component.prop).sort();
    const overlapping = copyChildren.filter((c) => SOURCE_MEMBER_IDS.includes(c.id));

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "多了一个分组",
        passed: newGroups.length === 1,
        detail: `新增 ${created.length} 个组件（${created.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "无"}），其中分组 ${newGroups.length} 个`
      },
      {
        name: "副本是新实例，不是原分组",
        passed: copy !== undefined && copy.id !== SOURCE_GROUP_ID,
        detail: copy ? `副本 #${copy.id}，原件 #${SOURCE_GROUP_ID}` : "没找到副本"
      },
      {
        name: "两个子组件都跟着复制过来了",
        passed: copyChildren.length === SOURCE_MEMBER_IDS.length && copyProps.join(",") === sourceProps.join(","),
        detail: copy
          ? `副本 children = ${copyChildren.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "空"}，期望 ${sourceProps.length} 个：${sourceProps.join(",")}`
          : "没找到副本"
      },
      // 子组件沿用原 id 是这条路最隐蔽的坏法：树上看着两份，实际共用同一批组件。
      {
        name: "副本的子组件用的是新 id",
        passed: overlapping.length === 0,
        detail: overlapping.length === 0 ? undefined : `与原件共用 id：${overlapping.map((c) => c.id).join(",")}`
      },
      {
        name: "原分组原封不动",
        passed:
          source?.component.prop === FolderEnum.group &&
          sourceChildren.length === SOURCE_MEMBER_IDS.length &&
          sourceChildren.every((id, i) => id === SOURCE_MEMBER_IDS[i]),
        detail: source ? `#${SOURCE_GROUP_ID} children = ${sourceChildren.join(",") || "空"}` : "原分组不在树上了"
      }
    ];
  }
};
