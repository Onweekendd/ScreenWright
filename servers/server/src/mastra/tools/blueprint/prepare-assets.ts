import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { loadBlueprint, mergePrepared, prepareAssets, saveBlueprint } from "@/mastra/services/design-blueprint";

import { TOOL_IMAGES_FIELD } from "../../provider/image-middleware";

export const prepareAssetsTool = createTool({
  id: "prepare_assets",
  description:
    "按设计蓝图的素材清单批量准备素材：generate 的并发生图，crop 的从效果图上裁下来，reuse 的校验能读到。" +
    "不传 keys 就准备所有还没就绪的（含上次失败的）；只想重做某几项时传 keys。" +
    "有生图素材时，必须先让用户确认过素材清单再调用。" +
    "单项失败不影响其它项，失败原因在结果里，改了蓝图里那一项的规格后可以只重做它。" +
    "本次准备好的素材会拼成一张总览图跟在工具结果后面给你看（顺序见图片说明），用来检查风格是否统一、有没有生歪的；" +
    "生图的实际尺寸可能和目标尺寸不同，组装时图片组件铺满节点区域即可。",
  inputSchema: z.object({
    screenKey: z.string().describe("大屏目录名，如 screen_29445_1"),
    keys: z.array(z.string()).min(1).optional().describe("只准备这些素材；不传则准备所有还没就绪的")
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        key: z.string(),
        name: z.string(),
        source: z.string(),
        status: z.string(),
        url: z.string().optional(),
        size: z.object({ width: z.number(), height: z.number() }).optional(),
        reused: z.boolean().optional(),
        error: z.string().optional()
      })
    ),
    ready: z.number(),
    failed: z.number(),
    remaining: z.number().describe("蓝图里仍未就绪的素材数"),
    [TOOL_IMAGES_FIELD]: z.array(z.object({ url: z.string(), label: z.string() })).optional()
  }),
  // 一批十几张、每张生图 30~60 秒，不开 background 会卡住整个 agentic loop。
  // 重跑是安全的：生图按 prompt 派生 seed、命中幂等，已 ready 的素材不会再做
  background: { enabled: true, timeoutMs: 15 * 60_000, maxRetries: 1 },
  execute: async ({ screenKey, keys }, context) => {
    const blueprint = await loadBlueprint(screenKey);
    if (!blueprint) {
      throw new Error(`${screenKey} 还没有设计蓝图，先用 save_blueprint 写结构树和素材清单`);
    }
    const { blueprint: prepared, results, sheet } = await prepareAssets(blueprint, { keys });

    const latest = (await loadBlueprint(screenKey)) ?? blueprint;
    const merged = mergePrepared(
      latest,
      prepared,
      results.map((result) => result.key)
    );
    await saveBlueprint(merged, context?.agent?.threadId);

    const ready = results.filter((result) => result.status === "ready").length;
    const label = sheet
      ? `本次准备好的 ${sheet.keys.length} 张素材总览，从左到右、从上到下依次是：${sheet.keys.join("、")}`
      : undefined;
    return {
      results,
      ready,
      failed: results.length - ready,
      remaining: merged.assets.filter((asset) => asset.status !== "ready").length,
      ...(sheet && label ? { [TOOL_IMAGES_FIELD]: [{ url: sheet.url, label }] } : {})
    };
  }
});
