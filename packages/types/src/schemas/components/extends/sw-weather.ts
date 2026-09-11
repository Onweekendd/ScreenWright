import { z } from "zod";

/**
 * 天气 (ft-weather)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `weather` - 天气信息
 * - `temperature` - 气温数据(包含min和max)
 * - `wind` - 风力信息(包含direction和level)
 */

// 单个数据项的 Schema
const swWeatherDataItemSchema = z.object({
  weather: z.string().describe("天气信息"),
  temperature: z.object({
    min: z.number().describe("最低温度"),
    max: z.number().describe("最高温度")
  }).describe("气温数据"),
  wind: z.object({
    direction: z.string().describe("风向"),
    level: z.string().describe("风力等级")
  }).describe("风力信息")
});

export const swWeatherDataSchema = z.array(swWeatherDataItemSchema);
export type ftWeatherData = z.infer<typeof swWeatherDataSchema>;

export const swWeatherOptionSchema = z.object({
  weatherType: z.string().describe("天气类型(base/custom)"),
  isIcon: z.boolean().describe("是否显示天气图标"),
  isWeather: z.boolean().describe("是否显示天气文字"),
  isTemperature: z.boolean().describe("是否显示温度"),
  isWind: z.boolean().describe("是否显示风力"),
  direction: z.string().describe("排列方向(horizontal/vertical)"),
  fontSize: z.number().describe("字号"),
  fontWeight: z.string().describe("字重"),
  fontStyle: z.string().describe("字体样式"),
  fontFamily: z.string().describe("字体"),
  fontColor: z.string().describe("字体颜色"),
  textTranslateX: z.number().describe("文字X偏移"),
  textTranslateY: z.number().describe("文字Y偏移"),
  baseTime: z.number().describe("自动刷新间隔(分钟)"),
  currentCity: z.unknown().describe("当前城市"),
  iconWidth: z.number().describe("天气图标宽度"),
  iconHeight: z.number().describe("天气图标高度"),
  connector: z.string().describe("温度区间连接符"),
  suffix: z.string().describe("温度后缀"),
  seriesTabsList: z.array(z.object({
    name: z.string().describe("系列名称"),
    fieldName: z.string().describe("天气字段匹配名"),
    icon: z.string().describe("天气图标路径")
  })).describe("天气类型系列配置列表")
});

export type ftWeatherOption = z.infer<typeof swWeatherOptionSchema>;
