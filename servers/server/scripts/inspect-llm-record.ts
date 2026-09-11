/**
 * 解析 llm-recorder 产出的 NDJSON 记录文件，输出可读报告。
 *
 * 用法：
 *   pnpm inspect:llm                       # 自动取 llm-records 下最新的 .ndjson
 *   pnpm inspect:llm <文件路径>            # 指定文件
 *   pnpm inspect:llm <文件路径> 2          # 只展开 seq=2 那次往返的完整 messages
 *
 * 输出：
 *   - turn 概览（threadId / 各次往返的 seq / status / ok）
 *   - 每次往返的 messages 表：[i] role | content 情况 | tool_calls
 *   - 自动高亮第一个 ok:false 的往返，并指出哪几条 message 缺 content
 */
import fs from "node:fs";
import path from "node:path";

const RECORD_DIR = process.env.LLM_RECORD_DIR ?? path.resolve(process.cwd(), "llm-records");

// ── 解析参数 ────────────────────────────────────────────────────────────────
const arg = process.argv[2];
const focusSeq = process.argv[3] != null ? Number(process.argv[3]) : undefined;

function latestRecordFile(): string | undefined {
  if (!fs.existsSync(RECORD_DIR)) {
    return undefined;
  }
  const files = fs
    .readdirSync(RECORD_DIR)
    .filter((f) => f.endsWith(".ndjson"))
    .map((f) => ({ f, t: fs.statSync(path.join(RECORD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files[0] ? path.join(RECORD_DIR, files[0].f) : undefined;
}

const filePath = arg ? path.resolve(arg) : latestRecordFile();
if (!filePath || !fs.existsSync(filePath)) {
  console.error(`找不到记录文件。RECORD_DIR=${RECORD_DIR}，arg=${arg ?? "(无)"}`);
  process.exit(1);
}

// ── 读取并逐行解析 ──────────────────────────────────────────────────────────
type Msg = { role?: string; content?: unknown; tool_calls?: unknown[]; tool_call_id?: string };
type Line =
  | { kind: "turn-meta"; threadId?: string; runId?: string; startedAt?: string }
  | {
      kind: "exchange";
      seq: number;
      at?: string;
      status: number;
      ok: boolean;
      url?: string;
      requestBody?: { messages?: Msg[]; tools?: unknown[] };
      responseText?: string;
    };

const lines = fs
  .readFileSync(filePath, "utf-8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l, i) => {
    try {
      return JSON.parse(l) as Line;
    } catch {
      console.error(`第 ${i + 1} 行无法解析为 JSON，跳过`);
      return undefined;
    }
  })
  .filter((x): x is Line => !!x);

// ── content 情况判定 ────────────────────────────────────────────────────────
function describeContent(msg: Msg): { text: string; missing: boolean } {
  if (!("content" in msg)) {
    return { text: "❌缺失(无字段)", missing: true };
  }
  const c = msg.content;
  if (c === null) {
    return { text: "null", missing: false }; // OpenAI 允许 assistant content 为 null
  }
  if (typeof c === "string") {
    return { text: `string(${c.length})`, missing: c.length === 0 && !msg.tool_calls };
  }
  if (Array.isArray(c)) {
    return { text: `parts(${c.length})`, missing: false };
  }
  return { text: typeof c, missing: false };
}

function printMessages(messages: Msg[], full: boolean): number[] {
  const missingIdx: number[] = [];
  messages.forEach((m, i) => {
    const { text, missing } = describeContent(m);
    if (missing) {
      missingIdx.push(i);
    }
    const tc = Array.isArray(m.tool_calls) ? ` tool_calls×${m.tool_calls.length}` : "";
    const tcid = m.tool_call_id ? ` tcid=${String(m.tool_call_id).slice(0, 8)}` : "";
    const flag = missing ? "  <<< 缺 content" : "";
    console.log(`    [${String(i).padStart(2)}] ${String(m.role).padEnd(10)} content=${text}${tc}${tcid}${flag}`);
    if (full) {
      const preview =
        typeof m.content === "string" ? m.content.slice(0, 300) : JSON.stringify(m.content)?.slice(0, 300);
      if (preview) {
        console.log(`         └ ${preview}`);
      }
    }
  });
  return missingIdx;
}

// ── 输出报告 ────────────────────────────────────────────────────────────────
console.log(`\n📄 ${filePath}\n${"─".repeat(70)}`);

const exchanges = lines.filter((l): l is Extract<Line, { kind: "exchange" }> => l.kind === "exchange");
const meta = lines.find((l) => l.kind === "turn-meta") as Extract<Line, { kind: "turn-meta" }> | undefined;
if (meta) {
  console.log(`threadId=${meta.threadId}  runId=${meta.runId ?? "(new)"}  startedAt=${meta.startedAt}`);
}
console.log(`共 ${exchanges.length} 次 LLM 往返：`);
for (const ex of exchanges) {
  const mark = ex.ok ? "✅" : "❌";
  const n = ex.requestBody?.messages?.length ?? 0;
  console.log(`  ${mark} seq=${ex.seq}  status=${ex.status}  messages=${n}`);
}

// 决定展开哪几次：指定了 focusSeq 就只展开它；否则展开所有 ok:false，没有失败则展开最后一次
const toExpand =
  focusSeq != null
    ? exchanges.filter((e) => e.seq === focusSeq)
    : exchanges.some((e) => !e.ok)
      ? exchanges.filter((e) => !e.ok)
      : exchanges.slice(-1);

for (const ex of toExpand) {
  console.log(`\n${"═".repeat(70)}\n往返 seq=${ex.seq}  status=${ex.status}  ok=${ex.ok}`);
  const msgs = ex.requestBody?.messages ?? [];
  const missing = printMessages(msgs, focusSeq != null);
  if (missing.length) {
    console.log(`\n  ⚠️ 缺 content 的消息下标：[${missing.join(", ")}]  → 这极可能就是被 API 拒绝的原因`);
  }
  if (!ex.ok && ex.responseText) {
    console.log(`\n  API 返回(截断 500 字)：\n  ${ex.responseText.slice(0, 500)}`);
  }
}
console.log("");
