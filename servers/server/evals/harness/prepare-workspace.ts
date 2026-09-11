/**
 * 把 eval 工作区搭起来：一份**只带基础设施、不带真实大屏**的工作区副本。
 *
 * 起因：agent 的 skill 是绑在工作区上的（`src/mastra/workspace.ts` 把
 * `skills/common` + `skills/executor` 挂给主 / 执行 / 校验 agent，路径根就是
 * `getAgentWorkspacePath()`）。直接把 `MASTRA_WORKSPACE_PATH` 指到一个空目录，
 * agent 会变成一个**没有任何 skill 的 agent**——`skill` / `skill_read` 全部读空，
 * `create-component.ts:323` 要查的组件 schema 文档也不在了。那样测出来的东西
 * 跟线上没关系。
 *
 * 同理还有另外三样：
 *   scripts/       —— `create-template.ts` / `extract-slots.ts`，模板提取子 agent 依赖
 *                     （事件干跑已从脚本改成 `simulateEvent` 工具，不再在这里）
 *   types/         —— agent 写 vue part 时的类型来源
 *   tsconfig.json  —— `check-vue-part` 要它才能跑
 *
 * 那为什么不干脆用真实工作区（`workspace.ts` 原本的设计：在真实工作区里加一块 9001 屏）？
 * 因为真实工作区里并排躺着 screen_73_1 / 74_1 / 75_1 / 76_1。agent 看得见它们，
 * 就可能跑去改别的屏，而 A1 的断言只盯着自己那块——测出来是绿的，实际上手伸到别人家里了。
 * 何况 eval 的产物会堆进仓库目录。
 *
 * 所以取中间路线：**工作区根是新的，基础设施是真实的副本，屏只有 fixture 种出来的那些。**
 *
 * `artifact-app/` 511M，不复制——它也不按 thread 隔离，是 TODO 里挂着的已知边界。
 * 碰 artifact-app 的 case 得单独想办法。
 *
 * 本文件管两件互补的事，都围绕同一份 {@link INFRASTRUCTURE} 白名单：
 *   - {@link prepareEvalWorkspace}：把基础设施拷进来（源比副本新时自动重拷）
 *   - {@link clearRunArtifacts}：把白名单之外的一切清掉
 * 两者是同一条边界的两侧——基础设施默认复用，本轮产物跑完即弃。
 */

import fs from "node:fs";
import path from "node:path";

/**
 * 从真实工作区复制过来的东西。都是**只读的基础设施**，agent 不该写它们；
 * 真写了也只脏了副本，源目录不受影响。
 */
const INFRASTRUCTURE = ["skills", "scripts", "types", "tsconfig.json"];

export interface PrepareResult {
  copied: string[];
  reused: string[];
  missing: string[];
  /** 因源目录比副本新而自动重拷的条目（不是靠 refresh 参数触发的） */
  staleRefreshed: string[];
}

interface FileStamp {
  mtimeMs: number;
  size: number;
}

/**
 * 一棵树里每个**文件**的 `相对路径 → mtime + 体积`。单文件（tsconfig.json）记作空串一项。
 *
 * 只收文件、不收目录自身的 mtime——目录 mtime 会因为"里面多了/少了一个条目"而更新，
 * 拿它参与比较会把陈旧的副本伪装成新的，见 {@link isStale}。
 */
const fileIndex = (target: string): Map<string, FileStamp> => {
  const index = new Map<string, FileStamp>();
  const walk = (current: string, relative: string): void => {
    const stat = fs.statSync(current);
    if (!stat.isDirectory()) {
      index.set(relative, { mtimeMs: stat.mtimeMs, size: stat.size });
      return;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      walk(path.join(current, entry.name), relative ? `${relative}/${entry.name}` : entry.name);
    }
  };
  walk(target, "");
  return index;
};

/**
 * 源比副本新就必须重拷——**这不是优化，是正确性**。
 *
 * 副本一旦落后，eval 跑的就是旧 skill，而报告不会有任何提示。改一句 skill 想验证效果，
 * 得到的却是改之前的行为，然后据此得出错误结论——比不跑还糟。
 *
 * 更隐蔽的是**重命名**：`screenwright-api-data-binding` 改名成 `sw-data-flow` 之后，
 * 副本里两个目录并存，agent 的 `<available_skills>` 里会同时看到新旧两份描述互相矛盾的 skill。
 * （`refresh` 走的是先 rmSync 再 cpSync，能清干净；靠人记得传 `EVAL_REFRESH_WORKSPACE=1` 不能。）
 *
 * **为什么逐文件比而不是比两棵树的最新 mtime**：目录自身的 mtime 会因为"里面多了/少了一个
 * 条目"而更新，于是副本目录被后来的写入顶新之后，整棵树"看起来"比源新，里面那份旧文件就
 * 永远刷不掉。b8 实测栽在这上面：`scripts/simulateEvent.ts` 的 import 早从 `@funbi/core`
 * 改成了 `@screenwright/core`，副本还停在旧名字（源文件 09-08 18:16，副本文件 09-06 22:07，
 * 但副本目录 09-08 19:00），判定为"复用"。agent 照 skill 去跑自检脚本，ERR_MODULE_NOT_FOUND，
 * 然后花了 17 轮满盘找这个不存在的包——**一轮 211s 里 125s 是这么烧掉的，断言其实早已全绿**。
 */
const isStale = (from: string, to: string): boolean => {
  try {
    const sourceFiles = fileIndex(from);
    const copyFiles = fileIndex(to);
    // 条目数对不上 = 源里删了/改名了，或 agent 往基础设施里写过东西。两种都该重拷回干净状态
    if (sourceFiles.size !== copyFiles.size) {
      return true;
    }
    for (const [relative, source] of sourceFiles) {
      const copy = copyFiles.get(relative);
      // cpSync 不保留时间戳，副本 mtime 恒等于"拷贝那一刻"，
      // 所以「源比副本新」精确地就是「拷完之后源又改过」
      if (!copy || copy.size !== source.size || source.mtimeMs > copy.mtimeMs) {
        return true;
      }
    }
    return false;
  } catch {
    // 读不到就当它旧了：重拷的代价（几百 KB）远小于跑一轮错的 eval
    return true;
  }
};

/**
 * @param sourceWorkspace 真实工作区（`.env` 的 MASTRA_WORKSPACE_PATH，或默认 ./agent-workspace）
 * @param targetWorkspace eval 工作区
 * @param refresh 强制重拷。skill 改过之后要用，否则 eval 跑的还是旧副本
 */
export const prepareEvalWorkspace = (
  sourceWorkspace: string,
  targetWorkspace: string,
  refresh = false
): PrepareResult => {
  fs.mkdirSync(targetWorkspace, { recursive: true });

  const result: PrepareResult = { copied: [], reused: [], missing: [], staleRefreshed: [] };

  for (const entry of INFRASTRUCTURE) {
    const from = path.join(sourceWorkspace, entry);
    const to = path.join(targetWorkspace, entry);

    if (!fs.existsSync(from)) {
      // 源里就没有——大概率是工作区路径配错了。不抛错，交给调用方在摘要里喊一声，
      // 因为「skill 缺失」的症状（agent 行为变差）比「路径配错」难查得多。
      result.missing.push(entry);
      continue;
    }

    if (fs.existsSync(to)) {
      const stale = isStale(from, to);
      if (!refresh && !stale) {
        result.reused.push(entry);
        continue;
      }
      if (stale && !refresh) {
        result.staleRefreshed.push(entry);
      }
      fs.rmSync(to, { recursive: true, force: true });
    }

    fs.cpSync(from, to, { recursive: true });
    result.copied.push(entry);
  }

  return result;
};

/**
 * 清掉工作区里**上一轮跑出来的一切**，只留 {@link INFRASTRUCTURE}。
 *
 * **不清的后果不是"数据丢了"，是"旧数据被当真理挖出来用"。**
 *
 * 两起实测：
 *
 * 1. `allocateScreenId`（`harness/workspace.ts`）每个进程都从 9001 起，不同次 `pnpm eval`
 *    之间屏号必然撞车。某次 agent 对 `cbArgs` 该不该写成 `callbackArgs` 拿不准，去工作区找
 *    "参考实现"，挖到三天前另一次跑（当时还没有校验警告）留下的 `screen_9017`——那份数据本身
 *    就是错的，agent 却拿它当"约定俗成"的证据，反过来说服自己一个本该生效的新警告是误报。
 * 2. c2（前端应用失败 → 不落盘）里 agent 翻到 `tasks/` 中历次跑剩的任务记录，据此判断
 *    "同环境存在前端写通道故障"。这次结论碰巧是对的，但它是拿别人跑的残留在推理本轮环境。
 *
 * **为什么用白名单而不是列举要删的目录**：`screen_*` / `tasks/` / `plan/` 是今天已知的三种，
 * 明天 agent 多写一个目录就会漏掉，而漏掉的症状（跨轮污染）极难归因。反过来定义就没有缺口：
 * 基础设施是**从源工作区拷进来的那几样**，此外的一切按定义都是本轮产物，跑完即弃。
 * 这份白名单与 `prepareEvalWorkspace` 拷贝的是同一份，不会出现"清掉了但没人拷回来"。
 *
 * 默认每次 `pnpm eval` 都清；`EVAL_KEEP_WORKSPACE=1` 跳过，留给"就是要接着上一轮现场手动
 * 查"这种少数场景。
 *
 * @returns 被清掉的顶层条目名，供调用方在摘要里如实说清动了什么
 */
export const clearRunArtifacts = (targetWorkspace: string): string[] => {
  if (!fs.existsSync(targetWorkspace)) {
    return [];
  }

  const keep = new Set<string>(INFRASTRUCTURE);
  const removed: string[] = [];
  for (const entry of fs.readdirSync(targetWorkspace)) {
    if (keep.has(entry)) {
      continue;
    }
    fs.rmSync(path.join(targetWorkspace, entry), { recursive: true, force: true });
    removed.push(entry);
  }
  return removed.sort();
};
