import type { ActiveAnimationList, AnimationItem } from "./animation/custom-animation";
import type { StatusAnimationResponse } from "./animation/status-animation";
import type { ComponentType, Filter } from "./component";

/**
 * 适配类型
 */
export enum AdaptationType {
  /**
   * 铺满屏幕
   */
  fill = 1,

  /**
   * 屏幕比例适配
   */
  scale = 2,

  /**
   * 原分辨率溢出滚动
   */
  overflow = 3
}

export const adaptationType = [
  { label: "铺满屏幕", value: AdaptationType.fill },
  { label: "屏幕比例适配", value: AdaptationType.scale },
  { label: "原分辨率溢出滚动", value: AdaptationType.overflow }
];

/**
 * 屏幕滤镜信息接口
 * @description 大屏幕显示效果的滤镜配置，包含各种CSS滤镜属性
 */
export interface ScreenFilterInfo {
  /** 高斯模糊：模糊效果的程度，值越大越模糊 */
  gaussianBlur: number;
  /** 亮度：屏幕亮度调节，1为正常，小于1变暗，大于1变亮 */
  brightness: number;
  /** 对比度：对比度调节，1为正常，小于1降低对比度，大于1增加对比度 */
  contrast: number;
  /** 灰度：灰度效果，0为彩色，1为完全灰度 */
  grayscale: number;
  /** 色调：色相旋转角度，0-360度 */
  hue: number;
  /** 饱和度：饱和度调节，0为完全去色，1为正常 */
  saturate: number;
  /** 反转：颜色反转，0为正常，1为完全反转 */
  invert: number;
  /** 棕褐色：棕褐色滤镜效果，0为正常，1为最大效果 */
  sepia: number;
  /** 色相旋转：色相旋转角度，单位为度 */
  /** 实测部分历史大屏的 screenFilterInfo 没有这个字段 */
  hueRotate?: number;
}

/**
 * 水印信息接口
 * @description 大屏幕水印的详细配置，包含文本样式和位置信息
 */
export interface WaterMark {
  /** 水印文本内容 */
  text: string;
  /** 字体族：如 'Arial', 'Microsoft YaHei' 等 */
  fontFamily: string;
  /** 字体样式：如 'normal', 'italic', 'oblique' */
  fontStyle: string;
  /** 字体粗细：如 'normal', 'bold', '100-900' */
  fontWeight: string;
  /** 字体大小：像素值 */
  fontSize: number;
  /** 文字颜色：CSS颜色值，如 '#FFFFFF', 'rgba(255,255,255,0.5)' */
  color: string;
  /** 旋转角度：水印旋转的角度，单位为度 */
  /** 实测部分历史大屏的 waterMark 没有这个字段 */
  degree?: number;
}

/**
 * 终端启用数组类型
 * @description 记录终端启用状态的映射关系，终端ID为键，终端名称为值
 */
export type TerminalEnableArr = {
  /** 终端ID对应终端名称：键为终端ID，值为终端名称 */
  [key: string]: string;
};

/**
 * 禁止配置接口
 * @description 大屏的禁止/限制配置，包含各种控制开关和过期时间
 */
export interface Prohibition {
  /** 是否隐藏图层：控制图层是否隐藏 */
  ihl: boolean;
  /** 过期日期：配置过期的时间，格式 'YYYY-MM-DD HH:mm:ss' */
  ed: string;
  /** 是否启用水印：控制水印是否显示 */
  iwm: boolean;
}

/**
 * 大屏详细配置信息接口
 * @description 大屏幕的完整配置信息，包含尺寸、样式、数据源等所有配置项
 */
export interface LargeScreenDetailInfo {
  /** 大屏宽度：CSS宽度值，如 '1920px', '100%' */
  width: string;
  /** 大屏高度：CSS高度值，如 '1080px', '100vh' */
  height: string;
  /** 缩放比例：屏幕缩放倍率 */
  scale: number;
  /** 主题：大屏显示主题名称（可选） */
  theme?: string;
  /** 初始加载：是否初始加载 */
  initLoad: boolean;
  /** 封面和背景图资源ID：资源ID数组（实测部分历史大屏没有这个字段） */
  minioIds?: Array<number | null>;
  /** 背景图片：背景图片URL */
  backgroundImage: string;
  /** 背景颜色：背景颜色值 */
  backgroundColor: string;
  /** 显示背景图片：是否显示背景图片 */
  showBackgroundImage: boolean;
  /** 显示屏幕适配：是否显示屏幕适配功能 */
  showScreenAdaptation: boolean;
  /** 适配规范：屏幕适配规范说明 */
  adaptationNorm: string;
  /** 适配类型：屏幕适配类型 */
  adaptationType: AdaptationType;
  /** 显示屏幕滤镜：是否显示屏幕滤镜效果 */
  showScreenFilter: boolean;
  /** 屏幕滤镜信息：屏幕滤镜详细配置 */
  screenFilterInfo: ScreenFilterInfo;
  /** 显示水印：是否显示水印 */
  showWaterMark: boolean;
  /** 水印信息：水印详细配置 */
  waterMark: WaterMark;
  /** 网格距离：网格对齐的距离 */
  gridDistance: number;
  /** 查询参数：数据查询参数配置 */
  query: Record<string, any>;
  /** 控制WebSocket URL：控制WebSocket连接地址 */
  controlWebsocketUrl: string;
  /** 心跳间隔：WebSocket心跳间隔时间 */
  heartbeatInterval: number;
  /** 终端启用数组：终端启用状态配置 */
  terminalEnableArr: TerminalEnableArr;
  /** 名称：大屏名称 */
  name: string;
  /** 标记：自定义标记信息（可选） */
  mark?: Record<string, any>;
  /** 是否编码控制：是否使用编码控制（可选） */
  isEncodedControl?: boolean;
  /** z-index映射：组件z-index层级映射（可选） */
  zIndexMap?: Record<string, any>;
}

/**
 * 动画帧设置接口
 * @description 大屏幕动画帧的解析后配置，包含动画列表和激活动画信息
 */
export interface AniFrameSetParsed {
  /** 动画列表：所有可用的动画项（可选） */
  animationList?: AnimationItem[];
  /** 激活动画列表：当前激活的动画配置（可选） */
  activeAnimationList?: ActiveAnimationList;
}

/**
 * 大屏信息接口
 * @description 大屏幕的基础信息，包含图层、配置、基本信息等
 */
export interface LargeScreeInfo {
  /** 图层数组：组件图层信息，可以是字符串数组或组件类型数组 */
  layers: Array<string> | Array<ComponentType>;
  /** 组件数组：组件信息列表（可选） */
  component?: Array<any>;
  /** 配置信息：大屏配置数据，可以是 JSON 字符串或已解析的组件 ID 数组 */
  config: string | Array<string | number>;
  /** 名称：大屏显示名称 */
  name: string;
  /** 详细信息：大屏详细配置，可以是字符串或LargeScreenDetailInfo对象 */
  detail: string | LargeScreenDetailInfo;
  /** 大屏封面图片URL：封面图片访问地址（未设置封面时为 null） */
  backgroundUrl: string | null;
  /** ID：大屏唯一标识符 */
  id: number;
  /** 邀请码：大屏访问邀请码 */
  invitationCode: string;
  /** 状态：大屏启用状态（实测接口返回 null 表示未设置） */
  status: boolean | null;
  /** 类型：大屏类型分类 */
  type: number;
  /** 版本代码：大屏版本标识 */
  versionCode: string;
  /** 版本描述：版本更新说明 */
  versionDesc: string | null;
  /** 数据过滤数组：数据过滤配置 */
  dataFilterArr: string | Record<string, Filter>;
  /** 用户ID：创建用户标识 */
  userId: number;
  /** 场景ID：所属场景标识（可选） */
  sceneId?: number;
  /** 场景版本代码：场景版本标识（可选） */
  sceneVersionCode?: string;
  /** 更新人：最后更新操作人 */
  updatedBy: string;
  /** 更新时间：最后更新时间 */
  updatedTime: string;
  /** 编码控制：编码控制配置 */
  encodedControl: string | string[];
  /** 动画帧设置：动画配置信息 */
  aniFrameSet: string | AniFrameSetParsed;
  /** 状态动画：状态动画配置 */
  statusAnimation: string | StatusAnimationResponse;
}

/**
 * 解析后的大屏信息接口
 * @description 继承LargeScreeInfo但重写config、detail、layers字段的类型，用于已解析的大屏数据
 */
export interface ParsedLargeScreenInfo
  extends Omit<
    LargeScreeInfo,
    "config" | "detail" | "layers" | "dataFilterArr" | "encodedControl" | "aniFrameSet" | "statusAnimation"
  > {
  /** 配置信息数组：已解析的大屏配置数据数组（实测为组件 ID 数组，历史数据中也存在字符串形式） */
  config: Array<string | number>;
  /** 详细配置信息：已解析的详细配置对象 */
  detail: LargeScreenDetailInfo;
  /** 组件图层数组：已解析的组件图层对象数组 */
  layers: ComponentType[];
  /** 数据过滤数组：已解析的数据过滤配置对象 */
  dataFilterArr: Record<string, Filter>;
  /** 编码控制：已解析的编码控制配置数组 */
  encodedControl: string[];
  /** 动画帧设置：已解析的动画配置对象 */
  aniFrameSet: AniFrameSetParsed;
  /** 状态动画：已解析的状态动画配置对象 */
  statusAnimation: StatusAnimationResponse;
}
