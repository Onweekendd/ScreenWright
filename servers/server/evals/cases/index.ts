/**
 * case 登记处。
 *
 * 这里可以放心用静态 import：本模块只被 `harness/run.ts` 动态 import，那时 env 已经定格完毕
 * （见 run.ts 顶部的「env 定格区」）。
 *
 * 顺序即报告里的顺序，按 TODO 的实施顺序排：先 C 类不变量（最便宜、起点极小），
 * 再 A 类单工具，最后 B 类跨工具。
 */

import type { EvalCase } from "../harness/case";
import { a1CreateComponent } from "./a-single-tool/a1-create-component";
import { a2CreateInGroup } from "./a-single-tool/a2-create-in-group";
import { a3CreateInPanelState } from "./a-single-tool/a3-create-in-panel-state";
import { a4EditStyle } from "./a-single-tool/a4-edit-style";
import { a5MoveComponent } from "./a-single-tool/a5-move-component";
import { a6GroupComponents } from "./a-single-tool/a6-group-components";
import { a7UngroupComponent } from "./a-single-tool/a7-ungroup-component";
import { a8CopyComponent } from "./a-single-tool/a8-copy-component";
import { a10AddPanelState } from "./a-single-tool/a10-add-panel-state";
import { a11CreateDataFilter } from "./a-single-tool/a11-create-data-filter";
import { b1EventVisibility } from "./b-cross-tool/b1-event-visibility";
import { b3CallbackFlow } from "./b-cross-tool/b3-callback-flow";
import { b4CallbackFlowDirect } from "./b-cross-tool/b4-callback-flow-direct";
import { b5EventConditionSingle } from "./b-cross-tool/b5-event-condition-single";
import { b6EventConditionAll } from "./b-cross-tool/b6-event-condition-all";
import { b7EventConditionAny } from "./b-cross-tool/b7-event-condition-any";
import { b8ApiDataBinding } from "./b-cross-tool/b8-api-data-binding";
import { c1RejectNoWrite } from "./c-protocol/c1-reject-no-write";
import { c2ApplyFailureNoWrite } from "./c-protocol/c2-apply-failure-no-write";
import { c3InvalidSchemaNoWrite } from "./c-protocol/c3-invalid-schema-no-write";
import { c4PlanMode } from "./c-protocol/c4-plan-mode";
import { c5AskMode } from "./c-protocol/c5-ask-mode";
import { d1BuildFromRequirement } from "./d-generate/d1-build-from-requirement";
import { d2BuildShareAndList } from "./d-generate/d2-build-share-and-list";

export const allCases: EvalCase[] = [
  c1RejectNoWrite,
  c2ApplyFailureNoWrite,
  c3InvalidSchemaNoWrite,
  c4PlanMode,
  c5AskMode,
  a1CreateComponent,
  a2CreateInGroup,
  a3CreateInPanelState,
  a4EditStyle,
  a5MoveComponent,
  a6GroupComponents,
  a7UngroupComponent,
  a8CopyComponent,
  a10AddPanelState,
  a11CreateDataFilter,
  b1EventVisibility,
  b3CallbackFlow,
  b4CallbackFlowDirect,
  b5EventConditionSingle,
  b6EventConditionAll,
  b7EventConditionAny,
  b8ApiDataBinding,
  // D 类：从零生成。前面三类都是「改已有的东西」，这一类没有起点
  d1BuildFromRequirement,
  d2BuildShareAndList
];

/** 完整 case ID 优先匹配；找不到完整 ID 时将选择器作为分组前缀。没有选择器时返回全部。 */
export const selectCases = (selectors: readonly string[]): EvalCase[] => {
  if (selectors.length === 0) {
    return allCases;
  }

  const exactIds = new Set(selectors.filter((selector) => allCases.some((c) => c.id === selector)));
  const prefixes = selectors.filter((selector) => !exactIds.has(selector));
  return allCases.filter((c) => exactIds.has(c.id) || prefixes.some((prefix) => c.id.startsWith(prefix)));
};
