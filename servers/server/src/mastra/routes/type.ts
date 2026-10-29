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
