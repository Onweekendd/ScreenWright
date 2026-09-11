/**
 * A4 · 修改组件样式
 *
 * 这条的重点在**后半句**：目标字段改了，其他字段一个没动。改配置这条路要经过「读文件 →
 * 编辑文本 → 过 core 合进整屏树 → 整屏回写」，中间任何一环把对象重建一遍，都可能顺手抹掉
 * 一堆没人注意的字段（option 里的深层配置、dataSource、events……）。这类损失当场看不出来，
 * 要等到某个功能突然不工作了才被发现。
 *
 * 所以 prompt 里明写「其它什么都别动」：这样一旦别的字段变了，就是实打实的指令遵循失败，
 * 而不是「agent 顺手优化了一下布局」这种可以争论的事。
 *
 * 选宽度而不是某个颜色，是因为宽度在 `component.width`——位置尺寸是整条链路上被重写次数
 * 最多的字段，最容易被顺带改坏。
 */

import { isDeepStrictEqual } from "node:util";

import type { ComponentType } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent } from "../../harness/case";

const TARGET_ID = 4181;
const TARGET_NAME = "折线柱形图";
const EXPECTED_WIDTH = 800;
/** 不该被碰的两个：#4179 条形图、#4180 双向条形图 */
const BYSTANDER_IDS = [4179, 4180];

/** 顶层字段里哪些不一样了。全等时返回空数组。 */
const changedKeys = (before: ComponentType, after: ComponentType): string[] => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter(
    (k) => !isDeepStrictEqual((before as Record<string, unknown>)[k], (after as Record<string, unknown>)[k])
  );
};

export const a4EditStyle: EvalCase = {
  id: "a4-edit-style",
  title: "修改组件样式",
  fixture: "three-components",

  prompt: `把这块大屏上「${TARGET_NAME}」的宽度改成 ${EXPECTED_WIDTH}，其它什么都别动`,

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const before = findComponent(ctx.before, TARGET_ID);
    const after = findComponent(ctx.screen, TARGET_ID);

    // 把宽度按回起点值再比：剩下的差异就是「本不该动却动了」的部分
    const rewound =
      after && before ? { ...after, component: { ...after.component, width: before.component.width } } : undefined;
    const strayKeys = rewound && before ? changedKeys(before, rewound as ComponentType) : ["目标组件不在树上"];

    const bystanders = BYSTANDER_IDS.map((id) => ({
      id,
      before: findComponent(ctx.before, id),
      after: findComponent(ctx.screen, id)
    }));
    const touched = bystanders.filter((b) => !b.before || !b.after || !isDeepStrictEqual(b.before, b.after));

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: `${TARGET_NAME} 的宽度变成了 ${EXPECTED_WIDTH}`,
        passed: after?.component.width === EXPECTED_WIDTH,
        detail: after ? `实际 ${after.component.width}（起点 ${before?.component.width}）` : "目标组件不在树上"
      },
      {
        name: "目标组件除宽度外一个字段没动",
        passed: strayKeys.length === 0,
        detail: strayKeys.length === 0 ? undefined : `还改了：${strayKeys.join(", ")}`
      },
      {
        name: "另外两个组件一个字节没动",
        passed: touched.length === 0,
        detail:
          touched.length === 0
            ? undefined
            : touched.map((b) => `#${b.id} ${!b.after ? "没了" : changedKeys(b.before!, b.after).join(",")}`).join("；")
      }
    ];
  }
};
