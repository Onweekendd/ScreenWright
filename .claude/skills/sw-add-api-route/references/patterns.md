# Mocean 后端接口代码模式参考

目录：
- [Schema 模式](#schema-模式)
- [业务逻辑模式](#业务逻辑模式)
- [路由处理器模式](#路由处理器模式)
- [客户端模式](#客户端模式)

---

## Schema 模式

文件：`packages/mastra/src/mastra/schema/xxx.ts`

```typescript
import { z } from "zod";
import { XxxSchema } from "generated/prisma/zod"; // Prisma 自动生成

// Response Schema - 基于 Prisma Schema 扩展关联数据
export const XxxWithRelationsSchema = XxxSchema.extend({
  relatedModel: RelatedSchema.partial().nullish()
});

// Response Schema 数组版
export const XxxWithRelationsArraySchema = z.array(XxxWithRelationsSchema);

// Request Schema - 创建（必填字段）
export const createXxxSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string().nullish().optional(),
  modelId: z.string().nullable().optional(),
  enabled: z.boolean().optional().default(true)
});

// Request Schema - 更新（所有字段可选）
export const updateXxxSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullish().optional(),
  modelId: z.string().nullable().optional(),
  enabled: z.boolean().optional()
});

// 路由参数 Schema
export const xxxIdParamSchema = z.object({
  xxxId: z.string().min(1, "ID 不能为空")
});

// TypeScript 类型导出
export type CreateXxxInputType = z.infer<typeof createXxxSchema>;
export type UpdateXxxInputType = z.infer<typeof updateXxxSchema>;
```

---

## 业务逻辑模式

文件：`packages/mastra/src/mastra/server/xxx.ts`

```typescript
import { prisma } from "./index";
import type { CreateXxxInputType, UpdateXxxInputType } from "../schema/xxx";
import {
  XxxSchema,
  XxxWithRelationsSchema,
  XxxWithRelationsArraySchema
} from "../schema/xxx";
import { xxxRoutes } from "../router/type";

// GET 列表
const getXxxList = async (): Promise<
  z.infer<(typeof xxxRoutes)["getXxxList"]["responseSchema"]>
> => {
  const items = await prisma.xxx.findMany({
    include: { model: true, settings: true }
  });
  return XxxWithRelationsArraySchema.parse(items);
};

// GET 单个
const getXxxById = async (
  id: string
): Promise<z.infer<(typeof xxxRoutes)["getXxxById"]["responseSchema"]>> => {
  const item = await prisma.xxx.findUnique({
    where: { id },
    include: { model: true }
  });
  return item ? XxxWithRelationsSchema.parse(item) : null;
};

// POST 创建
const createXxx = async (
  data: CreateXxxInputType
): Promise<z.infer<(typeof xxxRoutes)["createXxx"]["responseSchema"]>> => {
  const item = await prisma.xxx.create({
    data: {
      name: data.name,
      description: data.description,
      // ... 映射其他字段
    },
    include: { model: true }
  });
  return XxxWithRelationsSchema.parse(item);
};

// PUT 更新 - 必须过滤 undefined 字段
const updateXxx = async (
  id: string,
  data: UpdateXxxInputType
): Promise<z.infer<(typeof xxxRoutes)["updateXxx"]["responseSchema"]>> => {
  const updateData = {
    updatedAt: new Date(),
    ...Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )
  };
  const item = await prisma.xxx.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.xxx.update>[0]["data"],
    include: { model: true }
  });
  return XxxWithRelationsSchema.parse(item);
};

// DELETE
const deleteXxx = async (
  id: string
): Promise<z.infer<(typeof xxxRoutes)["deleteXxx"]["responseSchema"]>> => {
  const item = await prisma.xxx.delete({ where: { id } });
  return XxxSchema.parse(item);
};

// 流式接口示例（调用 Mastra agent）
const streamXxx = async (xxxId: string): Promise<Response> => {
  const agent = mastra.getAgent("DynamicAgent");
  const result = await agent.generate(
    [{ role: "user", content: `处理 ${xxxId}` }],
    { onFinish: async (text) => { /* 完成后回调 */ } }
  );
  return result.toDataStreamResponse();
};

export { getXxxList, getXxxById, createXxx, updateXxx, deleteXxx, streamXxx };
```

---

## 路由处理器模式

文件：`servers/server/src/mastra/routes/xxx.route.ts`

规则：
- 文件顶部提取各接口的 `responseSchema` 引用，handler 内引用而非重复写
- `openapi.responses` 的每个状态码都用 `responseSchema[N]` 声明，加 `@ts-expect-error`
- handler 统一用 try/catch 捕获错误：Zod 校验（`"issues" in e`）→ 400，资源不存在 → 404，其他 → 500

```typescript
import { registerApiRoute } from "@mastra/core/server";
import { HTTPException } from "hono/http-exception";

import { xxxRoutes } from "./type";
import { xxxIdParamSchema } from "../types/xxx";
import { getXxxList, getXxxById, createXxx, updateXxx, deleteXxx, streamXxx } from "../services/xxx";

// 提取 responseSchema 引用（避免在每个 openapi 块内重复写路径）
const { responseSchema: listResSchema } = xxxRoutes.getXxxList;
const { responseSchema: getResSchema } = xxxRoutes.getXxxById;
const { responseSchema: createResSchema } = xxxRoutes.createXxx;
const { responseSchema: updateResSchema } = xxxRoutes.updateXxx;
const { responseSchema: deleteResSchema } = xxxRoutes.deleteXxx;

// --- GET 列表（无参数）---
const getXxxListRoute = registerApiRoute(xxxRoutes.getXxxList.path, {
  method: "GET",
  openapi: {
    summary: "获取 Xxx 列表",
    tags: ["Xxx"],
    responses: {
      200: {
        description: "返回 Xxx 列表",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: listResSchema[200]
          }
        }
      },
      500: {
        description: "服务器内部错误",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: listResSchema[500]
          }
        }
      }
    }
  },
  handler: async (c) => {
    try {
      return c.json(await getXxxList());
    } catch (e) {
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "获取失败"
      });
    }
  }
});

// --- GET 单个（含路由参数）---
const getXxxByIdRoute = registerApiRoute(xxxRoutes.getXxxById.path, {
  method: "GET",
  openapi: {
    summary: "获取单个 Xxx",
    tags: ["Xxx"],
    responses: {
      200: {
        description: "返回 Xxx 详情",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: getResSchema[200]
          }
        }
      },
      404: {
        description: "不存在",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: getResSchema[404]
          }
        }
      }
    }
  },
  handler: async (c) => {
    try {
      const { xxxId } = xxxIdParamSchema.parse({ xxxId: c.req.param("xxxId") });
      return c.json(await getXxxById(xxxId));
    } catch (e) {
      throw new HTTPException(404, {
        message: e instanceof Error ? e.message : "未知错误"
      });
    }
  }
});

// --- POST 创建（含 requestBody）---
const createXxxRoute = registerApiRoute(xxxRoutes.createXxx.path, {
  method: "POST",
  openapi: {
    summary: "创建 Xxx",
    tags: ["Xxx"],
    requestBody: {
      content: {
        "application/json": {
          // @ts-expect-error hono-openapi requestBody schema type doesn't support ZodSchema
          schema: xxxRoutes.createXxx.requestSchema
        }
      }
    },
    responses: {
      200: {
        description: "创建成功",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: createResSchema[200]
          }
        }
      },
      400: {
        description: "请求参数校验失败",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: createResSchema[400]
          }
        }
      },
      500: {
        description: "服务器内部错误",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: createResSchema[500]
          }
        }
      }
    }
  },
  handler: async (c) => {
    try {
      const body = xxxRoutes.createXxx.requestSchema.parse(await c.req.json());
      return c.json(await createXxx(body));
    } catch (e) {
      if (e instanceof Error && "issues" in e) {
        throw new HTTPException(400, { message: e.message });
      }
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "创建失败"
      });
    }
  }
});

// --- PUT 更新（路由参数 + requestBody）---
const updateXxxRoute = registerApiRoute(xxxRoutes.updateXxx.path, {
  method: "PUT",
  openapi: {
    summary: "更新 Xxx",
    tags: ["Xxx"],
    requestBody: {
      content: {
        "application/json": {
          // @ts-expect-error hono-openapi requestBody schema type doesn't support ZodSchema
          schema: xxxRoutes.updateXxx.requestSchema
        }
      }
    },
    responses: {
      200: {
        description: "更新成功",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: updateResSchema[200]
          }
        }
      },
      400: {
        description: "请求参数校验失败",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: updateResSchema[400]
          }
        }
      },
      500: {
        description: "服务器内部错误",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: updateResSchema[500]
          }
        }
      }
    }
  },
  handler: async (c) => {
    try {
      const { xxxId } = xxxIdParamSchema.parse({ xxxId: c.req.param("xxxId") });
      const body = xxxRoutes.updateXxx.requestSchema.parse(await c.req.json());
      return c.json(await updateXxx(xxxId, body));
    } catch (e) {
      if (e instanceof Error && "issues" in e) {
        throw new HTTPException(400, { message: e.message });
      }
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "更新失败"
      });
    }
  }
});

// --- DELETE（含路由参数）---
const deleteXxxRoute = registerApiRoute(xxxRoutes.deleteXxx.path, {
  method: "DELETE",
  openapi: {
    summary: "删除 Xxx",
    tags: ["Xxx"],
    responses: {
      200: {
        description: "删除成功",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: deleteResSchema[200]
          }
        }
      },
      500: {
        description: "服务器内部错误",
        content: {
          "application/json": {
            // @ts-expect-error hono-openapi response schema type doesn't support ZodSchema
            schema: deleteResSchema[500]
          }
        }
      }
    }
  },
  handler: async (c) => {
    try {
      const { xxxId } = xxxIdParamSchema.parse({ xxxId: c.req.param("xxxId") });
      return c.json(await deleteXxx(xxxId));
    } catch (e) {
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "删除失败"
      });
    }
  }
});

// --- 流式接口（POST，直接 return Response，不包 c.json）---
const streamXxxRoute = registerApiRoute(xxxRoutes.streamXxx.path, {
  method: "POST",
  openapi: {
    summary: "流式处理 Xxx",
    tags: ["Xxx"],
    requestBody: {
      content: {
        "application/json": {
          // @ts-expect-error hono-openapi requestBody schema type doesn't support ZodSchema
          schema: xxxRoutes.streamXxx.requestSchema
        }
      }
    },
    responses: {
      200: { description: "流式响应", content: { "application/json": { schema: { type: "string" } } } }
    }
  },
  handler: async (c) => {
    try {
      const { xxxId } = xxxRoutes.streamXxx.requestSchema.parse(await c.req.json());
      return streamXxx(xxxId); // 直接 return，不包 c.json()
    } catch (e) {
      if (e instanceof Error && "issues" in e) {
        throw new HTTPException(400, { message: e.message });
      }
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "流式处理失败"
      });
    }
  }
});

// 导出路由数组（新路由加入此数组）
export const xxxApiRoutes = [
  getXxxListRoute,
  getXxxByIdRoute,
  createXxxRoute,
  updateXxxRoute,
  deleteXxxRoute,
  streamXxxRoute
];
```

---

## 客户端模式

文件：`packages/mastra/src/mastra/api/xxx-client.ts`

**四处必须同步，顺序：class → apiMethods → UseReturn type → useHook**

`ApiResponse` 是判别联合类型，需传入两个泛型：
- `RouteSuccess<T>` — 提取 `responseSchema[200]` 类型
- `RouteError<T>` — 提取所有非 200 状态码类型的联合

```typescript
import { xxxRoutes } from "../router/type";
import type { CreateXxxInputType, UpdateXxxInputType } from "../schema/xxx";
import type { ApiClientConfig, ApiResponse, RouteError, RouteSuccess } from "./base-client";
import { BaseApiClient } from "./base-client";

// ==================== 1. Class 方法 ====================

export class XxxApiClient extends BaseApiClient {
  constructor(config: ApiClientConfig = {}) {
    super(config);
  }

  // GET 列表
  async getXxxList(): Promise<
    ApiResponse<
      RouteSuccess<typeof xxxRoutes.getXxxList.responseSchema>,
      RouteError<typeof xxxRoutes.getXxxList.responseSchema>
    >
  > {
    return this.get(xxxRoutes.getXxxList.path);
  }

  // GET 单个（路由参数替换）
  async getXxxById(xxxId: string): Promise<
    ApiResponse<
      RouteSuccess<typeof xxxRoutes.getXxxById.responseSchema>,
      RouteError<typeof xxxRoutes.getXxxById.responseSchema>
    >
  > {
    return this.get(xxxRoutes.getXxxById.path.replace(":xxxId", xxxId));
  }

  // POST 创建
  async createXxx(data: CreateXxxInputType): Promise<
    ApiResponse<
      RouteSuccess<typeof xxxRoutes.createXxx.responseSchema>,
      RouteError<typeof xxxRoutes.createXxx.responseSchema>
    >
  > {
    return this.post(xxxRoutes.createXxx.path, data);
  }

  // PUT 更新（路由参数替换）
  async updateXxx(xxxId: string, data: UpdateXxxInputType): Promise<
    ApiResponse<
      RouteSuccess<typeof xxxRoutes.updateXxx.responseSchema>,
      RouteError<typeof xxxRoutes.updateXxx.responseSchema>
    >
  > {
    return this.put(xxxRoutes.updateXxx.path.replace(":xxxId", xxxId), data);
  }

  // DELETE
  async deleteXxx(xxxId: string): Promise<
    ApiResponse<
      RouteSuccess<typeof xxxRoutes.deleteXxx.responseSchema>,
      RouteError<typeof xxxRoutes.deleteXxx.responseSchema>
    >
  > {
    return this.delete(xxxRoutes.deleteXxx.path.replace(":xxxId", xxxId));
  }

  // 流式接口（返回原始 Response）
  async streamXxx({ xxxId }: { xxxId: string }): Promise<Response> {
    return this.postStream(xxxRoutes.streamXxx.path, { xxxId });
  }
}

// ==================== 2. 单例 + apiMethods ====================

export const xxxApi = new XxxApiClient();

export const xxxApiMethods = {
  getXxxList: () => xxxApi.getXxxList(),
  getXxxById: (xxxId: string) => xxxApi.getXxxById(xxxId),
  createXxx: (data: CreateXxxInputType) => xxxApi.createXxx(data),
  updateXxx: (xxxId: string, data: UpdateXxxInputType) =>
    xxxApi.updateXxx(xxxId, data),
  deleteXxx: (xxxId: string) => xxxApi.deleteXxx(xxxId),
  streamXxx: ({ xxxId }: { xxxId: string }) => xxxApi.streamXxx({ xxxId })
};

// ==================== 3. UseReturn type ====================

export type UseXxxApiReturn = Pick<
  XxxApiClient,
  | "getXxxList"
  | "getXxxById"
  | "createXxx"
  | "updateXxx"
  | "deleteXxx"
  | "streamXxx"
>;

// ==================== 4. useXxxApi Hook ====================

export const useXxxApi = (): UseXxxApiReturn => {
  return {
    getXxxList: xxxApi.getXxxList.bind(xxxApi) as UseXxxApiReturn["getXxxList"],
    getXxxById: xxxApi.getXxxById.bind(xxxApi) as UseXxxApiReturn["getXxxById"],
    createXxx: xxxApi.createXxx.bind(xxxApi) as UseXxxApiReturn["createXxx"],
    updateXxx: xxxApi.updateXxx.bind(xxxApi) as UseXxxApiReturn["updateXxx"],
    deleteXxx: xxxApi.deleteXxx.bind(xxxApi) as UseXxxApiReturn["deleteXxx"],
    streamXxx: xxxApi.streamXxx.bind(xxxApi) as UseXxxApiReturn["streamXxx"]
  };
};
```
