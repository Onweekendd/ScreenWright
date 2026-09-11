/**
 * L0 不变量：所有 case 共享的结构性检查，白捡的。
 *
 * 这些跟 agent 想干什么无关——不管它是建组件、连事件还是改配置，跑完之后工作区都必须
 * 满足这几条。任何一条破了，那一次的 L1 断言即使全绿也不能算数：整屏读不回来的时候，
 * 「组件建对了」这句话没有意义。
 *
 * 判定语义是**全票**：一条不过就算这个 case 的 L0 失败（对应 mastra gate 的 `>= 1`）。
 *
 * ⚠️ 还差一条「事件双向绑定闭合」。TODO 里列了它，但闭合的确切定义（A 的 action 指向 B
 * 时，B 侧到底该有 listenArgs 还是 cbArgs 的哪种对应项）没核对过，写个猜的检查比不写更糟——
 * 它会在真实数据上乱报，然后被人调宽直到永远为真。补之前先读 core 的事件注册那条路。
 */

import { extractComponentId } from "@screenwright/core";
import type { ComponentType, ParsedLargeScreenInfo } from "@screenwright/types";

import type { Assertion } from "./case";
import { flattenLayers } from "./case";

export const checkInvariants = (screen: ParsedLargeScreenInfo): Assertion[] => {
  const all = flattenLayers(screen.layers);
  const ids = new Set(all.map((c) => c.id));

  return [
    idsAreValid(all),
    idsAreUnique(all),
    eventRefsResolve(all, ids),
    filterRefsResolve(screen, ids),
    configRefsResolve(screen, ids)
  ];
};

/** id 必须是正整数。假前端造 id 出岔子（NaN / undefined 落进 JSON）先在这里露出来。 */
const idsAreValid = (all: ComponentType[]): Assertion => {
  const bad = all.filter((c) => !Number.isInteger(c.id) || c.id <= 0);
  return {
    name: "L0 组件 id 都是正整数",
    passed: bad.length === 0,
    detail:
      bad.length === 0 ? undefined : `${bad.length} 个非法：${bad.map((c) => `${String(c.id)}(${c.name})`).join(", ")}`
  };
};

/**
 * id 全局唯一（含分组里的子组件）。
 * 重复 id 会让所有按 id 定位的路径——事件、过滤器、文件落盘——指向不确定的那一个。
 */
const idsAreUnique = (all: ComponentType[]): Assertion => {
  const seen = new Map<number, number>();
  for (const c of all) {
    seen.set(c.id, (seen.get(c.id) ?? 0) + 1);
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  return {
    name: "L0 组件 id 唯一",
    passed: dupes.length === 0,
    detail: dupes.length === 0 ? undefined : `重复：${dupes.map(([id, n]) => `${id}×${n}`).join(", ")}`
  };
};

/**
 * 事件动作指向的组件都存在。
 *
 * `Action.component` 是 `["$component(1305156)"]` 这种形式，用 core 的 extractComponentId
 * 解析——跟运行时走同一个函数，它认不出来的写法这里也不该自己发明一套。
 */
const eventRefsResolve = (all: ComponentType[], ids: Set<number>): Assertion => {
  const dangling: string[] = [];
  for (const c of all) {
    for (const event of c.events ?? []) {
      for (const action of event.actions ?? []) {
        for (const ref of action.component ?? []) {
          const target = extractComponentId(ref);
          if (!ids.has(target)) {
            dangling.push(`${c.id}/${event.name}→${ref}`);
          }
        }
      }
    }
  }
  return {
    name: "L0 事件引用无悬挂",
    passed: dangling.length === 0,
    detail:
      dangling.length === 0 ? undefined : `${dangling.length} 处指向不存在的组件：${dangling.slice(0, 5).join(", ")}`
  };
};

/** 过滤器绑定的组件都存在。 */
const filterRefsResolve = (screen: ParsedLargeScreenInfo, ids: Set<number>): Assertion => {
  const dangling: string[] = [];
  for (const [key, filter] of Object.entries(screen.dataFilterArr ?? {})) {
    for (const bind of filter.bindComponent ?? []) {
      const target = extractComponentId(bind.id);
      if (!ids.has(target)) {
        dangling.push(`${key}→${String(bind.id)}`);
      }
    }
  }
  return {
    name: "L0 过滤器引用无悬挂",
    passed: dangling.length === 0,
    detail: dangling.length === 0 ? undefined : `${dangling.length} 处：${dangling.slice(0, 5).join(", ")}`
  };
};

/**
 * `config` 是组件 id 数组（历史数据里也有字符串形式，所以同样走 extractComponentId）。
 * 它跟 layers 对不上，画布上就会出现「树里有但排序里没有」或反之的组件。
 */
const configRefsResolve = (screen: ParsedLargeScreenInfo, ids: Set<number>): Assertion => {
  const dangling = (screen.config ?? []).filter((ref) => !ids.has(extractComponentId(ref)));
  return {
    name: "L0 config 引用无悬挂",
    passed: dangling.length === 0,
    detail:
      dangling.length === 0
        ? undefined
        : `${dangling.length} 个 id 不在 layers 里：${dangling.slice(0, 5).map(String).join(", ")}`
  };
};
