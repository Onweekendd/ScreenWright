/**
 * C3 · 校验不过 → 不落盘
 *
 * 前两条打的是前端那一侧的两种拒绝，这条打的是后端自己的闸门：改出来的组件过不了
 * schema 校验时，工作区必须一个字节不动。校验在「改好的文本交给 core 之前」，
 * 漏了这一步，一份结构非法的组件就会进树，接着被整屏回写出去——下次读回来时整屏都塌了。
 *
 * 用宽度当抓手：component.width 是 z.number()，塞个字符串必然过不了，而且这个字段在
 * 每条编辑路径上都会被碰到。prompt 说得很直白，是为了让「agent 真去试了」成为大概率事件。
 *
 * ⚠️ 这条会**空过**：agent 若判断这个要求不合理、压根没去改，断言同样全绿。这是可以接受的
 * ——C 类断言的是不变量（「非法值永远不落盘」），不变量在没人尝试时本来就成立。它跟 A 类
 * 不一样，A 类必须看到正向结果才算数。
 *
 * 应答策略是这条 case 的关键，而且**判据必须是提问内容，不能是提问序号**。
 *
 * agent 可能先问「width 必须是数字，确认要写字符串吗」——这一问必须点头，否则它压根
 * 不动手，全绿但什么也没测到。而它撞墙之后提的「那改成数字 800 还是保持现状」必须回绝：
 * **用户从没要过 800**，替他答应等于假前端自己开了第二扇门。
 *
 * 踩过两次，两次都栽在应答策略而不是产品：
 * - 2026-09-02（6/9）：默认取第一个选项，把 800 写了进去
 * - 2026-09-07：改用「第一问放行、之后回绝」后仍然红——那轮 agent **只问了一次**，
 *   而那一问已经是替代方案（「宽度想改成多少？1200 / 800 / 维持 600」），
 *   序号判据整体错位一格，又把 1200 写了进去
 *
 * 应答固定重申原意，不猜测选项：选项可能包含「不支持字符串」或「确认改成 800」，
 * 仅凭关键词仍会误授权；没有取消选项时也不能退回最后一个数值方案。
 * 自由文本答案明确不接受替代值，无法写入则保持原样，与提问次数、顺序无关。
 * 本 case 通过只证明终态不变量；agent 未提交非法值时，不代表实际覆盖了 schema 拦截路径。
 */

import { isDeepStrictEqual } from "node:util";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent } from "../../harness/case";

const TARGET_ID = 4179;
const TARGET_NAME = "条形图";
const ALL_IDS = [4179, 4180, 4181];

export const c3InvalidSchemaNoWrite: EvalCase = {
  id: "c3-invalid-schema-no-write",
  title: "校验不过 → 不落盘",
  fixture: "three-components",

  prompt: `把这块大屏上「${TARGET_NAME}」的 component.width 改成字符串 "很宽"`,

  mode: AgentMode.AUTO_EDIT,
  frontend: {
    answer: () =>
      '我只要求把 component.width 改成字符串 "很宽"，不接受改成任何其他数值。如果这个字符串不合法、无法写入，请保持原样，不要修改其他字段。'
  },

  assert: (ctx): Assertion[] => {
    const target = findComponent(ctx.screen, TARGET_ID);
    const before = findComponent(ctx.before, TARGET_ID);
    const drifted = ALL_IDS.filter(
      (id) => !isDeepStrictEqual(findComponent(ctx.before, id), findComponent(ctx.screen, id))
    );

    return [
      {
        name: "工作区一个字节没动",
        passed: !ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged
          ? "工作区指纹变化；需检查实际写入内容，不能据此认定绕过了 schema 校验"
          : undefined
      },
      {
        name: "宽度仍然是数字",
        passed: typeof target?.component.width === "number",
        detail: target
          ? `实际 ${typeof target.component.width}：${JSON.stringify(target.component.width)}`
          : "组件不在树上"
      },
      {
        name: "宽度还是起点那个值",
        passed: target?.component.width === before?.component.width,
        detail: `现在 ${JSON.stringify(target?.component.width)}，起点 ${JSON.stringify(before?.component.width)}`
      },
      {
        name: "三个组件都与起点逐字段一致",
        passed: drifted.length === 0,
        detail: drifted.length === 0 ? undefined : `变了的：${drifted.join(", ")}`
      }
    ];
  }
};
