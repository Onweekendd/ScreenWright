import { cpSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：这些用例会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output-info-edit");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { applyScreenInfoEdit } from "@/mastra/services/bi-data-sync/screen-file-edit";
import { ScreenReader } from "@/mastra/services/bi-data-sync/screen-read";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const infoFile = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`, "info.json");

const readInfo = () => JSON.parse(readFileSync(infoFile, "utf8")) as { detail: Record<string, unknown> };

/** 前端「屏幕大小」控件曾经把宽高写成数字——磁盘上留下的就是这份脏数据 */
const corruptWidthHeight = () => {
  const info = readInfo();
  info.detail.width = 1920;
  info.detail.height = 1080;
  writeFileSync(infoFile, JSON.stringify(info, null, 2));
};

/**
 * info.json 本身不合 schema 时，修它的那次编辑必须能落地。
 *
 * 读屏一律过 schema，磁盘上的 info.json 一旦是坏的，整块屏的读取、组件编辑、整屏回写全部抛错。
 * 唯一的出路是改 info.json 本身——这条路要是也先去读磁盘上的旧版，就会被同一个错拦住，屏永远修不回来。
 */
describe("applyScreenInfoEdit：修复不合 schema 的 info.json", () => {
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    cpSync(FIXTURE, path.dirname(infoFile), {
      recursive: true,
      filter: (src) => !src.split(/[\\/]/).includes(".git")
    });
    corruptWidthHeight();
  });

  afterEach(cleanOutput);

  it("前提：脏数据下整屏读取直接抛错（组件编辑因此全部失败）", () => {
    expect(() => new ScreenReader({ id: SCREEN_ID })).toThrow(/Screen data validation failed \(info\.json\)/);
  });

  it("用修好的内容编辑 info.json 能落盘，之后整屏可以正常读取", async () => {
    const fixed = readInfo();
    fixed.detail.width = "1920";
    fixed.detail.height = "1080";

    await applyScreenInfoEdit(infoFile, JSON.stringify(fixed, null, 2));

    expect(readInfo().detail).toMatchObject({ width: "1920", height: "1080" });
    expect(() => new ScreenReader({ id: SCREEN_ID })).not.toThrow();
  });
});
