/**
 * `change` 回执的构造规则。
 *
 * 这层的价值全在「回执得让 agent 不必再读一遍文件」，所以测的重点是两条边界：
 * 报的位置对不对（行号按改动后的内容算），以及会不会把整个文件倒回去（截断）。
 */
import { describe, expect, it } from "vitest";

import { capChanges, createdChange, deletedChange, diffChange, fieldChange } from "@/mastra/tools/change-report";

describe("diffChange", () => {
  it("只报变化的那几行，行号按改动后的内容算", () => {
    const before = ["{", '  "a": 1,', '  "openFilter": false,', '  "b": 2', "}"].join("\n");
    const after = ["{", '  "a": 1,', '  "openFilter": true,', '  "b": 2', "}"].join("\n");

    expect(diffChange("c.json", before, after)).toEqual([{ file: "c.json", line: 3, after: '  "openFilter": true,' }]);
  });

  it("连续变化的行并成一个 hunk，不是逐行一项", () => {
    const before = ["{", '  "cbArgs": [],', "}"].join("\n");
    const after = ["{", '  "cbArgs": [', "    {", '      "id": "callback_x"', "    }", "  ],", "}"].join("\n");

    const changes = diffChange("c.json", before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].line).toBe(2);
    expect(changes[0].after).toBe('  "cbArgs": [\n    {\n      "id": "callback_x"\n    }\n  ],');
  });

  it("内容没变就没有改动可报", () => {
    expect(diffChange("c.json", "same\n", "same\n")).toEqual([]);
  });

  it("纯删除也算一处改动，但交代的是删了几行", () => {
    const before = ["a", "b", "c", "d"].join("\n");
    const after = ["a", "d"].join("\n");

    expect(diffChange("c.json", before, after)).toEqual([{ file: "c.json", line: 2, after: "（删掉了 2 行）" }]);
  });

  // 回执的成本得封顶，否则一次大重写会把整个文件顺着回执倒回给模型
  it("超长 hunk 截断并标注剩余行数", () => {
    const after = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
    const [change] = diffChange("c.json", "", after);

    const lines = (change.after ?? "").split("\n");
    expect(lines).toHaveLength(21);
    expect(lines.at(-1)).toBe("…(另有 10 行)");
  });

  it("副作用文件带上一句说明", () => {
    const [change] = diffChange("c.json", "a", "b", "这个文件不是你点名改的");
    expect(change.note).toBe("这个文件不是你点名改的");
  });
});

describe("createdChange / deletedChange", () => {
  it("新建文件只报行数，不倒全文", () => {
    expect(createdChange("f.js", "a\nb\nc")).toEqual({ file: "f.js", created: true, lines: 3 });
  });

  it("删除文件只报路径", () => {
    expect(deletedChange("f.js")).toEqual({ file: "f.js", deleted: true });
  });
});

describe("fieldChange", () => {
  const content = [
    "{",
    '  "id": 900001,',
    '  "listenArgs": [',
    "    {",
    '      "filterName": "X"',
    "    }",
    "  ],",
    '  "openFilter": true',
    "}"
  ].join("\n");

  it("按缩进摘出整个字段块", () => {
    const change = fieldChange("c.json", content, "listenArgs");

    expect(change?.line).toBe(3);
    expect(change?.after).toBe('  "listenArgs": [\n    {\n      "filterName": "X"\n    }\n  ],');
  });

  it("单行字段也摘得出来", () => {
    expect(fieldChange("c.json", content, "openFilter")?.after).toBe('  "openFilter": true');
  });

  // 字段被删掉的情况：调用方据此决定不报这一处，而不是报一个空块
  it("字段不存在时返回 undefined", () => {
    expect(fieldChange("c.json", content, "cbArgs")).toBeUndefined();
  });
});

describe("capChanges", () => {
  it("改动处数封顶，超出折成一句交代", () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ file: `f${i}.json` }));
    const capped = capChanges(many);

    expect(capped).toHaveLength(11);
    expect(capped.at(-1)?.after).toBe("…另有 3 处改动未列出");
  });

  it("没超就原样返回", () => {
    const few = [{ file: "a.json" }, { file: "b.json" }];
    expect(capChanges(few)).toBe(few);
  });
});
