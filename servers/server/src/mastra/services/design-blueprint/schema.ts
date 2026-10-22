import { z } from "zod";

/**
 * 设计蓝图 = 结构树 + 素材清单。效果图 → 大屏的第一步由主模型看图写出，后面三步都围着它转：
 * 确认清单 → 批量准备素材（生图 / 裁切 / 复用）→ 按结构树组装组件。
 *
 * 分工：位置和层级由主模型在这里定，生图模型只按 key 出像素、不管放哪；
 * 结构树里只有 kind=asset 的节点用到素材，文字、数字、图表一律是组件，不进素材清单。
 */

/** key 只用小写字母、数字、连字符：要拼进存储路径、贴在总览图的说明里，也方便模型在后续步骤里反复引用 */
export const BLUEPRINT_KEY = /^[a-z0-9][a-z0-9-]{0,39}$/;

const keySchema = z
  .string()
  .regex(BLUEPRINT_KEY, "key 只能用小写字母、数字、连字符，且以字母或数字开头，最长 40")
  .describe("稳定的英文短 id，如 card-load、icon-power；后续步骤都按它引用");

export const RegionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive()
});
export type Region = z.infer<typeof RegionSchema>;

export const NodeKindSchema = z.enum(["group", "component", "asset"]);
export type NodeKind = z.infer<typeof NodeKindSchema>;

export const BlueprintNodeSchema = z.object({
  key: keySchema,
  name: z.string().min(1).describe("中文名，建组件时用作组件名，如「实时负荷卡片」"),
  parent: keySchema.optional().describe("父节点 key；不填表示挂在大屏根上"),
  kind: NodeKindSchema.describe(
    "group：容器（卡片、标题栏等，组装时建成分组）；component：文字、数字、图表等组件；asset：一张图片，图从素材清单里取"
  ),
  region: RegionSchema.describe("在画布上的位置（设计稿像素，原点在画布左上角）"),
  z: z
    .number()
    .int()
    .optional()
    .describe("同级节点间的叠放顺序，大的在上。一般不用填：默认面积大的在下，被包含的子节点总在父节点之上"),
  component: z.string().optional().describe("kind=component 时的组件类型，如 文本、数字翻牌器、折线图、环形进度"),
  asset: keySchema.optional().describe("kind=asset 时用的素材 key"),
  note: z.string().optional().describe("内容与样式要点：文字原文、配色、数据含义，搭建时照此配置"),
  componentId: z.number().int().optional().describe("组装后回填的组件 id，记录这个节点落到了哪个组件上")
});
export type BlueprintNode = z.infer<typeof BlueprintNodeSchema>;

export const AssetSourceSchema = z.enum(["generate", "crop", "reuse"]);
export type AssetSource = z.infer<typeof AssetSourceSchema>;

export const AssetSpecSchema = z.object({
  key: keySchema,
  name: z.string().min(1).describe("中文名，如「卡片底板」「电力图标」"),
  source: AssetSourceSchema.describe(
    "generate：生图；crop：直接从效果图上裁下来（最便宜、最还原）；reuse：用已有图片（素材库或之前生成过的）"
  ),
  prompt: z
    .string()
    .optional()
    .describe("source=generate 时的生图提示词，只写这一个素材本身，统一风格写在蓝图的 style 里"),
  cropRegion: RegionSchema.optional().describe("source=crop 时在画布坐标里裁哪块；不填就裁第一个使用它的节点的 region"),
  url: z.string().optional().describe("source=reuse 时的图片 url（须是本系统里的图片）"),
  blend: z
    .enum(["normal", "screen"])
    .optional()
    .describe("screen：深色底上的发光素材连底裁下来，叠放时用滤色混合让黑底消失，免抠图；默认 normal")
});
export type AssetSpec = z.infer<typeof AssetSpecSchema>;

export const BlueprintInputSchema = z.object({
  screenKey: z
    .string()
    .regex(/^screen_\d+_\d+$/, "screenKey 形如 screen_29445_1")
    .describe("大屏目录名，如 screen_29445_1"),
  sourceImage: z
    .object({ url: z.string(), width: z.number().positive(), height: z.number().positive() })
    .optional()
    .describe("效果图：url 取 <attached-images> 里的 url，宽高是图片像素；有 crop 素材时必填"),
  canvas: z
    .object({ width: z.number().positive(), height: z.number().positive() })
    .describe("画布尺寸（info.json 里的宽高）"),
  style: z
    .string()
    .optional()
    .describe("统一风格描述（色调、质感、光效），自动拼到每个生图素材的提示词前面，保证同一批素材风格一致"),
  palette: z.array(z.string()).optional().describe("主题色 #RRGGBB，从效果图里读出，搭组件时引用"),
  nodes: z.array(BlueprintNodeSchema).min(1),
  assets: z.array(AssetSpecSchema).default([])
});
export type BlueprintInput = z.infer<typeof BlueprintInputSchema>;

export const AssetStatusSchema = z.enum(["pending", "ready", "failed"]);
export type AssetStatus = z.infer<typeof AssetStatusSchema>;

/** 存下来的素材：在模型写的那份规格上，加上推导出的目标尺寸和准备结果 */
export interface BlueprintAsset extends AssetSpec {
  /** 使用它的节点 key */
  usedBy: string[];
  /** 目标尺寸：使用它的节点里最大的那个 region 的宽高 */
  target: { width: number; height: number };
  status: AssetStatus;
  /** 准备好的图片 url */
  resultUrl?: string;
  /** 实际像素尺寸（生图服务会取它支持的最接近尺寸） */
  resultSize?: { width: number; height: number };
  /** 生图记录 id（source=generate） */
  imageId?: string;
  error?: string;
  /** 生成这份结果时的输入指纹：规格没变就沿用结果，改了就回到 pending */
  fingerprint?: string;
}

export interface Blueprint extends Omit<BlueprintInput, "assets"> {
  /** 节点按「父在前、同级按叠放顺序从下到上」排好，z 已补成同级内的名次 */
  nodes: Array<BlueprintNode & { z: number }>;
  assets: BlueprintAsset[];
}
