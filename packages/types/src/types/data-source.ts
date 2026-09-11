/**
 * 数据库项类型
 * @description 数据库数据源的相关信息配置
 */
export type DbItem = {
  /** 创建人 */
  createdBy: string;

  /** 创建时间 */
  createdTime: string;

  /** 更新人 */
  updatedBy: string;

  /** 更新时间 */
  updatedTime: string;

  /** 数据库项ID */
  id: number;

  /** 用户ID */
  userId: number;

  /** 数据库名称 */
  name: string;

  /** 数据库描述 */
  description: string;

  /** 数据库类型 */
  type: string;

  /** 数据库连接URL */
  url: string;

  /** 数据组ID（可选） */
  dataGroupId: number | null;

  /** 文件名 */
  fileName: string;

  /** 文件大小 */
  size: number;

  /** 字符集名称 */
  charsetName: string;

  /** 图层ID列表 */
  layerIds: string;

  /** 配置信息（可选） */
  config?: string;
};

/**
 * 物联地址类型
 * @description 物联网设备连接地址相关信息配置
 */
export interface IotAddress {
  /** 创建人 */
  createdBy: string;

  /** 创建时间 */
  createdTime: string;

  /** 更新人 */
  updatedBy: string;

  /** 更新时间 */
  updatedTime: string;

  /** 物联地址ID */
  id: number;

  /** 用户ID */
  userId: number;

  /** 数据组ID（可选） */
  dataGroupId: number | null;

  /** 名称 */
  name: string;

  /** 描述 */
  description: string;

  /** 类型 */
  type: string;

  /** 目标IP地址 */
  desIp: string;

  /** 目标端口 */
  desPort: number;

  /** 本地端口 */
  localPort: number;

  /** 字符集名称 */
  charsetName: string;

  /** 图层ID列表 */
  layerIds: number[];
}

/**
 * WebSocket 数据源类型
 * @description WebSocket实时数据源的相关信息配置
 */
export interface WebSocketDataSource {
  /** 创建人 */
  createdBy: string;

  /** 创建时间 */
  createdTime: string;

  /** 更新人 */
  updatedBy: string;

  /** 更新时间 */
  updatedTime: string;

  /** WebSocket数据源ID */
  id: number;

  /** 用户ID */
  userId: number;

  /** 数据源类型 */
  type: string;

  /** 数据源名称 */
  name: string;

  /** 数据源描述 */
  description: string;

  /** 配置信息 */
  config: string;

  /** 数据组ID（可选） */
  dataGroupId: number | null;

  /** 图层ID列表 */
  layerIds: string;

  /** 基础URL */
  baseUrl: string;
}

/**
 * 统一数据源类型
 * @description 包含所有类型数据源的联合类型，用于统一处理不同类型的数据源
 */
export type DataSourceType = DbItem | IotAddress | WebSocketDataSource | Record<string, any>;
