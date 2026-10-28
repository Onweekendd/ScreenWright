import { randomUUID } from "node:crypto";

import type { MastraDBMessage } from "@mastra/core/agent";
import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

import { MAX_TOOL_IMAGES, TOOL_IMAGES_FIELD, type ToolImage } from "../provider/image-middleware";
import { storage } from "../storage/storage";
import {
  type BackgroundTaskNoticeLedger,
  type FinishedBackgroundTask,
  threadNoticeLedger
} from "./background-task-notices";

/**
 * 后台任务（`background: { enabled: true }` 的工具，如生图、生视频）跑完后，Mastra 会开一轮「续接」，
 * 并在末尾注入一条 user 消息（`buildContinuationDirective`，@mastra/core 1.66 的文案）：
 *   "IMPORTANT: The following tool-call IDs completed successfully: call_a (createImageTool).
 *    Their results are now in the conversation. Do not call the same tool again — …"
 *
 * 这条消息**只有任务 id，没有结果**，结果要模型自己去更早的消息里找：Mastra 会把当初那条
 * 「Background task started」的占位原地替换成真实结果。模型看到的新信息只有这句「完成了」，
 * 很容易找不到、或者以为结果就是一句话（实测：书法层结果明明在历史里，模型还是去 search_tools 里翻）；
 * 而服务重启过的任务，占位根本没被替换，历史里压根没有结果。
 *
 * 这里在续接轮每一步模型调用前，把结果直接写进这条提示里。结果取自后台任务表（权威来源，
 * 不依赖那次原地替换），取不到再退回历史里已替换的 tool-invocation。
 *
 * 续接本身也可能根本没开：结束事件只发一次，没人接住就丢了。所以每一步还会拿任务表对账，
 * 把结束了却从没告诉过模型的任务补报上去（见 catchUp、./background-task-notices）。
 *
 * 必须挂在 processInputStep 上：续接指令走 `context` 来源、不在用户本轮输入里，processInput 看不到。
 * processInputStep 每一步都会跑，所以改写要幂等（见 NOTE_MARKER）。
 * 改写后仍以 `context` 来源放回——它只给模型看、不落库，不会污染之后的对话。
 */
const COMPLETED_RE = /tool-call IDs completed successfully:\s*(.*?)\.\s+Their results are now/s;
const FAILED_RE = /tool-call IDs failed:\s*(.*?)\.\s+Their failure information/s;
const CANCELLED_RE = /tool-call IDs were cancelled by the user before completion:\s*(.*?)\.\s+These tasks/s;
/** 整句匹配，改写时要整句换掉：原文叫模型去找用户恢复，在本项目里是错的（见 suspendedNote） */
const SUSPENDED_RE =
  /\s*IMPORTANT: The following tool-call IDs are suspended:\s*(.*?)\.\s+Do not attempt to resume them; let the user know they are waiting for explicit resume input\./s;

/** 续接指令的开头，用来认出哪条 user 消息是它 */
const DIRECTIVE_PREFIX = "IMPORTANT: The following tool-call IDs";

/** 已经补过结果的标记：每一步都会再跑一遍，见到它就说明这条改写过了 */
const NOTE_MARKER = "〔后台任务结果〕";

/** 单个结果摘要的长度上限：url、id、尺寸这些关键信息在前面，超出的部分没有用 */
const MAX_RESULT_CHARS = 1200;

export interface BackgroundTaskOutcome {
  status: string;
  result?: unknown;
  error?: { message?: string } | string | null;
}

/** 按 toolCallId 查后台任务的终态；查不到返回 null */
export type BackgroundTaskLookup = (toolCallId: string) => Promise<BackgroundTaskOutcome | null>;

export const lookupBackgroundTaskInStorage: BackgroundTaskLookup = async (toolCallId) => {
  const store = await storage.getStore("backgroundTasks");
  if (!store) {
    return null;
  }
  const { tasks } = await store.listTasks({ toolCallId, orderBy: "createdAt", orderDirection: "desc", perPage: 1 });
  const task = tasks[0];
  return task ? { status: task.status, result: task.result, error: task.error } : null;
};

interface Entry {
  toolCallId: string;
  toolName?: string;
}

/** "call_a (createImageTool), call_b (createVideoTool)" → 条目列表 */
export function parseEntries(list: string): Entry[] {
  return list
    .split(/,\s*/)
    .map((item) => /^(\S+)(?:\s+\((.+)\))?$/.exec(item.trim()))
    .flatMap((match) => (match ? [{ toolCallId: match[1], toolName: match[2] }] : []));
}

const DELEGATED_TASK_ID_RE = /<id>\s*([^<\s]+)\s*<\/id>/g;

/**
 * 委派给子 agent 的调用当初派的是哪些任务：从委派入参的 <pending_task_ids> 里读。
 * 续接提示只给 toolCallId，模型得自己对回是哪个任务，实测会对错（把 call_03 当成任务 3）。
 */
export function delegatedTaskIds(messages: MastraDBMessage[], toolCallId: string): string[] {
  for (const message of messages) {
    for (const part of message.content?.parts ?? []) {
      if (part.type !== "tool-invocation" || part.toolInvocation.toolCallId !== toolCallId) {
        continue;
      }
      const args = part.toolInvocation.args as { prompt?: unknown } | undefined;
      const text = typeof args?.prompt === "string" ? args.prompt : JSON.stringify(args ?? {});
      return [...text.matchAll(DELEGATED_TASK_ID_RE)].map((match) => match[1]);
    }
  }
  return [];
}

/** "createImageTool（call_a）"；委派调用再带上任务号："agent-swExecutorAgent（call_a，任务 1）" */
const labelOf = ({ toolCallId, toolName }: Entry, messages: MastraDBMessage[]): string => {
  const tasks = delegatedTaskIds(messages, toolCallId);
  return `${toolName ?? "未知工具"}（${toolCallId}${tasks.length > 0 ? `，任务 ${tasks.join("、")}` : ""}）`;
};

const truncate = (text: string) =>
  text.length > MAX_RESULT_CHARS ? `${text.slice(0, MAX_RESULT_CHARS)}…（已截断）` : text;

const parseResult = (result: unknown): unknown => {
  if (typeof result !== "string") {
    return result;
  }
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
};

/**
 * 结果里要给模型「看」的图（`imagesForModel`）。只给 url 文本模型是看不懂的——
 * 它们得作为图片 file part 附在消息上，由 image-middleware 读成二进制再发给模型。
 */
export function imagesOfResult(result: unknown): ToolImage[] {
  const images = (parseResult(result) as Record<string, unknown> | null)?.[TOOL_IMAGES_FIELD];
  if (!Array.isArray(images)) {
    return [];
  }
  return images.filter(
    (image): image is ToolImage =>
      typeof image?.url === "string" && /^https?:\/\//i.test(image.url) && typeof image?.label === "string"
  );
}

/**
 * 结果 → 给模型看的一段文字。生图 / 生视频的结果里 `imagesForModel` 的图片本身另外作为图片附上，
 * 同一张图的 url 已经在顶层 `url` 里，这里只留下它的说明（实际尺寸等），别把 url 重复一遍。
 */
export function summarizeResult(result: unknown): string {
  const value = parseResult(result);
  if (typeof value === "string") {
    return truncate(value);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { [TOOL_IMAGES_FIELD]: images, ...rest } = value as Record<string, unknown>;
    const labels = Array.isArray(images)
      ? images.flatMap((image) =>
          (image as { label?: unknown })?.label ? [String((image as { label: unknown }).label)] : []
        )
      : [];
    return truncate(JSON.stringify(labels.length > 0 ? { ...rest, imageNotes: labels } : rest));
  }
  return truncate(JSON.stringify(value ?? null));
}

const errorMessage = (error: BackgroundTaskOutcome["error"]): string =>
  (typeof error === "string" ? error : error?.message) || "未知错误";

/** 历史里被 Mastra 原地替换过的真实结果；还是占位（没替换）就当没有 */
export function resultFromHistory(messages: MastraDBMessage[], toolCallId: string): unknown {
  for (const message of messages) {
    for (const part of message.content?.parts ?? []) {
      if (part.type !== "tool-invocation") {
        continue;
      }
      const invocation = part.toolInvocation;
      if (invocation.toolCallId !== toolCallId || invocation.state !== "result") {
        continue;
      }
      const isPlaceholder =
        typeof invocation.result === "string" && /^\[?后台任务|^Background task started/.test(invocation.result);
      return isPlaceholder ? undefined : invocation.result;
    }
  }
  return undefined;
}

interface Described {
  line: string;
  images: ToolImage[];
}

const describeResult = (label: string, result: unknown): Described =>
  result === undefined || result === null
    ? {
        line: `- ${label} 已完成，但没能取回结果内容。不要重复调用，告诉用户结果没取到，让用户去素材库 / 画布上确认。`,
        images: []
      }
    : { line: `- ${label} 已完成，结果：${summarizeResult(result)}`, images: imagesOfResult(result) };

const describeCompleted = async (
  { toolCallId, toolName }: Entry,
  lookup: BackgroundTaskLookup,
  messages: MastraDBMessage[]
): Promise<Described> => {
  const task = await lookup(toolCallId).catch(() => null);
  return describeResult(
    labelOf({ toolCallId, toolName }, messages),
    task?.result ?? resultFromHistory(messages, toolCallId)
  );
};

const describeFailed = async (
  entry: Entry,
  lookup: BackgroundTaskLookup,
  messages: MastraDBMessage[]
): Promise<Described> => {
  const task = await lookup(entry.toolCallId).catch(() => null);
  return { line: `- ${labelOf(entry, messages)}失败：${errorMessage(task?.error)}`, images: [] };
};

/**
 * 替换 Mastra 对挂起后台调用的原话「let the user know they are waiting for explicit resume input」。
 * 本项目里后台调用（子 agent 施工）挂起，是停在画布写入上等前端执行，前端处理完自动恢复，用户什么都不用做。
 * 照原话，主 agent 会去叫用户「恢复」，还会以为子 agent 卡住了、自己接手它的任务，画布上建出两套组件。
 */
const SUSPENDED_NOTE_MARKER = "〔后台调用等待前端〕";

const suspendedNote = (entries: Entry[], messages: MastraDBMessage[]): string =>
  [
    SUSPENDED_NOTE_MARKER,
    "下面这些后台调用停在画布写入上，正等前端执行（需要审批时，用户会直接在界面上看到审批框），执行完会自动接着跑：",
    ...entries.map((entry) => `- ${labelOf(entry, messages)}`),
    "它们没有卡住，也没有失败。不要叫用户去「恢复」，不要重新派发，也不要自己去做它们的任务——那样画布上会建出重复的组件。",
    "先做和它们不冲突的事，或者直接结束这一轮；它们跑完后结果会自动送到你这里。"
  ].join("\n");

export interface RewrittenDirective {
  text: string;
  /** 要附在这条消息后面给模型看的图（最近 MAX_TOOL_IMAGES 张，和工具图的上限一致） */
  images: ToolImage[];
}

const imagesToShow = (described: Described[]): ToolImage[] =>
  described.flatMap((item) => item.images).slice(-MAX_TOOL_IMAGES);

const imageNoteLines = (images: ToolImage[]): string[] =>
  images.length > 0
    ? [
        `生成的图片已按顺序附在本条消息后面，你可以直接看：${images.map((image, i) => `[${i + 1}] ${image.label}`).join("；")}`
      ]
    : [];

/** 续接指令里点到名的全部 toolCallId（完成、失败、取消） */
export function directiveToolCallIds(text: string): string[] {
  return [COMPLETED_RE, FAILED_RE, CANCELLED_RE].flatMap((re) =>
    parseEntries(re.exec(text)?.[1] ?? "").map((entry) => entry.toolCallId)
  );
}

/** 返回 null 表示不用改写：不是续接指令、已经改写过、或这批里没有完成 / 失败 / 挂起项 */
export async function rewriteDirectiveText(
  text: string,
  lookup: BackgroundTaskLookup,
  messages: MastraDBMessage[]
): Promise<RewrittenDirective | null> {
  if (text.includes(NOTE_MARKER) || text.includes(SUSPENDED_NOTE_MARKER)) {
    return null;
  }
  const suspendedMatch = SUSPENDED_RE.exec(text);
  const suspended = parseEntries(suspendedMatch?.[1] ?? "");
  const completed = parseEntries(COMPLETED_RE.exec(text)?.[1] ?? "");
  const failed = parseEntries(FAILED_RE.exec(text)?.[1] ?? "");
  if (completed.length === 0 && failed.length === 0 && suspended.length === 0) {
    return null;
  }
  const described = await Promise.all([
    ...completed.map((entry) => describeCompleted(entry, lookup, messages)),
    ...failed.map((entry) => describeFailed(entry, lookup, messages))
  ]);
  const images = imagesToShow(described);
  const original = (suspendedMatch ? text.replace(suspendedMatch[0], "") : text).trim();
  const resultLines =
    described.length > 0
      ? [
          NOTE_MARKER,
          ...described.map((item) => item.line),
          "以上就是这些后台任务的返回内容，要用其中的 url / id 直接取用，不要重复调用同一个工具，也不要再去别处找结果。",
          ...imageNoteLines(images)
        ]
      : [];
  return {
    text: [
      ...(original ? [original] : []),
      ...resultLines,
      ...(suspended.length > 0 ? [suspendedNote(suspended, messages)] : [])
    ].join("\n"),
    images
  };
}

/**
 * 补报：任务早已结束、续接却没送到模型那里（为什么会漏见 ./background-task-notices）。
 * 之前的回复或压缩摘要里可能还写着「在后台生成中」，提示里要明说以这里为准。
 */
const CATCH_UP_MARKER = "〔后台任务补报〕";

export function describeFinishedTask(task: FinishedBackgroundTask, messages: MastraDBMessage[] = []): Described {
  const label = labelOf(task, messages);
  if (task.status === "completed") {
    return describeResult(label, task.result);
  }
  if (task.status === "cancelled") {
    return { line: `- ${label} 已被用户取消，没有结果。`, images: [] };
  }
  const reason = task.status === "timed_out" ? "超时" : errorMessage(task.error);
  return { line: `- ${label} 失败：${reason}`, images: [] };
}

export function catchUpNote(tasks: FinishedBackgroundTask[], messages: MastraDBMessage[] = []): RewrittenDirective {
  const described = tasks.map((task) => describeFinishedTask(task, messages));
  const images = imagesToShow(described);
  return {
    text: [
      CATCH_UP_MARKER,
      "下面这些后台任务早已结束，但结束时没能通知到你。之前的对话或摘要里如果还写着它们「在后台运行 / 生成中」，以这里为准：",
      ...described.map((item) => item.line),
      "要用其中的 url / id 直接取用，不要重复调用同一个工具；之前跟用户说过「还在等结果」的，现在接着把结果用上。",
      ...imageNoteLines(images)
    ].join("\n"),
    images
  };
}

/** 按扩展名给出具体的图片类型：通配的 image/* 在 Mastra 先把 url 下载成字节之后不会再被改写，直接发给服务商可能被拒 */
export const imageMimeOf = (url: string): string => {
  const ext = /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(url)?.[1]?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") {
    return "image/jpeg";
  }
  return ext === "webp" ? "image/webp" : "image/png";
};

const textOf = (message: MastraDBMessage): string =>
  (message.content?.parts ?? []).map((part) => (part.type === "text" ? part.text : "")).join("");

/**
 * 「挂起还没回执」的前台工具调用，如 createComponentTool：它把操作交给前端执行，前端回传后才有结果。
 * 回传（resume 轮）排在当前轮结束后。pnpm 补丁确保前台挂起会结束当前 untilIdle 轮，
 * 不会为了等待后台任务而阻塞恢复；这里仍为尚未拿到真实回执的短暂状态提供说明。
 *
 * Mastra 构造给模型的历史时，会把没有结果的 tool-call 整个过滤掉，续接轮里的模型就看不见自己刚调过，
 * 于是再调一次、再挂起一次（实测：同一批标题组件连调 3 次，前端画布上留下重复的幽灵组件）。
 * 这里把这些调用以文字补回去，让模型知道「已提交、结果没回来」，不要重复。
 */
const PENDING_MARKER = "〔待回传的工具调用〕";

/** 单个调用入参摘要的长度上限：够模型认出是哪一批操作即可 */
const MAX_ARGS_CHARS = 300;

export interface PendingCall {
  toolCallId: string;
  toolName: string;
  args: unknown;
}

/** 历史里挂起了、还没有结果的调用：状态仍是 call，且所在消息的元数据登记了它是挂起的 */
export function pendingSuspendedCalls(messages: MastraDBMessage[]): PendingCall[] {
  return messages.flatMap((message) => {
    const suspended = (message.content?.metadata as { suspendedTools?: Record<string, unknown> } | undefined)
      ?.suspendedTools;
    if (!suspended) {
      return [];
    }
    return (message.content.parts ?? []).flatMap((part) => {
      if (part.type !== "tool-invocation" || part.toolInvocation.state !== "call") {
        return [];
      }
      const { toolCallId, toolName, args } = part.toolInvocation;
      return toolCallId in suspended ? [{ toolCallId, toolName, args }] : [];
    });
  });
}

export function pendingCallsNote(calls: PendingCall[]): string {
  const lines = calls.map((call) => {
    const args = JSON.stringify(call.args ?? {});
    const shown = args.length > MAX_ARGS_CHARS ? `${args.slice(0, MAX_ARGS_CHARS)}…` : args;
    return `- ${call.toolName}（${call.toolCallId}）入参：${shown}`;
  });
  return [
    PENDING_MARKER,
    "下面这些调用你已经发出，现在交给前端执行了，执行结果还没有回传。它们不在上面的对话记录里，但确实发生过：",
    ...lines,
    "不要重复发起同样的调用——重复会在画布上留下重复的组件。结果回来之后你会在对话里看到；",
    "如果现在要做别的事就继续做别的，或者先结束这一轮；要确认它们是否生效，到工作区里读对应文件，不要凭感觉重试。"
  ].join("\n");
}

/** 把「待回传」说明作为 context 消息放进这一步；上一步放过的先撤掉，状态可能已经变了 */
function syncPendingNote(messageList: ProcessorMessageContext["messageList"], messages: MastraDBMessage[]): void {
  const stale = messages.filter((message) => message.role === "user" && textOf(message).startsWith(PENDING_MARKER));
  const pending = pendingSuspendedCalls(messages);
  if (stale.length > 0) {
    messageList.removeByIds(stale.map((message) => message.id));
  }
  if (pending.length > 0) {
    messageList.add([{ role: "user", content: pendingCallsNote(pending) }], "context");
  }
}

/** 图片作为 file part 附在提示后面：image-middleware 会把本系统的图读成二进制，模型才真的看得见 */
const imageParts = (images: ToolImage[]) =>
  images.map((image) => ({ type: "file" as const, data: image.url, mimeType: imageMimeOf(image.url) }));

export class InlineBackgroundTaskResults implements Processor {
  id = "inline-background-task-results";

  constructor(
    private readonly lookup: BackgroundTaskLookup = lookupBackgroundTaskInStorage,
    private readonly ledger: BackgroundTaskNoticeLedger = threadNoticeLedger
  ) {}

  async processInputStep({ messageList }: ProcessorMessageContext) {
    syncPendingNote(messageList, messageList.get.all.db());
    const all = messageList.get.all.db();
    /** 本步续接指令里已经点到名的任务：照常改写，对账时只记账、不重复补报 */
    const announced = new Set<string>();
    for (const message of all) {
      if (message.role !== "user" || !textOf(message).includes(DIRECTIVE_PREFIX)) {
        continue;
      }
      directiveToolCallIds(textOf(message)).forEach((toolCallId) => announced.add(toolCallId));
      const images: ToolImage[] = [];
      const parts = message.content.parts.map(async (part) => {
        if (part.type !== "text") {
          return part;
        }
        const rewritten = await rewriteDirectiveText(part.text, this.lookup, all);
        if (rewritten === null) {
          return part;
        }
        images.push(...rewritten.images);
        return { ...part, text: rewritten.text };
      });
      const textParts = await Promise.all(parts);
      if (textParts.every((part, index) => part === message.content.parts[index])) {
        continue;
      }
      const newParts = [...textParts, ...imageParts(images)];
      // 以 context 来源放回：只给模型看，不落库
      messageList.removeByIds([message.id]);
      messageList.add({ ...message, content: { ...message.content, parts: newParts } }, "context");
    }
    await this.catchUp(messageList, all, announced);
    return messageList;
  }

  /**
   * 拿任务表对账：已经结束、却从没告诉过模型的任务，补一条说明（context 来源，不落库）。
   * 每一步都跑，补报过的随即记账，下一步就不会再报；对账失败只记日志，不能拖垮这一轮。
   */
  private async catchUp(
    messageList: ProcessorMessageContext["messageList"],
    messages: MastraDBMessage[],
    announced: Set<string>
  ): Promise<void> {
    const threadId = messages.find((message) => message.threadId)?.threadId;
    if (!threadId) {
      return;
    }
    try {
      const unnotified = await this.ledger.listUnnotified(threadId);
      const missed = unnotified.filter((task) => !announced.has(task.toolCallId));
      if (missed.length > 0) {
        const note = catchUpNote(missed, messages);
        const message: MastraDBMessage = {
          id: randomUUID(),
          role: "user",
          createdAt: new Date(),
          threadId,
          content: { format: 2, parts: [{ type: "text", text: note.text }, ...imageParts(note.images)] }
        };
        messageList.add(message, "context");
      }
      await this.ledger.markNotified(
        threadId,
        unnotified.map((task) => task.toolCallId)
      );
    } catch (err) {
      console.error("[inline-background-task-results] 后台任务对账失败", { threadId, err });
    }
  }
}
