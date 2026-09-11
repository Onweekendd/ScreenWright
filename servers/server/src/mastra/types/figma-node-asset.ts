import { z } from "zod";

export const FigmaNodeAssetSchema = z.object({
  id: z.string(),
  fileKey: z.string(),
  nodeId: z.string(),
  nodeName: z.string().nullable(),
  bucket: z.string(),
  objectKey: z.string(),
  url: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSize: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type FigmaNodeAsset = z.infer<typeof FigmaNodeAssetSchema>;

export const UploadImageRequestSchema = z.object({
  nodeId: z.string(),
  nodeName: z.string().optional(),
  fileKey: z.string(),
  bytes: z.array(z.number())
});

export const BatchByNodeIdsRequestSchema = z.object({
  nodeIds: z.array(z.string())
});

export const CreateOrUpdateRequestSchema = z.object({
  fileKey: z.string(),
  nodeId: z.string(),
  nodeName: z.string().optional(),
  bucket: z.string(),
  objectKey: z.string(),
  url: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional()
});

export const UpdateByIdRequestSchema = z.object({
  nodeName: z.string().optional(),
  bucket: z.string().optional(),
  objectKey: z.string().optional(),
  url: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional()
});

// 新增：Figma 节点数据简化请求 schema
export const SimplifyFigmaNodeDataRequestSchema = z.object({
  nodeId: z.string(),
  fileKey: z.string(),
  nodeName: z.string().optional(),
  figmaData: z.any()
});

// 新增：Figma 节点数据简化响应 schema
export const SimplifyFigmaNodeDataResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
});

// Path parameter schemas
export const NodeIdParamSchema = z.object({
  nodeId: z.string()
});

export const IdParamSchema = z.object({
  id: z.string()
});

export const FigmaNodeAssetApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema
  });

export const FigmaNodeAssetPaginatedResponseSchema = z.object({
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  list: z.array(FigmaNodeAssetSchema)
});
