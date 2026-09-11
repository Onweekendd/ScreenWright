/**
 * A5 · 移动组件（跨容器）
 *
 * 移动是唯一一个**两侧都要改**的操作：源容器少一个成员、目标容器多一个，两边的派生值都得
 * 跟着重算。只改一侧不会报错，画布上表现为「组件跑出去了，但原来的分组框还是原来那么大」。
 *
 * 这里走的是「组里 → 根级」这个方向：源侧的分组要收紧包围盒，目标侧是根级（没有盒子要算），
 * 所以断言全部压在源侧那一边，最省事也最能暴露问题。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import {
  type Assertion,
  containerOf,
  describeContainer,
  describeGroupBox,
  type EvalCase,
  findComponent,
  groupBoxIsTight
} from "../../harness/case";

const GROUP_ID = 4177;
const MOVED_ID = 4175; // 条形图，组里靠左那个，(0,0) 600×300
const STAYING_ID = 4176; // 折线柱形图，(600,0) 600×300

/** 只剩 #4176 之后，分组应当收紧到它的盒子上。 */
const EXPECTED_BOX = { left: 600, top: 0, width: 600, height: 300 };

export const a5MoveComponent: EvalCase = {
  id: "a5-move-component",
  title: "移动组件（移出分组）",
  fixture: "a-group",

  prompt: "把分组里的「条形图」移出来，放到大屏根级",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const group = findComponent(ctx.screen, GROUP_ID);
    const moved = findComponent(ctx.screen, MOVED_ID);
    const movedBefore = findComponent(ctx.before, MOVED_ID);
    const container = containerOf(ctx.screen, MOVED_ID);
    const children = (group?.children ?? []).map((c) => c.id);

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "条形图现在挂在根级",
        passed: container?.kind === "root",
        detail: `#${MOVED_ID} → ${describeContainer(container)}`
      },
      {
        name: "分组里只剩折线柱形图",
        passed: children.length === 1 && children[0] === STAYING_ID,
        detail: group ? `children = ${children.join(",") || "空"}` : `#${GROUP_ID} 不在树上了`
      },
      // 源侧漏改的典型症状：成员出去了，盒子还是 1200×300。
      {
        name: "分组包围盒跟着收紧了",
        passed:
          group !== undefined &&
          group.left === EXPECTED_BOX.left &&
          group.top === EXPECTED_BOX.top &&
          group.component.width === EXPECTED_BOX.width &&
          group.component.height === EXPECTED_BOX.height &&
          groupBoxIsTight(group),
        detail: group
          ? `${describeGroupBox(group)}，期望 (${EXPECTED_BOX.left},${EXPECTED_BOX.top}) ${EXPECTED_BOX.width}×${EXPECTED_BOX.height}`
          : "分组不在树上"
      },
      // 移出分组只换容器，不该顺手改坐标——子组件坐标本来就是绝对值。
      {
        name: "条形图自己的坐标没变",
        passed: moved !== undefined && moved.left === movedBefore?.left && moved.top === movedBefore?.top,
        detail: moved
          ? `现在 (${moved.left},${moved.top})，起点 (${movedBefore?.left},${movedBefore?.top})`
          : "条形图不在树上"
      }
    ];
  }
};
