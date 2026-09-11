/**
 * 事件干跑（dry-run）：给定触发组件、事件类型、抛出值，在 Node 里**真跑一遍**事件链路——
 * 求值条件 → 规划动作 → 抛出回调参数 → 消费方重算过滤器——把三段结论结构化地交出来。
 *
 * 前身是 `agent-workspace/scripts/simulateEvent.ts`。抽成服务的原因不在逻辑，在**调用方式**：
 * 脚本让 agent 得在沙箱里摸 shell 语法（cmd.exe 下 `;` 不分隔、`$VAR` 不展开，实测一轮里
 * 试了 4 次才拿到环境变量）、读 11KB 源码看用法、再把 `throwValue` 的 JSON 塞进命令行参数
 * ——那个转义规则本身就是个坑（只有 `\"` 一种写法能活过 cmd.exe）。做成工具入参就是结构化
 * JSON，这些全没了。
 *
 * ## 与前端的关系
 *
 * 跑的就是前端那份代码——`@screenwright/core` 的 ScreenEditor / EventDispatcher，与浏览器里
 * useEventHandling 调的是同一条链路、同一批纯函数。差别只有一处：动作执行器这里注入的是
 * 「只记录不执行」的版本（Node 里没有 DOM），所以**能验数据变化，验不了渲染**——
 * 显隐、动画、跳转只报告"会被触发、目标是谁"。
 *
 * ## 全局状态必须恢复
 *
 * `setActionExecutor` / `setCallbackArgsSource` / `setFilterResultSink` 都是 core 的模块级单例。
 * 脚本是一次性进程，写完就丢无所谓；服务在长驻进程里跑，不恢复的话下一次别的调用
 * （比如 `applyComponentEdit` 走 core 重算派生值）会拿到这里留下的录制版执行器。
 * `finally` 里逐个还原，跟 eval 的 `verifyProductionBinding` 同一套纪律。
 */

import {
  getActionExecutor,
  getFilterResultSink,
  getRuntimeCallbackArgs,
  MemoryFilterResultSink,
  planEventActions,
  ScreenEditor,
  selectMatchingEvents,
  setActionExecutor,
  setCallbackArgsSource,
  setFilterResultSink
} from "@screenwright/core";
import type { Action, ComponentType, EventTypeEnum, LargeScreeInfo } from "@screenwright/types";

import { ScreenReader } from "./bi-data-sync/screen-read";

/** 一次动作派发的记录。Node 里动作不真执行，但"被触发了、目标是谁"本身就是结论。 */
export interface SimulatedAction {
  actionType: string;
  /** 目标组件，带名字便于阅读 */
  targets: Array<{ id: number; name: string }>;
  conditionSatisfied: boolean;
  /** 派发时作用域内可见的组件数，用来判断作用域有没有算错 */
  scopeSize: number;
}

/**
 * 「决策」层：哪些事件匹配上了 trigger、条件满不满足、各规划出几个动作。
 *
 * 动作段为空有三种截然不同的原因——trigger 没配对、条件不满足导致动作被全部跳过、
 * 事件里本来就没动作。只报动作的话三种长得一模一样，排查会走错方向，所以这一层单独报。
 */
export interface SimulatedEvent {
  name: string;
  conditionSatisfied: boolean;
  plannedActions: number;
  /** 条件不满足且动作被全部跳过时给一句提示 */
  note?: string;
}

/** 回调参数驱动出的消费方过滤结果——这是真算出来的，可直接作为「回调参数配没配对」的依据。 */
export interface SimulatedCallback {
  callbackName: string;
  consumer: { id: number; name: string };
  /** 过滤后的行数；结果不是数组时为 null */
  rowCount: number | null;
  /** 过滤结果本身，超长会被裁到前若干条 */
  rows: unknown;
}

export interface EventSimulationResult {
  screenKey: string;
  source: { id: number; name: string };
  triggerType: string;
  throwValue: unknown;
  /** 该组件上配置的事件总数（不论 trigger） */
  eventCount: number;
  /** 匹配到 trigger 的事件；空数组表示 trigger 没配对 */
  events: SimulatedEvent[];
  actions: SimulatedAction[];
  callbacks: SimulatedCallback[];
  /** 人话版摘要，与旧脚本的终端输出同构，给 agent 直接读 */
  summary: string;
}

export interface SimulateEventInput {
  screenKey: string;
  componentId: number;
  triggerType: EventTypeEnum;
  /** 抛出对象。core 的 dispatch 要 Record，数组形态（如整表 dataChange）也照收——它自己取首项做条件求值 */
  throwValue: Record<string, unknown> | unknown[];
}

/** 回执里的过滤结果最多带几条。整表回显没意义，agent 要的是"形状对不对、有没有数"。 */
const MAX_ROWS_IN_RESULT = 5;

const nameOf = (map: Map<string, ComponentType>, id: number | string): string => {
  const target = map.get(`${id}`);
  return target ? target.name : `(未知组件 ${id})`;
};

/**
 * 装配：磁盘 → ScreenReader → ScreenEditor。
 *
 * `init` 补的是 reader 构造时不做的两件事：过滤器基线 + 回调参数关系图。
 * 关系图为空的话，回调那一段会"什么都不发生且不报错"，干跑结论就是错的。
 */
const buildEditor = (screenKey: string): ScreenEditor => {
  const reader = new ScreenReader({ id: screenKey });
  const editor = ScreenEditor.create(reader);
  editor.init(reader.read() as unknown as LargeScreeInfo);
  return editor;
};

const buildSummary = (result: Omit<EventSimulationResult, "summary">): string => {
  const lines: string[] = [];
  lines.push(`[simulateEvent] screen_${result.screenKey}`);
  lines.push(`来源组件: ${result.source.name} (id: ${result.source.id})`);
  lines.push(`触发类型: ${result.triggerType}`);
  lines.push(`抛出值: ${JSON.stringify(result.throwValue)}`);
  lines.push(`配置的事件数: ${result.eventCount}`);

  lines.push("", "事件");
  if (!result.events.length) {
    lines.push(`  ❌ 没有 trigger 为 "${result.triggerType}" 的事件——检查事件的 trigger 类型`);
  } else {
    result.events.forEach((event, i) => {
      const cond = event.conditionSatisfied ? "✅ 条件满足" : "❌ 条件不满足";
      lines.push(`  #${i + 1} "${event.name}" [${cond}] → 规划出 ${event.plannedActions} 个动作${event.note ?? ""}`);
    });
  }

  lines.push("", "动作");
  if (!result.actions.length) {
    lines.push("  （没有匹配到该触发类型的事件，或事件里没有可执行的动作）");
  } else {
    for (const item of result.actions) {
      const cond = item.conditionSatisfied ? "✅ 条件满足" : "⚠️  条件不满足（该动作仍被执行）";
      const targets = item.targets.length
        ? item.targets.map((t) => `${t.name} (${t.id})`).join("、")
        : "（无目标组件）";
      lines.push(`  ${cond}  ${item.actionType} → ${targets}`);
      lines.push(`     作用域内可见组件: ${item.scopeSize} 个`);
    }
  }

  lines.push("", "回调参数 → 消费方过滤结果");
  if (!result.callbacks.length) {
    lines.push("  （该组件没有配置回调参数，或没有组件监听它抛出的回调）");
  } else {
    for (const cb of result.callbacks) {
      lines.push(`  ${cb.callbackName} → ${cb.consumer.name} (${cb.consumer.id}): 过滤后 ${cb.rowCount ?? "-"} 条`);
      lines.push(`     ${JSON.stringify(cb.rows)?.slice(0, 300) ?? ""}`);
    }
  }

  lines.push(
    "",
    '注：动作在 Node 里不真执行（没有 DOM），显隐/动画/跳转只报告"会被触发"；',
    '    过滤结果是真算出来的，可直接作为"回调参数配没配对"的依据。'
  );
  return lines.join("\n");
};

export const simulateEvent = async (input: SimulateEventInput): Promise<EventSimulationResult> => {
  const { screenKey, componentId, triggerType, throwValue } = input;

  // 先把全局状态存下来，无论成败都要还原
  const previousExecutor = getActionExecutor();
  const previousArgs = getRuntimeCallbackArgs();
  const previousSink = getFilterResultSink();

  const editor = buildEditor(screenKey);
  try {
    // 过滤器要取运行时回调值，得先告诉 core 去哪儿取（前端在装配时注入同一个东西）
    setCallbackArgsSource({ getCallbackArgs: () => editor.event.callbackArguments.getCallbackArgs() });
    setFilterResultSink(new MemoryFilterResultSink());
    editor.dataFilter.registerAllFilters();

    const componentMap = editor.component.getScreenWithIframeComponentMap();
    const source = componentMap.get(`${componentId}`);
    if (!source) {
      throw new Error(`组件 ${componentId} 不存在于 screen_${screenKey}`);
    }

    const recorded: SimulatedAction[] = [];
    setActionExecutor((action: Action, context) => {
      recorded.push({
        actionType: String(action.action ?? action.customActionType ?? ""),
        targets: context.componentIds.map((id) => ({ id, name: nameOf(componentMap, id) })),
        conditionSatisfied: context.isConditionSatisfied,
        scopeSize: context.globalComponentMap.size
      });
    });

    const events = source.events ?? [];
    const callbackResult = await editor.eventDispatcher.dispatch({
      events,
      triggerType,
      throwValue: throwValue as Record<string, unknown>,
      id: componentId
    });

    // 决策层：与 selectMatchingEvents 同序，可直接下标配对
    const matched = selectMatchingEvents(events, triggerType);
    const curInfo = (Array.isArray(throwValue) ? throwValue[0] : throwValue) as Record<string, unknown>;
    const planned = matched.length
      ? planEventActions({ events, triggerType, curInfo, isExecuteOnlyConditionSatisfied: true })
      : [];
    const simulatedEvents: SimulatedEvent[] = matched.map((event, i) => {
      const plan = planned[i];
      const skipped = !plan.isConditionSatisfied && !plan.actions.length;
      return {
        name: event.name ?? event.id,
        conditionSatisfied: plan.isConditionSatisfied,
        plannedActions: plan.actions.length,
        ...(skipped ? { note: "（该事件的动作被全部跳过）" } : {})
      };
    });

    // 回调层：emitCallbackFieldTrigger 返回的是"所有监听者各自的结果"，故再取一层
    const callbacks: SimulatedCallback[] = [];
    for (const [callbackName, byConsumer] of Object.entries(callbackResult)) {
      for (const [consumerId, output] of Object.entries(byConsumer)) {
        const rows = Array.isArray(output) ? output[0] : output;
        callbacks.push({
          callbackName,
          consumer: { id: Number(consumerId), name: nameOf(componentMap, consumerId) },
          rowCount: Array.isArray(rows) ? rows.length : null,
          rows: Array.isArray(rows) ? rows.slice(0, MAX_ROWS_IN_RESULT) : rows
        });
      }
    }

    const partial = {
      screenKey,
      source: { id: componentId, name: source.name },
      triggerType,
      throwValue,
      eventCount: events.length,
      events: simulatedEvents,
      actions: recorded,
      callbacks
    };
    return { ...partial, summary: buildSummary(partial) };
  } finally {
    await editor.dataFilter.unregisterAllFilters();
    setActionExecutor(previousExecutor);
    setCallbackArgsSource({ getCallbackArgs: () => previousArgs });
    setFilterResultSink(previousSink);
  }
};
