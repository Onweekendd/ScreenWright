import { z } from "zod";

/**
 * 实时时间 (ftdatetime)
 * 文字
 *
 * 无数据源，直接显示系统当前时间。
 */

// ==================== Data Schema ====================

// 实时时间无数据接口，使用空数组
export const ftdatetimeDataSchema = z.array(z.never());

export type FtdatetimeData = z.infer<typeof ftdatetimeDataSchema>;

// ==================== Option Schema ====================

/**
 * 实时时间配置选项 Schema
 */
export const ftdatetimeOptionSchema = z.object({
  // ============ 基础配置 ============
  format: z.string().describe("时间显示格式(如 yyyy-MM-dd HH:mm:ss)"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("字体"),
  fontSize: z.number().describe("字号"),
  color: z.string().describe("字体颜色"),
  fontWeight: z.string().describe("字重"),
  fontStyle: z.string().describe("字体样式"),

  // ============ 布局配置 ============
  textAlign: z.string().describe("水平对齐(left/center/right)"),
  textAlignVertical: z.string().describe("垂直对齐(top/center/bottom)"),
  split: z.number().describe("字间距"),
  backgroundColor: z.string().describe("背景颜色")
});

export type FtdatetimeOption = z.infer<typeof ftdatetimeOptionSchema>;
