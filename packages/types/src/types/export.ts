/**
 * 导出相关类型定义
 * @description 用于 fileString.ts 重构后的模块化结构
 */

/**
 * 字体文件信息
 */
export interface FontFile {
  /** 字体标签（用于显示和查询） */
  label: string;
  /** 文件名 */
  filename: string;
  /** 文件目录 */
  filedir: string;
  /** 完整文件路径 */
  filepath: string;
}

/**
 * 地理数据文件信息
 */
export interface GeoFile {
  /** 文件名 */
  filename: string;
  /** 文件目录 */
  filedir: string;
  /** 完整文件路径 */
  filepath: string;
  /** 省份代码 */
  code: string;
}

/**
 * 静态资源文件信息
 */
export interface ResourceFile {
  /** 文件名 */
  filename: string;
  /** 文件目录 */
  filedir: string;
  /** 完整文件路径 */
  filepath: string;
  /** 可选的标签（字体文件特有） */
  label?: string;
}

/**
 * 城市配置
 */
export interface CityConfig {
  layers: unknown[];
  environment: {
    camera: Record<string, unknown>;
    fog: Record<string, unknown>;
    lights: Record<string, unknown>[];
    postProcessing: Record<string, unknown>;
    renderer: Record<string, unknown>;
    skyBox: Record<string, unknown>;
    skyCloud: Record<string, unknown>;
    spaceEffect: Record<string, unknown>[];
  };
  maptalksMap: {
    extent: Record<string, unknown>;
    options: Record<string, unknown>;
  };
}

/**
 * 三维场景配置
 */
export interface SceneConfig {
  /** 场景列表 */
  sceneList: unknown[];
  /** 默认场景 */
  defaultScene: Record<string, unknown>;
  /** 创建时间 */
  createdTime: string;
}

/**
 * HTML 生成选项
 */
export interface HtmlGenerateOptions {
  /** 基础路径（默认 "./public"） */
  basePath?: string;
  /** 用户信息 */
  userInfo?: Record<string, unknown>;
  /** 需要包含的组件集合 */
  includeSet?: string[];
  /** TCP 通知 WebSocket URL（可选，覆盖自动生成） */
  tcpNoticeWebsocketUrl?: string;
}
