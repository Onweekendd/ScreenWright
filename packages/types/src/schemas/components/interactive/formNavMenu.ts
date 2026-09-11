import { z } from "zod";

/**
 * 导航菜单 (formNavMenu)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 数值
 * - `image` - 图标路径
 * - `disabled` - 是否禁用
 * - `children` - 子菜单项
 *
 * @example
 * ```typescript
 * const data: formNavMenuData = [
 *   { label: "导航一", value: "1", image: "...", disabled: false, children: [...] }
 * ];
 * ```
 */

// 子菜单项 Schema
const navMenuChildSchema = z.object({
  label: z.string().describe("子菜单名称"),
  value: z.string().describe("子菜单值"),
  image: z.string().optional().describe("子菜单图标"),
  disabled: z.boolean().optional().describe("是否禁用")
});

// 单个数据项的 Schema
const formNavMenuDataItemSchema = z.object({
  label: z.string().describe("导航名称"),
  value: z.string().describe("导航值"),
  image: z.string().optional().describe("导航图标路径"),
  disabled: z.boolean().optional().describe("是否禁用"),
  children: z.array(navMenuChildSchema).optional().describe("子菜单列表")
});

export const formNavMenuDataSchema = z.array(formNavMenuDataItemSchema);
export type formNavMenuData = z.infer<typeof formNavMenuDataSchema>;

// 复选框样式配置
const checkboxStyleSchema = z.object({
  width: z.number(),
  height: z.number(),
  borderRadius: z.number(),
  borderColor: z.string(),
  backgroundColor: z.string()
}).passthrough();

// 前缀图标配置
const prefixIconSchema = z.object({
  isDataFirst: z.boolean(),
  url: z.string(),
  iconWidth: z.string(),
  iconHeight: z.string(),
  offset: z.number()
}).passthrough();

// 后缀配置
const suffixConfigSchema = z.object({
  type: z.string(),
  icon: z.string(),
  text: z.string(),
  customField: z.string(),
  position: z.string(),
  offset: z.number(),
  iconStyle: z.object({ iconWidth: z.string(), iconHeight: z.string() }).passthrough(),
  textStyle: z.object({
    fontSize: z.string(),
    color: z.string(),
    opacity: z.number(),
    fontWeight: z.string(),
    fontStyle: z.string(),
    fontFamily: z.string()
  }).passthrough()
}).passthrough();

/**
 * 导航菜单配置选项 Schema
 */
export const formNavMenuOptionSchema = z.object({
  type: z.string().describe("菜单方向（vertical/horizontal）"),
  disabled: z.boolean().describe("是否禁用"),
  paddingTop: z.number().describe("上内边距"),
  paddingLeft: z.number().describe("左内边距"),
  collapse: z.boolean().describe("是否折叠"),
  lineHeight: z.number().describe("行高"),
  defaultActive: z.string().describe("默认激活项"),
  textColor: z.string().describe("文本颜色"),
  backgroundColor: z.string().describe("背景颜色"),
  activeTextColor: z.string().describe("激活项文本颜色"),
  uniqueOpened: z.boolean().describe("是否只保持一个子菜单展开"),
  menuTrigger: z.string().describe("子菜单触发方式"),
  collapseTransition: z.boolean().describe("是否开启折叠过渡动画"),
  fontColor: z.string().describe("字体颜色"),
  fontSize: z.number().describe("字体大小"),
  letterSpacing: z.number().describe("字间距"),
  textAlign: z.string().describe("文本对齐方式"),
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
  radiusTop: z.number().describe("上圆角"),
  radiusBottom: z.number().describe("下圆角"),
  radiusLeft: z.number().describe("左圆角"),
  radiusRight: z.number().describe("右圆角"),
  backgroundRadius: z.number().describe("背景圆角"),
  backgroundColor1: z.string().describe("背景渐变色1"),
  backgroundColor2: z.string().describe("背景渐变色2"),
  isChildStyle: z.boolean().describe("是否自定义子菜单样式"),
  isHiddenArrow: z.boolean().describe("是否隐藏箭头"),
  isOpenedLine: z.boolean().describe("是否显示展开线"),
  childLineColor1: z.string().describe("子菜单线条颜色1"),
  childLineColor2: z.string().describe("子菜单线条颜色2"),
  childFontColor: z.string().describe("子菜单字体颜色"),
  childTextAlign: z.string().describe("子菜单文本对齐"),
  childFontWeight: z.boolean().describe("子菜单字体加粗"),
  childFontFamily: z.string().describe("子菜单字体族"),
  childFontStyle: z.boolean().describe("子菜单字体斜体"),
  childLetterSpacing: z.number().describe("子菜单字间距"),
  childBgRadius: z.number().describe("子菜单背景圆角"),
  childBgColor1: z.string().describe("子菜单背景渐变色1"),
  childBgColor2: z.string().describe("子菜单背景渐变色2"),
  childRadiusTop: z.number().describe("子菜单上圆角"),
  childRadiusBottom: z.number().describe("子菜单下圆角"),
  childRadiusLeft: z.number().describe("子菜单左圆角"),
  childRadiusRight: z.number().describe("子菜单右圆角"),
  showParentPrefix: z.boolean().describe("是否显示父级前缀"),
  showChildPrefix: z.boolean().describe("是否显示子级前缀"),
  showParentSuffix: z.boolean().describe("是否显示父级后缀"),
  showChildSuffix: z.boolean().describe("是否显示子级后缀"),
  checkboxTabs: z.object({
    multiple: z.boolean(),
    selectParent: z.boolean(),
    parentControl: z.boolean(),
    checkboxStyle: checkboxStyleSchema,
    parentPrefix: prefixIconSchema,
    childPrefix: prefixIconSchema,
    parentSuffix: suffixConfigSchema,
    childSuffix: suffixConfigSchema
  }).passthrough().optional().describe("复选框选项卡配置")
});

export type formNavMenuOption = z.infer<typeof formNavMenuOptionSchema>;
