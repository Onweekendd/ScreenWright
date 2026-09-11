import { z } from "zod";

/** 大屏列表查询（对齐前端 ScreenReq） */
export const ScreenListReqSchema = z.object({
  current: z.number().default(1),
  size: z.number().default(10),
  name: z.string().nullable().optional(),
  groupId: z.coerce.number().optional(),
  stockType: z.number().optional(),
  belong: z.number().optional(),
  status: z.boolean().optional()
});

/** 新增大屏（请求体较宽松，passthrough 接收前端扩展字段） */
export const ScreenSaveSchema = z
  .object({
    name: z.string().min(1, "大屏名称不能为空"),
    groupId: z.coerce.number().optional(),
    type: z.number().optional(),
    stockType: z.number().optional(),
    password: z.string().optional(),
    versionCode: z.union([z.string(), z.null()]).optional(),
    config: z.any().optional(),
    detail: z.any().optional()
  })
  .passthrough();

/** 更新大屏（必含 id） */
export const ScreenUpdateSchema = z
  .object({
    id: z.coerce.number().int(),
    name: z.string().optional(),
    groupId: z.coerce.number().optional(),
    type: z.number().optional(),
    stockType: z.number().optional(),
    status: z.boolean().optional(),
    password: z.union([z.string(), z.null()]).optional(),
    backgroundUrl: z.union([z.string(), z.null()]).optional(),
    sceneInfo: z.union([z.string(), z.null()]).optional(),
    minioIds: z.any().optional(),
    dataFilterArr: z.any().optional(),
    aniFrameSet: z.any().optional(),
    encodedControl: z.any().optional(),
    statusAnimation: z.any().optional(),
    publishInfo: z.union([z.string(), z.null()]).optional(),
    versionCode: z.union([z.string(), z.null()]).optional(),
    versionDesc: z.union([z.string(), z.null()]).optional(),
    config: z.any().optional(),
    detail: z.any().optional()
  })
  .passthrough();

/** 分组新增 */
export const LargeGroupSaveSchema = z
  .object({
    name: z.string().min(1, "分组名称不能为空"),
    type: z.number().optional(),
    sort: z.number().optional()
  })
  .passthrough();

/** 分组更新 */
export const LargeGroupUpdateSchema = z
  .object({
    id: z.coerce.number().int(),
    name: z.string().optional(),
    type: z.number().optional(),
    sort: z.number().optional()
  })
  .passthrough();

export const IdParamSchema = z.object({ id: z.coerce.number().int() });

export type ScreenListReq = z.infer<typeof ScreenListReqSchema>;
export type ScreenSaveReq = z.infer<typeof ScreenSaveSchema>;
export type ScreenUpdateReq = z.infer<typeof ScreenUpdateSchema>;
export type LargeGroupSaveReq = z.infer<typeof LargeGroupSaveSchema>;
export type LargeGroupUpdateReq = z.infer<typeof LargeGroupUpdateSchema>;
