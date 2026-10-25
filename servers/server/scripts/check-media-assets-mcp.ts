import { closeMediaAssetsMcp, getMediaAssetsTools } from "../src/mastra/mcp/media-assets/client";
import { getMediaAssetsTask } from "../src/mastra/services/ai-assets/media-assets.server";

try {
  const tools = await getMediaAssetsTools();
  console.log("MCP tools:", Object.keys(tools).join(", "));
  const taskId = process.argv[2];
  if (taskId) {
    const task = await getMediaAssetsTask(taskId);
    console.log(
      JSON.stringify(
        {
          taskId: task.task_id,
          status: task.status,
          assets: task.assets.map((asset) => ({
            assetId: asset.asset_id,
            type: asset.type,
            width: asset.width,
            height: asset.height,
            durationMs: asset.duration_ms
          }))
        },
        null,
        2
      )
    );
  }
} finally {
  await closeMediaAssetsMcp();
}
