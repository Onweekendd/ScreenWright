/**
 * driver：把一条 prompt 跑成一次真实的 agent 会话。
 *
 * 走**会话层**（`sessionRegistry` → `session.getStream()` / `runTurn`），不走 `agent.generate()`。
 * 会话层承担了三样绕不过去的东西：
 *   - `runTurn` 内部就是 `runTurnWithRecording`，**录制自动生效**，driver 不用自己包 withRecordingTurn
 *   - 后台任务双帧去重（`stream-session.ts:162`：两帧都放行会弹两次审批、建两个组件、打两条 resume）
 *   - 用户改动基线提交
 *
 * 模型是 **hub**，不是 stream→resume→新 stream：真实链路是一条长流，suspend 时流不关，
 * resume 从旁路灌回去，续接帧顺原流回来。跟前端 `useChunkSideEffects.ts:110` 逐行对应，
 * 只是省掉 HTTP/SSE 那层。
 *
 * ⚠️ 本模块静态 import 了 `@/`，所以**加载它之前** `MASTRA_WORKSPACE_PATH` 和 `LLM_RECORD_DIR`
 * 必须已经设好：一批模块级 `const ... = getAgentWorkspacePath()`（查法见 workspace.ts 顶部）
 * 和 `@/lib/storage` 的 `RECORD_ROOT` 都在 import 时定格，进程内再改会跟懒读的那份分叉。
 * 入口（harness/run.ts）负责先设 env 再动态 import。
 */

import type { UIMessage } from "ai";

import { handleBiChatResume, handleBiChatResumeTask } from "@/mastra/services/chat";
import { sessionRegistry } from "@/mastra/services/chat/session-registry";
import { handleCreateThread } from "@/mastra/services/chat/thread-handlers";
import type { AgentMode, SuspendType } from "@/mastra/types/bi-chat";
import { flushArchiveWrites } from "@/recording/exchange-archive";

import type { DriverResult } from "./case";
import type { FakeFrontend } from "./fake-frontend";
import { createNodeConversionApplier } from "./node-conversion";

/** eval 专用 resource：跟真实用户的 thread 彻底分开，也方便事后一把清理。 */
export const EVAL_RESOURCE = "eval-runner";

const MAIN_SUSPEND = "data-tool-call-suspended";
const BG_SUSPEND = "data-background-task-suspended";
/** 工作流单向推来的组件帧（figmaToBI / codiaToBI / requirementToBI 共用），见 node-conversion.ts */
const NODE_CONVERSION = "data-node-conversion";

/** 主 agent 工具挂起帧的 data（前端 `SuspendedToolInfo`，`useAgentBIStream.ts:15`）。 */
interface MainSuspendData {
  runId: string;
  toolCallId: string;
  toolName: string;
  suspendPayload: { type: SuspendType } & Record<string, unknown>;
}

/** 后台子任务挂起帧的 data（`useBackgroundTask.ts:198`）：多一个 taskId，resume 走另一个端点。 */
interface BgSuspendData extends MainSuspendData {
  taskId: string;
}

export interface DriverOptions {
  prompt: string;
  /** `{screenId}_{versionCode}`，拼进 editor-context 告诉 agent 该操作哪块屏 */
  screenKey: string;
  frontend: FakeFrontend;
  mode?: AgentMode;
  /**
   * 来自 `runExperiment` 的 `itemTimeout`。**必须真的接**——itemTimeout 是协作式的，
   * mastra 只 abort signal，不响应的 task 会一直跑到底还算 succeeded。
   */
  signal?: AbortSignal;
}

/**
 * 拼 `<editor-context>` + `<user-message>`，跟前端 `useAgentBI.ts:150` 一字不差。
 *
 * **这不是可选的包装**：agent 的 screenId 完全来自这里（`editor-context.md` 教它
 * 「操作 Workspace 文件时，使用 screen_{screenId}_{versionCode} 找到当前大屏」），
 * 只发裸 prompt 的话它根本不知道该动哪块屏，会去猜或者满工作区乱找。
 *
 * 眼下只铺根画布 + 空选区这一种情形，够 A/C 两类用。要测「用户选中了某个组件后说
 * 『把这个挪到左边』」，得把 `<selected-components>` 也照 `buildSelectedComponentsXml`
 * 的形状拼出来（含 `rf` 全路径），那是 B 类的事。
 */
const buildUserMessage = (prompt: string, screenKey: string): string => {
  const [screenId, versionCode = ""] = screenKey.split("_");
  const sections = [
    `<screen-info>\n大屏ID: ${screenId}，版本号: ${versionCode}，Workspace目录: screen_${screenKey}\n</screen-info>`,
    "<current-page>\n类型: 大屏根画布\n</current-page>",
    "<selected-components>无</selected-components>"
  ];
  return `<editor-context>\n${sections.join("\n\n")}\n</editor-context>\n\n<user-message>\n${prompt}\n</user-message>`;
};

export const runDriver = async ({
  prompt,
  screenKey,
  frontend,
  mode,
  signal
}: DriverOptions): Promise<DriverResult> => {
  const startedAt = Date.now();
  const chunkCounts: Record<string, number> = {};

  /**
   * 按需开启的 chunk 时间线（`EVAL_CHUNK_TIMELINE=1`）。
   *
   * 起因：b4 里两次写操作在两轮模型调用之间吃掉 44s，而 `previewComponentEdit` /
   * `applyComponentEdit` 实测各 ~5ms——耗时全在 suspend→resume 这条框架往返上，
   * 而 `chunkCounts` 只数个数、录制只记模型调用，中间这段是盲区。
   *
   * 默认关闭：它按 chunk 打点，开着会把 reasoning-delta 那种上万条的流也算进来。
   */
  const timeline: Array<{ ms: number; type: string; note?: string }> = [];
  const traceChunks = process.env.EVAL_CHUNK_TIMELINE === "1";
  const TRACED = new Set([
    MAIN_SUSPEND,
    BG_SUSPEND,
    "start-step",
    "finish-step",
    "tool-input-available",
    "tool-output-available",
    "finish"
  ]);
  const mark = (type: string, note?: string) => {
    if (traceChunks) {
      timeline.push({ ms: Date.now() - startedAt, type, ...(note ? { note } : {}) });
    }
  };

  // mode 存在 thread metadata 里（`bi-chat-turn-stream.ts:65` 读它，缺省 ASK_BEFORE_EDIT），
  // 而 patchThreadMetadata 对不存在的 thread 是空操作——所以建 thread 时就得把它带上。
  const thread = await handleCreateThread(EVAL_RESOURCE, `eval:${prompt.slice(0, 20)}`, mode ? { mode } : undefined);
  const threadId = thread.id;

  const session = sessionRegistry.getOrCreate(threadId, EVAL_RESOURCE);
  const stream = session.getStream();

  let timedOut = false;
  const onAbort = () => {
    timedOut = true;
    session.close(); // 关流 → 下面的 for-await 正常结束，控制权干净地交回来
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const nodeConversion = createNodeConversionApplier(screenKey);

  const messages: UIMessage[] = [
    { id: `eval-${Date.now()}`, role: "user", parts: [{ type: "text", text: buildUserMessage(prompt, screenKey) }] }
  ];

  let error: DriverResult["error"];
  try {
    // fire-and-forget：runTurn 只是把这一轮灌进 outer，消费在下面
    void session.runTurn({ messages, threadId, resourceId: EVAL_RESOURCE });

    for await (const chunk of stream as unknown as AsyncIterable<{ type: string; data: unknown }>) {
      chunkCounts[chunk.type] = (chunkCounts[chunk.type] ?? 0) + 1;
      if (TRACED.has(chunk.type)) {
        const d = chunk.data as { toolName?: string; suspendPayload?: { type?: string } } | undefined;
        mark(chunk.type, d?.suspendPayload?.type ?? d?.toolName);
      }

      // 工作流建组件走的是这条单向路：不 suspend、也不写工作区，落盘归前端。
      // 只处理 suspend 帧的话，工作流建出来的整块屏在断言眼里根本不存在
      if (chunk.type === NODE_CONVERSION) {
        nodeConversion.apply(chunk.data as Parameters<typeof nodeConversion.apply>[0]);
        continue;
      }

      if (chunk.type === MAIN_SUSPEND) {
        const data = chunk.data as MainSuspendData;
        const resumeData = frontend.reply(data.suspendPayload, {
          toolName: data.toolName,
          toolCallId: data.toolCallId,
          channel: "main"
        });
        handleBiChatResume({
          threadId,
          runId: data.runId,
          toolCallId: data.toolCallId,
          suspendType: data.suspendPayload.type,
          resumeData
        });
        continue;
      }

      // 两种挂起共用同一套分发（前端 `useChunkSideEffects.ts:66` 的注释写着）。只接主 agent
      // 那条的话，后台子任务一挂起就没人应答，case 会挂死到超时——并发那批必然踩。
      if (chunk.type === BG_SUSPEND) {
        const data = chunk.data as BgSuspendData;
        const resumeData = frontend.reply(data.suspendPayload, {
          toolName: data.toolName,
          toolCallId: data.toolCallId,
          channel: "background"
        });
        void handleBiChatResumeTask({
          threadId,
          taskId: data.taskId,
          suspendType: data.suspendPayload.type,
          resumeData
        });
      }
    }
    // 流关闭 = 整轮真正结束（包括所有 resume 轮）
  } catch (err) {
    // 落成数据不外抛：录制是逐 step 落盘的，崩在第 5 轮时前 4 轮记录都在，
    // 那是诊断价值最高的数据，不该因为异常就跳过 L2 采集。
    error = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    };
  } finally {
    signal?.removeEventListener("abort", onAbort);
    // 兜底重写一次：正常路径下每帧都已落盘（见 node-conversion.ts 的 writeBack），
    // 这里只是保证超时中断 / 异常路径下已收到的部分不丢
    nodeConversion.flush();
  }

  // 等归档落地。`close()` 里落盘与索引两个写入都是 fire-and-forget，case 跑完立刻读目录，
  // 最后一两个 step 大概率还没落地。**别用 sleep，也别轮询本地文件数**：文件数只反映本地那
  // 一半，上传那一半（RECORD_SINK=both）还要两个网络往返，本地稳定了它还在飞——曾经就是这么
  // 丢的：DB 索引行有、MinIO 对象没有，两边对不上且不报错。flush 是等那批 Promise，是确定的。
  await flushArchiveWrites();

  return {
    threadId,
    timedOut,
    error,
    suspends: frontend.log,
    ...(traceChunks ? { timeline } : {}),
    chunkCounts,
    elapsedMs: Date.now() - startedAt
  };
};
