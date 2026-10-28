import { describe, expect, it } from "vitest";

import { buildComponentReference } from "../../src/mastra/services/bi-data-sync/component-references";
import { validateComponentContent } from "../../src/mastra/tools/file/utils";
import { comp } from "./factories";

describe("component file references", () => {
  it("文件名按写入规则净化，引用不携带子树或样式", () => {
    const ref = buildComponentReference(
      comp({ id: 2, name: "销售/额", title: "文本框", prop: "swtext", option: { color: "#fff" } })
    );
    expect(ref).toEqual({ id: 2, name: "销售/额", type: "文本框", prop: "swtext", file: "2_销售额.json" });
  });

  it("新引用与旧字符串都能通过组件结构校验并归一成 id", () => {
    const group = comp({ id: 1, prop: "sw-folder", name: "分组" });
    const child = buildComponentReference(comp({ id: 2, name: "文本", prop: "swtext" }));
    for (const children of [[child], ["2_文本"]]) {
      const result = validateComponentContent(JSON.stringify({ ...group, display: true, option: {}, children }));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.children).toEqual([2]);
    }
  });
});
