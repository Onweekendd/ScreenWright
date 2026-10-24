import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { importMediaAssets, mediaAssetsResultSchema, searchMediaAssets } from "../services/media-assets.server";

const screenId = z
  .string()
  .regex(/^(?:screen_)?\d+_\d+$/)
  .describe('当前大屏，从 editor-context 取，如 "10_1"');

export const searchMediaAssetsTool = createTool({
  id: "searchMediaAssetsTool",
  description:
    "联网搜索并收集真实图片或视频素材。通过本地 Answer Media Agent MCP 委派搜索、下载和校验，" +
    "后台等待完成后自动转存到平台存储，并放进大屏所有者的「联网素材」分组，返回可长期引用的 url 和素材 id。" +
    "视频当前支持抖音搜索；图片可以提供来源网页 sourceUrls。描述主题、画面和时长等选择要求，默认短边至少1080。" +
    "不要关闭后台执行，也不要自己反复轮询；需要登录/验证码时结果会说明。不要把来源网页 sourceUrl 当成素材地址。",
  inputSchema: z.object({
    screenId,
    query: z.string().min(1).describe("搜索主题和筛选要求，例如新疆那拉提、蓝天白云绿草地、约13秒自然风景"),
    kind: z.enum(["image", "video"]),
    count: z.number().int().min(1).max(10).default(1),
    minShortSide: z.number().int().positive().default(1080),
    maxDurationSeconds: z.number().int().min(1).max(900).default(120),
    sourceUrls: z.array(z.url()).max(20).optional().describe("已知来源网页，尤其用于收集图片")
  }),
  outputSchema: mediaAssetsResultSchema,
  background: { enabled: true, timeoutMs: 12 * 60_000, maxRetries: 0 },
  execute: async (input, context) => searchMediaAssets(input, context?.agent?.toolCallId)
});

export const importMediaAssetsTool = createTool({
  id: "importMediaAssetsTool",
  description:
    "获取已有联网素材任务的最新结果（自动刷新临时下载 URL），将已取得的图片/视频转存到平台并放入「联网素材」分组。" +
    "用于导入用户提供的 task_id，或重试之前任务的导入；不会重新联网搜索，重复导入按内容去重。结果 assets[].url 才是平台可用地址。",
  inputSchema: z.object({ screenId, taskId: z.string().min(1) }),
  outputSchema: mediaAssetsResultSchema,
  background: { enabled: true, timeoutMs: 5 * 60_000, maxRetries: 0 },
  execute: async ({ screenId, taskId }) => importMediaAssets(taskId, screenId)
});
