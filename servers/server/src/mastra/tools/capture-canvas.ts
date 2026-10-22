import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { TOOL_IMAGES_FIELD } from "../provider/image-middleware";
import { SuspendDefs, SuspendType } from "../types/suspend";

const regionSchema = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() });

/**
 * 截取当前编辑器画布给主模型看。
 *
 * 画布只存在于用户浏览器里（含尚未保存的改动），所以走 execute_in_browser 同款的
 * 「suspend → 前端截图并上传 chat-images → resume 回 URL」。
 * 图本身不进工具结果——Chat Completions 的 tool 消息不能带图，结果里只放 `imagesForModel`，
 * 由 inlineImagesMiddleware 在这批 tool 消息之后补一条 user 图片消息。
 */
export const captureCanvasTool = createTool({
  id: "capture_canvas",
  description:
    "截取当前编辑器画布（所见即所得，含未保存的改动），截图会紧跟在工具结果之后以图片形式给你看。" +
    "用于视觉自检：搭建或修改大屏后，对照用户给的参考图检查布局、配色、文字和组件是否到位。" +
    "看整体布局时什么都不传；只核对某几个组件的细节（文字、配色、图表样式）时传 componentIds，" +
    "截到的是这些组件的并集外框（四周留少量边距），细节比整屏图清楚得多；" +
    "要看画布上**任意一块位置**（不对应某个组件，比如两张卡片之间的空隙、一块背景装饰、想放新组件的空位）时传 region，" +
    "坐标是设计稿像素、原点在画布左上角，和 read_file 里组件的 left / top 同一套坐标。componentIds 与 region 二选一。" +
    "**region 的坐标不要凭肉眼从截图上估**——图片会被缩放，就算带网格读也会差一整格。目标是组件时直接用 componentIds；" +
    "目标不是组件（底图里的一张卡片、一块边框装饰）时，带 snap: true：region 只需大致框住（每条边误差 60 像素以内都行），**宁大勿小**——框小了可能吸到卡内一组嵌套的小方块上；框大了不怕，隔壁卡片和整屏外框会被认出来排除，" +
    "工具会在像素上把四条边吸附到最近的边框线外沿，裁出来四条线完整、不留背景。返回的 region 就是吸附后的精确坐标，可以直接复用" +
    "（比如同尺寸的另几张卡）；snapped 里为 false 的边没找到线、保持原位，需要你再核对。" +
    "大致框可以先带 grid: true 截一张整屏读出来。要当 seedImage 用的截图不要加 grid。" +
    "只读，不改动画布。" +
    "返回的 url 还能作为 createImageTool 的 seedImage，把当前画布当参考图去生成配套素材或效果图。",
  inputSchema: z.object({
    componentIds: z
      .array(z.number())
      .min(1)
      .optional()
      .describe("只截这些组件（取并集外框）；不传则截整个画布。相距很远的组件分开截，否则并集框接近整屏"),
    region: regionSchema
      .extend({ width: z.number().positive(), height: z.number().positive() })
      .optional()
      .describe(
        "只截画布上的这块矩形（设计稿像素，原点在画布左上角），可以是任意位置；超出画布的部分会被裁掉。" +
          "与 componentIds 二选一；区域越小截图越清楚，别用它截整屏"
      ),
    grid: z
      .boolean()
      .optional()
      .describe("在截图上叠一层网格，刻度标的是画布绝对坐标（x200、y400…），用来读出 region 的准确坐标；默认不加"),
    gridStep: z
      .number()
      .positive()
      .optional()
      .describe(
        "网格间距（设计稿像素），只在 grid: true 时生效；不传按区域大小自动取（长边约 10 格）。" +
          "要精确对齐某条边时可以传小一点（如 10），但线在图上至少要隔 48 像素才放得下刻度，太小会被自动调大，实际值见返回的 gridStep"
      ),
    snap: z
      .boolean()
      .optional()
      .describe(
        "只对 region 生效：把 region 的四条边吸附到附近（60 像素内）真实的边框线外沿；region 宁大勿小。" +
          "要把卡片、边框完整切出来时用它，region 大致框住即可；只认贯穿的细亮线，按「卡片边缘」的结构挑线，不会吸到图表填充、卡内长线或隔壁卡片的边框上"
      ),
    purpose: z.string().optional().describe("这次截图要检查什么（如「核对左侧三张卡片的位置」），展示给用户")
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    url: z.string().optional().describe("截图 URL；可直接作为 createImageTool 的 seedImage 传入做图生图"),
    width: z.number().optional(),
    height: z.number().optional(),
    region: regionSchema.optional().describe("截图覆盖的画布区域（设计稿像素）"),
    scale: z
      .number()
      .optional()
      .describe("每 1 设计稿像素对应的图片像素数：画布坐标 = region 左上角 + 图片坐标 / scale"),
    gridStep: z.number().optional().describe("叠了网格时实际用的间距（设计稿像素），可能比请求的大"),
    snapped: z
      .object({ left: z.boolean(), top: z.boolean(), right: z.boolean(), bottom: z.boolean() })
      .optional()
      .describe("开了 snap 时每条边是否吸附到了边框线；false 的边保持原位"),
    missingIds: z.array(z.number()).optional().describe("画布上找不到或当前不可见的组件 id，未包含在截图里"),
    note: z.string().optional(),
    error: z.string().optional(),
    [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
  }),
  suspendSchema: SuspendDefs[SuspendType.CaptureCanvas].suspend,
  resumeSchema: SuspendDefs[SuspendType.CaptureCanvas].resume,

  execute: async ({ componentIds, region: requestedRegion, grid, gridStep: requestedStep, snap }, context) => {
    const { resumeData, suspend } = context?.agent ?? {};

    if (componentIds && requestedRegion) {
      return { ok: false, error: "componentIds 与 region 二选一：要截组件传 componentIds，要截任意位置传 region" };
    }

    if (resumeData) {
      if (!resumeData.ok || !resumeData.url) {
        return { ok: false, missingIds: resumeData.missingIds, error: resumeData.error ?? "截图失败" };
      }
      const { url, width, height, region, scale, gridStep, snapped, missingIds } = resumeData;
      const size = width && height ? ` ${width}×${height}` : "";
      const at = region ? `（画布区域 x=${region.x} y=${region.y} w=${region.width} h=${region.height}）` : "";
      const gridNote = grid ? `，叠了坐标网格（间距 ${gridStep ?? "自动"}），刻度即画布坐标` : "";
      const label = componentIds?.length
        ? `组件 ${componentIds.join("、")} 截图${size}${at}`
        : region
          ? `画布区域截图${size}${at}`
          : `画布截图${size}`;
      const EDGE_NAMES = { left: "左", top: "上", right: "右", bottom: "下" } as const;
      const missed = snapped
        ? (Object.keys(EDGE_NAMES) as Array<keyof typeof EDGE_NAMES>)
            .filter((e) => !snapped[e])
            .map((e) => EDGE_NAMES[e])
        : [];
      const snapNote = snapped
        ? missed.length
          ? `，${missed.join("")}边没找到边框线、保持原位`
          : "，四边已吸附到边框线"
        : "";
      const fullLabel = label + gridNote + snapNote;
      return {
        ok: true,
        url,
        width,
        height,
        region,
        scale,
        gridStep,
        snapped,
        missingIds: missingIds?.length ? missingIds : undefined,
        note: "截图已作为紧随其后的图片消息附上；较早的截图可能已不在上下文中，需要时重新截取",
        [TOOL_IMAGES_FIELD]: [{ url, label: fullLabel }]
      };
    }

    if (!suspend) {
      return { ok: false, error: "suspend not available" };
    }
    return suspend({
      type: SuspendType.CaptureCanvas,
      componentIds,
      region: requestedRegion,
      grid,
      gridStep: requestedStep,
      snap
    }) as never;
  }
});
