/**
 * 分析某个对话的上下文压缩效果：只读 LLM 录制与数据库，不调用模型。
 *
 * 用法：
 *   pnpm dotenvx run -- tsx scripts/analyze-compaction.ts <threadId>
 *   pnpm dotenvx run -- tsx scripts/analyze-compaction.ts <threadId> <constraints.json>
 *
 * constraints.json 是测试时埋下的约束：[{ "name": "主色", "pattern": "#1E90FF" }]，
 * pattern 按不区分大小写的正则匹配，用于检查每份摘要是否保留了这些约束。
 *
 * 口径：
 *   - token 一律取模型返回的真实 promptTokens；摘要文本 token 来自落库统计，可能是估算值
 *   - 固定前缀取对话第一步的 promptTokens（系统提示 + 工具定义 + 首条提问），是近似值
 *   - 累计节省 = 每次压缩的降幅 × 其后的步数，属反事实估算，且其中相当部分本可命中缓存
 *   - 同一目录下还录有摘要模型与子 agent 的调用：按系统提示区分，上下文曲线只看主 agent
 */
import fs from "node:fs";

import { recordStore } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";
import { listChildren, recordKey } from "@/recording/record-sink";

type StepKind = "main" | "summarizer" | "other";

interface StepRecord {
  kind: StepKind;
  turn: string;
  step: string;
  startedAt: Date;
  durationMs: number | undefined;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
  messageCount: number;
  readFileCalls: number;
}

interface CompactionEvent {
  createdAt: Date;
  hiddenCount: number;
  summaryText: string;
  stats: Record<string, unknown> | undefined;
}

interface Constraint {
  name: string;
  pattern: string;
}

const CACHE_STEPS_AFTER = 5;

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "-");
const bySeq = (a: string, b: string) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, ""));

interface RecordMessage {
  role?: string;
  content?: unknown;
  tool_calls?: Array<{ function?: { name?: string } }>;
}

const SUMMARIZER_PROMPT_MARK = "Context Checkpoint Compaction";
const SYSTEM_HEAD_LENGTH = 80;

const systemHead = (messages: RecordMessage[]) => {
  const content = messages.find((m) => m.role === "system")?.content;
  return (typeof content === "string" ? content : JSON.stringify(content ?? "")).slice(0, SYSTEM_HEAD_LENGTH);
};

const countReadFileCalls = (messages: RecordMessage[]) =>
  messages.flatMap((m) => m.tool_calls ?? []).filter((c) => c.function?.name === "readFileTool").length;

/** 对话第一步一定是主 agent，系统提示开头与它相同的算主 agent，其余是子 agent */
async function loadSteps(threadId: string): Promise<StepRecord[]> {
  const steps: StepRecord[] = [];
  let mainHead: string | undefined;
  const { dirs: turns } = await listChildren(threadId);
  for (const turn of turns.sort(bySeq)) {
    const { files } = await listChildren(`${threadId}/${turn}`);
    for (const file of files.filter((f) => /^step_\d+\.json$/.test(f)).sort(bySeq)) {
      const record = JSON.parse(await recordStore().getText(recordKey(`${threadId}/${turn}/${file}`)));
      const usage = record.tokenUsage;
      if (!usage?.promptTokens) {
        continue; // 中断或失败的往返没有 usage，不计入曲线
      }
      const messages: RecordMessage[] = record.request?.messages ?? [];
      const head = systemHead(messages);
      mainHead ??= head;
      const startedAt = new Date(record.startedAt ?? record.at);
      steps.push({
        kind: head.includes(SUMMARIZER_PROMPT_MARK) ? "summarizer" : head === mainHead ? "main" : "other",
        turn,
        step: file.replace(".json", ""),
        startedAt,
        durationMs:
          record.generationTimeMs ??
          (record.completedAt ? new Date(record.completedAt).getTime() - startedAt.getTime() : undefined),
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens ?? 0,
        cachedPromptTokens: usage.cachedPromptTokens ?? 0,
        messageCount: messages.length,
        readFileCalls: countReadFileCalls(messages)
      });
    }
  }
  return steps;
}

async function loadCompactions(threadId: string): Promise<CompactionEvent[]> {
  const records = await prismaClient.compactionRecord.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } });
  const events: CompactionEvent[] = [];
  for (const record of records) {
    const rows = await prismaClient.$queryRaw<Array<{ content: string }>>`
      select content from mastra.mastra_messages where id = ${record.summaryMessageId}`;
    const content = rows[0] ? JSON.parse(rows[0].content) : undefined;
    events.push({
      createdAt: record.createdAt,
      hiddenCount: (record.compactedMessageIds as string[]).length,
      summaryText: (content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("\n"),
      stats: content?.metadata?.stats
    });
  }
  return events;
}

/** 每轮的 readFile 次数 = 本轮最后一步请求里的累计次数 - 首步的；中途压缩过则只取最后一步的 */
function printTurns(steps: StepRecord[], compactions: CompactionEvent[]) {
  console.log("\n== 每轮 ==");
  console.log("轮次      首步 prompt   峰值 prompt   步数  readFile  压缩");
  const turns = [...new Set(steps.map((s) => s.turn))];
  for (const turn of turns) {
    const inTurn = steps.filter((s) => s.turn === turn);
    const first = inTurn[0];
    const last = inTurn[inTurn.length - 1];
    const reads = last.readFileCalls - first.readFileCalls;
    const compacted = compactions.some((c) => c.createdAt >= first.startedAt && c.createdAt <= last.startedAt);
    console.log(
      [
        turn.padEnd(9),
        fmt(first.promptTokens).padStart(11),
        fmt(Math.max(...inTurn.map((s) => s.promptTokens))).padStart(13),
        String(inTurn.length).padStart(5),
        String(reads >= 0 ? reads : last.readFileCalls).padStart(9),
        compacted ? "  ✓" : ""
      ].join(" ")
    );
  }
}

function printCompaction(
  index: number,
  event: CompactionEvent,
  steps: StepRecord[],
  summarizerCall: StepRecord | undefined,
  prefix: number
) {
  const afterIndex = steps.findIndex((s) => s.startedAt > event.createdAt);
  const before = afterIndex === -1 ? steps.at(-1) : steps[afterIndex - 1];
  const after = afterIndex === -1 ? undefined : steps[afterIndex];
  console.log(`\n== 压缩 #${index + 1} @ ${event.createdAt.toISOString()} ==`);
  if (before) {
    console.log(
      `  压缩前最后一步  ${before.turn}/${before.step}  ${fmt(before.promptTokens)}（${before.messageCount} 条）`
    );
  }
  if (!after) {
    console.log("  压缩后第一步    还没有新请求，发一条消息后再跑可得到真实降幅");
  }
  const drop = before && after ? before.promptTokens - after.promptTokens : 0;
  if (before && after) {
    console.log(
      `  压缩后第一步    ${after.turn}/${after.step}  ${fmt(after.promptTokens)}（${after.messageCount} 条）`
    );
    console.log(`  上下文降幅      ${fmt(drop)}（${pct(drop, before.promptTokens)}）`);
    const historyBefore = before.promptTokens - prefix;
    const historyAfter = after.promptTokens - prefix;
    console.log(
      `  历史部分        ${fmt(historyBefore)} → ${fmt(historyAfter)}（降 ${pct(historyBefore - historyAfter, historyBefore)}，已扣固定前缀）`
    );
  }
  console.log(`  隐藏消息        ${event.hiddenCount} 条（存储层消息，一条可对应多条模型消息）`);
  console.log(`  摘要长度        ${fmt(event.summaryText.length)} 字符`);
  if (event.stats) {
    const s = event.stats;
    console.log(
      `  摘要文本 token  ${fmt(Number(s.summaryTokenCount))}${s.tokenCountEstimated ? "（估算）" : ""}；被替代历史文本 ${fmt(Number(s.hiddenTokenCount))}`
    );
  }
  // 摘要调用本身有录制时以录制的真实用量为准，否则退回落库统计
  const input = summarizerCall?.promptTokens ?? event.stats?.summarizerInputTokens;
  const output = summarizerCall?.completionTokens ?? event.stats?.summarizerOutputTokens;
  const duration = summarizerCall?.durationMs ?? event.stats?.durationMs;
  console.log(
    `  摘要模型        输入 ${input != null ? fmt(Number(input)) : "-"} / 输出 ${output != null ? fmt(Number(output)) : "-"}，耗时 ${duration != null ? `${(Number(duration) / 1000).toFixed(1)}s` : "-"}`
  );
  if (before && after) {
    const cacheAfter = steps
      .slice(afterIndex, afterIndex + CACHE_STEPS_AFTER)
      .map((s) => pct(s.cachedPromptTokens, s.promptTokens));
    console.log(
      `  缓存命中        压缩前 ${pct(before.cachedPromptTokens, before.promptTokens)}；压缩后前 ${cacheAfter.length} 步 ${cacheAfter.join(" → ")}`
    );
  }
  return drop;
}

function printConstraints(constraints: Constraint[], compactions: CompactionEvent[]) {
  console.log("\n== 约束保留（摘要文本中是否出现） ==");
  for (const [i, event] of compactions.entries()) {
    const kept = constraints.filter((c) => new RegExp(c.pattern, "i").test(event.summaryText));
    console.log(`  压缩 #${i + 1}：${kept.length}/${constraints.length}`);
    for (const c of constraints) {
      console.log(`    ${kept.includes(c) ? "✓" : "✗"} ${c.name}`);
    }
  }
  console.log("  注：这里只查摘要；压缩后的回答是否遵守约束，需对照对话人工确认。");
}

async function main() {
  const [threadId, constraintsPath] = process.argv.slice(2);
  if (!threadId) {
    console.error("用法：tsx scripts/analyze-compaction.ts <threadId> [constraints.json]");
    process.exit(1);
  }

  const thread = await prismaClient.$queryRaw<Array<{ title: string | null }>>`
    select title from mastra.mastra_threads where id = ${threadId}`;
  const steps = await loadSteps(threadId);
  const compactions = await loadCompactions(threadId);
  if (steps.length === 0) {
    console.error(`没有找到 ${threadId} 的 LLM 录制`);
    process.exit(1);
  }

  const mainSteps = steps.filter((s) => s.kind === "main");
  const summarizerCalls = steps.filter((s) => s.kind === "summarizer");
  const prefix = mainSteps[0].promptTokens;
  const turnCount = new Set(mainSteps.map((s) => s.turn)).size;
  console.log(`对话：${thread[0]?.title ?? "(无标题)"}（${threadId}）`);
  console.log(
    `轮数 ${turnCount}，主 agent 步数 ${mainSteps.length}，摘要调用 ${summarizerCalls.length}，其他子 agent 步数 ${steps.length - mainSteps.length - summarizerCalls.length}`
  );
  console.log(`上下文峰值 ${fmt(Math.max(...mainSteps.map((s) => s.promptTokens)))}，固定前缀 ≈ ${fmt(prefix)}`);

  printTurns(mainSteps, compactions);

  // 每次压缩的降幅对其后所有步数都生效；多次压缩叠加
  let saved = 0;
  for (const [i, event] of compactions.entries()) {
    // 只认上一次压缩之后发起的摘要调用；手动压缩不在录制范围内，找不到时用落库统计
    const previous = compactions[i - 1]?.createdAt ?? new Date(0);
    const summarizerCall = summarizerCalls
      .filter((s) => s.startedAt > previous && s.startedAt <= event.createdAt)
      .at(-1);
    const drop = printCompaction(i, event, mainSteps, summarizerCall, prefix);
    saved += drop * mainSteps.filter((s) => s.startedAt > event.createdAt).length;
  }
  if (compactions.length === 0) {
    console.log("\n这个对话还没有压缩过。");
  } else {
    console.log(`\n== 累计 ==\n  压缩后少发的输入 token ≈ ${fmt(saved)}（反事实估算，其中相当部分本可命中缓存）`);
  }

  if (constraintsPath) {
    printConstraints(JSON.parse(fs.readFileSync(constraintsPath, "utf8")) as Constraint[], compactions);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prismaClient.$disconnect());
