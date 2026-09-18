import { createStep } from "@mastra/core/workflows";
import sharp from "sharp";
import { z } from "zod";

import { assetStore } from "@/lib/storage";
import { effectImageAnalyzerAgent } from "@/mastra/agents/effect-image-analyzer-agent";
import { prismaClient } from "@/mastra/storage/prisma";

import { retryGenerate } from "../../requirement-to-bi/retry";
import { type Rect, type SolvedZone } from "../../requirement-to-bi/types";
import {
  BACKGROUND_REGION_ID,
  effectImageAnalysisSchema,
  type EffectImageRegion,
  type RegionKind,
  type ResolvedRegion
} from "../types";
import { boundsToPixelBox, groupAssetRegions, produceRepresentativeAsset } from "./resolve-assets";

/**
 * ② 划区 + 素材分组去重 + 代表生图。替代 `requirement-to-bi/steps/compose-layout-step.ts`
 * 在这条链路里的位置——那一步的活是「模型编格子 + solveLayout 求坐标」，这一步不需要编，
 * 坐标直接来自效果图。
 *
 * 产出刻意对齐 `composeLayoutOutputSchema` 的形状（`zones: SolvedZone[]`），
 * 这样下游 `.foreach(...)` / `.then(assembleScreenStep)` 那段链路不用改一行——
 * 复用矩阵与理由见 `docs/生图到大屏工作流.md` §「能不能复用」。
 *
 * **一张卡片收成一个 `SolvedZone`**（`container` 恒为 `sw-folder`——图片来源的区不产生
 * 动态面板，面板需要的「同一内容多视图」效果图里看不出来）：卡片框是容器，框里的页签条、
 * 标题文字、图表按包含关系归进来当 `items`。这样画布上一张卡片就是一个分组，用户拖动
 * 整张卡片时框、页签、标题、图表一起走——按区域各自成组（第一版）拖一下就散架。
 *
 * 不在任何卡片框里的区域（底图、顶部标题栏 + 大屏标题、零散装饰）各自成组。
 *
 * **顺序就是画布 z 序**（assembleScreen 按 zones 序、组内按 items 序发帧，后发的在上面）：
 * 组间：底图 → 其它 → 卡片；组内：框 → 页签条 → 文字 → 图表。
 */

export const analyzeEffectImageInputSchema = z.object({
  screenId: z.string().describe('大屏标识 "{screenId}_{versionCode}"'),
  canvasWidth: z.number().positive(),
  canvasHeight: z.number().positive(),
  /** 用户在 ⏸ 挑效果图那一步选中的那张：`GeneratedImage.id`，也接受它的 url */
  imageId: z.string().min(1)
});

/** 每个 zone 配一条解析结果，供下游 `pickComponentOrAssetStep` 决定怎么落地。 */
export const resolvedRegionSchema = z.custom<ResolvedRegion>();

export const analyzeEffectImageOutputSchema = z.object({
  screenId: z.string(),
  canvasWidth: z.number(),
  canvasHeight: z.number(),
  zones: z.array(z.custom<SolvedZone>()),
  /** 与 zones 同序同长；每个 zone 一组，组内与该 zone 的 items 同序同长。不用 Map 是为了能序列化 */
  resolved: z.array(z.array(resolvedRegionSchema)),
  /** vision 从效果图取的主色，下游写进图表系列色；vision 没给就没有，图表沿用模板默认色 */
  palette: z.array(z.string()).optional()
});

/** vision 给的置信度低于它的区域丢弃。比 figma 那条（0.65）松：生成图本来就比设计稿"糊" */
const MIN_REGION_CONFIDENCE = 0.5;
/** 0~1000 归一化面积。20×20 以下基本是模型把图例、图标当区域了 */
const MIN_REGION_AREA = 400;
/** 同为 component 的两条框，小框被大框盖住 ≥ 这个比例就丢大框（模型把卡片整体又当成一个组件的情况） */
const MAX_COMPONENT_CONTAINMENT = 0.9;
/**
 * 素材占画面 ≥ 这个比例就当它是背景丢掉。生成出来的素材图**不透明**，一张铺满画布的
 * "outer-frame" 落上去等于把底图整个盖住，还会把生图幻觉出来的大装饰一起带上（screen_23 顶部那两个大括号）。
 * 底图由代码固定合成一条，vision 再给一条整屏的没有任何用处。
 */
const MAX_ASSET_CANVAS_COVERAGE = 0.85;
const CANVAS_AREA = 1000 * 1000;

const KIND_ORDER: Record<RegionKind, number> = { asset: 0, component: 1, text: 2 };

/** 一块区域被卡片框盖住 >= 这个比例就算"在这张卡片里"。vision 框有偏差，不能要求 100% */
const MIN_CONTAINMENT_IN_CARD = 0.7;

/** 组内叠放顺序：框最底、页签条其次、文字在图表下面（标题和图表本来就不重叠，顺序只是保险） */
const itemOrder = (r: EffectImageRegion): number =>
  r.role === "card-frame" ? 0 : r.kind === "asset" ? 1 : r.kind === "text" ? 2 : 3;

const intersection = (a: EffectImageRegion["bounds"], b: EffectImageRegion["bounds"]): number => {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  return w > 0 && h > 0 ? w * h : 0;
};

const areaOf = (b: EffectImageRegion["bounds"]): number => (b[2] - b[0]) * (b[3] - b[1]);

/** 页签条合成时相对标题文字框向外扩的量（0~1000 归一化单位）：上下各 6、右侧 30，左侧贴到卡片框内沿 */
const TITLE_BAR_PAD_Y = 6;
const TITLE_BAR_PAD_RIGHT = 30;
const TITLE_BAR_INSET_LEFT = 4;

const containedRatio = (inner: EffectImageRegion["bounds"], outer: EffectImageRegion["bounds"]): number =>
  intersection(inner, outer) / areaOf(inner);

/**
 * 卡片有标题文字却没有页签条时，按标题文字的框合成一条 `card-title-bar`。
 *
 * vision 模型（gemini flash-lite）在指令和用户提示里都点名要页签条，实测两轮一条都不给——
 * 它把页签条当成卡片框的一部分了。页签条是"卡片背景 / 页签背景 / 标题文字 / 内容"四层里
 * 用户明确要求的一层，不能指望模型，程序兜底：标题文字底下那块就是页签条所在，
 * 向外扩一圈当它的框，去重后照样只生一张。
 */
export const ensureCardTitleBars = (regions: EffectImageRegion[]): EffectImageRegion[] => {
  const frames = regions.filter((r) => r.role === "card-frame");
  const titleBars = regions.filter((r) => r.role === "card-title-bar");
  const synthesized: EffectImageRegion[] = [];
  for (const frame of frames) {
    const hasBar = titleBars.some((b) => containedRatio(b.bounds, frame.bounds) >= MIN_CONTAINMENT_IN_CARD);
    if (hasBar) {
      continue;
    }
    const title = regions.find(
      (r) =>
        r.kind === "text" &&
        r.role === "card-title" &&
        containedRatio(r.bounds, frame.bounds) >= MIN_CONTAINMENT_IN_CARD
    );
    if (!title) {
      continue;
    }
    const [fx1, , fx2] = frame.bounds;
    const [, ty1, tx2, ty2] = title.bounds;
    synthesized.push({
      id: `${frame.id}-title-bar`,
      kind: "asset",
      role: "card-title-bar",
      bounds: [
        Math.min(fx2, fx1 + TITLE_BAR_INSET_LEFT),
        Math.max(0, ty1 - TITLE_BAR_PAD_Y),
        Math.min(fx2, tx2 + TITLE_BAR_PAD_RIGHT),
        Math.min(1000, ty2 + TITLE_BAR_PAD_Y)
      ],
      confidence: title.confidence,
      hasBakedText: true
    });
  }
  return [...regions, ...synthesized];
};

/** 按"卡片框 -> 框里的东西"归组；不属于任何卡片的各自一组。返回每组的成员，已按叠放顺序排好。 */
export const groupRegionsIntoCards = (regions: EffectImageRegion[]): EffectImageRegion[][] => {
  // 小框优先：嵌套时归到最贴身的那张卡片
  const frames = regions.filter((r) => r.role === "card-frame").sort((a, b) => areaOf(a.bounds) - areaOf(b.bounds));
  const hostOf = new Map<string, string>();
  for (const region of regions) {
    if (region.role === "card-frame" || region.role === "background") {
      continue;
    }
    const host = frames.find(
      (f) => intersection(region.bounds, f.bounds) / areaOf(region.bounds) >= MIN_CONTAINMENT_IN_CARD
    );
    if (host) {
      hostOf.set(region.id, host.id);
    }
  }

  const groups: EffectImageRegion[][] = [];
  const byFrame = new Map<string, EffectImageRegion[]>();
  const membersOf = (frameId: string): EffectImageRegion[] => {
    let members = byFrame.get(frameId);
    if (!members) {
      members = [];
      byFrame.set(frameId, members);
      groups.push(members);
    }
    return members;
  };
  for (const region of regions) {
    const hostId = hostOf.get(region.id);
    if (region.role === "card-frame") {
      membersOf(region.id).push(region);
    } else if (hostId) {
      membersOf(hostId).push(region);
    } else {
      groups.push([region]);
    }
  }
  for (const members of groups) {
    members.sort((a, b) => itemOrder(a) - itemOrder(b));
  }
  return groups;
};

/**
 * 清洗规则改自 figma 的 `normalizeScreenRegions`，差别在包含关系去重**只在 component 之间做**：
 * 那边一级区域必须扁平，这边卡片框（asset）包含图表（component）是常态，跨 kind 不能互相剔除。
 */
export const normalizeEffectImageRegions = (regions: EffectImageRegion[]): EffectImageRegion[] => {
  const valid = regions.filter(
    (r) =>
      r.confidence >= MIN_REGION_CONFIDENCE &&
      r.bounds[2] > r.bounds[0] &&
      r.bounds[3] > r.bounds[1] &&
      areaOf(r.bounds) >= MIN_REGION_AREA &&
      r.id !== BACKGROUND_REGION_ID &&
      !(r.kind === "asset" && areaOf(r.bounds) >= MAX_ASSET_CANVAS_COVERAGE * CANVAS_AREA)
  );

  const components = valid
    .filter((r) => r.kind === "component")
    .sort((a, b) => areaOf(a.bounds) - areaOf(b.bounds) || b.confidence - a.confidence);
  const keptComponents: EffectImageRegion[] = [];
  for (const candidate of components) {
    const swallowsExisting = keptComponents.some(
      (existing) =>
        intersection(candidate.bounds, existing.bounds) / areaOf(existing.bounds) >= MAX_COMPONENT_CONTAINMENT
    );
    if (!swallowsExisting) {
      keptComponents.push(candidate);
    }
  }

  const seen = new Set<string>();
  return [...valid.filter((r) => r.kind !== "component"), ...keptComponents]
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
};

/** 把 0~1000 归一化 bbox 换算成 canvas 像素坐标，效果图分辨率与目标画布不一定相等。 */
const boundsToRect = (bounds: EffectImageRegion["bounds"], canvasWidth: number, canvasHeight: number): Rect => {
  const [x1, y1, x2, y2] = bounds;
  return {
    left: Math.round((x1 / 1000) * canvasWidth),
    top: Math.round((y1 / 1000) * canvasHeight),
    width: Math.round(((x2 - x1) / 1000) * canvasWidth),
    height: Math.round(((y2 - y1) / 1000) * canvasHeight)
  };
};

/** 底图：不由 vision 给，固定一条铺满画布的 asset，永远排在 zones 第一位。 */
const backgroundRegion = (): EffectImageRegion => ({
  id: BACKGROUND_REGION_ID,
  kind: "asset",
  role: "background",
  bounds: [0, 0, 1000, 1000],
  confidence: 1,
  hasBakedText: false
});

const loadEffectImage = async (imageId: string): Promise<{ id: string; url: string; buffer: Buffer }> => {
  const row =
    (await prismaClient.generatedImage.findUnique({ where: { id: imageId } })) ??
    (await prismaClient.generatedImage.findFirst({ where: { url: imageId } }));
  if (!row) {
    throw new Error(`找不到效果图 ${imageId}：它必须是 create_image / genEffectImages 生成并落库的那张`);
  }
  const key = assetStore().keyFromUrl(row.url);
  if (!key) {
    throw new Error(`效果图 ${row.id} 的 url 不在 assetStore 里：${row.url}`);
  }
  return { id: row.id, url: row.url, buffer: await assetStore().get(key) };
};

export const analyzeEffectImageStep = createStep({
  id: "analyze-effect-image",
  description: "vision 划区 → 素材按同款分组、每组生一张干净底图 → 产出与 compose-layout 同形状的 zones",
  inputSchema: analyzeEffectImageInputSchema,
  outputSchema: analyzeEffectImageOutputSchema,
  execute: async ({ inputData }) => {
    const { screenId, canvasWidth, canvasHeight } = inputData;

    const image = await loadEffectImage(inputData.imageId);
    const metadata = await sharp(image.buffer).metadata();
    const imageWidth = metadata.width ?? canvasWidth;
    const imageHeight = metadata.height ?? canvasHeight;
    const imageDataUrl = `data:${metadata.format === "jpeg" ? "image/jpeg" : "image/png"};base64,${image.buffer.toString("base64")}`;

    const result = await retryGenerate("效果图划区", () =>
      effectImageAnalyzerAgent.generate(
        [
          {
            role: "user",
            content: [
              { type: "image", image: imageDataUrl },
              {
                type: "text",
                // 提示里**不能提图片像素尺寸**：写了 1920×1080 模型就会按像素给坐标，整批越界被 schema 拒掉
                text:
                  "把这张大屏效果图拆成 asset / component / text 三类区域。" +
                  "每张卡片输出四条：背景框 card-frame、标题所在的页签装饰条 card-title-bar（标题文字底下那条斜切/渐变的窄条，" +
                  "只要有装饰就必须输出）、标题文字 text（role=card-title）、卡片里的图表 component。大屏标题一条 text（role=screen-title）。" +
                  "不要输出整屏背景。bounds 一律用 0~1000 的归一化坐标（图片最右下角是 [1000, 1000]），不是像素。"
              }
            ]
          }
        ],
        { structuredOutput: { schema: effectImageAnalysisSchema, jsonPromptInjection: true } }
      )
    );

    const regions = ensureCardTitleBars([backgroundRegion(), ...normalizeEffectImageRegions(result.object.regions)]);
    const palette = result.object.palette?.length ? result.object.palette : undefined;
    console.info(
      `[screen-from-effect-image] 划区 ${regions.length} 条，主色 ${palette ? palette.join(" ") : "（vision 未给，图表沿用模板默认色）"}`
    );

    // 素材：分组去重 → 每组只给代表生一张 → 其余成员 reuseOf。
    // 各组互不依赖，并发生成；生图慢（实测单张 40s 上下），串行会把整条链路拖到分钟级。
    const groups = groupAssetRegions(regions.filter((r) => r.kind === "asset"));
    const produced = await Promise.all(
      groups.map((group, groupIndex) =>
        produceRepresentativeAsset({
          imageId: image.id,
          imageBuffer: image.buffer,
          imageWidth,
          imageHeight,
          group,
          groupIndex
        })
      )
    );
    const assetByRegionId = new Map<string, ResolvedRegion["asset"]>();
    groups.forEach((group, i) => {
      const { url, generated } = produced[i];
      for (const member of group.members) {
        assetByRegionId.set(member.id, {
          url,
          generated,
          ...(member.id === group.representative.id ? {} : { reuseOf: group.representative.id })
        });
      }
    });

    const toResolved = (region: EffectImageRegion): ResolvedRegion => ({
      region,
      snap: "none",
      box: boundsToPixelBox(region.bounds, imageWidth, imageHeight),
      ...(region.kind === "asset" ? { asset: assetByRegionId.get(region.id) } : {}),
      ...(region.kind === "text" ? { text: { value: region.text ?? "" } } : {})
    });

    const zones: SolvedZone[] = [];
    const resolved: ResolvedRegion[][] = [];
    for (const members of groupRegionsIntoCards(regions)) {
      const head = members[0];
      zones.push({
        role: head.role,
        container: "sw-folder",
        rect: boundsToRect(head.bounds, canvasWidth, canvasHeight),
        items: members.map((m) => ({ contentId: m.id, rect: boundsToRect(m.bounds, canvasWidth, canvasHeight) })),
        aspectWarnings: []
      });
      resolved.push(members.map(toResolved));
    }

    return { screenId, canvasWidth, canvasHeight, zones, resolved, palette };
  }
});
