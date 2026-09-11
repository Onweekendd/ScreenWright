import { z } from "zod";

const APP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/** Artifact 应用预览模式。 */
export const ArtifactAppPreviewModeSchema = z.enum(["development", "published"]);

/**
 * Artifact 应用预览组件配置。
 *
 * `appId` 是应用身份。实际预览地址由客户端根据 Screenwright 服务地址和 appId 在运行时生成，
 * 不把开发服务器端口或环境地址保存到组件配置中。
 */
export const ArtifactAppPreviewOptionSchema = z.object({
  appId: z
    .string()
    .max(128)
    .refine((value) => value === "" || APP_ID_PATTERN.test(value), "appId 只能包含字母、数字、下划线和短横线")
    .default(""),
  allowInteraction: z.boolean().default(true),
  previewMode: ArtifactAppPreviewModeSchema.default("development"),
  showStatus: z.boolean().default(true)
});

/** Artifact 应用预览组件不消费低代码数据源。 */
export const ArtifactAppPreviewDataSchema = z.array(z.never()).default([]);
