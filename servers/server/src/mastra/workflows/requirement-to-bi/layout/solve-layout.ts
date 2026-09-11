/**
 * 布局求解器：分区树 + 内容清单 → 带绝对坐标与容器类型的分区列表。
 *
 * **这是整条链路的质量地基,原因是它把两类错误从「要检查」变成了「不可能」：**
 * 坐标由父矩形递归切分而来,子矩形永远落在父矩形内且互不相交,所以
 * 「组件重叠」「组件出画布」这两个自由生成布局最常见的翻车点在结构上就不存在了。
 *
 * 与之对应,模型只负责产出结构（切几刀、每刀多宽、哪块放什么）。让模型直接吐
 * `left/top/width/height` 是最差的做法：它算不准数字,而且生成第 7 个组件时
 * 已经不记得第 2 个占了哪儿——没有全局视野,只能靠事后检查兜,而事后检查发现
 * 布局是烂的时候钱已经花完了。
 *
 * 纯函数,不碰文件系统、不调模型、不依赖 mastra。所以它能被单测到死,
 * 也能在「agent 直接调」和「workflow step 调」两种形态下原样复用。
 */
import {
  ASPECT_BY_KIND,
  ASPECT_TOLERANCE,
  type ContentItem,
  GRID_COLS,
  GRID_ROWS,
  type Rect,
  resolveContainerKind,
  type SolvedItem,
  type SolvedZone,
  type Zone
} from "../types";

export interface SolveOptions {
  /** 画布尺寸,来自 info.json 的 detail.width / detail.height */
  canvasWidth: number;
  canvasHeight: number;
  /** 画布四周留白 */
  padding?: number;
  /** 同层分区之间的间隔 */
  gutter?: number;
  /** 容器内边距——组件不贴着容器边框放,给素材外框留出视觉呼吸 */
  zonePadding?: number;
  /** 同一分区内多个内容项之间的间隔 */
  itemGap?: number;
}

const DEFAULTS = { padding: 24, gutter: 16, zonePadding: 12, itemGap: 12 } as const;

/** 校验不通过时抛这个,调用方据 `issues` 决定是重生成分区树还是放弃。 */
export class ZoneTreeError extends Error {
  constructor(readonly issues: string[]) {
    super(`分区树校验未通过：\n- ${issues.join("\n- ")}`);
    this.name = "ZoneTreeError";
  }
}

// ── 校验 ──────────────────────────────────────────────────────────────────────

/** 树深上限。防模型套娃——大屏分区超过四层就已经不是「分区」而是在画组件内部结构了。 */
const MAX_DEPTH = 4;

/**
 * 走一遍树,把所有结构问题一次收集齐再抛。
 *
 * 一次抛全部而不是遇错即停,是因为这个错误会被喂回模型重生成：
 * 只告诉它第一处不平,它改完再来还是错,一轮只修一个问题最贵。
 */
const collectIssues = (root: Zone, contentIds: readonly string[]): string[] => {
  const issues: string[] = [];
  const seen = new Map<string, number>();
  let leafCount = 0;

  /**
   * 每个节点占的是一个**二维**格区 `{cols, rows}`,切分只消耗其中一个方向。
   *
   * 这里最容易写错的一点：子节点的可分配格数**不是**它自己的 span。
   * `span` 只描述它在被切的那个方向上占多少格,另一个方向是整段继承父节点的。
   * 所以一个 `dir:"col"` 的父节点切出来的子节点,若自己是 `dir:"row"`,
   * 它能分的是**继承来的 cols**,跟它的 span（行数）无关。
   */
  const walk = (zone: Zone, extent: { cols: number; rows: number }, depth: number, path: string): void => {
    if (depth > MAX_DEPTH) {
      issues.push(`${path}：嵌套超过 ${MAX_DEPTH} 层,分区树过深`);
      return;
    }

    if ("leaf" in zone) {
      leafCount += 1;
      for (const id of zone.leaf.contentIds) {
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
      return;
    }

    const capacity = zone.dir === "row" ? extent.cols : extent.rows;
    const sum = zone.children.reduce((acc, child) => acc + child.span, 0);
    if (sum !== capacity) {
      issues.push(
        `${path}（dir=${zone.dir}）：子节点 span 之和为 ${sum},应为 ${capacity}` +
          `（本节点在${zone.dir === "row" ? "列" : "行"}方向可分配 ${capacity} 格）`
      );
      // 继续下探——子层的问题也一并报出来,不因为本层不平就掩盖掉
    }

    zone.children.forEach((child, index) => {
      const childExtent =
        zone.dir === "row" ? { cols: child.span, rows: extent.rows } : { cols: extent.cols, rows: child.span };
      walk(child.zone, childExtent, depth + 1, `${path} > [${index}]`);
    });
  };

  walk(root, { cols: GRID_COLS, rows: GRID_ROWS }, 1, "根");

  if (leafCount === 0) {
    issues.push("分区树里一个叶子都没有,没有任何内容会被放置");
  }

  const missing = contentIds.filter((id) => !seen.has(id));
  if (missing.length > 0) {
    issues.push(`内容项未被放置：${missing.join("、")}`);
  }

  const duplicated = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}（${n} 次）`);
  if (duplicated.length > 0) {
    issues.push(`内容项被重复放置：${duplicated.join("、")}`);
  }

  const unknown = [...seen.keys()].filter((id) => !contentIds.includes(id));
  if (unknown.length > 0) {
    issues.push(`引用了内容清单里不存在的 id：${unknown.join("、")}`);
  }

  return issues;
};

// ── 切分 ──────────────────────────────────────────────────────────────────────

/**
 * 按 span 把一个矩形切成 n 份。
 *
 * 末段用「总长减去前面所有段」而不是各自 round,是为了让最后一块正好贴到父矩形右/下边缘。
 * 逐段 round 会累积舍入误差,表现成最右边一列比别处窄两三个像素——单看不明显,
 * 但大屏上多个区并排时那条参差的边缘很显眼。
 */
const splitRect = (rect: Rect, dir: "row" | "col", spans: readonly number[], gutter: number): Rect[] => {
  const total = spans.reduce((a, b) => a + b, 0);
  const along = dir === "row" ? rect.width : rect.height;
  const usable = along - gutter * (spans.length - 1);
  const out: Rect[] = [];
  let offset = 0;

  spans.forEach((span, index) => {
    const isLast = index === spans.length - 1;
    // 末段拿「整段长度减去已用偏移」——`offset` 是含间隔的推进量，所以这里要减的是 `along`
    // 而不是 `usable`（后者已经扣过间隔，再减一次含间隔的 offset 就把间隔算了两遍，
    // 症状是最后一块比应有的短了 gutter×(n-1)，右边缘缩进去一截）
    const size = isLast ? along - offset : Math.round((usable * span) / total);
    out.push(
      dir === "row"
        ? { left: rect.left + offset, top: rect.top, width: size, height: rect.height }
        : { left: rect.left, top: rect.top + offset, width: rect.width, height: size }
    );
    offset += size + gutter;
  });

  return out;
};

/** 区内多个内容项：沿容器长边均分。长边而不是固定方向,是为了让扁区横排、竖区竖排。 */
const layoutItems = (
  zoneRect: Rect,
  contentIds: readonly string[],
  zonePadding: number,
  itemGap: number
): SolvedItem[] => {
  const inner: Rect = {
    left: zoneRect.left + zonePadding,
    top: zoneRect.top + zonePadding,
    width: Math.max(1, zoneRect.width - zonePadding * 2),
    height: Math.max(1, zoneRect.height - zonePadding * 2)
  };

  if (contentIds.length === 1) {
    return [{ contentId: contentIds[0], rect: inner }];
  }

  const dir = inner.width >= inner.height ? "row" : "col";
  const rects = splitRect(
    inner,
    dir,
    contentIds.map(() => 1),
    itemGap
  );
  return contentIds.map((contentId, index) => ({ contentId, rect: rects[index] }));
};

// ── 长宽比体检 ────────────────────────────────────────────────────────────────

/**
 * 长宽比不作为硬失败,只记 warning。
 *
 * 「偏离多少算不能看」没有客观判据,而回退重切一整棵树的代价,通常比一个略扁的图表高。
 * 把判断权交回调用方：它可以选择重生成、可以换个更适合这个形状的组件、也可以照单全收。
 *
 * **比的是每一项自己的矩形,不是整块区的矩形。**一块区放 4 个 KPI 时，每项只占四分之一宽
 * （实测 453×59），拿整区（1872×83）去比每一项等于把偏离虚报三四倍——实测里这个虚高的
 * 数字直接让上游 agent 判定「布局坏了」，推翻了一份其实可用的产出去手工返工。
 */
const checkAspect = (items: readonly SolvedItem[], byId: ReadonlyMap<string, ContentItem>): string[] => {
  const warnings: string[] = [];

  for (const solved of items) {
    const item = byId.get(solved.contentId);
    if (!item) {
      continue;
    }
    const actual = solved.rect.width / solved.rect.height;
    const ideal = ASPECT_BY_KIND[item.kind];
    const ratio = actual > ideal ? actual / ideal : ideal / actual;
    if (ratio > ASPECT_TOLERANCE) {
      warnings.push(
        `「${item.name}」(${item.kind}) 理想宽高比 ${ideal},实得 ${actual.toFixed(2)}` +
          `（${solved.rect.width}×${solved.rect.height}）,偏离 ${ratio.toFixed(1)} 倍`
      );
    }
  }

  return warnings;
};

// ── 入口 ──────────────────────────────────────────────────────────────────────

/**
 * @throws {ZoneTreeError} 分区树结构不合法时。调用方应把 `issues` 原样喂回模型重生成——
 *   这些问题（span 不平、内容项漏放/重放）模型看到具体是哪一层不平就能自己改对。
 */
export const solveLayout = (root: Zone, contents: readonly ContentItem[], options: SolveOptions): SolvedZone[] => {
  const { canvasWidth, canvasHeight } = options;
  const padding = options.padding ?? DEFAULTS.padding;
  const gutter = options.gutter ?? DEFAULTS.gutter;
  const zonePadding = options.zonePadding ?? DEFAULTS.zonePadding;
  const itemGap = options.itemGap ?? DEFAULTS.itemGap;

  const issues = collectIssues(
    root,
    contents.map((c) => c.id)
  );
  if (issues.length > 0) {
    throw new ZoneTreeError(issues);
  }

  const byId = new Map(contents.map((c) => [c.id, c]));
  const solved: SolvedZone[] = [];

  const walk = (zone: Zone, rect: Rect): void => {
    if ("leaf" in zone) {
      const contents = zone.leaf.contentIds.map((id) => byId.get(id)!);
      const { container, states } = resolveContainerKind(contents);
      const items = layoutItems(rect, zone.leaf.contentIds, zonePadding, itemGap);
      solved.push({
        role: zone.leaf.role,
        container,
        ...(states ? { states } : {}),
        rect,
        items,
        aspectWarnings: checkAspect(items, byId)
      });
      return;
    }

    const rects = splitRect(
      rect,
      zone.dir,
      zone.children.map((c) => c.span),
      gutter
    );
    zone.children.forEach((child, index) => walk(child.zone, rects[index]));
  };

  walk(root, {
    left: padding,
    top: padding,
    width: canvasWidth - padding * 2,
    height: canvasHeight - padding * 2
  });

  return solved;
};
