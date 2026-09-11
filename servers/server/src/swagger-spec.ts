import z from "zod";

import { ListThreadMessagesRequestSchema } from "./mastra/types/bi-chat";
import {
  ReadWorkspaceFileRequestSchema,
  ReadWorkspaceFileResponseSchema,
  ScreenMetaSchema,
  SyncScreenDataRequestSchema,
  SyncScreenDataResponseSchema
} from "./mastra/types/bi-data-sync";
import {
  BatchByNodeIdsRequestSchema,
  CreateOrUpdateRequestSchema,
  FigmaNodeAssetPaginatedResponseSchema,
  FigmaNodeAssetSchema,
  SimplifyFigmaNodeDataRequestSchema,
  UpdateByIdRequestSchema,
  UploadImageRequestSchema
} from "./mastra/types/figma-node-asset";

const s = (schema: z.ZodTypeAny) => z.toJSONSchema(schema, { unrepresentable: "any" });

const err = {
  description: "错误",
  content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } }
};
const json = (schema: z.ZodTypeAny, description = "成功") => ({
  description,
  content: { "application/json": { schema: s(schema) } }
});

export const swaggerSpec = {
  openapi: "3.0.0",
  info: { title: "FunAI API", version: "1.0.0" },
  tags: [
    { name: "BI Chat", description: "AI 对话与线程管理" },
    { name: "BI Data Sync", description: "大屏数据同步" },
    { name: "Figma Node Assets", description: "Figma 节点资产管理" }
  ],
  paths: {
    // ── BI Chat ──────────────────────────────────────────────────────────────
    "/customApi/bi-chat": {
      post: {
        tags: ["BI Chat"],
        summary: "发起 AI 对话（流式）",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  messages: { type: "array" },
                  clientTools: { type: "object" },
                  threadId: { type: "string" },
                  resourceId: { type: "string" },
                  runId: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "流式 AI 响应" } }
      }
    },
    "/customApi/bi-chat/generate-title": {
      post: {
        tags: ["BI Chat"],
        summary: "生成对话标题",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { messages: { type: "array" }, threadId: { type: "string" } },
                required: ["threadId"]
              }
            }
          }
        },
        responses: { 200: { description: "标题生成响应" } }
      }
    },
    "/customApi/bi-chat/thread-messages": {
      post: {
        tags: ["BI Chat"],
        summary: "获取线程消息列表",
        requestBody: {
          required: true,
          content: { "application/json": { schema: s(ListThreadMessagesRequestSchema) } }
        },
        responses: {
          200: json(z.object({ messages: z.array(z.unknown()), threadId: z.string() }), "消息列表"),
          404: err,
          500: err
        }
      }
    },
    "/customApi/bi-chat/create-thread": {
      post: {
        tags: ["BI Chat"],
        summary: "创建对话线程",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { resourceId: { type: "string" }, title: { type: "string" } },
                required: ["resourceId"]
              }
            }
          }
        },
        responses: { 200: { description: "线程对象" }, 500: err }
      }
    },
    "/customApi/bi-chat/list-threads": {
      post: {
        tags: ["BI Chat"],
        summary: "获取线程列表",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { resourceId: { type: "string" } }, required: ["resourceId"] }
            }
          }
        },
        responses: { 200: { description: "线程列表" }, 500: err }
      }
    },
    "/customApi/bi-chat/update-thread": {
      post: {
        tags: ["BI Chat"],
        summary: "更新对话线程",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  threadId: { type: "string" },
                  title: { type: "string" },
                  resourceId: { type: "string" },
                  metadata: { type: "object" }
                },
                required: ["threadId", "title", "resourceId"]
              }
            }
          }
        },
        responses: { 200: { description: "更新后的线程" }, 404: err, 500: err }
      }
    },

    // ── BI Data Sync ─────────────────────────────────────────────────────────
    "/customApi/sync-global-data": {
      post: {
        tags: ["BI Data Sync"],
        summary: "同步全局数据",
        requestBody: { required: true, content: { "application/json": { schema: s(SyncScreenDataRequestSchema) } } },
        responses: { 200: json(SyncScreenDataResponseSchema, "同步成功"), 500: err }
      }
    },
    "/customApi/bi-data-sync/meta": {
      get: {
        tags: ["BI Data Sync"],
        summary: "读取屏幕元数据",
        parameters: [{ name: "id", in: "query", schema: { type: "string" } }],
        responses: { 200: json(ScreenMetaSchema.nullable(), "屏幕元数据"), 500: err }
      }
    },
    "/customApi/bi-data-sync/component": {
      get: {
        tags: ["BI Data Sync"],
        summary: "获取组件数据",
        parameters: [
          {
            name: "screenWithVersion",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "大屏标识，格式为 {screenId}_{versionCode}"
          },
          { name: "componentId", in: "query", required: true, schema: { type: "integer" } }
        ],
        responses: { 200: { description: "组件数据" }, 400: err, 404: err }
      }
    },
    "/customApi/bi-data-sync/workspace-file": {
      post: {
        tags: ["BI Data Sync"],
        summary: "读取工作区文件",
        requestBody: { required: true, content: { "application/json": { schema: s(ReadWorkspaceFileRequestSchema) } } },
        responses: { 200: json(ReadWorkspaceFileResponseSchema, "文件内容"), 404: err, 500: err }
      }
    },

    // ── Figma Node Assets ────────────────────────────────────────────────────
    "/customApi/figma-node-assets": {
      get: {
        tags: ["Figma Node Assets"],
        summary: "分页查询所有节点资产",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "fileKey", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: json(FigmaNodeAssetPaginatedResponseSchema, "分页结果") }
      },
      post: {
        tags: ["Figma Node Assets"],
        summary: "创建或更新节点资产",
        requestBody: { required: true, content: { "application/json": { schema: s(CreateOrUpdateRequestSchema) } } },
        responses: { 201: json(FigmaNodeAssetSchema, "创建成功") }
      }
    },
    "/customApi/figma-node-assets/upload": {
      post: {
        tags: ["Figma Node Assets"],
        summary: "上传图片",
        requestBody: { required: true, content: { "application/json": { schema: s(UploadImageRequestSchema) } } },
        responses: { 201: { description: "上传成功" } }
      }
    },
    "/customApi/figma-node-assets/download": {
      get: {
        tags: ["Figma Node Assets"],
        summary: "下载图片（二进制）",
        parameters: [
          { name: "nodeId", in: "query", schema: { type: "string" } },
          { name: "bucket", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "图片二进制数据" }, 404: err, 502: err }
      }
    },
    "/customApi/figma-node-assets/batch-by-node-ids": {
      post: {
        tags: ["Figma Node Assets"],
        summary: "批量查询节点资产",
        requestBody: { required: true, content: { "application/json": { schema: s(BatchByNodeIdsRequestSchema) } } },
        responses: { 200: { description: "批量结果" } }
      }
    },
    "/customApi/figma-node-assets/simplify-node-data": {
      post: {
        tags: ["Figma Node Assets"],
        summary: "简化 Figma 节点数据",
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: s(SimplifyFigmaNodeDataRequestSchema) } }
        },
        responses: { 200: { description: "简化结果" }, 400: err }
      }
    },
    "/customApi/figma-node-assets/by-node-id/{nodeId}": {
      get: {
        tags: ["Figma Node Assets"],
        summary: "按节点 ID 查询资产",
        parameters: [{ name: "nodeId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: json(FigmaNodeAssetSchema, "节点资产"), 404: err }
      }
    },
    "/customApi/figma-node-assets/{id}": {
      put: {
        tags: ["Figma Node Assets"],
        summary: "按 ID 更新节点资产",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: s(UpdateByIdRequestSchema) } } },
        responses: { 200: json(FigmaNodeAssetSchema, "更新成功"), 404: err }
      },
      delete: {
        tags: ["Figma Node Assets"],
        summary: "按 ID 删除节点资产",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "删除成功" }, 404: err }
      }
    }
  }
};
