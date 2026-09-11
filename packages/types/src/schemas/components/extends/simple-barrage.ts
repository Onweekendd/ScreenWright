import { z } from "zod";

/**
 * 弹幕组件 (simple-barrage)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 弹幕文本内容
 */

// 单个数据项的 Schema
const simpleBarrageDataItemSchema = z.object({
  text: z.string().describe("弹幕文本内容")
});

export const simpleBarrageDataSchema = z.array(simpleBarrageDataItemSchema);
export type simpleBarrageData = z.infer<typeof simpleBarrageDataSchema>;

// 弹幕样式项 Schema
const simpleBarrageStyleItemSchema = z.object({
  name: z.string().describe("样式名称"),
  fontSize: z.number().describe("字号"),
  fontWeight: z.boolean().describe("是否加粗"),
  fontStyle: z.boolean().describe("是否斜体"),
  letterSpacing: z.number().describe("字间距"),
  fontFamily: z.string().describe("字体"),
  fontColor: z.string().describe("字体颜色"),
  isTextShadow: z.boolean().describe("是否显示文字阴影"),
  textShadow: z.object({
    x: z.number().describe("阴影X偏移"),
    y: z.number().describe("阴影Y偏移"),
    blur: z.number().describe("阴影模糊度"),
    color: z.string().describe("阴影颜色"),
    extend: z.number().describe("阴影扩展")
  }).describe("文字阴影配置")
});

export const simpleBarrageOptionSchema = z.object({
  imageWidth: z.number().describe("弹幕区域宽度"),
  imageHeight: z.number().describe("弹幕区域高度"),
  imageMinHeight: z.number().describe("弹幕最小高度"),
  imageMaxHeight: z.number().describe("弹幕最大高度"),
  imageObjectFit: z.string().describe("弹幕内容适配方式"),
  scale: z.number().describe("缩放比例"),
  importType: z.string().describe("数据导入类型(systemInterface/custom)"),
  importConfig: z.object({
    apiUrl: z.string().describe("接口地址"),
    method: z.string().describe("请求方法"),
    body: z.array(z.unknown()).describe("请求体参数"),
    headers: z.array(z.unknown()).describe("请求头参数")
  }).describe("自定义接口导入配置"),
  loop: z.boolean().describe("是否循环播放弹幕"),
  lineNum: z.number().describe("弹幕轨道行数"),
  isHover: z.boolean().describe("鼠标悬停时是否暂停"),
  speed: z.number().describe("弹幕滚动速度"),
  stylesList: z.array(simpleBarrageStyleItemSchema).describe("弹幕样式列表，可配置多种弹幕样式随机分配")
});

export type simpleBarrageOption = z.infer<typeof simpleBarrageOptionSchema>;
