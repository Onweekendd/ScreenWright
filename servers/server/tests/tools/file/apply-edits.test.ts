import { describe, expect, it } from "vitest";

import { applyEdits, findNoopEditIndex } from "@/mastra/tools/file/apply-edits";
import { StringNotFoundError, StringNotUniqueError } from "@/mastra/tools/file/utils";

/**
 * edit_files 的文本引擎。此前埋在 processFileEdit 中段，只能靠跑整个工具（建临时工作区、
 * 造 suspend/resume 上下文）间接测到；抽成纯函数之后可以直接把边界钉死。
 */
describe("applyEdits", () => {
  it("单条替换", () => {
    expect(applyEdits("hello world", [{ old_string: "world", new_string: "there" }])).toEqual({
      content: "hello there",
      replacements: 1
    });
  });

  it("多条按顺序作用在上一条的结果上", () => {
    const result = applyEdits("a", [
      { old_string: "a", new_string: "b" },
      { old_string: "b", new_string: "c" }
    ]);

    // 第二条改的是 "b" 而不是原始内容里的 "a"
    expect(result).toEqual({ content: "c", replacements: 2 });
  });

  it("replace_all 时全部替换，次数累加", () => {
    expect(applyEdits("x x x", [{ old_string: "x", new_string: "y", replace_all: true }])).toEqual({
      content: "y y y",
      replacements: 3
    });
  });

  it("未开 replace_all 却命中多处时报错，避免误改", () => {
    expect(() => applyEdits("x x", [{ old_string: "x", new_string: "y" }])).toThrow(StringNotUniqueError);
  });

  it("找不到 old_string 时报错", () => {
    expect(() => applyEdits("hello", [{ old_string: "nope", new_string: "y" }])).toThrow(StringNotFoundError);
  });

  /**
   * 原实现是 `new StringNotFoundError(`${prefix}${error.message}`)`，看着在拼前缀，
   * 但那两个错误类的构造参数是 searchString 不是 message，前缀被塞进了没人读的字段，
   * 模型收到的永远是不带下标的通用文案。抽成纯函数直接断言消息才发现。
   */
  it("错误消息带 edits[i] 前缀，指明是第几条挂的", () => {
    expect(() =>
      applyEdits("a b", [
        { old_string: "a", new_string: "A" },
        { old_string: "zzz", new_string: "Z" }
      ])
    ).toThrow(/edits\[1\]: /);

    expect(() => applyEdits("x x", [{ old_string: "x", new_string: "y" }])).toThrow(/edits\[0\]: /);
  });

  it("抛出时不返回半成品：一个文件内的 edit 是原子的", () => {
    const original = "a b";
    let thrown: unknown;
    try {
      applyEdits(original, [
        { old_string: "a", new_string: "A" },
        { old_string: "zzz", new_string: "Z" }
      ]);
    } catch (error) {
      thrown = error;
    }

    // 没有任何「已经改了一半」的结果能被调用方拿到，落盘与否完全由调用方在 catch 之外决定
    expect(thrown).toBeInstanceOf(StringNotFoundError);
    expect(original).toBe("a b");
  });

  it("空 edits 原样返回", () => {
    expect(applyEdits("unchanged", [])).toEqual({ content: "unchanged", replacements: 0 });
  });
});

describe("findNoopEditIndex", () => {
  it("找出第一条改了等于没改的下标", () => {
    expect(
      findNoopEditIndex([
        { old_string: "a", new_string: "b" },
        { old_string: "same", new_string: "same" }
      ])
    ).toBe(1);
  });

  it("没有则返回 -1", () => {
    expect(findNoopEditIndex([{ old_string: "a", new_string: "b" }])).toBe(-1);
  });
});
