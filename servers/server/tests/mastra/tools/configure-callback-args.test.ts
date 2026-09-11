import { describe, expect, it } from "vitest";

import { buildCallbackEntry, collectAvailableFields } from "@/mastra/tools/configure-callback-args";

describe("collectAvailableFields", () => {
  it("取 data[0] 的键——抛出对象就是渲染数据的一项", () => {
    const fields = collectAvailableFields({ data: [{ seriesName: "系列一", name: "A", value: 1 }] });
    expect(fields).toContain("seriesName");
    expect(fields).toContain("name");
    expect(fields).toContain("value");
  });

  it("恒含 echart click 的四个固定键——它们不在 data[0] 里但确实抛得出来", () => {
    const fields = collectAvailableFields({ data: [{ foo: 1 }] });
    expect(fields).toEqual(expect.arrayContaining(["name", "value", "seriesName", "data"]));
  });

  it("dataRemark 的 key 与 map 都算可用别名", () => {
    const fields = collectAvailableFields({
      data: [{ raw: 1 }],
      dataRemark: [{ key: "别名", map: "raw" }]
    });
    expect(fields).toContain("别名");
    expect(fields).toContain("raw");
  });

  it("data 为空时不崩，只剩固定键", () => {
    expect(collectAvailableFields({})).toEqual(["data", "name", "seriesName", "value"]);
  });
});

describe("buildCallbackEntry", () => {
  it("把 origin/target 补成 CallbackSchema 要求的完整形状", () => {
    const entry = buildCallbackEntry("name", "selectedName");
    expect(entry.value.origin.value).toBe("name");
    expect(entry.value.target.value).toBe("selectedName");
    // 这四个是 agent 手写 cbArgs 时最容易漏或填错的样板字段
    expect(entry.value.origin.displayName).toBe("字段值");
    expect(entry.value.target.displayName).toBe("变量名");
    expect(entry.type).toBe("object");
    expect(entry.method).toBe("default");
  });

  it("每次生成不同的 id", () => {
    expect(buildCallbackEntry("a", "b").id).not.toBe(buildCallbackEntry("a", "b").id);
  });
});
