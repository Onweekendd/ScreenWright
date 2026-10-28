export interface ToolResultPolicyInput {
  toolName: string;
  toolCallId: string;
  args: unknown;
  result: unknown;
  /** UTF-8 字节预算，不是 token 数；是否处理当前工具由策略决定。 */
  maxBytes: number;
  /** 按需保存原始结果，返回 readFileTool 可读取的工作区相对路径。 */
  archiveOriginal: () => Promise<string>;
}

/** 返回 undefined 表示原样保留。返回值也会发给前端，必须保留工具必要的状态、错误和图片字段。 */
export type ToolResultPolicy = (input: ToolResultPolicyInput) => Promise<{ result: unknown } | undefined>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** 不在 UTF-16 代理对中间切断，保证中文、emoji 等内容可继续按原位置读取。 */
const prefixEnd = (text: string, end: number): number => {
  if (end > 0 && end < text.length) {
    const previous = text.charCodeAt(end - 1);
    const next = text.charCodeAt(end);
    if (previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
      return end - 1;
    }
  }
  return end;
};

/** 只限制新产生的文本读取结果，图片与其他工具的结构保持原样。 */
export const limitReadFileResult: ToolResultPolicy = async ({ toolName, args, result, maxBytes, archiveOriginal }) => {
  if (
    toolName !== "readFileTool" ||
    !isRecord(args) ||
    typeof args.path !== "string" ||
    !isRecord(result) ||
    result.type === "image" ||
    typeof result.content !== "string" ||
    typeof result.totalLines !== "number"
  ) {
    return;
  }
  if (Buffer.byteLength(JSON.stringify(result), "utf8") <= maxBytes) {
    return;
  }

  const archivePath = await archiveOriginal();
  const content = result.content;
  const start = typeof result.startCharOffset === "number" ? result.startCharOffset : 0;
  const buildResult = (end: number) => ({
    ...result,
    content: content.slice(0, end),
    isPartialView: true,
    truncated: true,
    sourcePath: args.path,
    archivePath,
    startCharOffset: start,
    endCharOffset: start + end,
    notice: [
      result.notice,
      "本次读取结果超出大小限制，仅返回预览。按 nextRead 继续读取原文件；archivePath 保存本次完整工具结果 JSON。"
    ]
      .filter(Boolean)
      .join("\n"),
    nextRead: {
      path: args.path,
      charOffset: start + end,
      charLimit: Math.max(1, Math.floor(maxBytes / 4))
    }
  });
  const fits = (end: number) => Buffer.byteLength(JSON.stringify(buildResult(end)), "utf8") <= maxBytes;
  if (!fits(0)) {
    throw new Error("Tool result byte budget is too small for read metadata and continuation instructions.");
  }

  let low = 0;
  let high = content.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(prefixEnd(content, middle))) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  let end = prefixEnd(content, low);
  // 有完整行可返回时优先保留完整行；单行大文件仍能通过字符游标向前读取。
  const newline = end > 0 ? content.lastIndexOf("\n", end - 1) : -1;
  if (newline >= 0) {
    end = newline + 1;
  }
  if (end === 0) {
    throw new Error("Tool result byte budget cannot fit a non-empty preview.");
  }
  return { result: buildResult(end) };
};
