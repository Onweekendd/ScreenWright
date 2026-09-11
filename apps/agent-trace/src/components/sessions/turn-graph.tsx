"use client";

import { CornerDownRight, Wrench } from "lucide-react";

import { type BranchLane, laneLabel, type TurnGraph } from "@/lib/turn-graph";
import { cn, formatDuration, formatTokenCount } from "@/lib/utils";

/**
 * 执行泳道：一轮问答里「哪一步是谁跑的」。
 *
 * 横轴是 step 序号且**跨泳道对齐**——这正是这张图要说的事：主 agent 停在哪一步、子 agent 从哪
 * 接手、跑到哪交回。委派多深、谁在烧 token，一眼就能看出来，不用逐条翻对话。
 *
 * 每个格子对应一条 `llm_exchange_records`，点它就跳到该 step 的原始视图。
 */

/** 格子宽度。够放两位数 step 号，56 步一屏放不下时整条泳道横向滚动。 */
const CELL = 24;
const GAP = 2;

export function TurnGraphPanel({
  graph,
  selectedObjectKey,
  onSelectStep
}: {
  graph: TurnGraph;
  selectedObjectKey: string | null;
  onSelectStep: (objectKey: string) => void;
}) {
  const span = graph.lastStep - graph.firstStep + 1;
  if (span <= 0 || graph.lanes.length === 0) {
    return null;
  }

  // 只有一条泳道就没有「泳道」可言了——那是一条直线，标题栏的耗时/token 已经说完了。
  const worthDrawing = graph.lanes.length > 1;
  if (!worthDrawing) {
    return null;
  }

  const trackWidth = span * CELL + (span - 1) * GAP;

  return (
    <section className="mb-5 rounded-lg border">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5">
        <h3 className="text-sm font-medium">执行泳道</h3>
        <span className="text-muted-foreground text-xs">
          {graph.lanes.length} 条执行链 · {span} 步
        </span>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          共 {formatTokenCount(graph.totalTokens)} tok
        </span>
      </header>

      <div className="overflow-x-auto p-4">
        <div className="min-w-fit space-y-1.5">
          {graph.lanes.map((lane) => (
            <LaneRow
              key={lane.branchKey}
              lane={lane}
              graph={graph}
              trackWidth={trackWidth}
              selectedObjectKey={selectedObjectKey}
              onSelectStep={onSelectStep}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LaneRow({
  lane,
  graph,
  trackWidth,
  selectedObjectKey,
  onSelectStep
}: {
  lane: BranchLane;
  graph: TurnGraph;
  trackWidth: number;
  selectedObjectKey: string | null;
  onSelectStep: (objectKey: string) => void;
}) {
  const label = laneLabel(lane);

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-56 shrink-0 items-center gap-1" style={{ paddingLeft: lane.depth * 12 }}>
        {!lane.isMain && <CornerDownRight className="text-muted-foreground size-3 shrink-0" />}
        <span className={cn("truncate text-xs", lane.isMain ? "font-medium" : "text-muted-foreground")} title={label}>
          {label}
        </span>
        {lane.spawnedAtStep !== null && (
          <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">← #{lane.spawnedAtStep}</span>
        )}
      </div>

      <div className="relative shrink-0" style={{ width: trackWidth, height: CELL }}>
        {/* 底纹：把本轮完整的 step 跨度画出来，泳道空白处代表「这一段不是它在跑」 */}
        <div className="bg-muted/40 absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
        {lane.steps.map((step) => {
          const offset = (step.step - graph.firstStep) * (CELL + GAP);
          const selected = selectedObjectKey === step.objectKey;
          const delegates = step.toolNames.some((name) => name.startsWith("agent-"));
          const tools = step.toolNames.length > 0 ? step.toolNames.join(", ") : "无工具调用";

          return (
            <button
              key={step.objectKey}
              type="button"
              onClick={() => onSelectStep(step.objectKey)}
              title={`step ${step.step} · ${tools} · ${formatTokenCount(step.totalTokens)} tok · ${formatDuration(step.generationTimeMs)}`}
              style={{ left: offset, width: CELL, height: CELL }}
              className={cn(
                "absolute top-0 cursor-pointer rounded-sm border text-[10px] tabular-nums transition-colors",
                "hover:border-primary hover:bg-primary/10",
                selected && "border-primary bg-primary/15 text-primary",
                !selected && !step.ok && "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
                !selected &&
                  step.ok &&
                  delegates &&
                  "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400",
                !selected && step.ok && !delegates && "bg-muted/60 border-transparent"
              )}
            >
              {step.step}
            </button>
          );
        })}
      </div>

      <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-[11px] tabular-nums">
        <span className="flex items-center gap-1">
          <Wrench className="size-3" />
          {lane.toolCalls}
        </span>
        <span className="w-16 text-right">{formatTokenCount(lane.totalTokens)} tok</span>
        <span className="w-14 text-right">{formatDuration(lane.elapsedMs)}</span>
      </div>
    </div>
  );
}
