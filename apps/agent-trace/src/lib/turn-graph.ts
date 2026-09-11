import type { LlmExchangeRecord } from "@screenwright/server/rpc";

/**
 * 把一轮问答的 step 流按「谁跑的」摊成泳道。
 *
 * 数据全部来自 `llm_exchange_records` 这张表——`branchKey` / `step` / `toolNames` / token 都在行上，
 * 不用拉 MinIO。`objectKey` 也在行上，所以每个格子能直接点进单步原始视图。
 *
 * **branchKey 不能直接当泳道键用。** 父子关系是前缀关系没错（子 agent 的形如
 * `${父branchKey}-${uuid}`，见 `recording-scope.ts:199`），但同一次委派内部，**每挂起再续上
 * 一轮，Mastra 就换一个新 branchKey**：委派工具 `execute()` 里 `subAgentThreadId =
 * ${inputData.threadId}-${randomUUID()}`（`@mastra/core` agent-as-tool 实现）在每次重新进入时
 * 都会重算，suspend/resume 一次就多一段。实测一次单一委派（一次 `agent-swExecutorAgent`
 * 调用，内部因 `createEventTemplate`/`editFilesTool` 反复 suspend）能切出 6 个不同 branchKey，
 * 边界精确卡在每次会挂起的工具调用后面——业务上这自始至终是同一个子 agent 在跑同一个任务
 * （靠 `createTask`/`claimTask` 维系连续性，而不是 thread 身份）。这同时也是「同一个子 agent
 * 的 threadId 一直变」导致 `mastra_workspace_grep` 报 threadId mismatch 的根源。
 *
 * 所以分组键是「同一个父分支 + 同一次委派调用」，不是原始 branchKey：先按前缀关系认父子、
 * 认出每个分支是父分支哪一步的 `agent-*` 调用派生的（spawnedAtStep），再把 (父分支,
 * spawnedAtStep, 委派工具名) 三者都相同、且 step 区间不重叠的分支合并成一条泳道。区间不重叠
 * 这个防线是防真并发（同一步里派发了两个同类型子 agent）被误合并——没有这种情况时它不生效。
 */

export interface LaneStep {
  step: number;
  toolNames: string[];
  toolCallCount: number;
  totalTokens: number;
  generationTimeMs: number;
  objectKey: string;
  /** 该步 HTTP 是否成功；false 要在图上显出来 */
  ok: boolean;
}

export interface BranchLane {
  /** 泳道的代表 key：本泳道里最早那段的原始 branchKey */
  branchKey: string;
  /** 主干：branchKey 等于 threadId */
  isMain: boolean;
  /** 父泳道的代表 key，主干为 null */
  parentKey: string | null;
  /** 委派深度，主干 0 */
  depth: number;
  steps: LaneStep[];
  /** 父泳道里派生出它的那一步（调 `agent-*` 的那步）；推不出来时为 null */
  spawnedAtStep: number | null;
  /** 派生它的委派工具名（如 `agent-swExecutorAgent`）；推不出来时为 null */
  delegationTool: string | null;
  toolCalls: number;
  totalTokens: number;
  elapsedMs: number;
}

export interface TurnGraph {
  turnIndex: number;
  /** 与 MinIO 目录同名，便于和左侧文件树对齐 */
  turnName: string;
  firstStep: number;
  lastStep: number;
  lanes: BranchLane[];
  totalTokens: number;
}

const turnNameOf = (turnIndex: number): string => `turn_${String(turnIndex).padStart(2, "0")}`;

/** 委派工具的命名约定：`agent-<目标 agent>`。派生点靠它认。 */
const isDelegationTool = (name: string): boolean => name.startsWith("agent-");

/**
 * 在候选里找 key 的父分支（原始 branchKey 层面）：所有「是 key 的真前缀」中最长的一个。
 * 取最长是为了在多层委派下认到直接父级，而不是认到祖先。
 */
const rawParentOf = (key: string, all: string[]): string | null => {
  let best: string | null = null;
  for (const candidate of all) {
    if (candidate !== key && key.startsWith(`${candidate}-`) && (best === null || candidate.length > best.length)) {
      best = candidate;
    }
  }
  return best;
};

const toLaneStep = (record: LlmExchangeRecord): LaneStep => ({
  step: record.step,
  toolNames: record.toolNames,
  toolCallCount: record.toolCallCount,
  totalTokens: record.totalTokens ?? 0,
  generationTimeMs: record.generationTimeMs ?? 0,
  objectKey: record.objectKey,
  ok: record.ok !== false
});

interface RawMeta {
  parentKey: string | null;
  spawnedAtStep: number | null;
  delegationTool: string | null;
}

interface MergeGroup {
  /** 按开跑先后收纳的原始 branchKey；第一个即代表 key */
  rawKeys: string[];
  parentRawKey: string | null;
  spawnedAtStep: number | null;
  delegationTool: string | null;
  lastStep: number;
}

/**
 * 按 turn 分组构造泳道图。
 *
 * `threadId` 用来判定哪条泳道是主干；records 里没有该 thread 的行时返回空数组。
 * 没有 `branchKey` 的行（分支追踪未生效时录的）归到主干，不至于凭空消失。
 */
export function buildTurnGraphs(records: LlmExchangeRecord[], threadId: string): TurnGraph[] {
  const byTurn = new Map<number, LlmExchangeRecord[]>();
  for (const record of records) {
    const bucket = byTurn.get(record.turnIndex);
    if (bucket) {
      bucket.push(record);
    } else {
      byTurn.set(record.turnIndex, [record]);
    }
  }

  const graphs: TurnGraph[] = [];

  for (const [turnIndex, turnRecords] of [...byTurn.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...turnRecords].sort((a, b) => a.step - b.step);

    const stepsByRawBranch = new Map<string, LaneStep[]>();
    for (const record of sorted) {
      const key = record.branchKey ?? threadId;
      const bucket = stepsByRawBranch.get(key);
      if (bucket) {
        bucket.push(toLaneStep(record));
      } else {
        stepsByRawBranch.set(key, [toLaneStep(record)]);
      }
    }

    const rawKeys = [...stepsByRawBranch.keys()];

    // 1) 原始 branchKey 层面的父子 + 派生点（主 agent 自己是根,不参与合并）
    const rawMeta = new Map<string, RawMeta>();
    for (const key of rawKeys) {
      const steps = stepsByRawBranch.get(key) ?? [];
      const parentKey = rawParentOf(key, rawKeys);
      const parentSteps = parentKey ? (stepsByRawBranch.get(parentKey) ?? []) : [];
      const firstStep = steps[0]?.step ?? 0;
      const spawn = parentSteps.filter((s) => s.step < firstStep && s.toolNames.some(isDelegationTool)).pop();
      rawMeta.set(key, {
        parentKey,
        spawnedAtStep: spawn?.step ?? null,
        delegationTool: spawn?.toolNames.find(isDelegationTool) ?? null
      });
    }

    // 2) 把「同一父分支 + 同一次委派」且 step 区间不重叠的原始分支合并成一条泳道。
    //    按开跑先后处理,保证每组里 rawKeys[0] 就是最早那段——用作这条泳道的代表 key。
    const byFirstStep = [...rawKeys].sort(
      (a, b) => (stepsByRawBranch.get(a)?.[0]?.step ?? 0) - (stepsByRawBranch.get(b)?.[0]?.step ?? 0)
    );
    const groups: MergeGroup[] = [];
    const rawToGroup = new Map<string, MergeGroup>();

    for (const key of byFirstStep) {
      const meta = rawMeta.get(key)!;
      const steps = stepsByRawBranch.get(key) ?? [];
      const firstStep = steps[0]?.step ?? 0;
      const lastStep = steps[steps.length - 1]?.step ?? firstStep;

      const match =
        meta.parentKey === null
          ? null // 主干永远单独成组,不与任何东西合并
          : groups.find(
              (g) =>
                g.parentRawKey === meta.parentKey &&
                g.spawnedAtStep === meta.spawnedAtStep &&
                g.delegationTool === meta.delegationTool &&
                firstStep > g.lastStep // 区间不重叠——真并发时不会走到这里,分支会各自成组
            );

      if (match) {
        match.rawKeys.push(key);
        match.lastStep = Math.max(match.lastStep, lastStep);
        rawToGroup.set(key, match);
      } else {
        const group: MergeGroup = {
          rawKeys: [key],
          parentRawKey: meta.parentKey,
          spawnedAtStep: meta.spawnedAtStep,
          delegationTool: meta.delegationTool,
          lastStep
        };
        groups.push(group);
        rawToGroup.set(key, group);
      }
    }

    // 3) 原始 key → 所属泳道代表 key,用来把「挂在某一段原始分支下」的孙分支接到正确的泳道上
    const rawToLaneKey = new Map<string, string>();
    for (const group of groups) {
      for (const key of group.rawKeys) {
        rawToLaneKey.set(key, group.rawKeys[0]);
      }
    }

    const lanes = new Map<string, BranchLane>();
    for (const group of groups) {
      const laneKey = group.rawKeys[0];
      const steps = group.rawKeys.flatMap((key) => stepsByRawBranch.get(key) ?? []).sort((a, b) => a.step - b.step);
      const parentLaneKey = group.parentRawKey ? (rawToLaneKey.get(group.parentRawKey) ?? group.parentRawKey) : null;

      lanes.set(laneKey, {
        branchKey: laneKey,
        isMain: laneKey === threadId,
        parentKey: parentLaneKey,
        depth: 0,
        steps,
        spawnedAtStep: group.spawnedAtStep,
        delegationTool: group.delegationTool,
        toolCalls: steps.reduce((sum, s) => sum + s.toolCallCount, 0),
        totalTokens: steps.reduce((sum, s) => sum + s.totalTokens, 0),
        elapsedMs: steps.reduce((sum, s) => sum + s.generationTimeMs, 0)
      });
    }

    // 深度优先排序：父紧跟着自己的孩子，孩子之间按开跑先后。读起来就是委派发生的顺序。
    const childrenOf = (key: string | null): BranchLane[] =>
      [...lanes.values()]
        .filter((lane) => lane.parentKey === key)
        .sort((a, b) => (a.steps[0]?.step ?? 0) - (b.steps[0]?.step ?? 0));

    const ordered: BranchLane[] = [];
    const walk = (lane: BranchLane, depth: number): void => {
      lane.depth = depth;
      ordered.push(lane);
      for (const child of childrenOf(lane.branchKey)) {
        walk(child, depth + 1);
      }
    };
    // 根＝没有父的泳道。正常只有主干一条,数据缺失时可能多条,都当根处理免得丢泳道。
    for (const root of childrenOf(null)) {
      walk(root, 0);
    }

    graphs.push({
      turnIndex,
      turnName: turnNameOf(turnIndex),
      firstStep: sorted[0]?.step ?? 0,
      lastStep: sorted[sorted.length - 1]?.step ?? 0,
      lanes: ordered,
      totalTokens: ordered.reduce((sum, lane) => sum + lane.totalTokens, 0)
    });
  }

  return graphs;
}

/** 泳道标签：主干叫「主 agent」，子分支用派生它的委派工具名，认不出来就用 key 尾段。 */
export function laneLabel(lane: BranchLane): string {
  if (lane.isMain) {
    return "主 agent";
  }
  if (lane.delegationTool) {
    return lane.delegationTool.replace(/^agent-/u, "");
  }
  const tail = lane.branchKey.split("-").slice(-1)[0] ?? lane.branchKey;
  return `子 agent ${tail.slice(0, 6)}`;
}
