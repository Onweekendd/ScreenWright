import type { AllComponentType, ComponentType } from "@screenwright/types";
import {
  AniFrameSetParsedSchema,
  ComponentSchema,
  FilterSchema,
  LargeScreenDetailInfoSchema,
  StatusAnimationResponseParsedSchema
} from "@screenwright/types/schemas";
import { z } from "zod";

// ============================================
// 导出类型和枚举
// ============================================

export type { AllComponentType, ComponentType };

export { ComponentSchema };

// ============================================
// Token Usage Schema
// ============================================

export const tokenUsageSchema = z
  .record(
    z.string(),
    z.array(
      z.object({
        inputTokens: z.number().describe("输入 token 数量"),
        outputTokens: z.number().describe("输出 token 数量"),
        modelId: z.string().describe("模型Id")
      })
    )
  )
  .default({})
  .describe("各步骤的 token 使用统计");

export type TokenUsage = z.infer<typeof tokenUsageSchema>;

export type SingleModelTokenUsage = z.infer<typeof tokenUsageSchema>[0][0];

// ============================================
// View Option Schema (匹配 view.js 的结构)
// ============================================

/**
 * View Option Schema
 * @description 对应 view.js 中的 option 对象结构
 */
export const ViewOptionSchema = z
  .object({
    /** 动画帧设置 */
    aniFrameSet: AniFrameSetParsedSchema,
    /** 数据过滤数组 */
    dataFilterArr: z
      .record(z.string().describe("过滤器ID"), FilterSchema)
      .describe("数据过滤数组：已解析的数据过滤配置对象"),
    /** 详细配置信息 */
    detail: LargeScreenDetailInfoSchema,
    /** 组件数组 */
    component: z.array(ComponentSchema).describe("组件数组"),
    /** 编码控制 */
    encodedControl: z.array(z.string()).nullable().describe("编码控制"),
    /** 配置信息数组 */
    config: z.array(z.string()).describe("配置信息数组"),
    /** 状态动画 */
    statusAnimation: StatusAnimationResponseParsedSchema
  })
  .catchall(z.any())
  .describe("View Option 配置对象");

export type ViewOption = z.infer<typeof ViewOptionSchema>;

// ============================================
// 导出大屏相关 Schema
// ============================================

export enum StateKeyEnum {
  NODE_ANNOTATIONS = "node-annotations",
  NODE_CLASSIFICATIONS = "node-classifications",
  COMPONENT_CONVERSIONS = "component-conversions",
  TOKEN_USAGES = "token-usages",
  IMAGE_CANDIDATES = "image-candidates",
  FLATTENED_NODES = "flattened-nodes",
  FRAME_MERGE = "frame-merge",
  SUBTABS_RECOGNITION = "subtabs-recognition",
  TODO = "todo"
}

/**
 * 工作流步骤 ID 枚举
 *
 * 集中管理所有步骤的 ID，确保 ID 的一致性和可维护性
 * 所有步骤文件应该使用这些枚举值作为 id 字段的值
 */
export enum StepEnum {
  /** 生成工作流唯一 ID */
  GENERATE_WORKFLOW_ID = "generate-workflow-id",

  /** 解析用户输入，提取 Figma fileKey 和 nodeId */
  PARSE_FIGMA_URL = "parse-figma-url",

  /** 获取 Figma 设计文件的节点数据 */
  FETCH_FIGMA = "fetch-figma",

  /** 从 MinIO 取图并调用 Codia image_to_design，产出 Codia data */
  CODIA_IMAGE_TO_DESIGN = "codia-image-to-design",

  /** 把 Codia data 引用的 CDN 图片转存到 MinIO，并就地替换 URL */
  CODIA_UPLOAD_IMAGES = "codia-upload-images",

  /** 数据预处理：处理多状态节点、面板合并、跨 frame 去重 */
  DATA_PROCESSOR = "data-processor",

  /** 从 Figma 下载图片资源到本地 */
  FIGMA_DOWNLOAD_IMAGES = "figma-download-images",

  RULE_BASED_CLASSIFICATION = "rule-based-classification",

  /** 解析图片资源：从 FigmaNodeAsset 数据库查询并匹配到节点（合并了图片下载和匹配逻辑） */
  RESOLVE_IMAGES = "resolve-images",

  /** 将下载的图片匹配到对应的 Figma 节点 */
  MATCH_IMAGES = "match-images",

  /** 解析 Figma 节点的样式引用 */
  RESOLVE_STYLES = "resolve-styles",

  /** 解析 Figma 节点的布局引用，并将相对位置转换为绝对位置 */
  NORMALIZE_LAYOUT = "normalize-layout",

  /** 将 Codia VisualElement Schema 适配为 NormalizedNode（用 yoga 解算相对布局） */
  CODIA_TO_NORMALIZED = "codia-to-normalized",

  /** 将 Codia 布局容器展开为语义重建使用的原子 NormalizedNode */
  CODIA_TO_ATOMIC_NORMALIZED = "codia-to-atomic-normalized",

  /** 使用视觉模型识别大屏一级区域 */
  ANALYZE_SCREEN_REGIONS = "analyze-screen-regions",

  /** 将 Codia 原子节点分配到一级区域，并为细粒度识别准备任务 */
  ASSIGN_NODES_TO_REGIONS = "assign-nodes-to-regions",

  /** 使用视觉模型识别单个区域内部的一层功能分组 */
  ANALYZE_REGION_GROUPS = "analyze-region-groups",

  /** 校验语义分析结果并重建 DynamicPanel / Group 节点树 */
  REBUILD_SEMANTIC_CONTAINERS = "rebuild-semantic-containers",

  /** 对归一化节点树进行 BFS 广度优先遍历 */
  BFS_TRAVERSAL = "bfs-traversal",

  /** 将分类后的节点转换为低代码组件 */
  NODE_CONVERT = "node-convert-step",

  NODE_CONVERT_TO_BI = "node-convert-to-bi-step",

  /** 输出所有转换后的组件和统计信息 */
  OUTPUT = "output-step"
}

// ============================================
// 后端数据结构 Schema
// ============================================

/**
 * Layer item Schema (后端图层数据结构)
 */
export const LayerItemSchema = z
  .object({
    moduleId: z.number().optional(),
    largeId: z.number(),
    config: z.string().describe("JSON 字符串"),
    minioIds: z.string(),
    dataJson: z.string(),
    versionCode: z.string(),
    createdBy: z.string(),
    createdTime: z.number(),
    updatedBy: z.string(),
    updatedTime: z.number(),
    id: z.number(),
    userId: z.number()
  })
  .describe("图层数据结构");

export type LayerItem = z.infer<typeof LayerItemSchema>;

/**
 * LargeScreenInfo Schema (后端大屏信息结构)
 */
export const LargeScreenInfoDtoSchema = z
  .object({
    config: z.string().describe("JSON 字符串数组"),
    name: z.string(),
    detail: z.string().describe("JSON 字符串"),
    sceneInfo: z.string(),
    type: z.number(),
    stockType: z.number(),
    groupId: z.number(),
    invitationCode: z.string(),
    status: z.boolean(),
    sort: z.number(),
    versionCode: z.string(),
    minioIds: z.string().describe("JSON 字符串数组"),
    dataFilterArr: z.string().describe("JSON 字符串对象"),
    aniFrameSet: z.string().describe("JSON 字符串"),
    statusAnimation: z.string().describe("JSON 字符串"),
    createdBy: z.string(),
    createdTime: z.number(),
    updatedBy: z.string(),
    updatedTime: z.number(),
    id: z.number(),
    userId: z.number()
  })
  .describe("大屏信息结构");

export type LargeScreenInfoDto = z.infer<typeof LargeScreenInfoDtoSchema>;

/**
 * LargeScreenConfig Schema (后端大屏配置结构)
 */
export const LargeScreenConfigDtoSchema = z
  .object({
    largeId: z.number(),
    config: z.string(),
    detail: z.string(),
    dataFilterArr: z.string(),
    aniFrameSet: z.string(),
    statusAnimation: z.string(),
    sceneInfo: z.string(),
    status: z.boolean(),
    minioIds: z.string(),
    versionCode: z.string(),
    createdBy: z.string(),
    createdTime: z.number(),
    updatedBy: z.string(),
    updatedTime: z.number(),
    id: z.number(),
    userId: z.number()
  })
  .describe("大屏配置结构");

export type LargeScreenConfigDto = z.infer<typeof LargeScreenConfigDtoSchema>;

/**
 * Package large screen Schema (完整的大屏导出结构)
 */
export const PackageLargeScreenSchema = z
  .object({
    largeScreenInfo: LargeScreenInfoDtoSchema.describe("大屏信息"),
    largeScreenConfig: LargeScreenConfigDtoSchema.describe("大屏配置"),
    layersList: z.array(LayerItemSchema).describe("图层数据列表")
  })
  .describe("完整的大屏导出结构");

export type PackageLargeScreen = z.infer<typeof PackageLargeScreenSchema>;
