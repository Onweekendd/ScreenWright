/**
 * A3 · 创建组件（进动态面板状态）
 *
 * 面板状态是树上的第二种容器（第一种是分组的 children）。它比分组更容易出错：状态在
 * `panelData[].config` 里，落盘时又拆成一层以状态命名的子目录，任何一环没对上，组件就会
 * 悄悄掉到根级——画布上看着「组件建出来了」，但切到那个状态里是空的。
 *
 * 所以这里断言的不是「多了一个组件」，而是**它挂在哪个状态下**。fixture 刻意只给一个状态，
 * agent 无从选错：要么放对，要么放到根级去了。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import {
  type Assertion,
  containerOf,
  describeContainer,
  type EvalCase,
  newComponents,
  panelStatesOf
} from "../../harness/case";

const PANEL_ID = 4178;
/** fixture 里那个唯一的状态「状态1」。改 fixture 的状态 id 这里要跟着改。 */
const STATE_ID = "978158a6-31fc-4c62-9a33-f029492d38c8";

export const a3CreateInPanelState: EvalCase = {
  id: "a3-create-in-panel-state",
  title: "创建组件（进动态面板状态）",
  fixture: "a-empty-dynamic-panel",

  prompt: "把一个文本组件放进这块大屏那个动态面板的「状态1」里",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const placed = created.map((c) => ({ component: c, container: containerOf(ctx.screen, c.id) }));
    const inState = placed.filter(
      (p) =>
        p.container?.kind === "panelState" && p.container.parent.id === PANEL_ID && p.container.stateId === STATE_ID
    );
    const panel = ctx.screen.layers.find((c) => c.id === PANEL_ID);

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
        name: "新组件落进了「状态1」",
        passed: created.length > 0 && inState.length === created.length,
        detail: placed.map((p) => `${p.component.id} → ${describeContainer(p.container)}`).join("；") || "无新增"
      },
      // 掉根级是这条路最典型的失败形态，单独列一条：上面那条红了的时候，这条能直接说清
      // 是「放错状态」还是「压根没进面板」。
      {
        name: "根级仍然只有那个动态面板",
        passed: ctx.screen.layers.length === 1 && ctx.screen.layers[0]?.id === PANEL_ID,
        detail: `根级 ${ctx.screen.layers.length} 个：${ctx.screen.layers.map((c) => c.id).join(",")}`
      },
      {
        name: "面板状态数没变（这一步不该新增状态）",
        passed: panel !== undefined && panelStatesOf(panel).length === 1,
        detail: panel ? `panelData 有 ${panelStatesOf(panel).length} 个状态` : "面板不在树上"
      }
    ];
  }
};
