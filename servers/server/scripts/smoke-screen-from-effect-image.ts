/**
 * 生图→大屏工作流冒烟：拿库里已有的一张效果图跑完整链路，打印划区、分组去重、素材产出和组装结果。
 * 用法：dotenvx run -- tsx scripts/smoke-screen-from-effect-image.ts <generatedImageId> [screenId]
 * 需要设置页配好 vision / image / reasoning 三个模型。没有前端连着时组装那步只发帧不落盘。
 */
import { mastra } from "@/mastra";
import type { ResolvedRegion } from "@/mastra/workflows/screen-from-effect-image/types";

import "@/mastra/runtime";

const imageId = process.argv[2];
const screenId = process.argv[3] ?? "smoke_1";
if (!imageId) {
  console.error("缺 imageId");
  process.exit(1);
}

const run = await mastra.getWorkflow("screenFromEffectImageWorkflow").createRun();
const started = Date.now();
const result = await run.start({ inputData: { screenId, canvasWidth: 1920, canvasHeight: 1080, imageId } });
console.log(`status=${result.status} 耗时 ${((Date.now() - started) / 1000).toFixed(1)}s`);

const analyze = (
  result.steps as Record<string, { status: string; output?: { zones: unknown[]; resolved: ResolvedRegion[][] } }>
)["analyze-effect-image"];
if (analyze?.output) {
  for (const [zi, members] of analyze.output.resolved.entries()) {
    console.log(`── zone ${zi}（${members.length} 项）`);
    for (const r of members) {
      const tag =
        r.region.kind === "asset"
          ? `asset ${r.asset?.generated ? "生图" : "裁切"}${r.asset?.reuseOf ? ` ←${r.asset.reuseOf}` : ""}`
          : r.region.kind;
      console.log(
        `  ${r.region.id.padEnd(18)} ${tag.padEnd(22)} ${r.region.role.padEnd(16)} ${r.region.contentKind ?? ""}${r.region.text ? ` "${r.region.text}"` : ""} box=${r.box.join(",")}`
      );
    }
  }
}
if (result.status === "success") {
  console.log(result.result);
} else if (result.status === "failed") {
  console.error(result.error);
}
process.exit(0);
