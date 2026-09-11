import { z } from "zod";

import type { LargeScreenDetailInfo, ParsedLargeScreenInfo } from "../types/large-screen";
import { AniFrameSetParsedSchema } from "./animation";
import { StatusAnimationResponseParsedSchema } from "./animation";
import { ComponentSchema } from "./component";
import { FilterSchema } from "./component";
import { AdaptationTypeSchema } from "./config";
import { ScreenFilterInfoSchema, TerminalEnableArrSchema, WaterMarkSchema } from "./screen";

// ============================================
// Large Screen Schema
// ============================================

/** 大屏详细配置信息 Schema */
export const LargeScreenDetailInfoSchema: z.ZodSchema<LargeScreenDetailInfo> = z.object({
  /** 大屏宽度：CSS宽度值，如 '1920px', '100%' */
  width: z.string().describe("大屏宽度：CSS宽度值，如 '1920px', '100%'"),
  /** 大屏高度：CSS高度值，如 '1080px', '100vh' */
  height: z.string().describe("大屏高度：CSS高度值，如 '1080px', '100vh'"),
  /** 缩放比例：屏幕缩放倍率 */
  scale: z.number().describe("缩放比例：屏幕缩放倍率"),
  /** 主题：大屏显示主题名称（可选） */
  theme: z.string().describe("主题：大屏显示主题名称").optional(),
  /** 初始加载：是否初始加载 */
  initLoad: z.boolean().describe("初始加载：是否初始加载"),
  /** 封面和背景图资源ID：资源ID数组 */
  minioIds: z.array(z.number().describe("资源ID").nullable()).describe("封面和背景图资源ID：资源ID数组").optional(),
  /** 背景图片：背景图片URL */
  backgroundImage: z.string().describe("背景图片：背景图片URL"),
  /** 背景颜色：背景颜色值 */
  backgroundColor: z.string().describe("背景颜色：背景颜色值"),
  /** 显示背景图片：是否显示背景图片 */
  showBackgroundImage: z.boolean().describe("显示背景图片：是否显示背景图片"),
  /** 显示屏幕适配：是否显示屏幕适配功能 */
  showScreenAdaptation: z.boolean().describe("显示屏幕适配：是否显示屏幕适配功能"),
  /** 适配规范：屏幕适配规范说明 */
  adaptationNorm: z.string().describe("适配规范：屏幕适配规范说明"),
  /** 适配类型：屏幕适配类型 */
  adaptationType: AdaptationTypeSchema.describe("适配类型：屏幕适配类型"),
  /** 显示屏幕滤镜：是否显示屏幕滤镜效果 */
  showScreenFilter: z.boolean().describe("显示屏幕滤镜：是否显示屏幕滤镜效果"),
  /** 屏幕滤镜信息：屏幕滤镜详细配置 */
  screenFilterInfo: ScreenFilterInfoSchema.describe("屏幕滤镜信息：屏幕滤镜详细配置"),
  /** 显示水印：是否显示水印 */
  showWaterMark: z.boolean().describe("显示水印：是否显示水印"),
  /** 水印信息：水印详细配置 */
  waterMark: WaterMarkSchema.describe("水印信息：水印详细配置"),
  /** 网格距离：网格对齐的距离 */
  gridDistance: z.number().describe("网格距离：网格对齐的距离"),
  /** 查询参数：数据查询参数配置 */
  query: z.record(z.string().describe("参数键"), z.any().describe("参数值")).describe("查询参数：数据查询参数配置"),
  /** 控制WebSocket URL：控制WebSocket连接地址 */
  controlWebsocketUrl: z.string().describe("控制WebSocket URL：控制WebSocket连接地址"),
  /** 心跳间隔：WebSocket心跳间隔时间 */
  heartbeatInterval: z.number().describe("心跳间隔：WebSocket心跳间隔时间"),
  /** 终端启用数组：终端启用状态配置 */
  terminalEnableArr: TerminalEnableArrSchema.describe("终端启用数组：终端启用状态配置"),
  /** 名称：大屏名称 */
  name: z.string().describe("名称：大屏名称"),
  /** 标记：自定义标记信息（可选） */
  mark: z.record(z.string().describe("标记键"), z.any().describe("标记值")).describe("标记：自定义标记信息").optional(),
  /** 是否编码控制：是否使用编码控制（可选） */
  isEncodedControl: z.boolean().describe("是否编码控制：是否使用编码控制").optional(),
  /** z-index映射：组件z-index层级映射（可选） */
  zIndexMap: z
    .record(z.string().describe("组件ID"), z.any().describe("层级信息"))
    .describe("z-index映射：组件z-index层级映射")
    .optional()
});

/**
 * 解析后的大屏信息 object 形态
 *
 * 需要 pick / omit / extend 时用它：ParsedLargeScreenInfoSchema 是 ZodLazy，
 * 拿不到 ZodObject 上的这些组合方法。
 * 保留成工厂函数是为了延续 lazy 原本的作用——ComponentSchema 存在自引用，
 * 提前在模块顶层求值会踩到初始化顺序问题。
 */
export const parsedLargeScreenInfoObject = () =>
  z
    .object({
      /** 组件图层数组：已解析的组件图层对象数组 */
      layers: z.array(ComponentSchema).describe("组件图层数组：已解析的组件图层对象数组"),
      /** 组件数组：组件信息列表（可选） */
      component: z.array(z.any().describe("组件信息")).describe("组件数组：组件信息列表").optional(),
      /** 配置信息数组：已解析的大屏配置数据数组 */
      config: z
        .array(z.union([z.string(), z.number()]).describe("配置项：组件 ID"))
        .describe("配置信息数组：已解析的大屏配置数据数组"),
      /** 名称：大屏显示名称 */
      name: z.string().describe("名称：大屏显示名称"),
      /** 详细配置信息：已解析的详细配置对象 */
      detail: LargeScreenDetailInfoSchema.describe("详细配置信息：已解析的详细配置对象"),
      /** 大屏封面图片URL：封面图片访问地址 */
      backgroundUrl: z.string().describe("大屏封面图片URL：封面图片访问地址").nullable(),
      /** ID：大屏唯一标识符 */
      id: z.number().describe("ID：大屏唯一标识符"),
      /** 邀请码：大屏访问邀请码 */
      invitationCode: z.string().describe("邀请码：大屏访问邀请码"),
      /** 状态：大屏启用状态 */
      status: z.boolean().describe("状态：大屏启用状态").nullable(),
      /** 类型：大屏类型分类 */
      type: z.number().describe("类型：大屏类型分类"),
      /** 版本代码：大屏版本标识 */
      versionCode: z.string().describe("版本代码：大屏版本标识"),
      /** 版本描述：版本更新说明 */
      versionDesc: z.string().describe("版本描述：版本更新说明").nullable(),
      /** 数据过滤数组：已解析的数据过滤配置对象 */
      dataFilterArr: z
        .record(z.string().describe("过滤器ID"), FilterSchema)
        .describe("数据过滤数组：已解析的数据过滤配置对象"),
      /** 用户ID：创建用户标识 */
      userId: z.number().describe("用户ID：创建用户标识"),
      /** 场景ID：所属场景标识（可选） */
      sceneId: z.number().describe("场景ID：所属场景标识").optional(),
      /** 场景版本代码：场景版本标识（可选） */
      sceneVersionCode: z.string().describe("场景版本代码：场景版本标识").optional(),
      /** 更新人：最后更新操作人 */
      updatedBy: z.string().describe("更新人：最后更新操作人"),
      /** 更新时间：最后更新时间 */
      updatedTime: z.string().describe("更新时间：最后更新时间"),
      /** 编码控制：已解析的编码控制配置数组 */
      encodedControl: z.array(z.string().describe("编码控制项")).describe("编码控制：已解析的编码控制配置数组"),
      /** 动画帧设置：已解析的动画配置对象 */
      aniFrameSet: AniFrameSetParsedSchema.describe("动画帧设置：已解析的动画配置对象"),
      /** 状态动画：已解析的状态动画配置对象 */
      statusAnimation: StatusAnimationResponseParsedSchema.describe("状态动画：已解析的状态动画配置对象")
    })
    .catchall(z.any().describe("其他任意属性"));

/** 解析后的大屏信息 Schema */
export const ParsedLargeScreenInfoSchema: z.ZodSchema<ParsedLargeScreenInfo> = z.lazy(
  parsedLargeScreenInfoObject
) as z.ZodSchema<ParsedLargeScreenInfo>;
