/**
 * A6 · 分组
 *
 * 三件事一起考：新分组收的成员对不对、它自己挂在哪、包围盒算得对不对。
 *
 * 「落在成员原来所在的容器里」这条最容易被忽略——成员在根级就该挂根级，成员在某个面板状态
 * 里就该挂那个状态里。实现上它是从成员路径反推出来的（group-component.ts 里的
 * parsePlacementFromPath），推错了不会报错，分组会静静地跑到根级去。这里成员本来就在根级，
 * 所以这条断言只挡得住「分组跑到别处去了」，挡不住反推逻辑本身——那要等有嵌套起点的 fixture。
 *
 * fixture 给三个组件而只组两个，第三个是对照组：它必须留在原地。
 */

import { FolderEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import {
  type Assertion,
  containerOf,
  describeContainer,
  describeGroupBox,
  type EvalCase,
  flattenLayers,
  groupBoxIsTight,
  hasProp,
  newComponents
} from "../../harness/case";

const MEMBER_IDS = [4179, 4180]; // 条形图 (0,0) + 双向条形图 (600,0)，都是 600×300
const BYSTANDER_ID = 4181; // 折线柱形图 (1200,0)，不该被卷进来
/** 两个成员的并集 */
const EXPECTED_BOX = { left: 0, top: 0, width: 1200, height: 300 };

export const a6GroupComponents: EvalCase = {
  id: "a6-group-components",
  title: "分组",
  fixture: "three-components",

  prompt: "把这块大屏上的「条形图」和「双向条形图」组合成一个分组，「折线柱形图」不要动",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const groups = hasProp(flattenLayers(ctx.screen.layers), FolderEnum.group);
    const group = groups[0];
    const childIds = (group?.children ?? []).map((c) => c.id).sort((a, b) => a - b);

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "多了一个分组（且只多了一个）",
        passed: groups.length === 1 && created.some((c) => c.id === group?.id),
        detail: `树上共 ${groups.length} 个分组，新增 ${created.length} 个组件：${created.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "无"}`
      },
      {
        name: "分组成员正好是指定的那两个",
        passed: childIds.length === MEMBER_IDS.length && childIds.every((id, i) => id === MEMBER_IDS[i]),
        detail: group ? `children = ${childIds.join(",") || "空"}，期望 ${MEMBER_IDS.join(",")}` : "没有分组"
      },
      {
        name: "分组挂在成员原来所在的容器（根级）",
        passed: group !== undefined && containerOf(ctx.screen, group.id)?.kind === "root",
        detail: group ? `#${group.id} → ${describeContainer(containerOf(ctx.screen, group.id))}` : "没有分组"
      },
      {
        name: "折线柱形图仍在根级、没被卷进分组",
        passed: containerOf(ctx.screen, BYSTANDER_ID)?.kind === "root",
        detail: `#${BYSTANDER_ID} → ${describeContainer(containerOf(ctx.screen, BYSTANDER_ID))}`
      },
      {
        name: "分组包围盒是两个成员的并集",
        passed:
          group !== undefined &&
          group.left === EXPECTED_BOX.left &&
          group.top === EXPECTED_BOX.top &&
          group.component.width === EXPECTED_BOX.width &&
          group.component.height === EXPECTED_BOX.height &&
          groupBoxIsTight(group),
        detail: group
          ? `${describeGroupBox(group)}，期望 (${EXPECTED_BOX.left},${EXPECTED_BOX.top}) ${EXPECTED_BOX.width}×${EXPECTED_BOX.height}`
          : "没有分组"
      }
    ];
  }
};
