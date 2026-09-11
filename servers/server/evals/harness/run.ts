/**
 * eval 入口：把 case 列表装进 mastra 的 `runExperiment`。
 *
 * 用 `runExperiment`（`@mastra/core/datasets`）而不是 `runEvals`：后者的 target 只能是
 * Agent 或 Workflow（`executeTarget` 只有 `isWorkflow` 和 `agent.generate()` 两条路），
 * 而我们的被测入口是会话层；且它的 gates/threshold 全是跨 item 求平均，我们每个 case
 * 是不同任务，平均没有意义。详见 TODO「已定的取舍」。
 *
 * ⚠️ 同名陷阱：`@mastra/core/evals` 也有过一个 `runExperiment`，v1 已改名 `runEvals`。
 * 迁移用的 codemod 按名字改，跑一次就会把下面这个 import 改坏（`runEvals` 不吃 `task`）。
 *
 * ⚠️ **env 必须在被测代码求值前设好**。ESM 的静态 import 会提升，因此所有直接或间接依赖
 * `@/` 的模块都必须在 env 定格后动态导入；`report.ts` 也因依赖 Prisma 属于这一类。
 * 这些模块会在求值时缓存工作区、录制目录等配置，`@/mastra/index` 还会通过 top-level await
 * 启动 artifact app 服务。
 */

import path from "node:path";

// type-only：编译后不产生 runtime import，不会提前触发下面那些模块级常量的定格
import type { AssertContext, EvalCase } from "./case";
// 只用 node 内置模块、不碰 `@/`，所以可以静态 import——它本身就得在定格前跑完
import { clearRunArtifacts, prepareEvalWorkspace } from "./prepare-workspace";

const EVAL_ROOT = path.resolve(import.meta.dirname, "..");

// ── env 定格区：这一段之上不许 import 任何 `@/` 模块 ──────────────────────────
//
// 全部**强制覆盖**，不能用 `??=`：`pnpm eval` 走 dotenvx，它会先把 `.env` 灌进
// process.env，而 `.env` 里这四个键都有值。用 `??=` 的话——
//   MASTRA_WORKSPACE_PATH → eval 直接跑到日常开发的工作区上，agent 的改动写进真实大屏
//   LLM_RECORD_DIR        → 录制写进日常调试目录，跟 eval 产物混在一起
//   RECORD_LLM=false      → 压根不录，L2 指标全 0
// 想换目录用 EVAL_* 这组 eval 专属的键，别去动 .env。
const EVAL_WORKSPACE = process.env.EVAL_WORKSPACE_PATH ?? path.join(EVAL_ROOT, "runs", ".workspace");
const EVAL_RECORDS = process.env.EVAL_RECORD_DIR ?? path.join(EVAL_ROOT, "runs", ".records");

// 真实工作区当模板——必须在覆盖之前读。agent 的 skill / scripts / types 都绑在工作区上，
// 空目录跑出来的是一个「没有任何 skill 的 agent」，测了也白测。详见 prepare-workspace.ts
const SOURCE_WORKSPACE = process.env.MASTRA_WORKSPACE_PATH ?? "./agent-workspace";
const workspacePrep = prepareEvalWorkspace(
  SOURCE_WORKSPACE,
  EVAL_WORKSPACE,
  process.env.EVAL_REFRESH_WORKSPACE === "1"
);

// 默认每次都清掉上一次调用留下的产物（屏、tasks/、plan/、以及 agent 顺手写的任何东西）——
// 留着不是「省事」，是让下一轮的 agent 有机会把它们当"参考实现"或"同环境先例"，拿过期甚至
// 本身就错的数据反过来推理本轮（两起实测见 clearRunArtifacts 注释）。
// EVAL_KEEP_WORKSPACE=1 留给「就是要接着上一轮现场查」这种场景。
const clearedArtifacts = process.env.EVAL_KEEP_WORKSPACE === "1" ? [] : clearRunArtifacts(EVAL_WORKSPACE);

/**
 * 是否把录制档案额外镜像到 MinIO。默认开启，`EVAL_UPLOAD=0` 关闭。
 *
 * 录制正文恒写本地、索引恒入库，所以 L0/L1/L2 都不依赖这个开关——它只决定档案是否也进
 * MinIO 供 agent-trace 之外的集中查看。报告仍以 `uploaded` 标记，方便追溯。
 * 若 MinIO 未配置（无 access/secret key），`both` 会静默降级为纯本地，不报错。
 */
const UPLOAD = process.env.EVAL_UPLOAD !== "0";

/**
 * 一次 eval 的关联键：连接录制索引 `llm_exchange_records.eval_run_id`、本地
 * `runs/<RUN_ID>/report.json`，以及报告表 `eval_runs.id` / `eval_cases.run_id`。
 */
const RUN_ID = new Date().toISOString().replace(/[:.]/gu, "-");

process.env.MASTRA_WORKSPACE_PATH = EVAL_WORKSPACE;
process.env.LLM_RECORD_DIR = EVAL_RECORDS;
process.env.RECORD_LLM = "true";
// both = 本地为主 + 镜像 MinIO；fs = 只写本地。两者本地都是完整一份，metrics.ts 与 driver
// 的收尾都读本地/DB，不受影响。
process.env.RECORD_SINK = UPLOAD ? "both" : "fs";
// eval 档案单独一个前缀：将来要清理，删一个前缀即可，不用在真实记录里逐条挑
process.env.LLM_RECORD_MINIO_PREFIX = process.env.EVAL_RECORD_MINIO_PREFIX ?? "eval-records";
process.env.EVAL_RUN_ID = RUN_ID;

const RUNS_DIR = path.join(EVAL_ROOT, "runs");

/** case 选择器；完整 ID 优先，也可用 `a` / `b` / `c` 这类前缀选择整组。无参数时全跑。 */
const CASE_SELECTORS = process.argv.slice(2);

/** 同一个 case 跑几遍。runExperiment 没有重复运行机制，多跑就是多塞几个 item。 */
const REPEAT = Number(process.env.EVAL_REPEAT ?? 1);

/** 单个 case 的墙钟上限。driver 收到 signal 会主动关流并返回 timedOut。 */
const ITEM_TIMEOUT_MS = Number(process.env.EVAL_ITEM_TIMEOUT ?? 540_000);

const main = async (): Promise<void> => {
  const { runExperiment } = await import("@mastra/core/datasets");
  const { mastra } = await import("@/mastra/index");

  const { selectCases } = await import("../cases/index");
  const { createFakeFrontend } = await import("./fake-frontend");
  const { runDriver } = await import("./driver");
  const { seedWorkspace } = await import("./workspace");
  const { checkInvariants } = await import("./invariants");
  const { collectMetrics } = await import("./metrics");
  const { formatSummary, judge, persistReport, writeReport } = await import("./report");
  // 分支追踪：不注册的话每条记录的 branchKey 都是空的，L2 就分不开子 agent 的往返
  // （实测上一轮 0/410 个 step 带 branchKey）。线上是 server.ts 启动时注册的，
  // 而 eval 走 @/mastra/index，根本不经过那条路。
  const { initMastraRecordingBridge } = await import("@/mastra/record/branch-resolver");
  initMastraRecordingBridge();

  const cases: EvalCase[] = selectCases(CASE_SELECTORS);
  if (cases.length === 0) {
    console.error(`[eval] case 选择器 "${CASE_SELECTORS.join(" ")}" 没匹配到任何 case`);
    process.exit(1);
  }
  const caseById = new Map(cases.map((c) => [c.id, c]));

  /** per-item 状态：beforeEach 建、task 用、afterEach 评估。串行跑，一次只有一份活跃。 */
  interface ItemState {
    workspace: ReturnType<typeof seedWorkspace>;
    before: ReturnType<ReturnType<typeof seedWorkspace>["read"]>;
    beforeFingerprint: string;
    frontend: ReturnType<typeof createFakeFrontend>;
  }
  const states = new Map<string, ItemState>();
  const reports: Awaited<ReturnType<typeof buildReport>>[] = [];
  const startedAt = new Date().toISOString();

  const buildReport = async (
    itemId: string,
    caseId: string,
    attempt: number,
    run: Awaited<ReturnType<typeof runDriver>>
  ) => {
    const state = states.get(itemId);
    const evalCase = caseById.get(caseId);
    if (!state || !evalCase) {
      throw new Error(`item ${itemId} 缺少状态或 case 定义`);
    }

    // 整屏读不回来本身就是最重的 L0 失败——不能让它变成一个 afterEach 里被吞掉的异常
    let screen: ItemState["before"] | undefined;
    let readError: string | undefined;
    try {
      screen = state.workspace.read();
    } catch (err) {
      readError = err instanceof Error ? err.message : String(err);
    }

    const invariants = screen
      ? checkInvariants(screen)
      : [{ name: "L0 整屏能读回来", passed: false, detail: readError }];

    // assert 允许是异步的（如 b8 要在内存里真跑一遍 core 的过滤器链路），必须 await——
    // 漏了的话 assertions 是个 Promise，judge() 里 .every 直接 TypeError，case 静默丢失
    const assertions = screen
      ? await evalCase.assert({
          screen,
          before: state.before,
          workspace: state.workspace,
          fingerprintChanged: state.workspace.fingerprint() !== state.beforeFingerprint,
          suspends: state.frontend.log,
          run
        } satisfies AssertContext)
      : [];

    // 与 agent-trace 共用 llm_exchange_records，保证指标只有一套口径。
    // EVAL_UPLOAD=0 时没有数据库索引，因此这一层指标按 0 记录。
    const metrics = await collectMetrics(run.threadId);

    const { suspends, ...runRest } = run;
    const base = {
      caseId,
      title: evalCase.title,
      attempt,
      invariants,
      assertions,
      metrics,
      run: { ...runRest, suspendCount: suspends.length },
      suspends: suspends.map((s) => ({ type: s.type, channel: s.channel, toolName: s.toolName }))
    };
    return { ...base, passed: judge(base) };
  };

  await runExperiment(mastra, {
    name: "sw-agent-eval",
    data: cases.flatMap((c) =>
      Array.from({ length: REPEAT }, (_, i) => ({
        // 稳定 id：不给的话 runExperiment 会发随机 uuid，报告里认不出哪几条是同一个 case
        id: `${c.id}#${i + 1}`,
        input: c.prompt,
        metadata: { caseId: c.id, attempt: i + 1 }
      }))
    ),

    beforeEach: async ({ item }) => {
      const evalCase = caseById.get(item.metadata?.caseId as string);
      if (!evalCase) {
        throw new Error(`未知 case: ${String(item.metadata?.caseId)}`);
      }
      const workspace = seedWorkspace(evalCase.fixture);
      // 屏之外的起点（如 api-registry）。抛错时本 item 记失败、其余照跑，afterEach 会被跳过
      // ——mastra 认为「setup 失败的 item 自己负责清理」，而我们种的东西全在跑完即弃的工作区里
      await evalCase.setup?.(workspace);
      states.set(item.id!, {
        workspace,
        before: workspace.read(),
        beforeFingerprint: workspace.fingerprint(),
        frontend: createFakeFrontend(evalCase.frontend)
      });
    },

    task: async ({ input, metadata, signal }) => {
      const evalCase = caseById.get(metadata?.caseId as string)!;
      const state = states.get(`${evalCase.id}#${metadata?.attempt as number}`)!;
      return runDriver({
        prompt: input as string,
        // agent 靠 <editor-context> 才知道该操作哪块屏——这是前端拼进用户消息里的，driver 得照做
        screenKey: state.workspace.screenKey,
        frontend: state.frontend,
        mode: evalCase.mode,
        signal
      });
    },

    afterEach: async ({ item, result }) => {
      // afterEach 的异常会被 mastra 吞掉（设计如此：teardown 不该改变 item 结果），
      // 所以评估失败要自己落进报告，否则这个 case 会静默从报告里消失。
      try {
        if (result.output) {
          reports.push(
            await buildReport(
              item.id!,
              item.metadata?.caseId as string,
              item.metadata?.attempt as number,
              result.output as Awaited<ReturnType<typeof runDriver>>
            )
          );
        }
      } catch (err) {
        console.error(`[eval] ${item.id} 评估失败`, err);
      }
      // 工作区**不删**：eval 失败时最值得看的就是现场。屏 id 每次递增，不会互相覆盖。
      states.delete(item.id!);
    },

    maxConcurrency: 1,
    itemTimeout: ITEM_TIMEOUT_MS,
    // 重试一次就是重烧一次钱，而且上一次已经把工作区跑脏了，重试结果不可比
    maxRetries: 0,
    // 默认会往生产库的 mastra_experiments / mastra_experiment_results 写，关掉
    persistence: { experiments: "none", scores: "none" }
  });

  const report = {
    runId: RUN_ID,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalCases: reports.length,
    passedCases: reports.filter((r) => r.passed).length,
    cases: reports
  };

  // 先落 JSON，确保数据库暂时不可用时，本次付费运行的结果仍然保留在本地。
  const file = writeReport(report, RUNS_DIR);
  let persisted = true;
  try {
    await persistReport(report, UPLOAD);
  } catch (err) {
    persisted = false;
    console.error("[eval] 报告入库失败（JSON 已落盘）", err);
  }
  console.log(formatSummary(report));

  // skill 缺失的症状是「agent 行为莫名变差」，比路径配错难查得多——直接喊出来
  if (workspacePrep.missing.length > 0) {
    console.log(`
⚠ 工作区缺少 ${workspacePrep.missing.join(" / ")}（源：${SOURCE_WORKSPACE}）——agent 会没有 skill 可用`);
  }
  console.log(`\n报告 ${file}${persisted ? "（已入库 eval_runs / eval_cases）" : "（未入库）"}`);
  // 把清掉的条目名原样报出来，而不只报个数：跨轮污染最难查的一步是「不知道上一轮留下过什么」，
  // 摘要里直接看见 tasks/plan/screen_9017 这些名字，出问题时能立刻对上号。
  const cleanupNotice =
    process.env.EVAL_KEEP_WORKSPACE === "1"
      ? "本次跳过清理（EVAL_KEEP_WORKSPACE=1），工作区仍是上一轮现场"
      : clearedArtifacts.length > 0
        ? `已清掉上一轮留下的 ${clearedArtifacts.join("、")}，本次现场是干净的`
        : "工作区本来就没有遗留产物";
  console.log(
    `工作区 ${EVAL_WORKSPACE}（${cleanupNotice}；就是要接着上一轮查用 EVAL_KEEP_WORKSPACE=1）` +
      `
基础设施 ${workspacePrep.copied.length > 0 ? "已拷 " + workspacePrep.copied.join("/") : "复用上次"}` +
      `${workspacePrep.reused.length > 0 ? "，复用 " + workspacePrep.reused.join("/") : ""}` +
      `${
        workspacePrep.staleRefreshed.length > 0
          ? `；检测到源更新，已自动重拷 ${workspacePrep.staleRefreshed.join("/")}`
          : ""
      }`
  );

  process.exit(report.passedCases === report.totalCases ? 0 : 1);
};

await main();
