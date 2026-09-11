/**
 * D1 · 从一句话需求搭出一块大屏
 *
 * 全套 case 里第一条**没有起点**的：前面 21 条都是「改已有的东西」，最大的 fixture 只有
 * 3 个组件；这条从空屏开始，考的是完全不同的能力——把模糊需求收敛成内容、切分区、
 * 选组件、造数据、落盘。
 *
 * ## 断言为什么全是结构级的
 *
 * 「电力大屏该长什么样」没有唯一解，也不该有：放 5 个还是 7 个组件、主视觉给排名还是给曲线，
 * 都是合理的产品判断。所以这里一个「必须有某某组件」都不断言——那会退化成在测模型会不会
 * 复述 prompt。断言的是**任何一块能看的大屏都必须成立的性质**：
 * 组件在画布内、顶层区之间不重叠、每个组件有真实尺寸、数据不是占位词。
 *
 * 这几条恰好是 `solveLayout` 用结构保证的东西（子矩形永远落在父矩形内且互不相交），
 * 所以这条 case 同时是那个求解器的端到端回归网：它红了，要么是求解器坏了，
 * 要么是 agent 绕过工作流自己逐个 create_component 去了——两种都值得当场知道。
 *
 * ## 会走哪条路不做限定
 *
 * agent 可以调 `requirementToBIWorkflow`，也可以老老实实逐个 `create_component`。
 * **终态达标就算过**，路径差异反映在 L2 指标（轮数、token）里，只看趋势不设阈值。
 * 这是刻意的：断言里写死"必须调某个工具"会让这条 case 变成工作流的实现测试，
 * 而工作流的价值本来就该由成本数据说话，不该由断言强制。
 *
 * ## 假前端
 *
 * 用默认的 `answerFirstOption`：agent 按提示词要求会先用 `ask_user_question` 确认内容清单
 * （"给调度中心看还是给管理层看"），第一个选项即可。这条 case 不测澄清质量，
 * 只要它别在没确认的情况下瞎猜就行——而那个由提示词负责，不由断言负责。
 */

import { FolderEnum } from "@screenwright/types";

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, flattenLayers, withinCanvas } from "../../harness/case";
import { groupsAreOuter } from "./field-assertions";

/** 组件模板自带的占位数据。产出里还留着它们，说明「造数据」这一步没生效。 */
const PLACEHOLDER_PATTERNS = [/类目\s*\d/u, /系列\s*[A-Za-z\d]/u, /数据\s*\d/u, /示例\s*\d/u];

const rectOf = (c: { left: number; top: number; component: { width: number; height: number } }) => ({
  left: c.left,
  top: c.top,
  width: c.component.width,
  height: c.component.height
});

const overlaps = (a: ReturnType<typeof rectOf>, b: ReturnType<typeof rectOf>): boolean =>
  a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

export const d1BuildFromRequirement: EvalCase = {
  id: "d1-build-from-requirement",
  title: "从一句话需求搭大屏",
  fixture: "empty-screen",

  // 故意说得很粗。需求越模糊，"先收敛再动手"这个行为越该被观察到；
  // 说细了（"放一个负荷曲线一个厂站排名"）就变成在测它会不会照单执行。
  prompt: "帮我做一个电力监控大屏",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const all = flattenLayers(ctx.screen.layers);
    const containers = all.filter((c) => c.component.prop === FolderEnum.group);
    const leaves = all.filter((c) => c.component.prop !== FolderEnum.group);
    const roots = ctx.screen.layers;

    const outside = all.filter((c) => !withinCanvas(c, ctx.screen));
    const zeroSized = all.filter((c) => c.component.width <= 0 || c.component.height <= 0);

    const overlapping: string[] = [];
    for (let i = 0; i < roots.length; i += 1) {
      for (let j = i + 1; j < roots.length; j += 1) {
        if (overlaps(rectOf(roots[i]), rectOf(roots[j]))) {
          overlapping.push(`${roots[i].id}(${roots[i].name}) × ${roots[j].id}(${roots[j].name})`);
        }
      }
    }

    const placeholders = leaves.filter((c) => {
      const data = (c as unknown as { data?: unknown }).data;
      if (!Array.isArray(data) || data.length === 0) {
        return false;
      }
      const text = JSON.stringify(data);
      return PLACEHOLDER_PATTERNS.some((re) => re.test(text));
    });

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "画布上建出了组件",
        passed: leaves.length > 0,
        detail: `容器 ${containers.length} 个，内容组件 ${leaves.length} 个`
      },
      {
        // 下限而非精确值：内容项数量是产品判断，但只放一两个组件的"大屏"显然没达成需求
        name: "内容组件不少于 3 个",
        passed: leaves.length >= 3,
        detail: `实得 ${leaves.length} 个：${leaves.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "无"}`
      },
      {
        name: "所有组件都在画布内",
        passed: outside.length === 0,
        detail:
          outside.length === 0
            ? `画布 ${ctx.screen.detail.width}×${ctx.screen.detail.height}`
            : outside
                .map((c) => `${c.id} left=${c.left} top=${c.top} ${c.component.width}×${c.component.height}`)
                .join("；")
      },
      {
        name: "没有零尺寸组件",
        passed: zeroSized.length === 0,
        detail: zeroSized.map((c) => `${c.id} ${c.component.width}×${c.component.height}`).join("；") || undefined
      },
      {
        // 求解器的核心承诺。它红了要么求解器坏了，要么 agent 没走工作流、自己拍的坐标
        name: "顶层区之间不重叠",
        passed: overlapping.length === 0,
        detail: overlapping.length === 0 ? `顶层 ${roots.length} 块` : `重叠：${overlapping.join("；")}`
      },
      {
        // 这条盯的是「造数据」那一步。留着模板占位数据等于交了个空壳，结构再对也没法给人看
        name: "数据不是模板占位值",
        passed: placeholders.length === 0,
        detail:
          placeholders.length === 0
            ? undefined
            : placeholders.map((c) => `${c.id}/${c.component.prop} 仍含「类目N」这类占位词`).join("；")
      },
      // 只在渲染时才现形的一类：磁盘数据全对，画布上组件整体偏移
      ...groupsAreOuter(ctx.screen)
    ];
  }
};
