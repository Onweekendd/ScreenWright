import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const OUTPUT_DIR = path.resolve(__dirname, "output");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { commitScreenSnapshot, ensureRepo, getRollbackPreview, listNodes } from "@/mastra/services/version-history";

const SCREEN_ID = "900";
const DIR_KEY = `${SCREEN_ID}_1`;
const screenRoot = path.join(OUTPUT_DIR, `screen_${DIR_KEY}`);

/**
 * 与生产的 git 封装同样挂 `-c core.quotepath=false`：不关的话含中文的文件名在输出里会被转成
 * 八进制转义并包上双引号（"component/4001_\346\235\241..."），断言全都对不上。
 */
const git = async (args: string[]) => {
  const { stdout } = await execFileAsync("git", ["-c", "core.quotepath=false", ...args], { cwd: screenRoot });
  return stdout;
};

/** 已被 git 跟踪的文件列表 */
const trackedFiles = async () =>
  (await git(["ls-files"]))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

const write = (rel: string, content: string) => {
  const abs = path.join(screenRoot, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf-8");
};

/** 铺一份最小大屏：用户内容 + 派生索引各若干 */
const seedScreen = () => {
  write("info.json", JSON.stringify({ id: 900, name: "测试屏" }, null, 2));
  write("component/4001_条形图.json", JSON.stringify({ id: 4001, title: "条形图" }, null, 2));
  write("dataFilterArr/f1.json", JSON.stringify({ name: "f1" }, null, 2));
  // 派生索引：根层与嵌套层都有
  write("_meta.json", JSON.stringify({ updatedTime: "t0", componentIds: [4001] }, null, 2));
  write("_layout.json", JSON.stringify({ screen: { id: 900 }, ascii_map: "AAA" }, null, 2));
  write("component/4002_分组/_layout.json", JSON.stringify({ ascii_map: "BBB" }, null, 2));
  write("_callback_flows/argA.json", JSON.stringify({ producers: [] }, null, 2));
  write("_event_flows/4001.json", JSON.stringify([], null, 2));
};

const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

describe("版本历史：派生索引不进 git", () => {
  beforeEach(() => {
    cleanOutput();
    mkdirSync(screenRoot, { recursive: true });
    seedScreen();
  });

  afterEach(cleanOutput);

  it("新仓库：.gitignore 同时含运行环境噪声与派生索引", async () => {
    await ensureRepo(screenRoot);

    const ignore = readFileSync(path.join(screenRoot, ".gitignore"), "utf-8");
    for (const pattern of [
      "node_modules/",
      ".mastra/",
      "_meta.json",
      "_layout.json",
      "_callback_flows/",
      "_event_flows/"
    ]) {
      expect(ignore).toContain(pattern);
    }
  });

  it("首次提交只收用户内容，派生索引一个都不进索引", async () => {
    await commitScreenSnapshot(SCREEN_ID, "初始");

    expect(await trackedFiles()).toEqual([
      ".gitignore",
      "component/4001_条形图.json",
      "dataFilterArr/f1.json",
      "info.json"
    ]);
    // 磁盘上文件仍在，只是不归 git 管——下一次 syncScreenData 照常读写
    expect(existsSync(path.join(screenRoot, "_layout.json"))).toBe(true);
    expect(existsSync(path.join(screenRoot, "_callback_flows/argA.json"))).toBe(true);
  });

  it("改派生索引不产生新提交（nothing to commit）", async () => {
    await commitScreenSnapshot(SCREEN_ID, "初始");
    const before = await listNodes(DIR_KEY);

    write("_layout.json", JSON.stringify({ screen: { id: 900 }, ascii_map: "改过了" }, null, 2));
    write("_meta.json", JSON.stringify({ updatedTime: "t1", componentIds: [4001, 4002] }, null, 2));
    await commitScreenSnapshot(SCREEN_ID, "只动了派生索引");

    expect(await listNodes(DIR_KEY)).toHaveLength(before.length);
  });

  it("改组件时提交里只有那个组件，不夹带派生索引", async () => {
    await commitScreenSnapshot(SCREEN_ID, "初始");

    write("component/4001_条形图.json", JSON.stringify({ id: 4001, title: "条形图_改过" }, null, 2));
    // 整屏回写必然连带重算这些
    write("_layout.json", JSON.stringify({ screen: { id: 900 }, ascii_map: "跟着变了" }, null, 2));
    write("component/4002_分组/_layout.json", JSON.stringify({ ascii_map: "也跟着变" }, null, 2));
    await commitScreenSnapshot(SCREEN_ID, "改标题");

    const [latest] = await listNodes(DIR_KEY);
    expect(latest.files.map((f) => f.file)).toEqual(["component/4001_条形图.json"]);
  });

  it("老仓库迁移：已被跟踪的派生索引会被摘出索引，磁盘文件保留", async () => {
    // 造一个「加规则之前」的仓库：派生索引已经 commit 进去了
    await git(["init"]);
    await git(["config", "user.email", "ai@screenwright.local"]);
    await git(["config", "user.name", "Screenwright AI"]);
    writeFileSync(path.join(screenRoot, ".gitignore"), "node_modules/\n", "utf-8");
    await git(["add", "-A"]);
    await git(["commit", "-m", "旧版本：派生索引也提交了"]);
    expect(await trackedFiles()).toContain("_layout.json");

    await commitScreenSnapshot(SCREEN_ID, "迁移后第一次提交");

    const tracked = await trackedFiles();
    for (const derived of [
      "_meta.json",
      "_layout.json",
      "component/4002_分组/_layout.json",
      "_callback_flows/argA.json",
      "_event_flows/4001.json"
    ]) {
      expect(tracked).not.toContain(derived);
    }
    expect(tracked).toContain("component/4001_条形图.json");
    // git rm --cached 只动索引：文件必须还在磁盘上，否则下一轮同步前 agent 就读不到布局了
    expect(existsSync(path.join(screenRoot, "_layout.json"))).toBe(true);
    expect(existsSync(path.join(screenRoot, "component/4002_分组/_layout.json"))).toBe(true);
  });

  it("回退预览不会把派生索引列进来", async () => {
    await commitScreenSnapshot(SCREEN_ID, "初始");
    const [base] = await listNodes(DIR_KEY);

    write("component/4001_条形图.json", JSON.stringify({ id: 4001, title: "又改了" }, null, 2));
    write("_layout.json", JSON.stringify({ ascii_map: "噪声" }, null, 2));

    const preview = await getRollbackPreview(DIR_KEY, base.commit);
    expect(preview.map((f) => f.file)).toEqual(["component/4001_条形图.json"]);
  });
});
