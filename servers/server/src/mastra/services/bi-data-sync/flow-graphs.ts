import type { ComponentType, ParsedLargeScreenInfo } from "@screenwright/types";

import { flattenComponents } from "./component-tree";
import type { DataFlowEntry, EventFlowEntry } from "./types";

/**
 * 事件-行为链路 / 回调参数数据流图构建（无状态纯函数）。
 * 产物按 sourceId / argName 落成 _event_flows、_callback_flows 下的独立文件，供 agent 按需读取。
 */

export const buildEventFlowGraph = (layers: ComponentType[]): Map<string, EventFlowEntry[]> => {
  const flat = flattenComponents(layers);
  const idToName = new Map(flat.map((c) => [String(c.id), c.name ?? c.title ?? ""]));
  const bySource = new Map<string, EventFlowEntry[]>();

  for (const comp of flat) {
    const sourceId = String(comp.id);
    const sourceName = comp.name ?? comp.title ?? "";

    for (const event of (comp.events ?? []) as Array<{
      trigger: string;
      conditions?: Array<{ field?: string; compare?: string; expected?: string }>;
      actions?: Array<{ action: string; component?: string[] }>;
    }>) {
      const targets: EventFlowEntry["targets"] = [];
      for (const action of event.actions ?? []) {
        for (const token of action.component ?? []) {
          const match = /\$component\((\d+)\)/.exec(token);
          if (match) {
            targets.push({ id: match[1], name: idToName.get(match[1]) ?? "", actionType: action.action });
          }
        }
      }

      const conditions = (event.conditions ?? []).map((c) => ({
        ...(c.field ? { field: c.field } : {}),
        ...(c.compare ? { compare: c.compare } : {}),
        ...(c.expected !== undefined ? { expected: c.expected } : {})
      }));

      if (!bySource.has(sourceId)) {
        bySource.set(sourceId, []);
      }
      bySource.get(sourceId)!.push({ sourceId, sourceName, trigger: event.trigger, conditions, targets });
    }
  }

  return bySource;
};

/**
 * 根据组件树和过滤器字典构建回调参数数据流图
 * 结构：callbackArgName → { emittedBy（哪些组件在哪些事件上抛出）, consumedBy（哪些过滤器消费并绑定到哪些组件）}
 */
export const buildCallbackFlowGraph = (
  layers: ComponentType[],
  dataFilterArr: ParsedLargeScreenInfo["dataFilterArr"]
): Record<string, DataFlowEntry> => {
  const flat = flattenComponents(layers);
  const filterNames = new Map(
    dataFilterArr ? Object.entries(dataFilterArr).map(([name, filter]) => [name, filter]) : []
  );

  // callbackArgName → source 列表
  const sourcesByArg = new Map<string, DataFlowEntry["emittedBy"]>();
  for (const comp of flat) {
    let onEvents = ((comp.events ?? []) as Array<{ trigger: string }>).map((e) => e.trigger);
    // 数据容器在数据加载完成时自动触发 dataChange，无需手动配置事件
    if (onEvents.length === 0 && comp.component.prop === "sw-dataContainer") {
      onEvents = ["dataChange"];
    }
    for (const cbArg of (comp.cbArgs ?? []) as Array<{
      value: { origin: { value: string }; target: { value: string } };
    }>) {
      const argName = cbArg.value?.target?.value;
      if (!argName) {
        continue;
      }
      if (!sourcesByArg.has(argName)) {
        sourcesByArg.set(argName, []);
      }
      sourcesByArg.get(argName)!.push({
        id: String(comp.id),
        name: comp.name ?? comp.title ?? "",
        originField: cbArg.value?.origin?.value ?? "",
        onEvents
      });
    }
  }

  // callbackArgName → consumer 列表（对齐 registerTargetComponents：从组件 listenArgs 侧构建，openFilter 为 false 时跳过）
  const consumersByArg = new Map<string, DataFlowEntry["consumedBy"]>();
  for (const comp of flat) {
    const openFilter = (comp as unknown as Record<string, unknown>).openFilter;
    const listenArgs = (comp.listenArgs ?? []) as Array<{ filterName: string; callbackFields: string[] }>;
    if (!listenArgs.length || !openFilter) {
      continue;
    }

    for (const arg of listenArgs) {
      if (!filterNames.has(arg.filterName)) {
        continue;
      }

      const filter = filterNames.get(arg.filterName);
      if (!filter) {
        continue;
      }

      for (const field of filter.callBack) {
        if (!consumersByArg.has(field)) {
          consumersByArg.set(field, []);
        }
        const consumers = consumersByArg.get(field)!;
        const existing = consumers.find((c) => c.filterName === arg.filterName);
        if (existing) {
          existing.boundTo.push({ id: String(comp.id), name: comp.name ?? comp.title ?? "" });
        } else {
          consumers.push({
            filterName: arg.filterName,
            boundTo: [{ id: String(comp.id), name: comp.name ?? comp.title ?? "" }]
          });
        }
      }
    }
  }

  const allArgNames = new Set([...sourcesByArg.keys(), ...consumersByArg.keys()]);
  const graph: Record<string, DataFlowEntry> = {};
  for (const argName of allArgNames) {
    graph[argName] = {
      emittedBy: sourcesByArg.get(argName) ?? [],
      consumedBy: consumersByArg.get(argName) ?? []
    };
  }
  return graph;
};
