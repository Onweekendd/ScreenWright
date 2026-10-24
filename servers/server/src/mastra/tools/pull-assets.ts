import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { MAX_ASSET_BYTES, pullAsset, type PulledAsset, type PullSource } from "@/mastra/services/ai-assets/workspace-assets";

/** 一次最多拉几个：并行下载，再多就该分批 */
export const MAX_PULL_FILES = 16;

export const pullAssetsInputSchema = z.object({
  screenId: z
    .string()
    .describe(
      '当前大屏，格式 "{screenId}_{versionCode}"（如 "29445_1"），从 editor-context 取；文件拉到这个大屏自己的 assets/ 目录'
    ),
  files: z
    .array(
      z.object({
        url: z
          .string()
          .min(1)
          .describe(
            "要拉的文件：素材 url（工具返回的、素材库里的、用户上传的），或对象存储的 key；url 要原样复制，别手敲"
          ),
        name: z.string().optional().describe("落到工作区的文件名（含扩展名）；不传取原文件名")
      })
    )
    .min(1)
    .max(MAX_PULL_FILES)
    .describe("要拉到工作区的文件，每项一个，并行下载"),
  dir: z.string().optional().describe('assets/ 下的子目录（如 "refs"），不传直接放在 assets/ 里；不能跳出 assets/')
});

const resultItemSchema = z.object({
  index: z.number().describe("对应入参 files 的下标（从 0 起）"),
  source: z.string(),
  path: z.string().optional().describe("文件在工作区里的最终位置（相对工作区根），本地处理就用它；失败时没有"),
  absolutePath: z.string().optional().describe("同一个位置的绝对路径，给命令行用"),
  size: z.number().optional(),
  reused: z.boolean().optional().describe("工作区里已有内容一样的同名文件，没有重复写"),
  error: z.string().optional().describe("这个文件没拉成功的原因；只需重试失败的")
});

export type PullAssetsInput = z.infer<typeof pullAssetsInputSchema>;

type Item = { index: number; source: string } & (({ ok: true } & PulledAsset) | { ok: false; error: string });

const pullOne = async (file: PullSource, index: number, screenId: string, dir: string | undefined): Promise<Item> => {
  try {
    return { index, source: file.url, ok: true, ...(await pullAsset(file, screenId, dir)) };
  } catch (error) {
    return { index, source: file.url, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const pullAssetsTool = createTool({
  id: "pullAssetsTool",
  description:
    "把对象存储（素材库、生成的图、用户上传的文件）里的文件拉到当前大屏工作区的 assets/ 目录（screen_{id}/assets/），" +
    "之后就能用 execute_command 做本地处理（裁切、缩放、拼图、转格式……）。一次可以带多个文件，并行下载；" +
    "每个文件的最终位置（path）在结果里，同名但内容不同的文件会自动改名避让，所以一定要用返回的 path，不要自己猜文件名。" +
    `单个文件最多 ${MAX_ASSET_BYTES / 1024 / 1024}MB。某个文件失败不影响其他，结果里按下标给出每个的 path 或 error。` +
    "处理完要放回素材库用 pushAssetsTool。assets/ 不进版本历史，回退不会动它。",
  inputSchema: pullAssetsInputSchema,
  outputSchema: z.object({
    files: z.array(resultItemSchema).describe("与入参 files 一一对应")
  }),
  execute: async ({ screenId, files, dir }) => {
    const items = await Promise.all(files.map((file, index) => pullOne(file, index, screenId, dir)));
    if (items.every((item) => !item.ok)) {
      throw new Error(
        `${items.length} 个文件全部没拉下来：${items.map((item) => (item.ok ? "" : `[${item.index + 1}] ${item.error}`)).join("；")}`
      );
    }
    return {
      files: items.map((item) =>
        item.ok
          ? {
              index: item.index,
              source: item.source,
              path: item.path,
              absolutePath: item.absolutePath,
              size: item.size,
              reused: item.reused
            }
          : { index: item.index, source: item.source, error: item.error }
      )
    };
  }
});
