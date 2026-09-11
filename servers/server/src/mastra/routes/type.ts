import { z } from "zod";

const PREFIX = "/customApi";
import { BiChatErrorSchema, ListThreadMessagesRequestSchema, ListThreadMessagesResponseSchema } from "../types/bi-chat";
import {
  ErrorSchema,
  GetComponentResponseSchema,
  ScreenMetaSchema,
  SyncScreenDataRequestSchema,
  SyncScreenDataResponseSchema
} from "../types/bi-data-sync";
import { ReadWorkspaceFileRequestSchema, ReadWorkspaceFileResponseSchema } from "../types/bi-data-sync";
import {
  BatchByNodeIdsRequestSchema,
  CreateOrUpdateRequestSchema,
  FigmaNodeAssetApiResponseSchema,
  FigmaNodeAssetPaginatedResponseSchema,
  FigmaNodeAssetSchema,
  SimplifyFigmaNodeDataRequestSchema,
  UpdateByIdRequestSchema,
  UploadImageRequestSchema
} from "../types/figma-node-asset";

// 简化 Figma 节点数据响应 schema
const SimplifyFigmaNodeDataResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
});

// BI Chat 路由定义
export const biChatRoutes = {
  chat: {
    path: `${PREFIX}/bi-chat` as const,
    requestSchema: z.any(), // 流式接口，使用 any
    responseSchema: z.any()
  },
  generateTitle: {
    path: `${PREFIX}/bi-chat/generate-title` as const,
    requestSchema: z.any(), // 流式接口，使用 any
    responseSchema: z.any()
  },
  listThreadMessages: {
    path: `${PREFIX}/bi-chat/thread-messages` as const,
    requestSchema: ListThreadMessagesRequestSchema,
    responseSchema: {
      200: ListThreadMessagesResponseSchema,
      400: BiChatErrorSchema,
      500: BiChatErrorSchema
    }
  }
} as const;

export const biDataSyncRoutes = {
  readScreenMeta: {
    path: `${PREFIX}/bi-data-sync/meta` as const,
    responseSchema: {
      200: ScreenMetaSchema.nullable(),
      500: ErrorSchema
    }
  },
  syncScreenData: {
    path: `${PREFIX}/sync-global-data` as const,
    requestSchema: SyncScreenDataRequestSchema,
    responseSchema: {
      200: SyncScreenDataResponseSchema,
      400: ErrorSchema,
      500: ErrorSchema
    }
  },
  getComponent: {
    path: `${PREFIX}/bi-data-sync/component` as const,
    responseSchema: {
      200: GetComponentResponseSchema,
      400: ErrorSchema,
      404: ErrorSchema
    }
  },
  readWorkspaceFile: {
    path: `${PREFIX}/bi-data-sync/workspace-file` as const,
    requestSchema: ReadWorkspaceFileRequestSchema,
    responseSchema: {
      200: ReadWorkspaceFileResponseSchema,
      400: ErrorSchema,
      404: ErrorSchema,
      500: ErrorSchema
    }
  }
} as const;

export const figmaNodeAssetRoutes = {
  uploadImage: {
    path: `${PREFIX}/figma-node-assets/upload` as const,
    requestSchema: UploadImageRequestSchema,
    responseSchema: {
      201: FigmaNodeAssetApiResponseSchema(FigmaNodeAssetSchema)
    }
  },
  downloadImage: {
    path: `${PREFIX}/figma-node-assets/download` as const,
    responseSchema: {
      200: z.any(),
      404: ErrorSchema,
      502: ErrorSchema
    }
  },
  batchByNodeIds: {
    path: `${PREFIX}/figma-node-assets/batch-by-node-ids` as const,
    requestSchema: BatchByNodeIdsRequestSchema,
    responseSchema: {
      200: FigmaNodeAssetApiResponseSchema(z.array(FigmaNodeAssetSchema))
    }
  },
  getByNodeId: {
    path: `${PREFIX}/figma-node-assets/by-node-id/:nodeId` as const,
    responseSchema: {
      200: FigmaNodeAssetApiResponseSchema(FigmaNodeAssetSchema),
      404: ErrorSchema
    }
  },
  listAll: {
    path: `${PREFIX}/figma-node-assets` as const,
    responseSchema: {
      200: FigmaNodeAssetApiResponseSchema(FigmaNodeAssetPaginatedResponseSchema)
    }
  },
  createOrUpdate: {
    path: `${PREFIX}/figma-node-assets` as const,
    requestSchema: CreateOrUpdateRequestSchema,
    responseSchema: {
      201: FigmaNodeAssetApiResponseSchema(FigmaNodeAssetSchema)
    }
  },
  updateById: {
    path: `${PREFIX}/figma-node-assets/:id` as const,
    requestSchema: UpdateByIdRequestSchema,
    responseSchema: {
      200: FigmaNodeAssetApiResponseSchema(FigmaNodeAssetSchema),
      404: ErrorSchema
    }
  },
  deleteById: {
    path: `${PREFIX}/figma-node-assets/:id` as const,
    responseSchema: {
      200: FigmaNodeAssetApiResponseSchema(z.null()),
      404: ErrorSchema
    }
  },
  // 新增：简化 Figma 节点数据接口
  simplifyNodeData: {
    path: `${PREFIX}/figma-node-assets/simplify-node-data` as const,
    requestSchema: SimplifyFigmaNodeDataRequestSchema,
    responseSchema: SimplifyFigmaNodeDataResponseSchema
  }
} as const;
