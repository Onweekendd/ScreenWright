import {
  getFilterResultSink,
  getRuntimeCallbackArgs,
  MemoryEditorState,
  MemoryFilterResultSink,
  ScreenEditor,
  setCallbackArgsSource,
  setFilterResultSink
} from "@screenwright/core";
import { type ComponentType, DataType, type LargeScreeInfo, type ParsedLargeScreenInfo } from "@screenwright/types";

import { type Assertion, findComponent } from "./case";

interface ProductionRow {
  name: string;
  output: number;
}

const matchesProduction = (output: unknown, expected: ProductionRow[]): boolean => {
  if (!Array.isArray(output) || output.length !== expected.length) {
    return false;
  }
  return expected.every((line) =>
    output.some((row: unknown) => {
      if (!row || typeof row !== "object") {
        return false;
      }
      const item = row as Record<string, unknown>;
      return item.name === line.name && item.value === line.output && typeof item.seriesName === "string";
    })
  );
};

/**
 * 仅验证响应体之后的链路，不模拟浏览器发请求，也不补 agent 遗漏的配置。
 * 在内存副本将容器输入替换为响应体，复用 core 的过滤、字段映射、回调关系与消费方重算。
 * 禁止将响应写回工作区，否则静态示例会掩盖 API 请求未配置的问题。
 */
export const verifyProductionBinding = async (
  screen: ParsedLargeScreenInfo,
  sourceId: number,
  targetId: number,
  rows: ProductionRow[]
): Promise<Assertion[]> => {
  const assertions: Assertion[] = [];
  const editor = ScreenEditor.create(new MemoryEditorState());
  const previousArgs = getRuntimeCallbackArgs();
  const previousSink = getFilterResultSink();
  const sink = new MemoryFilterResultSink();
  try {
    const copy = structuredClone(screen);
    const source = findComponent(copy, sourceId);
    const target = findComponent(copy, targetId);
    if (!source || !target) {
      throw new Error("缺少数据容器或目标图表");
    }
    // 只替换输入适配层。容器的原始 dataType / dataSource 另由 case 静态断言。
    source.dataType = DataType.STATIC;
    source.data = { code: 0, data: structuredClone(rows) } as unknown as ComponentType["data"];
    editor.init(copy as unknown as LargeScreeInfo);
    setCallbackArgsSource({ getCallbackArgs: () => editor.event.callbackArguments.getCallbackArgs() });
    setFilterResultSink(sink);
    const outputs = new Map<number, unknown>();
    editor.dataFilter.registerAllFilters((component, output) => outputs.set(component.id, output));

    await editor.dataFilter.calculateComponentData(target);
    const initialErrors = sink.getResults(target).filter((result) => result.success === false);
    assertions.push({
      name: "离线：上游尚未返回时图表过滤器不抛错",
      passed: initialErrors.length === 0,
      detail: initialErrors.map((result) => result.error?.message).join("；") || undefined
    });

    const output = await editor.dataFilter.calculateComponentData(source);
    const throwValue: unknown = Array.isArray(output) ? output[0] : output;
    if (!throwValue || typeof throwValue !== "object") {
      throw new Error("容器过滤器没有返回可抛出的对象");
    }
    const sourceErrors = sink.getResults(source).filter((result) => result.success === false);
    if (sourceErrors.length) {
      throw new Error(sourceErrors.map((result) => result.error?.message).join("；"));
    }
    await editor.dataFilter.dispatchCallback({ sourceComponent: source, throwValue });
    const result = outputs.get(targetId);
    assertions.push({
      name: "离线：模拟响应经容器回调生成各产线的当日产量",
      passed: matchesProduction(result, rows),
      detail: result === undefined ? "没有回调触发目标图表重算" : JSON.stringify(result)?.slice(0, 800)
    });
  } catch (error) {
    assertions.push({
      name: "离线：模拟响应经容器回调生成各产线的当日产量",
      passed: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await editor.dataFilter.unregisterAllFilters();
    setCallbackArgsSource({ getCallbackArgs: () => previousArgs });
    setFilterResultSink(previousSink);
  }
  return assertions;
};
