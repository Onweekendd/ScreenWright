import { z } from "zod";

/**
 * 页面刷新 (pageReload)
 * 扩展
 *
 * ## 数据结构
 * 无数据字段（data为空数组）
 */

export const pageReloadDataSchema = z.array(z.never());
export type pageReloadData = z.infer<typeof pageReloadDataSchema>;

export const pageReloadOptionSchema = z.object({
  icon: z.string().describe("刷新图标路径"),
  iconHeight: z.number().describe("图标高度"),
  iconWidth: z.number().describe("图标宽度"),
  opacity: z.number().describe("透明度(0-1)"),
  pageReloadType: z.string().describe("刷新类型(click/auto)"),
  pageReloadTypeClick: z.string().describe("点击刷新模式(0/1)")
});

export type pageReloadOption = z.infer<typeof pageReloadOptionSchema>;
