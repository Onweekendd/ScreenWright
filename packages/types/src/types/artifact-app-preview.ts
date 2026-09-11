/** Artifact 应用的预览环境。 */
export type ArtifactAppPreviewMode = "development" | "published";

/** Artifact 应用预览组件的业务配置。 */
export interface ArtifactAppPreviewOption {
  /** Artifact 应用唯一标识。 */
  appId: string;
  /** 是否允许用户操作 iframe 中的应用。 */
  allowInteraction: boolean;
  /** 当前展示开发环境还是已发布环境。 */
  previewMode: ArtifactAppPreviewMode;
  /** 是否展示预览环境与加载状态。 */
  showStatus: boolean;
}

/** 预览组件不消费低代码数据源。 */
export type ArtifactAppPreviewData = [];
