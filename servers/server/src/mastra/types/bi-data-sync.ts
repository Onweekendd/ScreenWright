import { z } from "zod";

export const ErrorSchema = z.object({
  message: z.string()
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;

export const ScreenMetaSchema = z.object({
  updatedTime: z.string()
});

export type ScreenMeta = z.infer<typeof ScreenMetaSchema>;

export const SyncScreenDataRequestSchema = z.object({
  id: z.string(),
  cacheTime: z.number(),
  parsedLargeScreenInfo: z.any()
});

export const SyncScreenDataResponseSchema = z.object({
  success: z.boolean()
});

export const SyncScreenDescribeRequestSchema = z.object({
  id: z.string().describe("大屏标识，格式为 {screenId}_{versionCode}，如 29483_1"),
  describe: z
    .string()
    .describe(
      "大屏范式模板 JSON（应用 AI 模板后，已将旧组件 id 替换为目标大屏的新 id），落盘为 template-{screenId}.json"
    )
});

export const SyncScreenDescribeResponseSchema = z.object({
  success: z.boolean()
});

export const GetComponentRequestSchema = z.object({
  screenWithVersion: z.string().describe("大屏标识，格式为 {screenId}_{versionCode}，如 29483_1"),
  componentId: z.number().int().describe("目标组件 id")
});

export const GetComponentResponseSchema = z.any().nullable();

export const ReadWorkspaceFileRequestSchema = z.object({
  path: z.string().describe("工作区文件相对路径，如 screen_29445_1/component/123.json")
});

export const ReadWorkspaceFileResponseSchema = z.object({
  content: z.string().describe("文件 JSON 内容"),
  totalLines: z.number(),
  encoding: z.enum(["utf8", "utf16le"]),
  lineEnding: z.enum(["LF", "CRLF"])
});
