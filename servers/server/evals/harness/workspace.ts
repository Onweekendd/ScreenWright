/**
 * eval 工作区：把一份 fixture 种成一块真实大屏。
 *
 * 隔离粒度是**一块大屏**：一个 case 一块屏，工作区天生就是多屏共存的
 * （真实环境里也是 screen_73_1 / screen_74_1 并列），一屏一 case 测的就是真实路径。
 *
 * 但工作区根本身是**另起的**——真实工作区里那几块屏 agent 看得见就可能跑去改，
 * 而 case 的断言只盯自己那块。根目录由 `prepare-workspace.ts` 备好：从真实工作区
 * 复制 skills / scripts / types / tsconfig.json（agent 的 skill 绑在工作区上，
 * 少了它就不是被测的那个 agent 了），屏只有这里种出来的。
 *
 * 根路径必须在**进程启动前**由 MASTRA_WORKSPACE_PATH 定好、之后再不改动：有一批模块级
 * `const ... = getAgentWorkspacePath()` 在 import 时就定格，其中 `mastra/runtime.ts` 最重
 * ——它下面还跟着 top-level await 去建 artifact app 服务，而 `mastra/index.ts:5` 就 import 它。
 * 进程内切根会让这些定格值与懒读的 `getWorkspaceBase()` 分叉，表现为「在 A 里找、拿 B 算 key」，
 * 不报错、只是找不到文件。
 *
 * 名单会随重构变，别记数量，记这条查法：`grep -rn "getAgentWorkspacePath()" src/`
 * ——写在模块顶层的是定格点，写在函数体里的是懒读的、不受影响。
 *
 * 其余全局目录靠 threadId 自动隔离，不需要处理：
 *   plan/<threadId>.md · echart-options/<threadId>/ · tasks/<主 threadId>/
 * 唯一的例外是 artifact-app/——它不按 thread 分。加 artifact-app 类 case 时需要单独隔离。
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ParsedLargeScreenInfo } from "@screenwright/types";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";
import { syncScreenData } from "@/mastra/services/bi-data-sync";
import { ScreenReader } from "@/mastra/services/bi-data-sync/screen-read";

/** fixture 文件的形状：起点大屏 + 让人半年后还敢改它的元信息。 */
export interface EvalFixture {
  caseId: string;
  /** 起点大屏在真实环境里编出来时的 id，仅作溯源；种进工作区时会被换掉 */
  screenId: number;
  /** 这块起点大屏是什么、为什么是这个起点 */
  note: string;
  authoredAt: string;
  screen: ParsedLargeScreenInfo;
}

export interface EvalWorkspace {
  /** 种进工作区后的大屏 id（数字，9001 起，与真实大屏 73/74/75/76 不冲突） */
  screenId: number;
  /** `${screenId}_${versionCode}`，即工具入参里的 screenId */
  screenKey: string;
  screenDir: string;
  /** 当前工作区状态，读一份出来做断言 */
  read(): ParsedLargeScreenInfo;
  /** 整块大屏的内容指纹，用于「工作区一个字节没动」这类断言 */
  fingerprint(): string;
}

const FIXTURE_DIR = path.resolve(import.meta.dirname, "..", "fixtures");

/**
 * eval 大屏 id 从 9001 起，逐个 case×attempt 递增。
 *
 * 必须是数字：info.json 顶层的 `id` / `versionCode` 就是 screenKey 的两截
 * （`screen_73_1` ← `id:73` + `versionCode:1`），下游按数字用。
 * 可读性由 fixture 文件名和 eval 报告承担，不放进目录名。
 */
let nextScreenId = 9001;

export const allocateScreenId = (): number => nextScreenId++;

/** 仅供测试重置，避免用例间 id 漂移。 */
export const resetScreenIdAllocator = (): void => {
  nextScreenId = 9001;
};

export const loadFixture = (name: string): EvalFixture => {
  const file = path.join(FIXTURE_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as EvalFixture;
};

/**
 * 把 fixture 种成一块大屏。
 *
 * 走的是 `syncScreenData`——**跟前端整屏保存同一个写入器**（POST /sync-global-data 也是调它），
 * 所以种出来的目录跟真实环境一个字节不差。fixture 存的是「源」（ParsedLargeScreenInfo），
 * 磁盘形态每次重新编译，因此磁盘格式演进时 fixture 不会无声腐化。
 */
export const seedWorkspace = (fixtureName: string, screenId = allocateScreenId()): EvalWorkspace => {
  const fixture = loadFixture(fixtureName);
  const screenKey = `${screenId}_1`;

  // id / versionCode 必须一起改写：漏了这步，目录叫 9001_1 而 info.json 说自己是 73_1，
  // 任何按 info.json 定位的路径都会错位。
  syncScreenData({
    id: screenKey,
    cacheTime: Date.now(),
    // versionCode 是 string、id 是 number——两截类型不同，写反了 tsc 会拦住，但值写错不会
    parsedLargeScreenInfo: { ...fixture.screen, id: screenId, versionCode: "1" }
  });

  const screenDir = path.join(path.resolve(getAgentWorkspacePath()), `screen_${screenKey}`);

  return {
    screenId,
    screenKey,
    screenDir,
    read: () => new ScreenReader({ id: screenKey }).read(),
    fingerprint: () => fingerprintDir(screenDir)
  };
};

/**
 * 目录内容指纹：按相对路径排序后把「路径 + 内容」滚进一个 hash。
 *
 * 跳过 .git —— 版本历史是 agent 正常操作的副产物，不算工作区内容变更。
 */
export const fingerprintDir = (dir: string): string => {
  const hash = createHash("sha1");
  for (const rel of listFilesSorted(dir)) {
    hash.update(rel);
    hash.update(fs.readFileSync(path.join(dir, rel)));
  }
  return hash.digest("hex");
};

const listFilesSorted = (dir: string, prefix = ""): string[] => {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") {
      continue;
    }
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listFilesSorted(path.join(dir, entry.name), rel));
    } else {
      out.push(rel);
    }
  }
  return out.sort();
};
