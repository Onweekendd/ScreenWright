import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  annotateBlueprint,
  type Blueprint,
  BlueprintInputSchema,
  checkBlueprint,
  loadBlueprint,
  saveBlueprint
} from "@/mastra/services/design-blueprint";
import { formatErrorChain } from "@/mastra/workflows/figma-to-bi/utils/async";

import { TOOL_IMAGES_FIELD } from "../../provider/image-middleware";

const assetRowSchema = z.object({
  key: z.string(),
  name: z.string(),
  source: z.string(),
  target: z.string().describe("目标尺寸 宽×高"),
  usedBy: z.number().describe("使用它的节点数"),
  status: z.string()
});

/** 给模型和用户看的素材清单：一行一项，状态沿用了上次结果的会直接是 ready */
export const assetRows = (blueprint: Blueprint) =>
  blueprint.assets.map((asset) => ({
    key: asset.key,
    name: asset.name,
    source: asset.source,
    target: `${asset.target.width}×${asset.target.height}`,
    usedBy: asset.usedBy.length,
    status: asset.status
  }));

export const saveBlueprintTool = createTool({
  id: "save_blueprint",
  description:
    "保存效果图的设计蓝图：结构树（nodes）+ 素材清单（assets），一个大屏一份，每次整份覆盖。" +
    "效果图 → 大屏时，看完图第一步就写它，后面的确认清单、准备素材、组装组件都以它为准；" +
    "上下文被压缩后用 read_blueprint 读回来，不要凭记忆。" +
    "结构树只拆到能定出素材清单的深度（一般两三层：大屏 → 卡片/标题栏 → 卡内元素）。" +
    "文字、数字、图表、进度条、分割线是组件（kind=component），不进素材清单；只有背景、底板、装饰、图标、插画这类" +
    "组件画不出来的才是素材（kind=asset 的节点引用素材 key）。几处长得一样的（六张卡片同一种底板）只列一项素材，多个节点引用它。" +
    "位置用画布坐标；从效果图上读坐标误差很大，效果图作为底图铺在画布上时，用 capture_canvas 的 snap 量出准确位置再填。" +
    "保存时会校验结构并推导目标尺寸、叠放顺序；有 errors 就按提示改完重新保存。" +
    "保存成功后会附上标注图：节点框、裁切框画在效果图上（版面重排时另附一张画布线框图），框上标着 key，用来核对坐标有没有偏。" +
    "规格没变的素材会沿用上次准备好的结果，改了提示词/裁切区域/尺寸的会回到 pending。",
  inputSchema: BlueprintInputSchema,
  outputSchema: z.object({
    ok: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    nodeCount: z.number().optional(),
    assets: z.array(assetRowSchema).optional(),
    next: z.string().optional(),
    [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
  }),
  execute: async (input, context) => {
    const previous = await loadBlueprint(input.screenKey);
    const { errors, warnings, blueprint } = checkBlueprint(input, previous ?? undefined);
    if (!blueprint) {
      return { ok: false, errors, warnings };
    }
    await saveBlueprint(blueprint, context?.agent?.threadId);

    const pending = blueprint.assets.filter((asset) => asset.status !== "ready");
    const toGenerate = pending.filter((asset) => asset.source === "generate").length;
    const next =
      pending.length === 0
        ? "素材都已就绪，可以按结构树组装组件"
        : toGenerate > 0
          ? `有 ${toGenerate} 张素材要生图（要花钱、要等）：先把素材清单整理给用户确认，确认后再调 prepare_assets`
          : "待准备的素材都是裁切/复用，不花钱，可以直接调 prepare_assets";
    // 标注图只是给模型核对用的，画不出来不影响保存
    const images = await annotateBlueprint(blueprint).catch((error) => {
      console.warn(`[design-blueprint] 画标注图失败：${formatErrorChain(error)}`);
      return [];
    });
    return {
      ok: true,
      errors,
      warnings,
      nodeCount: blueprint.nodes.length,
      assets: assetRows(blueprint),
      next,
      ...(images.length > 0 ? { [TOOL_IMAGES_FIELD]: images } : {})
    };
  }
});
