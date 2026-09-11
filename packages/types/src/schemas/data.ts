import { z } from "zod";

import type { Callback, DataRemark, DataSourceType, DataType, ListenArg } from "../types";

// ============================================
// Data Schemas
// ============================================

/** 数据类型枚举 Schema */
export const DataTypeSchema: z.ZodSchema<DataType> = z.enum({
  /** 静态数据 */
  STATIC: 0,
  /** SQL数据库查询 */
  SQL: 1,
  /** CSV文件数据 */
  CSV: 3,
  /** API接口请求 */
  API: 2,
  /** WebSocket实时数据 */
  WEBSOCKET: 4,
  /** 物联网设备数据 */
  IOT: 5
});

/** 监听参数 Schema */
export const ListenArgSchema: z.ZodSchema<ListenArg> = z.object({
  /** 过滤器名称 */
  filterName: z.string().describe("过滤器名称"),
  /** 过滤器是否启用 */
  usageStatus: z.boolean().describe("过滤器是否启用"),
  /** 回调字段列表 */
  callbackFields: z.array(z.string().describe("回调字段")),
  /** 过滤器类型（可选） */
  filterType: z.boolean().describe("过滤器类型").optional()
});

/** 回调参数 Schema */
export const CallbackSchema: z.ZodSchema<Callback> = z.object({
  /** 回调唯一标识符 */
  id: z.string().describe("回调唯一标识符"),
  /** 回调名称 */
  name: z.string().describe("回调名称"),
  /** 回调类型 */
  type: z.string().describe("回调类型"),
  /** 回调方法 */
  method: z.string().describe("回调方法"),
  /** 回调值配置，包含源字段和目标变量 */
  value: z
    .object({
      /** 原始字段值配置 */
      origin: z.object({
        /** 显示名称 */
        displayName: z.literal("字段值").describe("显示名称"),
        /** 输入类型 */
        type: z.literal("input").describe("输入类型"),
        /** 字段值 */
        value: z.string().describe("字段值")
      }),
      /** 目标变量配置 */
      target: z.object({
        /** 显示名称 */
        displayName: z.literal("变量名").describe("显示名称"),
        /** 输入类型 */
        type: z.literal("input").describe("输入类型"),
        /** 变量名 */
        value: z.string().describe("变量名")
      })
    })
    .describe("回调值配置，包含源字段和目标变量")
});

/** 统一数据源类型 Schema */
export const DataSourceTypeSchema: z.ZodSchema<DataSourceType> = z.union([
  z
    .object({
      /** 创建人 */
      createdBy: z.string().describe("创建人"),
      /** 创建时间 */
      createdTime: z.string().describe("创建时间"),
      /** 更新人 */
      updatedBy: z.string().describe("更新人"),
      /** 更新时间 */
      updatedTime: z.string().describe("更新时间"),
      /** 数据库项ID */
      id: z.number().describe("数据库项ID"),
      /** 用户ID */
      userId: z.number().describe("用户ID"),
      /** 数据库名称 */
      name: z.string().describe("数据库名称"),
      /** 数据库描述 */
      description: z.string().describe("数据库描述"),
      /** 数据库类型 */
      type: z.string().describe("数据库类型"),
      /** 数据库连接URL */
      url: z.string().describe("数据库连接URL"),
      /** 数据组ID（可选） */
      dataGroupId: z.number().describe("数据组ID").nullable(),
      /** 文件名 */
      fileName: z.string().describe("文件名"),
      /** 文件大小 */
      size: z.number().describe("文件大小"),
      /** 字符集名称 */
      charsetName: z.string().describe("字符集名称"),
      /** 图层ID列表 */
      layerIds: z.string().describe("图层ID列表"),
      /** 配置信息（可选） */
      config: z.string().describe("配置信息").optional()
    })
    .describe("数据库项类型"),
  z
    .object({
      /** 创建人 */
      createdBy: z.string().describe("创建人"),
      /** 创建时间 */
      createdTime: z.string().describe("创建时间"),
      /** 更新人 */
      updatedBy: z.string().describe("更新人"),
      /** 更新时间 */
      updatedTime: z.string().describe("更新时间"),
      /** 物联地址ID */
      id: z.number().describe("物联地址ID"),
      /** 用户ID */
      userId: z.number().describe("用户ID"),
      /** 数据组ID（可选） */
      dataGroupId: z.number().describe("数据组ID").nullable(),
      /** 名称 */
      name: z.string().describe("名称"),
      /** 描述 */
      description: z.string().describe("描述"),
      /** 类型 */
      type: z.string().describe("类型"),
      /** 目标IP地址 */
      desIp: z.string().describe("目标IP地址"),
      /** 目标端口 */
      desPort: z.number().describe("目标端口"),
      /** 本地端口 */
      localPort: z.number().describe("本地端口"),
      /** 字符集名称 */
      charsetName: z.string().describe("字符集名称"),
      /** 图层ID列表 */
      layerIds: z.array(z.number().describe("图层ID"))
    })
    .describe("物联地址类型"),
  z
    .object({
      /** 创建人 */
      createdBy: z.string().describe("创建人"),
      /** 创建时间 */
      createdTime: z.string().describe("创建时间"),
      /** 更新人 */
      updatedBy: z.string().describe("更新人"),
      /** 更新时间 */
      updatedTime: z.string().describe("更新时间"),
      /** WebSocket数据源ID */
      id: z.number().describe("WebSocket数据源ID"),
      /** 用户ID */
      userId: z.number().describe("用户ID"),
      /** 数据源类型 */
      type: z.string().describe("数据源类型"),
      /** 数据源名称 */
      name: z.string().describe("数据源名称"),
      /** 数据源描述 */
      description: z.string().describe("数据源描述"),
      /** 配置信息 */
      config: z.string().describe("配置信息"),
      /** 数据组ID（可选） */
      dataGroupId: z.number().describe("数据组ID").nullable(),
      /** 图层ID列表 */
      layerIds: z.string().describe("图层ID列表"),
      /** 基础URL */
      baseUrl: z.string().describe("基础URL")
    })
    .describe("WebSocket数据源类型"),
  z.record(z.string().describe("键"), z.any().describe("值")).describe("通用记录类型")
]);

/** 数据映射配置 Schema */
export const DataRemarkSchema: z.ZodSchema<DataRemark> = z.object({
  /** 描述 */
  description: z.string().describe("描述").optional(),
  /** 键名 */
  key: z.string().describe("键名"),
  /** 映射规则 */
  map: z.string().describe("映射规则"),
  /** 描述（可选） */
  decription: z.string().describe("描述").optional()
});
