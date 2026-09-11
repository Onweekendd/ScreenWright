import type { Filter } from "@screenwright/types";
import { beforeEach, describe, expect, it } from "vitest";

import { CompiledFunctionCache, getCompiledFunctionCache } from "../CompiledFunctionCache";
import { FilterExecutor } from "../FilterExecutor";

const makeFilter = (name: string, body: string): Filter => ({ name, dataFormatter: body }) as unknown as Filter;

const listen = (filterName: string) => ({ filterName, usageStatus: true, callbackFields: [] });

describe("CompiledFunctionCache", () => {
  beforeEach(() => {
    getCompiledFunctionCache().clear();
    getCompiledFunctionCache().resetStats();
  });

  it("getOrCompile 编译并执行；相同代码命中缓存", () => {
    const cache = getCompiledFunctionCache();
    const filter = makeFilter("double", "(data) => data.map((n) => n * 2)");

    const fn1 = cache.getOrCompile(filter);
    expect(fn1([1, 2, 3])).toEqual([2, 4, 6]);

    const fn2 = cache.getOrCompile(filter);
    expect(fn2).toBe(fn1); // 命中缓存，返回同一函数
    expect(cache.getStats().hits).toBe(1);
  });

  it("代码变化后重新编译", () => {
    const cache = getCompiledFunctionCache();
    cache.getOrCompile(makeFilter("f", "(d) => d"));
    const fn = cache.getOrCompile(makeFilter("f", "(d) => d.slice(0, 1)"));
    expect(fn([1, 2, 3])).toEqual([1]);
    expect(cache.getStats().codeChanges).toBe(1);
  });

  it("getInstance 为单例", () => {
    expect(CompiledFunctionCache.getInstance()).toBe(getCompiledFunctionCache());
  });
});

describe("FilterExecutor", () => {
  beforeEach(() => {
    getCompiledFunctionCache().clear();
  });

  it("无过滤器时原样返回数据", () => {
    const exec = new FilterExecutor();
    const data = [1, 2, 3];
    const res = exec.execute({ dataFilter: {}, listenArgs: [], data, callbackArgs: {} });
    expect(res).toEqual([1, 2, 3]);
  });

  it("按 listenArgs 顺序串联执行过滤器链", () => {
    const exec = new FilterExecutor();
    const dataFilter = {
      addOne: makeFilter("addOne", "(data) => data.map((n) => n + 1)"),
      keepEven: makeFilter("keepEven", "(data) => data.filter((n) => n % 2 === 0)")
    };
    const res = exec.execute({
      dataFilter,
      listenArgs: [listen("addOne"), listen("keepEven")],
      data: [1, 2, 3, 4],
      callbackArgs: {}
    });
    // +1 -> [2,3,4,5]，保留偶数 -> [2,4]
    expect(res).toEqual([2, 4]);
  });

  it("过滤器可读取 callbackArgs", () => {
    const exec = new FilterExecutor();
    const dataFilter = {
      scale: makeFilter("scale", "(data, args) => data.map((n) => n * args.factor)")
    };
    const res = exec.execute({
      dataFilter,
      listenArgs: [listen("scale")],
      data: [1, 2, 3],
      callbackArgs: { factor: 10 }
    });
    expect(res).toEqual([10, 20, 30]);
  });

  it("过滤器抛错时链终止并返回空数组；getProcessorsData 标记失败", () => {
    const exec = new FilterExecutor();
    const dataFilter = {
      boom: makeFilter("boom", "(data) => { throw new Error('x'); }")
    };
    exec.setInputData([1, 2, 3]);
    const res = exec.execute({
      dataFilter,
      listenArgs: [listen("boom")],
      data: [1, 2, 3],
      callbackArgs: {}
    });
    expect(res).toEqual([]);

    const processors = exec.getProcessorsData();
    expect(processors[0].filterName).toBe("boom");
    expect(processors[0].success).toBe(false);
    expect(processors[0].error).toBeInstanceOf(Error);
  });

  it("usageStatus=false 的过滤器被跳过", () => {
    const exec = new FilterExecutor();
    const dataFilter = {
      addOne: makeFilter("addOne", "(data) => data.map((n) => n + 1)")
    };
    const res = exec.execute({
      dataFilter,
      listenArgs: [{ filterName: "addOne", usageStatus: false, callbackFields: [] }],
      data: [1, 2, 3],
      callbackArgs: {}
    });
    expect(res).toEqual([1, 2, 3]);
  });
});
