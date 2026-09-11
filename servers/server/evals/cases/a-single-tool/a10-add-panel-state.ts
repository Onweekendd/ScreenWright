/**
 * A10 · 动态面板加状态
 *
 * 状态不是「一个名字」，是一份带派生字段的结构（adaptationNorm / adaptationType / config /
 * 背景那几项）。缺哪一项都不报错，要等到画布切到这个状态时才发现自适应算不出来、背景是空的。
 * 所以断言分两层：数量和名字对不对（agent 干了这件事），字段齐不齐（干得对不对）。
 *
 * 状态 id 是本地 uuid，前后端各造一份就会对不上，因此它必须是前端那一份原样落进 panelData。
 * 这里只断言「新 id 和原状态不同、非空」——它具体是什么由假前端决定，写死没有意义。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, panelStatesOf } from "../../harness/case";

const PANEL_ID = 4178;
const EXISTING_STATE_ID = "978158a6-31fc-4c62-9a33-f029492d38c8";
const NEW_STATE_NAME = "详情";

/** 一个状态该有的派生字段，缺一个都会让画布在这个状态下算错 */
const REQUIRED_STATE_KEYS = ["id", "title", "name", "config", "backgroundColor", "adaptationNorm", "adaptationType"];

export const a10AddPanelState: EvalCase = {
  id: "a10-add-panel-state",
  title: "动态面板加状态",
  fixture: "a-empty-dynamic-panel",

  prompt: `给这块大屏的动态面板加一个叫「${NEW_STATE_NAME}」的新状态`,

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const panel = ctx.screen.layers.find((c) => c.id === PANEL_ID);
    const states = panel ? panelStatesOf(panel) : [];
    const added = states.filter((s) => `${s.id}` !== EXISTING_STATE_ID);
    const fresh = added[0];
    const missingKeys = fresh
      ? REQUIRED_STATE_KEYS.filter((k) => (fresh as unknown as Record<string, unknown>)[k] === undefined)
      : REQUIRED_STATE_KEYS;

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "面板上多了一个状态",
        passed: states.length === 2 && added.length === 1,
        detail: panel
          ? `panelData = ${states.map((s) => `${s.name}(${s.id})`).join(", ") || "空"}`
          : `#${PANEL_ID} 不在树上`
      },
      {
        name: `新状态叫「${NEW_STATE_NAME}」`,
        passed: fresh?.name === NEW_STATE_NAME && fresh?.title === NEW_STATE_NAME,
        detail: fresh ? `name=${fresh.name} title=${fresh.title}` : "没有新增状态"
      },
      {
        name: "新状态的派生字段齐全",
        passed: missingKeys.length === 0,
        detail: missingKeys.length === 0 ? undefined : `缺 ${missingKeys.join(", ")}`
      },
      {
        name: "新状态初始没有子组件",
        passed: Array.isArray(fresh?.config) && fresh.config.length === 0,
        detail: fresh ? `config 有 ${Array.isArray(fresh.config) ? fresh.config.length : "非数组"} 项` : "没有新增状态"
      },
      {
        name: "原有的「状态1」还在",
        passed: states.some((s) => `${s.id}` === EXISTING_STATE_ID),
        detail: `现有状态 id：${states.map((s) => s.id).join(", ") || "无"}`
      }
    ];
  }
};
