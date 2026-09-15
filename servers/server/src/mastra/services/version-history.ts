import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import {
  type ComponentType,
  type Filter,
  FolderEnum,
  type LargeScreenDetailInfo,
  type SystemComponentProps
} from "@screenwright/types";

import { readFileState } from "../tools/file/state";
import { getScreenDirPath, getWorkspaceBase } from "./screen-workspace";

const execFileAsync = promisify(execFile);

/** 一个文件的变更条目 */
export interface FileChange {
  /** git 状态码：A=新增 M=修改 D=删除 R=重命名 */
  status: string;
  /** 相对大屏根目录的文件路径（正斜杠） */
  file: string;
}

/** 回退节点：一次提交 = 用户一次提问后的可回退快照 */
export interface HistoryNode {
  /** 完整 commit hash */
  commit: string;
  /** 提交信息（取自用户本轮问题） */
  message: string;
  /** 提交时间（ISO 8601） */
  time: string;
  /**
   * 父 commit hash（取第一个父；根 commit 无父时为空串）。
   * 撤销某条提问 = 跳到「该提问 commit」的父：msg-id 打在 agent 改动 commit 上，其父正是「提问前」的状态。
   */
  parent: string;
  /** 产生该 commit 的用户消息 id（screenwright-msg-id）。仅「用户提问」节点有；基线节点为 undefined。 */
  messageId?: string;
  /** 本次提交（这一轮提问）改动的文件 */
  files: FileChange[];
}

/**
 * 回退操作：把「工作区当前状态」还原到目标 commit 所需的一步动作。
 *
 * 由 buildRollbackPlan 从 target→工作区 的文件差异翻译而来，前端 executor 按 kind+action
 * 分派到画布原语执行。action 用「回退后要做的动作」语义（非 git status 字母），动词统一：
 * - component overwrite：用目标版本内容覆盖该组件（工作区改过，还原内容；不改结构）
 * - component delete：工作区多出来的组件，删掉（阶段 2/3）
 * - component recreate：工作区缺失的组件，重建（阶段 2/3，涉及新 id 回写/嵌套聚合）
 * - filter overwrite：用目标版本存回过滤器（D 恢复 / M 覆盖）
 * - filter delete：工作区多出来的过滤器，删掉
 * - screenInfo overwrite：用目标版本 detail 覆盖大屏配置
 */
export type RollbackOp =
  | { kind: "component"; action: "overwrite"; id: number; component: ComponentType }
  | { kind: "component"; action: "delete"; id: number; component: ComponentType }
  | { kind: "component"; action: "recreate"; id: number; component: ComponentType }
  | { kind: "filter"; action: "overwrite"; name: string; filter: Filter }
  | { kind: "filter"; action: "delete"; name: string }
  // detail 是 Partial：已剔除「视图本地」字段(scale)，前端 Object.assign 合并回写，保留用户当前视口
  | { kind: "screenInfo"; action: "overwrite"; detail: Partial<LargeScreenDetailInfo> };

/** 回退计划：一次「撤销到目标 commit」拆成的有序操作 + 本阶段暂不支持而跳过的项 */
export interface RollbackPlan {
  /** 目标 commit（= 被撤销那条提问的父，即提问前状态） */
  targetCommit: string;
  /** 有序回退操作 */
  ops: RollbackOp[];
  /** 暂未支持而跳过的差异项（当前：组件的结构增删归后续阶段），供前端如实提示 */
  unsupported: { file: string; status: string; reason: string }[];
}

/**
 * 解析 git --name-status 的一行为 FileChange。
 * 普通行 "M\tpath"；重命名 "R100\told\tnew"（取新路径）。返回 null 表示非变更行。
 */
const parseNameStatusLine = (line: string): FileChange | null => {
  if (!line.includes("\t")) {
    return null;
  }
  const parts = line.split("\t");
  const status = parts[0][0]; // R100 → R
  const file = parts[parts.length - 1];
  return { status, file };
};

/** workspace 根目录，运行时读取 env（与 bi-data-sync 一致，支持测试覆盖） */
/**
 * 由大屏目录 key 得到大屏根目录
 * @param dirKey "{screenId}_{versionCode}"，如 "30838_1"
 */
const screenRootOf = getScreenDirPath;

/**
 * git执行封装函数
 *
 * 统一挂 `-c core.quotepath=false`：否则含中文的文件名在 --name-status 输出里会被转成
 * 八进制转义并包上双引号（如 "component/3321826_\351...json"），得到的路径无法直接用于
 * git show / 文件匹配。关掉后输出干净 UTF-8 路径。只影响输出显示，不影响 commit。
 * @param screenRoot 大屏根目录
 * @param args 参数
 * @returns 命令输出
 */
const git = async (screenRoot: string, args: string[]) => {
  const { stdout } = await execFileAsync("git", ["-c", "core.quotepath=false", ...args], { cwd: screenRoot });
  return stdout;
};

const isRepoInitialized = (screenRoot: string): boolean => {
  return fs.existsSync(path.join(screenRoot, ".git"));
};

/** 运行环境噪声，与大屏内容无关 */
const BASE_IGNORE_PATTERNS = ["node_modules/", ".mastra/", "*.db", "*.log"];

/**
 * 由组件树派生、每次 syncScreenData 都会重算的索引文件，不进版本历史。
 *
 * 它们不是用户内容：删掉之后下一次同步会原样重建，回退也从不看它们
 * （见 {@link isRollbackRelevant}——`_` 开头的元文件与白名单之外的目录都被排除）。
 * 留在 git 里只会让每次提交混进一堆与用户改动无关的 diff：改一个组件标题，
 * `_layout.json` 里那张 ascii 图例的图例行就跟着变，`_meta.json` 的 componentIds 也可能重排，
 * 于是回退预览与提交历史都被这些噪声淹没。
 *
 * 不含 `_analysis.json` / `template-*.json`：那两个是 agent 自己的产物（探索笔记、语义模型），
 * 重建不出来，属于要留档的内容。
 *
 * 无前导斜杠是刻意的——`_layout.json` 在根目录和 `component/**` 的每一层都有，
 * 不带斜杠的模式在任意层级都命中。
 */
const DERIVED_IGNORE_PATTERNS = ["_meta.json", "_layout.json", "_callback_flows/", "_event_flows/"];

/**
 * 把「已被 git 跟踪、但现在命中 .gitignore」的文件从索引里摘掉。
 *
 * .gitignore 只管还没被跟踪的文件，已经 commit 过的派生文件不会因为新加了规则就自动消失，
 * 必须显式 `git rm --cached`——只动索引不删磁盘文件，下一次 syncScreenData 照常重写。
 * 老仓库因此能平滑迁移：迁移那一次提交里这些文件表现为删除，此后彻底安静。
 */
const untrackIgnoredFiles = async (screenRoot: string) => {
  let listed: string;
  try {
    // -i 需要配合 exclude 选项才有意义；--cached 限定只看已跟踪的
    listed = await git(screenRoot, ["ls-files", "--cached", "--ignored", "--exclude-standard"]);
  } catch {
    // 仓库尚无任何提交时 ls-files 可能失败，此时也不存在「已跟踪」的文件
    return;
  }

  const files = listed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (files.length === 0) {
    return;
  }

  // 分批：Windows 命令行长度有限，大屏的嵌套 _layout.json 可能不少
  for (let i = 0; i < files.length; i += 100) {
    await git(screenRoot, ["rm", "--cached", "--quiet", "--", ...files.slice(i, i + 100)]);
  }
};

/**
 * 确保 .gitignore 覆盖上面两组规则；缺哪条补哪条，不覆盖用户/历史版本已有的内容。
 */
const ensureIgnoreRules = async (screenRoot: string) => {
  const gitignorePath = path.join(screenRoot, ".gitignore");
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf-8") : "";
  const present = new Set(existing.split("\n").map((line) => line.trim()));
  const missing = [...BASE_IGNORE_PATTERNS, ...DERIVED_IGNORE_PATTERNS].filter((pattern) => !present.has(pattern));

  if (missing.length > 0) {
    const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";
    fs.writeFileSync(gitignorePath, `${existing}${separator}${missing.join("\n")}\n`, "utf-8");
  }

  await untrackIgnoredFiles(screenRoot);
};

/**
 * 确保某个大屏已经正确的初始化git了
 *
 * 首次 init 时配置本地提交身份，这样即便运行环境（如 Docker）没有全局 git 身份，commit 也不会失败。
 * .gitignore 则**每次都对账**（不只首次）：规则会随版本演进，老仓库要能补上新增的排除项，
 * 已经被跟踪的派生文件也要在这一步摘出索引。
 * @param screenRoot 大屏根目录
 * @returns 是否成功
 */
export const ensureRepo = async (screenRoot: string) => {
  try {
    if (!isRepoInitialized(screenRoot)) {
      await git(screenRoot, ["init"]);
      await git(screenRoot, ["config", "user.email", "ai@screenwright.local"]);
      await git(screenRoot, ["config", "user.name", "Screenwright AI"]);
    }
    await ensureIgnoreRules(screenRoot);
    return true;
  } catch (e) {
    console.error("初始化git失败", e);
    return false;
  }
};

/**
 * 把 messageId 压成单行 XML 放进 commit body，供 listNodes 解析出 screenwright-msg-id。
 *
 * - 单行是刻意的：listNodes 靠换行切分 name-status，body 有换行会打乱解析。
 * - 只在 id 形如安全字符（字母数字/下划线/冒号/连字符）时嵌入，避免破坏 XML；否则不嵌。
 * @param messageId 用户消息 id
 * @returns 单行 XML；无有效 id 时返回空串
 */
const buildFunbiMeta = (messageId?: string): string => {
  if (!messageId || !/^[\w:-]+$/.test(messageId)) {
    return "";
  }
  return `<screenwright-meta><messageId>${messageId}</messageId></screenwright-meta>`;
};

/**
 * 每一轮对话后 提交代码 生成一个可回退的节点
 * @param screenRoot 大屏根目录
 * @param subject 提交信息首行（用户本轮问题，保持人类可读）
 * @param messageId 产生本次提交的用户消息 id；仅「用户提问」节点传，基线不传
 * @returns
 */
export const commitTurn = async (screenRoot: string, subject: string, messageId?: string) => {
  await git(screenRoot, ["add", "-A"]);

  // subject 放首行保持可读；messageId 以单行 XML 存入 body（供撤销时按消息定位 commit）
  const meta = buildFunbiMeta(messageId);
  const commitMessage = meta ? `${subject}\n\n${meta}` : subject;

  try {
    await git(screenRoot, ["commit", "-m", commitMessage]);
  } catch (e) {
    // execFile 失败时 "nothing to commit" 落在 e.stdout（不在 e.message），需一并检查
    const detail = `${(e as { stdout?: string }).stdout ?? ""}${(e as { stderr?: string }).stderr ?? ""}${String(e)}`;
    if (detail.includes("nothing to commit")) {
      return;
    }
    throw e;
  }
};

/**
 * 列出某大屏所有版本目录（screen_{screenId}_*）的根路径。
 *
 * 用 "_" 分隔避免前缀误命中（screen_3083_ 不会匹配 screen_30838_）。
 * @param screenId 大屏 id（不含版本），即 resourceId
 */
const listScreenDirs = (screenId: string): string[] => {
  const base = getWorkspaceBase();
  if (!fs.existsSync(base)) {
    return [];
  }
  const prefix = `screen_${screenId}_`;
  return fs
    .readdirSync(base)
    .filter((name) => name.startsWith(prefix))
    .map((name) => path.join(base, name))
    .filter((full) => fs.statSync(full).isDirectory());
};

/**
 * 提交某大屏本轮改动的快照（回退节点）。
 *
 * 不追踪「谁改了哪个文件」——git add -A 天然观测所有工具（含未来新增）写入的改动，
 * 只需确定该在哪些仓库上提交。按 screenId glob 出该大屏的全部版本目录逐个提交，
 * 一次对话内即便切换过版本也都能各自成节点；无改动的目录被 commitTurn 自动跳过。
 * @param screenId 大屏 id（resourceId，不含版本）
 * @param message 提交信息（用户本轮问题）
 * @param messageId 产生本次提交的用户消息 id；仅「用户提问」节点传，基线不传
 */
export const commitScreenSnapshot = async (screenId: string, message: string, messageId?: string) => {
  for (const root of listScreenDirs(screenId)) {
    try {
      await ensureRepo(root);
      await commitTurn(root, message, messageId);
    } catch (e) {
      console.error("[version-history] 提交快照失败", { root, e });
    }
  }
};

/**
 * 列出某个大屏版本的回退节点（按时间倒序，最新在前）
 * @param dirKey "{screenId}_{versionCode}"
 */
export const listNodes = async (dirKey: string): Promise<HistoryNode[]> => {
  const screenRoot = screenRootOf(dirKey);
  if (!isRepoInitialized(screenRoot)) {
    return [];
  }

  try {
    // 单次 git log 同时取出提交元信息与每次提交的改动文件：
    // - 每个提交头用 \x1e(RS) 起始，字段用 \x1f(US) 分隔——这两个控制字符几乎不会出现在提交
    //   信息里，且 Node 的 execFile 拒绝含 NUL(\x00) 的参数，故不能用 \x00 做分隔。
    // - %P=父 hash(可多个,空格分隔)；%b=body(我们只写单行 XML，不会引入换行破坏切分)。
    // - --name-status 紧跟在头之后逐行列出该提交改动的文件；--root 让首个提交也列出文件
    const out = await git(screenRoot, [
      "log",
      "--root",
      "--name-status",
      // --no-renames：关掉 git 的重命名合并。否则「草稿→真实 id」「改标题」等会被并成一条 R，
      // 跨掉两个 id/路径，破坏我们「raw D/A + 自己按 id 交叉匹配」的分类逻辑。
      "--no-renames",
      "--pretty=format:\x1e%H\x1f%s\x1f%cI\x1f%P\x1f%b"
    ]);

    return out
      .split("\x1e")
      .filter((block) => block.trim())
      .map((block) => {
        const lines = block.split("\n");
        const [commit, message, time, parents, body] = lines[0].split("\x1f");
        // %P 是空格分隔的父 hash 列表；线性历史取第一个，根 commit 无父 → 空串
        const parent = (parents ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? "";
        const messageId = /<messageId>([^<]*)<\/messageId>/.exec(body ?? "")?.[1];
        const files = lines
          .slice(1)
          .map(parseNameStatusLine)
          .filter((f): f is FileChange => f !== null);
        return { commit, message, time, parent, messageId, files };
      });
  } catch (e) {
    // 刚 init 尚无任何提交时 git log 会报错，视为无节点
    if (String(e).includes("does not have any commits")) {
      return [];
    }
    throw e;
  }
};

/**
 * 回退只关心「用户实质内容」的文件，其余在回退后由脚本自动重建，纳入预览/回退只是噪声。
 *
 * 保留（白名单）：
 * - 根 `info.json`：大屏配置
 * - `dataFilterArr/**`：数据过滤器
 * - `component/**` 的组件文件
 *
 * 排除：任意层级下 `_` 开头的元文件（component 内各层散落的 `_layout.json`、根 `_meta.json` /
 * `_layout.json` / `_draft_id_map.json` / `_event_flows` / `_callback_flows` 等派生与映射）、
 * `aniFrameSet.json` / `statusAnimation.json`（动画，暂不纳入）等其余未纳入项。
 * @param file 相对大屏根目录的正斜杠路径
 */
const isRollbackRelevant = (file: string): boolean => {
  const base = file.slice(file.lastIndexOf("/") + 1);
  if (base.startsWith("_")) {
    return false; // 任何层级的下划线元文件都不算实质内容
  }
  return file === "info.json" || file.startsWith("dataFilterArr/") || file.startsWith("component/");
};

/**
 * info.detail 里的「视图本地」字段：随用户当前编辑视口变化、每人各异，不属于版本内容。
 * 回退时既不参与「info 是否变更」判定，也不写回（前端用当前值），避免回退顺手改掉用户缩放。
 * scale=画布缩放倍率是典型的每用户本地状态。
 */
const VIEW_LOCAL_INFO_KEYS = ["scale"] as const;

/** 复制 detail 并剔除视图本地字段，得到「参与回退」的部分（Partial：字段本身可能缺省） */
const stripViewLocal = (detail: LargeScreenDetailInfo | undefined): Partial<LargeScreenDetailInfo> => {
  const rest: Partial<LargeScreenDetailInfo> = { ...(detail ?? {}) };
  for (const k of VIEW_LOCAL_INFO_KEYS) {
    delete rest[k];
  }
  return rest;
};

/**
 * 键排序的稳定序列化：两侧对象来自不同来源（git show / 磁盘）键序可能不同，
 * 直接 JSON.stringify 比较会误判，故排序后再比。仅用于剔除视图本地字段后的深比较。
 */
const stableStringify = (v: unknown): string => {
  if (v === null || typeof v !== "object") {
    return JSON.stringify(v) ?? "null";
  }
  if (Array.isArray(v)) {
    return `[${v.map(stableStringify).join(",")}]`;
  }
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
};

/** 读工作区当前文件并 parse；不存在 / 内容非法 → null */
const readWorkingJson = <T>(screenRoot: string, file: string): T | null => {
  try {
    return JSON.parse(fs.readFileSync(path.join(screenRoot, file), "utf-8")) as T;
  } catch {
    return null;
  }
};

/**
 * info.json 是否有「实质」变更：只比较 detail（回退唯一会写回的部分）且剔除视图本地字段。
 * 顶层 updatedTime/updatedBy 等时间戳天然不在 detail 内 → 自动被忽略；仅缩放/时间戳变动不算变更。
 * @param screenRoot 大屏根目录
 * @param commit 目标 commit
 */
const infoMeaningfullyChanged = async (screenRoot: string, commit: string): Promise<boolean> => {
  const target = await showJsonAtCommit<{ detail?: LargeScreenDetailInfo }>(screenRoot, commit, "info.json");
  const working = readWorkingJson<{ detail?: LargeScreenDetailInfo }>(screenRoot, "info.json");
  return stableStringify(stripViewLocal(target?.detail)) !== stableStringify(stripViewLocal(working?.detail));
};

/**
 * 回退预览：回退到目标 commit 会更新哪些文件（目标 commit 与「工作区当前状态」的差异）。
 *
 * 基准是**工作区**不是 HEAD：跳转不提交，回退后工作区变了而 HEAD 仍停在最新 commit，
 * 故 `git diff <commit>`（省略第二参数 = 对工作区）才反映"此刻真实状态与目标的差距"。
 * 回退即把这些文件还原到目标节点的样子。
 * @param dirKey "{screenId}_{versionCode}"
 * @param commit 目标 commit hash
 */
export const getRollbackPreview = async (dirKey: string, commit: string): Promise<FileChange[]> => {
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error(`非法 commit: ${commit}`);
  }
  const screenRoot = screenRootOf(dirKey);
  if (!isRepoInitialized(screenRoot)) {
    return [];
  }
  const out = await git(screenRoot, ["diff", "--no-renames", "--name-status", commit]);
  const tracked = out
    .split("\n")
    .map(parseNameStatusLine)
    .filter((f): f is FileChange => f !== null);

  // git diff 只看已跟踪文件：用户在上一次 commit 后手动新建的组件是 untracked（git status 的 ??），
  // 对 diff 完全隐身，会导致「撤销到提问前」漏删这些新组件。故显式补上未跟踪文件、当作新增(A)——
  // 它们相对目标 commit 本就是「工作区多出来的」，回退时应被删掉。
  const untrackedOut = await git(screenRoot, ["ls-files", "--others", "--exclude-standard"]);
  const untracked: FileChange[] = untrackedOut
    .split("\n")
    .map((line) => line.trim())
    .filter((file) => file !== "")
    .map((file) => ({ status: "A", file }));

  const relevant = [...tracked, ...untracked].filter((f) => isRollbackRelevant(f.file));

  // info.json 靠 git 行级 diff 几乎必然「变更」（scale/时间戳每次都不同）；只在 detail 剔除视图本地
  // 字段后确有差异时才保留，否则剔除，避免每次回退都被 info 噪声干扰。
  const result: FileChange[] = [];
  for (const f of relevant) {
    if (f.file === "info.json" && !(await infoMeaningfullyChanged(screenRoot, commit))) {
      continue;
    }
    result.push(f);
  }
  return result;
};

/** 相对路径（正斜杠）末段文件名去掉 .json 扩展 */
const baseNameNoExt = (file: string): string => {
  const base = file.slice(file.lastIndexOf("/") + 1);
  return base.endsWith(".json") ? base.slice(0, -5) : base;
};

/**
 * 从组件文件路径解析组件数字 id：末段文件名形如 "{id}_{name}" 或纯 "{id}"，取 `_` 前的数字。
 * 解析失败（非数字）返回 null。
 * @param file 相对大屏根目录的组件文件路径，如 component/3305687_card/3305700_电压合格率.json
 */
const parseComponentId = (file: string): number | null => {
  const idPart = baseNameNoExt(file).split("_")[0];
  const id = Number(idPart);
  return idPart !== "" && Number.isFinite(id) ? id : null;
};

/**
 * 是否「大屏根级」组件文件：component/{id}_{name}.json（component 下直接是文件，无中间目录）。
 * 嵌套组件（分组 / 动态面板子组件）落在 component/{容器}_x/... 子目录里，会含额外 `/`。
 * 阶段 1 的结构增删（A/D）只处理根级组件，嵌套留后续阶段（涉及容器聚合）。
 * @param file 相对大屏根目录的组件文件路径
 */
const isRootComponentFile = (file: string): boolean => {
  if (!file.startsWith("component/")) {
    return false;
  }
  return !file.slice("component/".length).includes("/");
};

/**
 * 取某 commit 版本的文件内容并 parse 成 JSON；文件在该 commit 不存在或内容非法 → null。
 * 调用方用泛型标注期望结构（内容来自 git、后端不解读，仅透传给前端）。
 * @param screenRoot 大屏根目录
 * @param commit 目标 commit
 * @param file 相对路径（正斜杠）
 */
const showJsonAtCommit = async <T>(screenRoot: string, commit: string, file: string): Promise<T | null> => {
  try {
    // git show <commit>:<path> 取该提交下该文件的内容（path 是入参不受 quotepath 输出转义影响）
    const out = await git(screenRoot, ["show", `${commit}:${file}`]);
    return JSON.parse(out) as T;
  } catch {
    return null;
  }
};

/**
 * 是否容器组件（动态面板类 / 分组）。
 *
 * 容器自身文件落盘时剥离了子组件引用（面板 panelData 去掉 config、分组去掉 children，见 bi-data-sync），
 * 因此直接走 component/overwrite 会用「空 config / 无 children」覆盖：动态面板清空各状态子组件、甚至
 * undefined.map 抛错，分组因 !children 提前 return 而连坐标都不回退。故容器自身变更归 unsupported，
 * 留阶段 3 用容器聚合（读 panelData/children 结构还原）处理。
 */
const isContainerComponent = (comp: ComponentType): boolean => {
  if ((comp as SystemComponentProps).panelData !== undefined) {
    return true;
  }
  return comp.component?.prop === FolderEnum.group;
};

/**
 * 生成「撤销到目标 commit」的回退计划：把 target→工作区 的三类文件差异翻译成有序回退操作。
 *
 * 阶段 1 范围（不改结构、无新 id，安全）：
 * - 叶子组件 `M`（工作区改过内容）→ component/overwrite（取目标版本内容覆盖）
 * - 过滤器 `A`→filter/delete；`M`/`D`→filter/overwrite（取目标版本存回）
 * - info.json `M`→screenInfo/overwrite（取目标版本 detail）
 *
 * 暂不支持（归 unsupported）：组件结构增删 `A`/`D`（阶段 2/3，涉及新 id 回写）；
 * 容器组件（面板/分组）自身的 `M`（阶段 3，见 isContainerComponent）。
 * @param dirKey "{screenId}_{versionCode}"
 * @param commit 目标 commit（= 被撤销那条提问的父）
 */
export const buildRollbackPlan = async (dirKey: string, commit: string): Promise<RollbackPlan> => {
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error(`非法 commit: ${commit}`);
  }
  const screenRoot = screenRootOf(dirKey);
  const ops: RollbackOp[] = [];
  const unsupported: RollbackPlan["unsupported"] = [];
  if (!isRepoInitialized(screenRoot)) {
    return { targetCommit: commit, ops, unsupported };
  }

  // getRollbackPreview 已按三类白名单过滤，这里只需按类分派
  const changes = await getRollbackPreview(dirKey, commit);

  for (const { status, file } of changes) {
    if (file === "info.json") {
      // 走到这里说明 getRollbackPreview 已判定 detail 有实质变更。取目标版本 detail 覆盖，
      // 但剔除视图本地字段(scale)：前端 Object.assign 合并回写，保留用户当前缩放，不回退视口。
      const target = await showJsonAtCommit<{ detail?: LargeScreenDetailInfo }>(screenRoot, commit, file);
      if (target?.detail !== undefined) {
        ops.push({ kind: "screenInfo", action: "overwrite", detail: stripViewLocal(target.detail) });
      } else {
        unsupported.push({ file, status, reason: "info.json 目标版本缺少 detail" });
      }
      continue;
    }

    if (file.startsWith("dataFilterArr/")) {
      if (status === "A") {
        // 工作区新增的过滤器 → 回退删除（目标版本没有它，取不到内容，name 用文件名）
        ops.push({ kind: "filter", action: "delete", name: baseNameNoExt(file) });
      } else {
        // M（覆盖）/ D（恢复被删）：都用目标版本存回
        const filter = await showJsonAtCommit<Filter>(screenRoot, commit, file);
        if (filter) {
          const name = filter.name ?? baseNameNoExt(file);
          ops.push({ kind: "filter", action: "overwrite", name, filter });
        } else {
          unsupported.push({ file, status, reason: "过滤器目标版本内容缺失" });
        }
      }
      continue;
    }

    // component/**：M=改内容，A=工作区相对目标新增，D=工作区相对目标删除
    const id = parseComponentId(file);

    if (status === "M") {
      const component = await showJsonAtCommit<ComponentType>(screenRoot, commit, file);
      if (!component || id === null) {
        unsupported.push({ file, status, reason: "组件目标内容或 id 解析失败" });
      } else if (isContainerComponent(component)) {
        // 容器自身文件（panelData 无 config / 无 children），overwrite 会清空子组件或静默失效
        unsupported.push({ file, status, reason: "容器组件（面板/分组）自身变更，阶段 3 处理" });
      } else {
        ops.push({ kind: "component", action: "overwrite", id, component });
      }
      continue;
    }

    // A/D 都是结构增删：阶段 1 只支持「大屏根级的叶子组件」，嵌套 / 容器留后续阶段
    if (!isRootComponentFile(file)) {
      unsupported.push({ file, status, reason: "嵌套组件的结构增删（阶段 2/3）" });
      continue;
    }

    if (status === "A") {
      // 工作区相对目标新增了组件 → 回退时删掉。内容取自工作区（目标 commit 里没有该文件）
      const component = readWorkingJson<ComponentType>(screenRoot, file);
      if (!component || id === null) {
        unsupported.push({ file, status, reason: "组件工作区内容或 id 解析失败" });
      } else if (isContainerComponent(component)) {
        unsupported.push({ file, status, reason: "容器组件（面板/分组）结构增删，阶段 3 处理" });
      } else {
        ops.push({ kind: "component", action: "delete", id, component });
      }
      continue;
    }

    // status === "D"：工作区相对目标删除了组件 → 回退时恢复。内容取自目标 commit
    const component = await showJsonAtCommit<ComponentType>(screenRoot, commit, file);
    if (!component || id === null) {
      unsupported.push({ file, status, reason: "组件目标内容或 id 解析失败" });
    } else if (isContainerComponent(component)) {
      unsupported.push({ file, status, reason: "容器组件（面板/分组）结构增删，阶段 3 处理" });
    } else {
      ops.push({ kind: "component", action: "recreate", id, component });
    }
  }

  return { targetCommit: commit, ops, unsupported };
};

/**
 * 硬回退到指定节点：丢弃该节点之后的所有提交与工作区改动。
 *
 * 回退后磁盘内容变了，agent 之前读过的快照（readFileState）已失效——清掉该大屏目录下的
 * 缓存，强制下次编辑先重读，避免误判「外部修改」或基于旧内容改错。
 * @param dirKey "{screenId}_{versionCode}"
 * @param commit 目标 commit hash
 */
export const rollback = async (dirKey: string, commit: string): Promise<void> => {
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error(`非法 commit: ${commit}`);
  }
  const screenRoot = screenRootOf(dirKey);
  if (!isRepoInitialized(screenRoot)) {
    throw new Error(`大屏未初始化版本管理: ${dirKey}`);
  }

  await git(screenRoot, ["reset", "--hard", commit]);

  const rootAbs = path.resolve(screenRoot);
  for (const key of readFileState.keys()) {
    if (path.resolve(key).startsWith(rootAbs)) {
      readFileState.delete(key);
    }
  }
};
