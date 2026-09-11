/**
 * AI大屏配置（AI模板）
 * 该模板用于给 AI 创建大屏模板：payload 为整份模板范式，screenData 为源屏真实组件树
 */
export interface LargeScreenAiConfig {
  createdBy?: string;
  createdTime?: string;
  updatedBy?: string;
  updatedTime?: string;
  /** 主键 */
  id?: number;
  /** 用户id（不用传递） */
  userId?: number;
  /** AI大屏id */
  largeAiId?: number;
  /** 嵌入摘要原文，送向量库做语义检索 */
  embeddingText?: string;
  /** 整份模板JSON：范式描述+分辨率+插槽等 */
  payload?: string;
  /** 源屏真实组件树，建屏用的原始数据 */
  screenData?: string;
  /** 来源大屏id */
  sourceLargeId?: number;
  /** 来源大屏版本号 */
  sourceVersion?: string;
  /** AI大屏名称（info表） */
  name?: string;
  /** 封面缩略图URL（info表） */
  coverUrl?: string;
  /** AI匹配语义标签json数组（info表） */
  tags?: string;
  /** 适配场景描述（info表） */
  scene?: string;
  /** 状态：0禁用，1启用（info表） */
  status?: number;
  /** 排序（info表） */
  sort?: number;
}

/** AI模板分页查询结果 */
export interface PageLargeScreenAiConfig {
  records: LargeScreenAiConfig[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

/** AI模板分页查询参数 */
export interface PageParamLargeScreenAiConfig {
  /** 每页显示条数，默认 10 */
  size?: number;
  /** 当前页，默认 1 */
  current?: number;
}

/** 批量复制AI模板组件到目标大屏参数 */
export interface CopyComponentsParam {
  /** AI大屏配置表id (t_large_screen_ai_config.id) */
  configId: number;
  /** 目标普通大屏id (t_large_screen_info.id) */
  targetLargeId: number;
}
