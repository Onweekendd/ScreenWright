import { z } from "zod";

// ==================== 通用类型定义 ====================

/**
 * 颜色渐变配置
 */
export const gradientColorSchema = z.object({
  type: z.literal("linear-gradient"),
  angle: z.number().describe("渐变角度"),
  colors: z.array(
    z.object({
      color: z.string().describe("颜色值（rgba/hex）"),
      per: z.number().describe("百分比位置")
    })
  )
});

/**
 * 字体配置
 */
export const fontConfigSchema = z.object({
  fontFamily: z.string().describe("字体名称"),
  fontSize: z.number().describe("字体大小"),
  color: z.string().describe("字体颜色"),
  fontStyle: z.enum(["normal", "italic", "oblique"]).describe("字体样式"),
  fontWeight: z.enum(["normal", "bold", "bolder", "lighter"]).describe("字体粗细")
});

/**
 * Tab 选项配置
 */
export const tabOptionSchema = z.object({
  name: z.string().describe("显示名称"),
  value: z.string().describe("实际值")
});

/**
 * 位置配置
 */
export const positionSchema = z.object({
  top: z.union([z.number(), z.string()]).describe("顶部位置"),
  left: z.union([z.number(), z.string()]).describe("左侧位置"),
  bottom: z.union([z.number(), z.string()]).optional().describe("底部位置"),
  right: z.union([z.number(), z.string()]).optional().describe("右侧位置")
});

/**
 * 内边距配置
 */
export const paddingSchema = z.object({
  top: z.number().optional().describe("顶部内边距"),
  bottom: z.number().optional().describe("底部内边距"),
  left: z.number().optional().describe("左侧内边距"),
  right: z.number().optional().describe("右侧内边距")
});

// ==================== 图表配置 ====================

/**
 * 系列标签配置（数组形式）
 */
export const seriesLabelArraySchema = z.array(
  z.object({
    show: z.boolean().describe("是否显示标签"),
    color: z.string().describe("标签颜色"),
    fontFamily: z.string().describe("字体名称"),
    fontSize: z.number().describe("字体大小"),
    fontWeight: z.string().describe("字体粗细"),
    fontStyle: z.string().describe("字体样式"),
    offsetX: z.number().describe("X轴偏移"),
    offsetY: z.number().describe("Y轴偏移")
  })
);

/**
 * 坐标轴配置
 */
export const axisConfigSchema = z.object({
  show: z.boolean().describe("是否显示坐标轴"),
  labelShow: z.boolean().describe("是否显示标签"),
  type: z.enum(["category", "value", "time", "log"]).describe("坐标轴类型"),
  interval: z.number().describe("刻度间隔"),
  rotate: z.number().describe("标签旋转角度"),
  min: z.string().describe("最小值"),
  max: z.string().describe("最大值"),
  margin: z.number().describe("轴线与标签间距"),
  fontFamily: z.string().describe("字体名称"),
  fontSize: z.number().describe("字体大小"),
  color: z.string().describe("字体颜色"),
  fontStyle: z.string().describe("字体样式"),
  fontWeight: z.string().describe("字体粗细"),
  nameShow: z.boolean().describe("是否显示轴名称"),
  name: z.string().describe("轴名称"),
  nameFontFamily: z.string().describe("轴名称字体"),
  nameFontSize: z.number().describe("轴名称字体大小"),
  nameColor: z.string().describe("轴名称颜色"),
  nameFontStyle: z.string().describe("轴名称字体样式"),
  nameFontWeight: z.string().describe("轴名称字体粗细"),
  lineShow: z.boolean().describe("是否显示轴线"),
  lineColor: z.string().describe("轴线颜色"),
  lineWidth: z.number().describe("轴线宽度"),
  lineOpacity: z.number().describe("轴线透明度"),
  tickShow: z.boolean().describe("是否显示刻度"),
  tickColor: z.string().describe("刻度颜色"),
  tickWidth: z.number().describe("刻度宽度"),
  tickLength: z.number().describe("刻度长度"),
  splitLineShow: z.boolean().describe("是否显示分割线"),
  splitLineInterval: z.number().describe("分割线间隔"),
  splitLineWidth: z.number().describe("分割线宽度"),
  splitLineColor: z.string().describe("分割线颜色"),
  inverse: z.boolean().describe("是否反向")
});

/**
 * 图例配置
 */
export const legendConfigSchema = z.object({
  show: z.boolean().describe("是否显示图例"),
  width: z.number().describe("图例宽度"),
  height: z.number().describe("图例高度"),
  itemWidth: z.number().describe("图例标记宽度"),
  itemHeight: z.number().describe("图例标记高度"),
  itemGap: z.number().describe("图例项间距"),
  fontFamily: z.string().describe("字体名称"),
  fontSize: z.number().describe("字体大小"),
  color: z.string().describe("字体颜色"),
  fontStyle: z.string().describe("字体样式"),
  fontWeight: z.string().describe("字体粗细"),
  textLeftPadding: z.number().describe("文字左侧内边距"),
  selectedMode: z.boolean().describe("是否支持选择"),
  grid: positionSchema.describe("图例位置"),
  offsetX: z.number().describe("X轴偏移"),
  offsetY: z.number().describe("Y轴偏移"),
  orient: z.enum(["horizontal", "vertical"]).describe("排列方向")
});

/**
 * Tooltip 配置
 */
export const tooltipConfigSchema = z.object({
  loop: z.boolean().describe("是否循环显示"),
  loopInterval: z.number().describe("循环间隔（秒）"),
  triggerOn: z.boolean().describe("是否触发显示"),
  offsetX: z.number().describe("X轴偏移"),
  offsetY: z.number().describe("Y轴偏移"),
  background: z.string().describe("背景颜色"),
  width: z.number().describe("宽度"),
  height: z.number().describe("高度"),
  paddingTop: z.number().describe("顶部内边距"),
  paddingBottom: z.number().describe("底部内边距"),
  paddingLeft: z.number().describe("左侧内边距"),
  paddingRight: z.number().describe("右侧内边距"),
  nameFontFamily: z.string().describe("名称字体"),
  nameFontSize: z.number().describe("名称字体大小"),
  nameColor: z.string().describe("名称字体颜色"),
  nameFontWeight: z.string().describe("名称字体粗细"),
  nameFontStyle: z.string().describe("名称字体样式"),
  align: z.enum(["left", "center", "right"]).describe("对齐方式"),
  nameOffsetX: z.number().describe("名称X轴偏移"),
  nameOffsetY: z.number().describe("名称Y轴偏移"),
  arrLineHeight: z.number().describe("数组行高"),
  seriesNameFontFamily: z.string().describe("系列名字体"),
  seriesNameFontSize: z.number().describe("系列名字体大小"),
  seriesNameColor: z.string().describe("系列名字体颜色"),
  seriesNameFontWeight: z.string().describe("系列名字体粗细"),
  seriesNameFontStyle: z.string().describe("系列名字体样式"),
  valueFontFamily: z.string().describe("数值字体"),
  valueFontSize: z.number().describe("数值字体大小"),
  valueColor: z.string().describe("数值字体颜色"),
  valueFontWeight: z.string().describe("数值字体粗细"),
  valueFontStyle: z.string().describe("数值字体样式"),
  unit: z.array(z.string()).describe("单位数组"),
  unitFontFamily: z.string().describe("单位字体"),
  unitFontSize: z.number().describe("单位字体大小"),
  unitColor: z.string().describe("单位字体颜色"),
  unitFontWeight: z.string().describe("单位字体粗细"),
  unitFontStyle: z.string().describe("单位字体样式"),
  unitOffsetX: z.number().describe("单位X轴偏移"),
  unitOffsetY: z.number().describe("单位Y轴偏移"),
  markerSize: z.number().describe("标记大小"),
  axisPointerWidth: z.number().describe("指示线宽度"),
  axisPointerColor: z.string().describe("指示线颜色")
});

/**
 * 网格配置
 */
export const gridConfigSchema = z.object({
  left: z.number().describe("左边距"),
  right: z.number().describe("右边距"),
  top: z.number().describe("上边距"),
  bottom: z.number().describe("下边距")
});

/**
 * 数据循环配置
 */
export const dataLoopConfigSchema = z.object({
  loop: z.boolean().describe("是否循环"),
  interval: z.number().describe("循环间隔（秒）"),
  displayRows: z.number().describe("显示行数"),
  rollNum: z.number().describe("滚动数量")
});

/**
 * 柱状图配置
 */
export const barConfigSchema = z.object({
  gap: z.number().describe("柱间距离"),
  categoryGap: z.number().describe("类目间距离"),
  borderRadius: z.string().describe("圆角"),
  backgroundColor: z.string().describe("背景色")
});

/**
 * 折线图配置
 */
export const lineConfigSchema = z.object({
  width: z.array(z.number()).describe("线条宽度"),
  smoothShow: z.array(z.boolean()).describe("是否平滑"),
  smooth: z.array(z.number()).describe("平滑度"),
  connectNulls: z.array(z.boolean()).describe("是否连接空值"),
  symbolShow: z.array(z.boolean()).describe("是否显示标记"),
  symbol: z.array(z.string()).describe("标记类型"),
  symbolImage: z.array(z.string()).describe("标记图片"),
  symbolWidth: z.array(z.number()).describe("标记宽度"),
  symbolHeight: z.array(z.number()).describe("标记高度"),
  itemColor: z.array(z.string()).describe("数据项颜色"),
  itemBorderWidth: z.array(z.number()).describe("数据项边框宽度"),
  itemBorderColor: z.array(z.string()).describe("数据项边框颜色")
});
