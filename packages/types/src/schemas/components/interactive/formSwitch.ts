import { z } from "zod";

/**
 * 开关 (formSwitch)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 布尔值（开/关状态）
 *
 * @example
 * ```typescript
 * const data: formSwitchData = [
 *   { label: "开关", value: false }
 * ];
 * ```
 */

// 单个数据项的 Schema
const formSwitchDataItemSchema = z.object({
  label: z.string().describe("名称"),
  value: z.boolean().describe("开关状态")
});

export const formSwitchDataSchema = z.array(formSwitchDataItemSchema);
export type formSwitchData = z.infer<typeof formSwitchDataSchema>;

/**
 * 开关配置选项 Schema
 */
export const formSwitchOptionSchema = z.object({
  type: z.string().describe("开关类型"),
  pointSize: z.number().describe("开关按钮大小"),
  pointColor: z.string().describe("开关按钮激活颜色"),
  pointColor2: z.string().describe("开关按钮未激活颜色"),
  disabled: z.boolean().describe("是否禁用"),
  paddingTop: z.number().describe("上内边距"),
  paddingLeft: z.number().describe("左内边距"),
  backgroundImage: z.string().describe("背景图片"),
  backgroundSize: z.string().describe("背景图片大小"),
  activeText: z.string().describe("激活状态文本"),
  inactiveText: z.string().describe("未激活状态文本"),
  activeColor: z.string().describe("激活状态背景颜色"),
  inactiveColor: z.string().describe("未激活状态背景颜色"),
  activeIcon: z.string().describe("激活状态图标"),
  inactiveIcon: z.string().describe("未激活状态图标"),
  activeImage: z.string().describe("激活状态图片"),
  inactiveImage: z.string().describe("未激活状态图片"),
  fontColor: z.string().describe("字体颜色"),
  fontSize: z.number().describe("字体大小"),
  letterSpacing: z.number().describe("字间距"),
  fontWeight: z.boolean().describe("字体加粗"),
  fontFamily: z.string().describe("字体族"),
  fontStyle: z.boolean().describe("字体斜体"),
  textTranslateX: z.number().describe("文本X偏移"),
  textTranslateY: z.number().describe("文本Y偏移"),
  isTextShadow: z.boolean().describe("是否显示文本阴影"),
  textShadow: z.object({
    color: z.string(),
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    extend: z.number()
  }).passthrough().optional().describe("文本阴影配置"),
  fontPaddingTop: z.number().describe("字体上内边距"),
  fontPaddingLeft: z.number().describe("字体左内边距")
});

export type formSwitchOption = z.infer<typeof formSwitchOptionSchema>;
