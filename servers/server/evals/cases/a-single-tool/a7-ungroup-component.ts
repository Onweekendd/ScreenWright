/**
 * A7 · 解散分组
 *
 * 解组的产物有一半在磁盘上：分组容器整个消失，它那个以 {id}_{name} 命名的目录也要被清掉。
 * 树上看不出区别——孤儿文件本来就不会进树——所以这里除了断言内存中的结构，还得下去数文件。
 * 漏清的表现是工作区里躺着一个再也不会被读到的目录，下次整屏回写时可能把它又变回一个组件。
 *
 * 另一半是位置：子组件坐标是绝对值，升级到父层不该让它们动。
 */

import { FolderEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import {
  type Assertion,
  containerOf,
  describeContainer,
  type EvalCase,
  findComponent,
  flattenLayers,
  hasProp,
  screenFiles
} from "../../harness/case";

const GROUP_ID = 4177;
const MEMBER_IDS = [4175, 4176];

export const a7UngroupComponent: EvalCase = {
  id: "a7-ungroup-component",
  title: "解散分组",
  fixture: "a-group",

  prompt: "把这块大屏上的那个分组解散掉",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const groups = hasProp(flattenLayers(ctx.screen.layers), FolderEnum.group);
    const promoted = MEMBER_IDS.map((id) => ({
      id,
      container: containerOf(ctx.screen, id),
      before: findComponent(ctx.before, id),
      after: findComponent(ctx.screen, id)
    }));
    // 组件文件名是 {id}_{name}.json，同名目录装它的子组件——两者都该没了
    const leftovers = screenFiles(ctx.workspace.screenDir).filter((f) => f.includes(`${GROUP_ID}_`));

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "树上已经没有分组了",
        passed: groups.length === 0,
        detail: groups.length === 0 ? undefined : `还剩 ${groups.map((g) => g.id).join(",")}`
      },
      {
        name: "两个成员都升到了根级",
        passed: promoted.every((p) => p.container?.kind === "root"),
        detail: promoted.map((p) => `#${p.id} → ${describeContainer(p.container)}`).join("；")
      },
      {
        name: "成员位置没变",
        passed: promoted.every(
          (p) =>
            p.after !== undefined &&
            p.before !== undefined &&
            p.after.left === p.before.left &&
            p.after.top === p.before.top
        ),
        detail: promoted
          .map((p) => `#${p.id} (${p.after?.left},${p.after?.top}) ← (${p.before?.left},${p.before?.top})`)
          .join("；")
      },
      {
        name: "分组的文件和目录都从磁盘上清掉了",
        passed: leftovers.length === 0,
        detail: leftovers.length === 0 ? undefined : `残留 ${leftovers.length} 项：${leftovers.slice(0, 5).join(", ")}`
      }
    ];
  }
};
