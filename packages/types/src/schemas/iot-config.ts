import { z } from "zod";

import type { IotConfig } from "../types";

// ============================================
// IoT Config Schema
// ============================================

/** 物联网配置 Schema */
export const IotConfigSchema: z.ZodSchema<IotConfig> = z.object({
  /** 操作码，定义设备控制类型 */
  operateCode: z
    .enum([
      "SWITCH", // 开关控制
      "VOLUME", // 音量控制
      "BUTTON", // 按钮控制
      "LIST_WINDOWS", // 窗口列表
      "SWITCH_WINDOWS" // 窗口切换
    ])
    .describe("操作码，定义设备控制类型"),
  /** 物联网地址（可选） */
  iotAddress: z.string().describe("物联网地址").optional(),
  /** 产品品牌 ID（可选） */
  productBrandId: z.string().describe("产品品牌ID").optional(),
  /** 产品分类 ID（可选） */
  productCategoryId: z.string().describe("产品分类ID").optional(),
  /** 产品编码（可选） */
  productCode: z.string().describe("产品编码").optional(),
  /** 分组 ID（可选） */
  groupId: z.string().describe("分组ID").optional(),
  /** 设备分组 ID（可选） */
  deviceGroupId: z.string().describe("设备分组ID").optional(),
  /** 设备 ID（可选） */
  deviceId: z.string().describe("设备ID").optional(),
  /** 集成控制 ID（可选） */
  integratedControlId: z.string().describe("集成控制ID").optional(),
  /** 操作描述（可选） */
  operateDescription: z.string().describe("操作描述").optional(),
  /** 操作参数，键值对形式（可选） */
  params: z
    .record(z.string().describe("参数键"), z.any().describe("参数值"))
    .describe("操作参数，键值对形式")
    .optional(),
  /** 电路编号（可选） */
  circuitIndex: z.number().describe("电路编号").optional(),
  /** 选中的状态（可选） */
  selectedStatus: z.number().describe("选中的状态").optional(),
  /** 设备类型：单设备或集成设备（可选） */
  deviceType: z.enum(["single", "integrated"]).describe("设备类型：单设备或集成设备").optional()
});
