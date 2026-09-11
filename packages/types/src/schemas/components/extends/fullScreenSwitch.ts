import { z } from "zod";

/**
 * 全屏切换 (fullScreenSwitch)
 * 扩展
 *
 * ## 数据结构
 * 无数据字段（data为空数组）
 */

export const fullScreenSwitchDataSchema = z.array(z.never());
export type fullScreenSwitchData = z.infer<typeof fullScreenSwitchDataSchema>;

export const fullScreenSwitchOptionSchema = z.object({
  fullScreenImg: z.string().describe("全屏状态图标路径"),
  unFullScreenImg: z.string().describe("非全屏状态图标路径")
});

export type fullScreenSwitchOption = z.infer<typeof fullScreenSwitchOptionSchema>;
