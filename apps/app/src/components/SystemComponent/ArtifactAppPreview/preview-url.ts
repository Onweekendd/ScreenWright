export interface ResolveArtifactPreviewUrlInput {
  readonly appId: string;
  readonly ScreenwrightBaseUrl: string;
  readonly previewMode: "development" | "published";
}

const ALLOWED_PREVIEW_PROTOCOLS = new Set(["http:", "https:"]);
const APP_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/**
 * 根据 Screenwright 服务地址和 appId 生成可供 iframe 使用的开发预览地址。
 *
 * 临时 Vite 端口只由 Screenwright PreviewManager 管理，不进入客户端组件配置。
 */
export function resolveArtifactPreviewUrl(input: ResolveArtifactPreviewUrlInput): string | null {
  const appId = input.appId.trim();
  if (input.previewMode !== "development" || !APP_ID_PATTERN.test(appId)) {
    return null;
  }

  try {
    const resolvedUrl = new URL(input.ScreenwrightBaseUrl);
    if (!ALLOWED_PREVIEW_PROTOCOLS.has(resolvedUrl.protocol)) {
      return null;
    }

    resolvedUrl.pathname = `/artifact-apps/${encodeURIComponent(appId)}/`;
    resolvedUrl.search = "";
    resolvedUrl.hash = "";
    return resolvedUrl.href;
  } catch {
    return null;
  }
}
