import type { BackgroundTaskManager } from "@mastra/core/background-tasks";
import type { ChunkType } from "@mastra/core/stream";

import { withRecordingTurn } from "@/recording/recording-scope";

import { memory } from "../../storage/storage";
import { commitScreenSnapshot } from "../version-history";
import { renameBackgroundChunk } from "./background-chunk";
import type { BgEventChunk } from "./bg-event-dedup";
import { BgEventDedup } from "./bg-event-dedup";
import { createBIChatTurnStream } from "./bi-chat-turn-stream";
import { markToolCallsInterrupted } from "./interrupted-tool-call";
import { extractUserMessageId, extractUserMessageText } from "./turn-message";
import type { BIChatRequest } from "./types";

/** 挂起后等 resume 的兜底超时：无人 resume 则关掉会话，释放连接（防僵尸常驻） */
const IDLE_MS = 15 * 60_000;

/** 一轮的可变入参：初始轮给 messages，resume 轮给 runId(+resumeData)。 */
interface RunTurnArgs extends Partial<BIChatRequest> {
  /** 用户拒绝命令时，等该工具结果推给前端后立即终止会话，禁止模型继续换路线重试。 */
  terminateAfterToolCallId?: string;
}

/** 轮循环只读这几个字段；真实 chunk 是 ChunkType，字段远多于此 */
interface TurnChunk {
  type?: string;
  toolCallId?: string;
  data?: { taskId?: string; toolCallId?: string };
}

/**
 * 主 agent 自身被挂起(如 clientTool 人审)：当前轮在此处暂停结束，需留着 outer 等下一轮
 * 带 runId 的 resume(handleBiChatResume → resumeStream 续接)。
 */
const MAIN_SUSPEND_TYPE = "data-tool-call-suspended";

/**
 * 后台任务被挂起：和主 agent 挂起不同，它的 resume 走旁路(resume-task → bgManager.resume +
 * attachTaskStream)，且续接不一定回到当前轮。用 suspendedBgTasks Set 记「还没回来的后台任务」，
 * attachTaskStream 收到终态再清除，以此决定轮结束时该 close() 还是留着 idle。
 */
const BG_SUSPEND_TYPE = "data-background-task-suspended";

/** 所有后台任务事件的前缀；这些帧的 data 都带 toolCallId(BackgroundTaskRef) */
const BG_EVENT_PREFIX = "data-background-task-";

/** 后台任务的三种终态(bgManager 原始事件名，尚未经 renameBackgroundChunk 改名)：收到即停订阅 */
const BG_TERMINAL_TYPES = new Set(["background-task-completed", "background-task-failed", "background-task-cancelled"]);

/** 建一条会话所需的全部依赖 */
interface BIChatStreamSessionInit {
  readonly threadId: string;
  readonly resourceId: string;
  /**
   * 举着 outer 流的那条初始连接的断连信号，断开即拆会话。
   * resume 等短命请求不要传——它们一结束就会把整条长会话拆掉。
   */
  readonly connectionSignal?: AbortSignal;
  /** 会话进入收尾（正常 close 或出错 fail）时回调一次，且只回调一次 */
  readonly onClosed: (session: BIChatStreamSession) => void;
}

/**
 * 会话级传输流(hub)：按 threadId 长存的一条 outer 流，跨初始轮 / resume 轮。
 *
 * 传输与状态解耦：每个 turn 的 swAgent.stream 只是临时数据源，pipe 进 outer；
 * turn 结束 ≠ outer 结束——见过 suspend 就留着等 resume，正常答完才关。
 */
class BIChatStreamSession {
  private readonly stream = new TransformStream<ChunkType, ChunkType>(); // 一根管子:writable 进 / readable 出
  private readonly writer = this.stream.writable.getWriter();
  private readonly abort = new AbortController(); // 喂给 swAgent.stream/resumeStream
  private closed = false;
  private tail: Promise<void> = Promise.resolve(); // 串行队列:每轮排在上一轮之后
  private sawMainSuspend = false; // 本轮主 agent 是否被挂起(需 runId resume)；每轮重置
  private turnActive = false; // 当前是否有一轮在消费 turnStream(决定 bg 终态时该续接还是放手)
  /**
   * 本次会话（=用户一次提问，close 自删）的问题文本，作为版本快照 commit message。
   * 首个非空轮捕获一次；resume/后台续接轮 messages 为空，不覆盖。
   */
  private turnMessageText = "";
  /**
   * 发起本次会话那条用户消息的 id。与 turnMessageText 同时机捕获（首个非空轮），
   * close 提交版本节点时作为 screenwright-msg-id 写入 commit，供前端按消息撤销。
   */
  private turnMessageId = "";
  /**
   * 是否已落过「AI 动手前」的用户改动基线节点。整个会话只做一次：
   * 首个真实提问轮在 AI 编辑前，把此刻 workspace（含用户手动改动，由 cacheWorker 同步而来）
   * 提交为独立节点，使 AI 本轮的改动与用户改动干净分离，各自可回退。
   */
  private baselineCommitted = false;
  /**
   * 还没回来的后台任务 taskId：循环见 BG_SUSPEND_TYPE 时 add，attachTaskStream 终态时 delete。
   * 跨轮存活(不随单轮重置)——轮结束时只要它非空，就留着 idle 等任务回来，不能 close。
   */
  private readonly suspendedBgTasks = new Set<string>();
  /** 用户已拒绝的后台挂起任务：等任务结果落入流并进入终态后终止整个会话。 */
  private readonly terminateAfterBgTasks = new Set<string>();
  private idleTimer?: ReturnType<typeof setTimeout>;
  /**
   * resume 后接进 outer 的后台任务遥测订阅；dispose/close 时一并退订，防订阅泄漏
   */
  private readonly attachedTasks = new Map<string, AbortController>();
  /**
   * 已委派到后台的 toolCallId。后台任务挂起时上游会另发一帧 data-tool-call-suspended，
   * 那是 agent.resumeStream 那条 resume 路线的入口；本项目走 bgManager 那条，故据此丢弃。
   * 两条路线的取舍见 runTurnBody 的注释。
   */
  private readonly bgToolCallIds = new Set<string>();
  /** bg task 事件双发去重台账；判重规则与窗口成因见 ./bg-event-dedup */
  private readonly bgEventDedup = new BgEventDedup();
  /**
   * 已发起(tool-input-available)但还没等到结果(tool-output-available/-error/-denied)的
   * 前台 toolCallId。正常收尾时必为空——dispose()/fail() 才会撞上非空的情况，见那两处注释。
   */
  private readonly pendingToolCallIds = new Set<string>();

  private readonly threadId: string;
  private readonly resourceId: string;
  /** 收尾时通知外界（注册表据此摘除登记）；会话因此不必反向依赖注册表 */
  private readonly onClosed: (session: BIChatStreamSession) => void;

  private constructor(init: BIChatStreamSessionInit) {
    this.threadId = init.threadId;
    this.resourceId = init.resourceId;
    this.onClosed = init.onClosed;
    // 消费者(Response)取消 readable → writable 被 error → writer.closed reject;运行时断连兜底
    this.writer.closed.catch(() => this.dispose());
    // 初始连接断开 → 拆会话(主路,Hono 下更可靠);只在新建时绑一次
    init.connectionSignal?.addEventListener("abort", () => this.dispose(), { once: true });
  }

  /**
   * 唯一的建会话入口，只应由 SessionRegistry 调用 ——
   * 外部要拿会话一律走 `sessionRegistry.getOrCreate()` / `.find()`，
   * 否则会造出一条没有登记、resume 轮永远找不回来的孤儿会话。
   */
  static create(init: BIChatStreamSessionInit): BIChatStreamSession {
    return new BIChatStreamSession(init);
  }

  getStream(): ReadableStream<ChunkType> {
    return this.stream.readable;
  }

  /**
   * 推进对话：把这一轮排进串行队列，跑完不关 outer。
   *
   * 串行(而非 activeTurn 布尔门控)是关键：resume 轮常在初始轮"收尾"(SubAgentSnapshotCollector.persist
   * 等异步)还没结束时就到达，旧门控会因 activeTurn 仍为真而静默丢掉这一轮 → 前端收不到续接(偶发)。
   * 排队让 resume 轮稳稳接在初始轮之后执行。
   */
  runTurn(args: RunTurnArgs): Promise<void> {
    const next = this.tail.then(() => this.runTurnWithRecording(args));
    this.tail = next.catch(() => {}); // 单轮失败不卡死后续轮(runTurnBody 内部已 fail())
    return next;
  }

  /**
   * 一次 turn 就是录制里的一个 turn：建流与消费流都在 runTurnBody 内完成，
   * 所以深层 provider fetch 层能一路继承到本轮的 threadId / runId。
   */
  private runTurnWithRecording(args: RunTurnArgs): Promise<void> {
    return withRecordingTurn({ threadId: this.threadId, runId: args.runId }, () => this.runTurnBody(args));
  }

  /**
   * 跑一轮：消费 turnStream 逐帧推给前端，顺带维护「这一轮该不该关流」的状态。
   *
   * 循环里丢帧只有一种情形 —— 后台任务挂起时，上游会为同一次挂起发两帧，各自对应一条
   * 官方 resume 路线（docs/harness/background-tasks.md「What happens to the agent loop」）：
   *
   *   data-tool-call-suspended        带 runId + toolCallId → agent.resumeStream(...)
   *   data-background-task-suspended  带 taskId             → bgManager.resume(taskId, ...)
   *
   * 两帧的 suspendPayload 一模一样，是同一次人审请求。**必须二选一**：前端两条链路
   * （createSideEffectTransform 与 onBackgroundTaskSuspended）各自独立，都放行就会弹两次审批，
   * 批准后组件建两次，还同时打两条 resume。
   *
   * 本项目选 bgManager 那条 —— /resume-task 已经配齐了 waitForBgWorkflowSuspended（等 snapshot
   * 真落盘）、subscribe-before-resume、以及 taskId 级幂等，续接由 finishTaskStream 触发空轮完成。
   * 所以这里把 resumeStream 那条路线的入口帧丢掉，前端就只剩一条路可走。
   */
  private async runTurnBody(args: RunTurnArgs): Promise<void> {
    if (this.closed) {
      return;
    }
    this.clearIdle();
    this.sawMainSuspend = false;
    this.turnActive = true;
    if (!this.turnMessageText) {
      this.turnMessageText = extractUserMessageText(args.messages);
    }
    if (!this.turnMessageId) {
      this.turnMessageId = extractUserMessageId(args.messages);
    }
    // AI 动手前先落用户改动基线：必须 await 完成后再起 turnStream，否则 AI 已写的文件会和
    // 用户改动一起被 git add -A 打进基线节点。只在首个真实提问轮做一次（resume/后台续接轮跳过）。
    if (!this.baselineCommitted && (args.messages?.length ?? 0) > 0) {
      this.baselineCommitted = true;
      await commitScreenSnapshot(this.resourceId, "用户手动改动").catch((e) =>
        console.error("[stream-session] 用户改动基线提交失败", e)
      );
    }
    try {
      const turnStream = await this.buildTurnStream(args);
      for await (const chunk of turnStream as unknown as AsyncIterable<TurnChunk>) {
        if (this.closed) {
          break;
        }
        if (chunk.type?.startsWith(BG_EVENT_PREFIX) && chunk.data?.toolCallId) {
          this.bgToolCallIds.add(chunk.data.toolCallId); // started 最早，挂起前必已记上
        }
        if (chunk.type === MAIN_SUSPEND_TYPE) {
          if (chunk.data?.toolCallId && this.bgToolCallIds.has(chunk.data.toolCallId)) {
            continue; // 后台那次挂起的重复通报：丢帧，理由见方法注释
          }
          // 挂起等审批走的是 runId resume，不是「悄悄断在半路」，不算 pending。
          if (chunk.data?.toolCallId) {
            this.pendingToolCallIds.delete(chunk.data.toolCallId);
          }
          this.sawMainSuspend = true;
        } else if (chunk.type === BG_SUSPEND_TYPE && chunk.data?.taskId) {
          this.suspendedBgTasks.add(chunk.data.taskId); // 记下，等 attachTaskStream 收到终态再清
        }
        // 前台工具调用的起止：中途 dispose()/fail() 时，留在这里的就是被掐断的那些。
        // 委派到后台的调用(bgToolCallIds)另有 suspend/resume 路线，交给 markPendingToolCallsInterrupted 排除。
        if (chunk.type === "tool-input-available" && chunk.toolCallId) {
          this.pendingToolCallIds.add(chunk.toolCallId);
        } else if (
          chunk.toolCallId &&
          (chunk.type === "tool-output-available" ||
            chunk.type === "tool-output-error" ||
            chunk.type === "tool-output-denied")
        ) {
          this.pendingToolCallIds.delete(chunk.toolCallId);
        }
        await this.push(chunk as ChunkType);
        if (chunk.type === "tool-output-available" && chunk.toolCallId === args.terminateAfterToolCallId) {
          this.terminate();
          break;
        }
      }
      if (this.closed) {
        return; // 已被 dispose，别再门控
      }
      // 留着等 resume 的两种理由：主 agent 自身挂起(等 runId resume)、或还有后台任务没回来
      // (等 resume-task 旁路续接)。两者都没有 = 真答完了，close() 发 DONE。
      if (this.sawMainSuspend || this.suspendedBgTasks.size > 0) {
        this.scheduleIdleClose();
      } else {
        this.close();
      }
    } catch (err) {
      this.fail(err);
    } finally {
      this.turnActive = false;
    }
  }

  /**
   * resume 后把某个后台任务的实时遥测接进 outer（旁路推送，不走 runTurn 串行队列）。
   *
   * - subscribe-before-resume：调用方必须先 attach 再 resume——stream() 连上只补发 running 快照，
   *   订阅那刻任务还是 suspended，先订阅才不漏后续 resumed/output。
   * - 终态(completed/failed/cancelled)收到即 abort 退订，否则 stream() 永不关闭 = 订阅泄漏。
   * - 期间 clearIdle，长任务跑到一半不会被空闲计时关流。
   * - 复用 renameBackgroundChunk：原始 background-task-* → data-background-task-* UIMessageChunk，
   *   前端现有的 split/子流渲染顺着 toolCallId 直接接住，无需改前端渲染。
   * - 关流不归这里管(它只是旁路遥测)：终态时若已无活动轮，触发一轮空 runTurn 让主 agent 续接，
   *   由那一轮跑完 close()；若初始流还活着，续接走 in-band，更不该在这里 close。
   *
   * @param terminateOnFinish 用户拒绝了这个后台任务里的命令。任务走到终态时不再触发续接轮，
   *   直接终止整条会话——语义与前台的 terminateAfterToolCallId 一致：拒绝即到此为止。
   *   不当场终止是因为要先让任务结果顺流推给前端，否则用户看不到自己那次拒绝的回执。
   */
  attachTaskStream(taskId: string, bgManager: BackgroundTaskManager, terminateOnFinish = false): void {
    if (this.closed || this.attachedTasks.has(taskId)) {
      return;
    }

    if (terminateOnFinish) {
      // 记在这里而不是当场终止：任务结果还没落进流，立刻掐掉前端就看不到"这一步被拒了"的回执。
      this.terminateAfterBgTasks.add(taskId);
    }

    this.clearIdle();

    const newTaskAbortController = new AbortController(); // 本次订阅的退订把手
    this.attachedTasks.set(taskId, newTaskAbortController);

    const taskStream = bgManager.stream({
      taskId,
      abortSignal: newTaskAbortController.signal
    }) as ReadableStream<ChunkType>;

    void this.pumpTaskStream(taskId, taskStream, newTaskAbortController).catch(() => {}); // 任务流失败 = 退订
  }

  /**
   * 抽干某个后台任务的遥测流，逐帧改名后推进 outer；收到终态或会话已关即停。
   * 无论如何结束都走 finishTaskStream 收尾（退订 + 决定要不要触发续接轮）。
   */
  private async pumpTaskStream(
    taskId: string,
    taskStream: ReadableStream<ChunkType>,
    taskAbortController: AbortController
  ): Promise<void> {
    let reachedTerminalState = false;
    try {
      for await (const chunk of taskStream) {
        if (this.closed) {
          break;
        }
        reachedTerminalState = BG_TERMINAL_TYPES.has(chunk.type);

        const renamedChunk = renameBackgroundChunk(chunk);
        if (renamedChunk) {
          await this.push(renamedChunk);
        }

        if (reachedTerminalState) {
          break; // 终态：停订阅
        }
      }
    } catch (err) {
      console.error("[stream-session] attachTaskStream error", { taskId, err });
    } finally {
      this.finishTaskStream(taskId, taskAbortController, reachedTerminalState);
    }
  }

  /**
   * 后台任务遥测订阅收尾：退订、清登记，并决定主 agent 的续接走哪条路。
   *
   * - turnActive：续接顺着当前轮那条 untilIdle 流 in-band 回来，由它跑完自行 close()，这里不插手。
   * - 已无活动轮(初始流早在挂起处 idle 结束)：主 agent 不会自己续接，触发一轮空 runTurn
   *   让它读 memory(任务结论已落盘)把续接灌进 outer，该轮无挂起跑完即 close() 发 DONE。
   */
  private finishTaskStream(taskId: string, taskAbortController: AbortController, reachedTerminalState: boolean): void {
    taskAbortController.abort();
    if (this.attachedTasks.get(taskId) === taskAbortController) {
      this.attachedTasks.delete(taskId);
    }
    if (reachedTerminalState) {
      this.suspendedBgTasks.delete(taskId); // 任务回来了，不再是「挂着没回来」
    }
    if (reachedTerminalState && this.terminateAfterBgTasks.delete(taskId)) {
      // 用户拒绝了这个后台任务里的命令：结果已顺流推给前端，到此为止，不触发续接轮。
      this.terminate();
      return;
    }
    if (reachedTerminalState && !this.closed && !this.turnActive && this.attachedTasks.size === 0) {
      void this.runTurn({ messages: [] });
    }
  }

  /** 恢复请求被拒绝时撤销遥测订阅；任务仍保持 suspended，可安全重试。 */
  detachTaskStream(taskId: string): void {
    // 一并清掉终止标记：resume 本身失败（任务没跑起来）不算"用户拒绝的那次执行完了"。
    // 留着的话，用户改口批准后重试，这个陈旧标记会在终态时把会话误杀。
    this.terminateAfterBgTasks.delete(taskId);
    const taskAbortController = this.attachedTasks.get(taskId);
    if (!taskAbortController) {
      return;
    }
    this.attachedTasks.delete(taskId);
    taskAbortController.abort();
  }

  /** 这一轮怎么起流 = 复用工厂；session 补上 threadId/resourceId 与 abort 依赖 */
  private buildTurnStream(args: RunTurnArgs) {
    return createBIChatTurnStream(
      {
        messages: args.messages ?? [],
        clientTools: args.clientTools ?? {},
        runId: args.runId,
        suspendType: args.suspendType,
        resumeData: args.resumeData,
        threadId: this.threadId,
        resourceId: this.resourceId
      },
      { abortController: this.abort }
    );
  }

  private async push(chunk: ChunkType) {
    if (this.closed) {
      return;
    }
    // 只有存在 attach 旁路订阅时才处于「双发重叠窗口」，此外一律放行（否则会误杀连续 delta）。
    if (!this.bgEventDedup.tryAdmit(chunk as BgEventChunk, this.attachedTasks.size > 0)) {
      return;
    }
    try {
      await this.writer.write(chunk); // 背压：消费者慢就在这等
    } catch {
      this.dispose(); // 写失败 = 消费者已断
    }
  }

  private scheduleIdleClose() {
    this.clearIdle();
    this.idleTimer = setTimeout(() => this.close(), IDLE_MS);
  }

  private clearIdle() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  /** 正常收尾：先落版本快照节点，提交「落地后」顺流通知前端刷新，再关 readable */
  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.clearIdle();
    this.onClosed(this); // 立即通知摘除，防止新 turn 命中已在收尾的会话
    void this.finalizeCommit();
  }

  /**
   * 一次提问的生命周期到此结束：把本轮所有工具写入的改动提交为一个可回退节点，
   * 并在提交「落地后」往流里写一帧 data-version-committed，前端据此刷新回退列表。
   *
   * 为何要发事件而非让前端猜时机：提交本身是异步 git 操作，且 close() 可能远晚于前端本轮
   * 流「看起来结束」（suspend 等 resume、后台任务续接、一次会话多轮）。前端无从得知何时该
   * 刷新，靠固定时机 refresh 会与提交竞态、经常拿不到刚发这条提问的撤销锚点。改由提交落地
   * 后顺流通知，天然消除竞态并覆盖上述所有场景。
   *
   * 用底层 writer 直接写（不走 push 的 closed 守卫）——writer 尚未 close，此写合法且排在既有帧后；
   * 提交/通知失败只记日志，最终都要 close writer 收尾。
   */
  private async finalizeCommit() {
    try {
      await commitScreenSnapshot(this.resourceId, this.turnMessageText || "AI 编辑", this.turnMessageId || undefined);
      await this.writer.write({
        type: "data-version-committed",
        data: { messageId: this.turnMessageId || null }
      } as unknown as ChunkType);
    } catch (e) {
      console.error("[stream-session] 版本快照提交/通知失败", e);
    } finally {
      this.writer.close().catch(() => {});
    }
  }

  /** 出错收尾：让前端 readUIMessageStream 抛错 → 走 handleSendError */
  private fail(err: unknown) {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.clearIdle();
    void this.markPendingToolCallsInterrupted();
    this.abort.abort();
    this.writer.abort(err).catch(() => {});
    this.onClosed(this);
  }

  /**
   * dispose()/fail() 撞上"工具已发起、还没等到结果"时，给这些 toolCallId 补一个
   * 占位结果再撤——不然它们会被 Mastra 落盘时当作不完整的 tool-call 整个过滤掉，
   * 下一轮历史里就像没发生过；工具的副作用却是真实的。具体写法见 ./interrupted-tool-call。
   *
   * fire-and-forget：dispose()/fail() 本身不等它，失败只记日志，不影响会话收尾。
   */
  private async markPendingToolCallsInterrupted(): Promise<void> {
    if (this.pendingToolCallIds.size === 0) {
      return;
    }
    // bgToolCallIds：委派到后台的调用另有 suspend/resume 路线，任务仍在真实跑着，不算「断在半路」。
    const toolCallIds = [...this.pendingToolCallIds].filter((id) => !this.bgToolCallIds.has(id));
    this.pendingToolCallIds.clear();
    if (toolCallIds.length === 0) {
      return;
    }
    try {
      await markToolCallsInterrupted({ memory, threadId: this.threadId, resourceId: this.resourceId, toolCallIds });
    } catch (e) {
      console.error("[stream-session] 标记中断工具调用失败", e);
    }
  }

  /**
   * 用户拒绝执行 → 整条会话到此为止。
   *
   * 【为什么不能只 close()】close() 只关 readable，agent 那条 untilIdle 流还在跑——模型会接着
   * 换个路线重试，而"别再试了"正是拒绝的语义。所以必须先 abort 掐掉上游。
   *
   * 【为什么不能用 fail()】拒绝不是错误。fail() 会让前端 readUIMessageStream 抛错走
   * handleSendError；用户主动拒绝该看到一次正常的 DONE，版本快照也该照常提交。
   *
   * 与 dispose() 恰好同构（都是 abort + close），但语义不同：那个是"客户端断连"。
   * 分开命名让调用点自解释，将来两者要分化也有缝可下。
   */
  private terminate() {
    this.abort.abort();
    this.close();
  }

  /** 客户端断连：停上游 + 关流 */
  private dispose() {
    void this.markPendingToolCallsInterrupted();
    this.abort.abort();
    this.close();
  }
}

export type { BIChatStreamSessionInit };
export { BIChatStreamSession };
