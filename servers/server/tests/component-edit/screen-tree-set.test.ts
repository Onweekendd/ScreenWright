import { cpSync, mkdtempSync, readFileSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ScreenTreeSet } from "@/mastra/services/bi-data-sync/screen-tree-set";

const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", "screen_75_1");

/**
 * 一批编辑共用整屏树时，「能不能叠在同一棵树上」的判定。
 *
 * mock 大屏的结构：
 *   4152 / 4153  顶层条形图（兄弟）
 *   4156 分组
 *     ├─ 4154
 *     └─ 4155
 */
describe("ScreenTreeSet", () => {
  const originalWorkspace = process.env.MASTRA_WORKSPACE_PATH;
  let workspace: string;
  let screenDir: string;
  let componentFile: string;

  beforeEach(() => {
    workspace = path.join(mkdtempSync(path.join(os.tmpdir(), "screen-tree-set-")), "agent-workspace");
    screenDir = path.join(workspace, "screen_75_1");
    // fixture 目录里的 .git 是 gitlink，拷进来会让 Windows 上的清理撞 EBUSY
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
    process.env.MASTRA_WORKSPACE_PATH = workspace;
    componentFile = path.join(screenDir, "component", "4152_条形图.json");
  });

  afterEach(() => {
    process.env.MASTRA_WORKSPACE_PATH = originalWorkspace;
    rmSync(path.dirname(workspace), { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const openTree = () => {
    const trees = new ScreenTreeSet();
    const tree = trees.open(componentFile);
    if (!tree) {
      throw new Error("fixture 路径应当落在大屏目录下");
    }
    return { trees, tree };
  };

  it("同一块屏只读一次：同屏的不同文件拿到同一棵树", () => {
    const { trees, tree } = openTree();
    expect(trees.open(path.join(screenDir, "info.json"))).toBe(tree);
  });

  it("不在大屏目录下的路径拿不到树", () => {
    expect(new ScreenTreeSet().open(path.join(workspace, "notes.txt"))).toBeNull();
  });

  it("兄弟组件可以叠在同一棵树上", () => {
    const { trees, tree } = openTree();
    expect(trees.claim(tree, { componentId: 4152 })).toBe(true);
    expect(trees.claim(tree, { componentId: 4153 })).toBe(true);
    expect(trees.claim(tree, { componentId: 4154 })).toBe(true);
    expect(trees.claim(tree, { componentId: 4155 })).toBe(true);
  });

  it.each([
    ["同一个组件", 4152, 4152],
    ["先成员后分组", 4155, 4156],
    ["先分组后成员", 4156, 4155]
  ])("%s不能叠：后一次内联会把前一次冲回盘上的旧版", (_label, first, second) => {
    const { trees, tree } = openTree();
    expect(trees.claim(tree, { componentId: first })).toBe(true);
    expect(trees.claim(tree, { componentId: second })).toBe(false);
  });

  it("过滤器（影响面说不清）独占一块屏", () => {
    const { trees, tree } = openTree();
    expect(trees.claim(tree, { componentId: 4152 })).toBe(true);
    expect(trees.claim(tree, "screen")).toBe(false);

    const fresh = openTree();
    expect(fresh.trees.claim(fresh.tree, "screen")).toBe(true);
    expect(fresh.trees.claim(fresh.tree, { componentId: 4152 })).toBe(false);
    expect(fresh.trees.claim(fresh.tree, "screenInfo")).toBe(false);
  });

  it("屏幕配置跟组件互不影响，但同一批只能换一次", () => {
    const { trees, tree } = openTree();
    expect(trees.claim(tree, { componentId: 4152 })).toBe(true);
    expect(trees.claim(tree, "screenInfo")).toBe(true);
    expect(trees.claim(tree, "screenInfo")).toBe(false);
  });

  it("认领失败什么都不登记", () => {
    const { trees, tree } = openTree();
    expect(trees.claim(tree, { componentId: 4155 })).toBe(true);
    expect(trees.claim(tree, { componentId: 4156 })).toBe(false);
    // 4156 没登记上，跟它无关的兄弟照样能叠
    expect(trees.claim(tree, { componentId: 4152 })).toBe(true);
  });

  it("flush 只写标记过的屏", () => {
    const infoFile = path.join(screenDir, "info.json");
    const before = readFileSync(infoFile, "utf8");
    const { trees, tree } = openTree();
    tree.editor.screen.replaceNavInfo({ ...tree.reader.navInfo, name: "改过的名字" });

    trees.flush();
    expect(readFileSync(infoFile, "utf8")).toBe(before);

    trees.markDirty(tree);
    trees.flush();
    expect(JSON.parse(readFileSync(infoFile, "utf8")).name).toBe("改过的名字");
  });
});
