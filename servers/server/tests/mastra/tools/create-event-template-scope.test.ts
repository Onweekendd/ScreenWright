import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { InputSchema } from "@/mastra/tools/create-event-template";
import { findComponentFileInWorkspace, isAmbiguousMatch } from "@/mastra/tools/file/utils";
import { resolveComponentScope } from "@/mastra/tools/resolve-component-scope";

/**
 * 锁住 `createEventTemplate` 的 insertTo 与 `resolveComponentScope` 的**屏作用域**。
 *
 * 回归的是一次实测事故：三个 event 类 case 用同一份 fixture（组件 id 都是 4182），一轮 eval 里
 * 三块屏共存，而 insertTo 走的是「递归找到第一个就返回」——b6/b7 的事件都被插进了 b5 的
 * `screen_9001_1`，agent 发现自己屏上 events 仍为空只好用 edit_files 手写补救。断言只读自己那块屏，
 * 所以三个 case 全绿，事故完全隐身。
 */

const mkWorkspace = (): string => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "evt-scope-"));
  for (const [screen, extra] of [
    ["screen_9001_1", null],
    ["screen_9002_1", "分组"]
  ] as const) {
    const dir = path.join(base, screen, "component");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "4182_选项卡.json"), JSON.stringify({ id: 4182 }), "utf8");
    // 9002 把目标组件放进分组子目录，制造与 9001 不同的层级
    const targetDir = extra ? path.join(dir, `4190_${extra}`) : dir;
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "4183_条形图.json"), JSON.stringify({ id: 4183 }), "utf8");
  }
  return base;
};

describe("insertTo 两种形态都收", () => {
  // b6/b7 两个 case 100% 先把 insertTo 传成字符串、吃一次校验失败再重传对象。
  // 工具描述通篇讲「路径」，参数却要求包一层只有一个字段的壳——模型没错，schema 错了。
  const PATH = "screen_9002_1/component/4182/events/0";
  const parse = (insertTo: unknown) => InputSchema.parse({ triggerType: "click", insertTo });

  it("直接传路径字符串", () => {
    expect(parse(PATH).insertTo).toBe(PATH);
  });

  it("传 { path } 对象仍然兼容", () => {
    expect(parse({ path: PATH }).insertTo).toEqual({ path: PATH });
  });

  it("两种形态之外仍然拒绝", () => {
    expect(() => parse({ target: PATH })).toThrow();
    expect(() => parse(123)).toThrow();
  });
});

describe("insertTo 的屏作用域", () => {
  it("裸 id 且多块屏都有该组件时报歧义，而不是取目录序第一个", async () => {
    const base = mkWorkspace();
    const found = await findComponentFileInWorkspace(base, "4182");
    expect(isAmbiguousMatch(found)).toBe(true);
    if (isAmbiguousMatch(found)) {
      expect(found.ambiguous).toHaveLength(2);
      expect(found.ambiguous.some((p) => p.startsWith("screen_9002_1/"))).toBe(true);
    }
  });

  it("带屏前缀时只在该屏里找，不会串到别的屏", async () => {
    const base = mkWorkspace();
    const found = await findComponentFileInWorkspace(base, "9002_1/4182");
    expect(isAmbiguousMatch(found)).toBe(false);
    if (!isAmbiguousMatch(found) && found) {
      expect(found.file.replace(/\\/gu, "/")).toContain("screen_9002_1/");
    }
  });

  it("裸 id 且只有一块屏有该组件时仍然可用（不因收紧而误伤单屏工作区）", async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "evt-scope-single-"));
    const dir = path.join(base, "screen_9001_1", "component");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "4182_选项卡.json"), JSON.stringify({ id: 4182 }), "utf8");
    const found = await findComponentFileInWorkspace(base, "4182");
    expect(isAmbiguousMatch(found)).toBe(false);
    expect(found).not.toBeNull();
  });
});

describe("resolveComponentScope 的屏作用域", () => {
  it("给了 screenKey 时按该屏的层级判定：目标在分组里 → All", () => {
    const base = mkWorkspace();
    expect(resolveComponentScope(4182, [4183], base, "9002_1")).toBe("all");
  });

  it("同一屏内同级 → current", () => {
    const base = mkWorkspace();
    expect(resolveComponentScope(4182, [4183], base, "9001_1")).toBe("current");
  });

  it("不给 screenKey 时退化为全工作区搜——两屏结构不同却都答 current，这正是要避免的", () => {
    const base = mkWorkspace();
    // 9001 与 9002 层级不同，但全区搜只会看到 9001，于是恒答 current。
    // 保留这条是为了把「不传屏就会答错」这件事钉死在测试里，而不是让它悄悄发生。
    expect(resolveComponentScope(4182, [4183], base)).toBe("current");
  });
});
