import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { largeIdOf } from "@/mastra/services/ai-assets/ai-asset-library";
import { MAX_ASSET_BYTES, pushAsset, type PushedAsset, type PushSource } from "@/mastra/services/ai-assets/workspace-assets";

/** 一次最多传几个：并行上传，再多就该分批 */
export const MAX_PUSH_FILES = 16;

export const pushAssetsInputSchema = z.object({
  screenId: z
    .string()
    .describe(
      '当前大屏，格式 "{screenId}_{versionCode}"（如 "29445_1"），从 editor-context 取；只能传这个大屏 assets/ 里的文件，素材归这个大屏的所有者'
    ),
  files: z
    .array(
      z.object({
        path: z
          .string()
          .min(1)
          .describe(
            '这个大屏 assets/ 下的文件：写 pullAssetsTool 返回的 path（如 "screen_29445_1/assets/card.png"），或只写 assets/ 里的相对路径（如 "card.png"）'
          ),
        name: z.string().optional().describe("素材库里显示的名字；不传取文件名")
      })
    )
    .min(1)
    .max(MAX_PUSH_FILES)
    .describe("要上传的文件，每项一个，并行上传")
});

const resultItemSchema = z.object({
  index: z.number().describe("对应入参 files 的下标（从 0 起）"),
  path: z.string(),
  url: z.string().optional().describe("文件在对象存储里的最终位置，可直接当图片 / 视频地址用；失败时没有"),
  libraryFileId: z.number().optional().describe("在素材库里的素材 id；失败时没有"),
  size: z.number().optional(),
  reused: z.boolean().optional().describe("素材库里已有这个文件（同一个用户、同样内容），没有新建"),
  error: z.string().optional().describe("这个文件没传成功的原因；只需重试失败的")
});

type Item = { index: number; path: string } & (({ ok: true } & PushedAsset) | { ok: false; error: string });

const pushOne = async (file: PushSource, index: number, screenId: string, largeId: number): Promise<Item> => {
  try {
    return { index, path: file.path, ok: true, ...(await pushAsset(file, screenId, largeId)) };
  } catch (error) {
    return { index, path: file.path, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const pushAssetsTool = createTool({
  id: "pushAssetsTool",
  description:
    "把当前大屏工作区 assets/ 目录（screen_{id}/assets/）里的图片 / 视频上传到对象存储，并新增到用户素材库" +
    "（「AI 生成」分组，所有大屏都能用）。一次可以带多个文件，并行上传；每个文件的最终位置（url）和素材 id 在结果里，" +
    "url 可直接放进图片 / 视频组件。" +
    `只能传这个大屏 assets/ 里的文件，类型限 png / jpg / webp / gif / svg / mp4 / webm / mov，单个最多 ${MAX_ASSET_BYTES / 1024 / 1024}MB。` +
    "同一个用户重复上传同样内容不会产生重复素材。某个文件失败不影响其他，结果里按下标给出每个的 url 或 error。" +
    "要先把文件弄到 assets/ 里：从存储拉用 pullAssetsTool，本地生成 / 处理的文件直接写到 assets/ 下。",
  inputSchema: pushAssetsInputSchema,
  outputSchema: z.object({
    files: z.array(resultItemSchema).describe("与入参 files 一一对应")
  }),
  execute: async ({ screenId, files }) => {
    const largeId = largeIdOf(screenId);
    if (largeId === null) {
      throw new Error(`screenId 格式不对（${screenId}），应为 "{screenId}_{versionCode}"，没有上传任何文件`);
    }
    const items = await Promise.all(files.map((file, index) => pushOne(file, index, screenId, largeId)));
    if (items.every((item) => !item.ok)) {
      throw new Error(
        `${items.length} 个文件全部没传上去：${items.map((item) => (item.ok ? "" : `[${item.index + 1}] ${item.error}`)).join("；")}`
      );
    }
    return {
      files: items.map((item) =>
        item.ok
          ? {
              index: item.index,
              path: item.path,
              url: item.url,
              libraryFileId: item.libraryFileId,
              size: item.size,
              reused: item.reused
            }
          : { index: item.index, path: item.path, error: item.error }
      )
    };
  }
});
