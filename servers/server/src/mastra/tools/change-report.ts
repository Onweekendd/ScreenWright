/**
 * 写工具的统一改动回执（`change` 字段）。
 *
 * ## 为什么需要它
 *
 * 写工具过去一律只回「成功了」——`{ success: true, message: "过滤器 X 创建成功" }`。
 * agent 调完之后不知道文件变成了什么样，只能自己再读一遍。b8 实测里这一项占掉大头：
 * 一轮 54 次工具调用里只有 8 次是写，其余多半是「写完读回来确认」。
 *
 * 更糟的是**副作用不可见**。`createDataFilterTool` 的 `saveFilterWithBindings` 会顺手把
 * `listenArgs` 挂到绑定组件上、把 `openFilter` 打开——都发生在 agent 没点名的另一个文件里，
 * 回执一个字不提。实测后果：agent 在下一步用 `editFilesTool` 把 `listenArgs` 又手写了一遍。
 * 工具做了事、不说，agent 就再做一遍。
 *
 * ## 回显什么、不回显什么
 *
 * **不回显整个文件。** `4179_条形图.json` 有 10073 字符，每次写完全量回显比 agent 自己
 * 分段读还贵。只回显**这次真的变了的部分**，以及 agent 预测不了的东西：工具生成的值
 * （UUID、合并后的列表）、副作用文件、以及「改完之后仍然不生效」的状态。
 *
 * ## 一项 = 一处改动
 *
 * `change` 是数组，每项描述一处改动，必带 `file`。至于「改动后长什么样」怎么表达，按
 * 工具手上有什么来：
 *
 *   - 拿得到新旧内容的（`editFilesTool`、`configureCallbackArgs` 的直写路径）
 *     → {@link diffChange}，行级 diff，连续变化行并成一个 hunk
 *   - 新建 / 删除文件 → {@link createdChange} / {@link deletedChange}
 *   - 只能在 resume 之后重读的（前端落盘那批）→ {@link fieldChange}，摘出被改的那个字段
 *
 * 统一的是**字段名和「一项 = 一处改动 + 改动后内容」这个约定**，不是每项内部形状完全一致。
 * agent 学一次就够；硬把三种情况凑成同一个形状，只会逼出假的 before 快照。
 *
 * ## 为什么不在 suspend 前缓存快照做真 diff
 *
 * 那批工具走 `suspend` → 前端应用 → `resume`，落盘由前端做，而 `resume` 是**新一轮
 * `execute` 调用**，改前的局部变量早没了。要做真 diff 就得按 `toolCallId` 在模块级 Map 里
 * 缓存改前内容，还得管 TTL 和泄漏——为了形式统一付这个代价不值，`fieldChange` 已经够用。
 */

import fsp from "node:fs/promises";
import nodePath from "node:path";

import { z } from "zod";

/**
 * 一处改动。`file` 必带；其余按改动种类三选一。
 *
 * 定义在 zod 这边而不是先写 interface，是因为每个写工具的 `outputSchema` 都要引它——
 * 两处各写一份迟早分叉，而 schema 是真正会被校验的那一份。
 */
export const ChangeSchema = z.object({
  file: z.string().describe("工作区相对路径"),
  line: z.number().optional().describe("改动后内容里的行号（1-based）"),
  after: z.string().optional().describe("改动后的片段，连续变化行已合并"),
  created: z.boolean().optional().describe("这是新建的文件"),
  deleted: z.boolean().optional().describe("这个文件被删掉了"),
  lines: z.number().optional().describe("新建文件的总行数"),
  note: z.string().optional().describe("这处改动是工具的副作用，发生在你没点名的文件上")
});

export type Change = z.infer<typeof ChangeSchema>;

/** 最多报几处改动。超出的折成一句「另有 N 处」，避免一次替换几十处把回执撑爆。 */
const MAX_HUNKS = 10;

/** 单个 hunk 最多几行。超出截断并在尾部标注。 */
const MAX_LINES_PER_HUNK = 20;

const splitLines = (text: string): string[] => text.replace(/\r\n/gu, "\n").split("\n");

const truncateHunk = (lines: string[]): string => {
  if (lines.length <= MAX_LINES_PER_HUNK) {
    return lines.join("\n");
  }
  return [...lines.slice(0, MAX_LINES_PER_HUNK), `…(另有 ${lines.length - MAX_LINES_PER_HUNK} 行)`].join("\n");
};

/**
 * 行级 diff：找出 `after` 里相对 `before` 变化的行，连续的并成一个 hunk。
 *
 * 用的是最朴素的「掐头去尾」——从两端各找最长的相同前缀 / 后缀，中间那段就是改动。
 * 对写工具的实际场景（改几个字段、插一段配置）这足够准，也不必为了漂亮的 diff 引一个库：
 * 回执要的是「让 agent 认出自己改对了地方」，不是给人看的补丁。
 *
 * 行号按 **`after` 的内容**算（1-based）。整体重写类的改动（如 `JSON.stringify` 全文重写）
 * 会让后面所有行位移，报旧行号毫无意义；而 agent 后续编辑靠 `old_string` 匹配、不靠行号，
 * 所以这里的行号只用于定位阅读。
 */
export const diffChange = (file: string, before: string, after: string, note?: string): Change[] => {
  const oldLines = splitLines(before);
  const newLines = splitLines(after);

  let head = 0;
  while (head < oldLines.length && head < newLines.length && oldLines[head] === newLines[head]) {
    head += 1;
  }
  let tail = 0;
  while (
    tail < oldLines.length - head &&
    tail < newLines.length - head &&
    oldLines[oldLines.length - 1 - tail] === newLines[newLines.length - 1 - tail]
  ) {
    tail += 1;
  }

  const changed = newLines.slice(head, newLines.length - tail);
  if (changed.length === 0) {
    // 纯删除也算一处改动，但没有「改动后的内容」可报，给一句话交代
    const removed = oldLines.length - head - tail;
    return removed > 0 ? [{ file, line: head + 1, after: `（删掉了 ${removed} 行）`, ...(note ? { note } : {}) }] : [];
  }

  return [{ file, line: head + 1, after: truncateHunk(changed), ...(note ? { note } : {}) }];
};

/** 新建的文件：只报行数，不把全文倒回去。 */
export const createdChange = (file: string, content: string, note?: string): Change => ({
  file,
  created: true,
  lines: splitLines(content).length,
  ...(note ? { note } : {})
});

/** 删掉的文件。 */
export const deletedChange = (file: string, note?: string): Change => ({
  file,
  deleted: true,
  ...(note ? { note } : {})
});

/**
 * 从重读回来的文件内容里，摘出某个顶层字段当前的样子。
 *
 * 给 resume 之后拿不到改前快照的那批工具用：工具自己知道它改的是哪个字段
 * （`cbArgs` / `listenArgs` / `event` / `panelState`…），把那一段回显出来，
 * 既精准又不必把整个组件文件倒给 agent。
 *
 * 按缩进找字段所在的整段：从 `"<field>":` 那行起，到缩进回到同级为止。找不到该字段就返回
 * `undefined`（比如字段被删了），调用方据此决定要不要报这一处。
 */
export const fieldChange = (file: string, content: string, field: string, note?: string): Change | undefined => {
  const lines = splitLines(content);
  const start = lines.findIndex((line) => new RegExp(`^\\s*"${field}"\\s*:`, "u").test(line));
  if (start === -1) {
    return undefined;
  }

  const indent = (lines[start].match(/^\s*/u) ?? [""])[0].length;
  let end = start;
  for (let i = start + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      end = i;
      continue;
    }
    const currentIndent = (lines[i].match(/^\s*/u) ?? [""])[0].length;
    if (currentIndent <= indent) {
      // 收尾的 `]` / `}` 跟字段名**同缩进**时是这个块的一部分，得带上（多行数组/对象的收尾）；
      // 缩进更浅的闭合是父级的，单行字段后面那个 `}` 就是，不能算进来
      if (currentIndent === indent && /^[}\]]/u.test(trimmed)) {
        end = i;
      }
      break;
    }
    end = i;
  }

  return {
    file,
    line: start + 1,
    after: truncateHunk(lines.slice(start, end + 1)),
    ...(note ? { note } : {})
  };
};

/**
 * 读工作区里的文件，报成「新建」一处改动。读不到就返回 `undefined`。
 *
 * 给组件树那批工具用（create / copy / group…）：它们本来就返回了 `filePath`，但只说了
 * 「在哪」没说「多大、成没成」。统一走 `change` 之后，agent 对所有写工具是同一套心智。
 *
 * 读不到不抛错也不编造：回执宁可少一条，也不能谎报一个其实没落盘的文件。
 */
export const readCreatedChange = async (
  workspaceBase: string,
  relativePath: string,
  note?: string
): Promise<Change | undefined> => {
  try {
    const content = await fsp.readFile(nodePath.join(workspaceBase, relativePath), "utf8");
    return createdChange(relativePath, content, note);
  } catch {
    return undefined;
  }
};

/**
 * 组件被挪到了新路径。
 *
 * 既不是新建也不是内容改动——文件还是那个文件，只是位置变了，所以不带 `created`，
 * 也不去读内容（内容本来就没动，回显它纯属浪费）。agent 要的是「现在去哪读它」。
 */
export const movedChanges = (moved: ReadonlyArray<{ componentId: number; filePath: string }>): Change[] =>
  capChanges(
    moved.map(({ componentId, filePath }) => ({
      file: filePath,
      note: `组件 ${componentId} 现在在这个路径（内容未变，只是挪了位置）`
    }))
  );

/** 把多处改动裁到 {@link MAX_HUNKS}，超出的折成一句交代。 */
export const capChanges = (changes: Change[]): Change[] => {
  if (changes.length <= MAX_HUNKS) {
    return changes;
  }
  const kept = changes.slice(0, MAX_HUNKS);
  return [...kept, { file: "", after: `…另有 ${changes.length - MAX_HUNKS} 处改动未列出` }];
};
