import type { AppCodeTaskError } from "../contracts/app-code-task-error";

export const ARTIFACT_APP_PREVIEW_PATH_PREFIX = "/artifact-apps";

/** 已经启动并可供客户端访问的 Artifact App 开发预览。 */
export interface AppDevelopmentPreview {
  readonly appId: string;
  readonly port: number;
  readonly publicPath: string;
  readonly status: "running";
}

/** 管理每个 Artifact App 的长期开发预览服务。 */
export interface PreviewManager {
  start(appId: string): Promise<AppDevelopmentPreview>;
  get(appId: string): AppDevelopmentPreview | undefined;
  stop(appId: string): Promise<void>;
  stopAll(): Promise<void>;
}

export type PreviewErrorCode = AppCodeTaskError.APP_NOT_FOUND | AppCodeTaskError.SANDBOX_UNAVAILABLE;

/** 启动或访问开发预览失败。 */
export class PreviewError extends Error {
  constructor(
    readonly code: PreviewErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "PreviewError";
  }
}

/** 为客户端生成不包含临时端口的稳定预览路径。 */
export function createArtifactAppPreviewPath(appId: string): string {
  return `${ARTIFACT_APP_PREVIEW_PATH_PREFIX}/${encodeURIComponent(appId)}/`;
}
