export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  result: T;
  timestamp: number;
  requestId: string;
  onlTable: any;
}

/**
 * 产品项类型
 */
export interface ProductItem {
  /**
   * 创建人
   */
  createdBy: string;

  /**
   * 创建时间(ISO格式字符串){
  createdBy: "system",
  createdTime: "2025-06-23 16:54:14",
  updatedBy: "system",
  updatedTime: "2025-08-11 09:25:21",
  id: 1,
  userId: null,
  categoryName: "继电器",
  isSystemDefined: true,
  displayOrder: 0,
  remark: "继电器",
}
   */
  createdTime: string;

  /**
   * 更新人
   */
  updatedBy: string;

  /**
   * 更新时间(ISO格式字符串)
   */
  updatedTime: string;

  /**
   * 产品ID
   */
  id: number;

  /**
   * 用户ID
   */
  userId: number;

  /**
   * 产品名称
   */
  productName: string;

  /**
   * 产品分类
   */
  productCategory: string;

  /**
   * 网络类型
   */
  networkType: string;

  /**
   * 备注信息
   */
  remark: string;

  /**
   * 产品编码
   */
  code: string;
}

export interface SelectObj {
  /** 创建人 */
  createdBy: string;
  /** 创建时间 */
  createdTime: string; // 可以使用Date类型，但需要转换
  /** 更新人 */
  updatedBy: string;
  /** 更新时间 */
  updatedTime: string; // 可以使用Date类型，但需要转换
  /** ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 设备名称 */
  deviceName: string;
  /** 分组ID */
  groupId: number;
  /** 分组名称 */
  groupName: string;
  /** 产品名称 */
  productName: string;
  /** 产品编码 */
  productCode: string;
  /** 产品分类ID */
  productId: number;
  /** 产品分类名称 */
  productCategoryName: string;
  productCategoryId: string;
  /** 是否启用 */
  isEnabled: boolean;
  /** 设备状态 */
  deviceStatus: boolean;
  /** 配置信息 */
  config: Config;
  /** 设备信息 */
  info: DeviceInfo;
}

interface OrderColumn {
  /** 排序字段 */
  [key: string]: "asc" | "desc";
}

export interface RequestParams {
  /** 查询对象 */
  selectObj: Partial<SelectObj>;
  /** 每页大小 */
  pageSize: number;
  /** 当前页码 */
  current: number;
  /** 排序字段 */
  orderColumns: OrderColumn[];
}

/**
 * 设备操作参数类型
 */
export type DeviceOperateParams =
  | {
      deviceId: number;
      operateCode: "LIST_WINDOWS";
      params?: { pattern: string };
    }
  | {
      deviceId: number;
      operateCode: "SWITCH_WINDOWS";
      params: { hwnd: number };
    }
  | {
      deviceId: number;
      operateCode: "BUTTON";
      params: { switchValue: 0 };
    }
  | {
      deviceId: number;
      operateCode: "SWITCH";
      params: { switchValue: 1 | 0 };
    }
  | {
      deviceId: number;
      operateCode: "VOLUME";
      params: { value: number; type: "FIXED" };
    };

export type DeviceOperateParamsWithCircuitIndex = DeviceOperateParams & {
  params: { circuitIndex?: number };
};

/**
 * 设备查询参数
 */
export interface DeviceQueryParams {
  /** 分组ID */
  groupId?: number | string;
  /** 产品编码 */
  productCode?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 产品ID */
  productId?: number;
}

/**
 * 电路信息
 */
interface CircuitInfo {
  /**
   * 电路编号
   */
  circuit: number;
  /**
   * 电路索引
   */
  circuitIndex: number;

  /**
   * 状态名称
   */
  switchName: "开" | "开启中" | "关" | "关闭中";

  /**
   * 切换值
   */
  switchValue: "1" | "11" | "0" | "10";
}

interface Config {
  /**
   * 本地端口号
   */
  localPort: number;

  /**
   * 端口号
   */
  port: number;

  /**
   * IP地址
   */
  ip: string;

  /**
   * 本地IP地址
   */
  localIp: string;

  /**
   * 是否支持急停(存在这个字段就是有；如果没有这个组件就是普通的开关)
   */
  stopSupport?: "Y";

  /**
   * 电路名称列表
   */
  circuitName?: CircuitInfo[];
}

export interface DeviceRecord {
  createdBy: string;

  createdTime: string;

  updatedBy: string;

  updatedTime: string;

  id: number;

  userId: number;

  deviceName: string;

  groupId: number;

  groupName: string;

  productName: string;

  productCode: string;

  productCategoryId: number;

  productCategoryName: string;

  isEnabled: boolean;

  deviceStatus: boolean;

  config: Config;

  info: DeviceInfo;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  /**
   * 状态名称
   */
  switchName: "开" | "开启中" | "关" | "关闭中";

  /**
   * 切换值
   */
  switchValue: "1" | "11" | "0" | "10";

  /**
   * 音量名称
   */
  volume: number;

  /**
   * 电路名称列表
   */
  circuitName?: CircuitInfo[];
}

export interface PaginationResult<T> {
  size: number;
  current: number;
  pages: number;
  records: T;
  total: number;
}

/**
 * 设备分组项类型
 */
export interface DeviceGroup {
  /**
   * 创建人
   */
  createdBy: string;

  /**
   * 创建时间(ISO格式字符串)
   */
  createdTime: string;

  /**
   * 更新人
   */
  updatedBy: string;

  /**
   * 更新时间(ISO格式字符串)
   */
  updatedTime: string;

  /**
   * 分组ID
   */
  id: number;

  /**
   * 用户ID
   */
  userId: number;

  /**
   * 分组名称
   */
  groupName: string;

  /**
   * 排序序号
   */
  sortOrder: number;

  /**
   * 备注信息
   */
  remark: string;
}

/**
 * 表示一个窗口的信息
 */
export interface WindowInfo {
  /**
   * 窗口句柄，一个唯一的标识符
   */
  hwnd: number;

  /**
   * 窗口标题，即窗口的名称或描述
   */
  title: string;
}

/**
 * 设备控制配置项
 */
interface DeviceControlConfig {
  /**
   * 操作代码
   */
  code: string;

  /**
   * 设备ID
   */
  deviceId: number;

  /**
   * 设备名称
   */
  deviceName: string;

  /**
   * 分组ID
   */
  groupId: number;

  /**
   * 分组名称
   */
  groupName: string;

  /**
   * 产品ID
   */
  productId: number;

  /**
   * 产品名称
   */
  productName: string;

  /**
   * 产品代码
   */
  productCode: string;

  /**
   * 产品类别ID
   */
  productCategoryId: number;

  /**
   * 产品类别名称
   */
  productCategoryName: string;

  /**
   * 是否启用
   */
  isEnabled: boolean;

  /**
   * 操作间隔（单位：秒）
   */
  operateInterval: number;

  /**
   * 操作代码
   */
  operateCode: string;

  /**
   * 排序顺序
   */
  sortOrder: number;

  /**
   * 操作描述
   */
  operateDescription: string;

  /**
   * 操作参数
   */
  params: { [key in DeviceOperateAttributeName]?: any };
}

/**
 * 设备控制配置列表
 */
export interface DeviceControlConfigList {
  /**
   * 创建者
   */
  createdBy: string;

  /**
   * 创建时间
   */
  createdTime: string;

  /**
   * 更新者
   */
  updatedBy: string;

  /**
   * 更新时间
   */
  updatedTime: string;

  /**
   * 唯一标识符
   */
  id: number;

  /**
   * 用户ID
   */
  userId: number;

  /**
   * 名称
   */
  name: string;

  /**
   * 是否启用
   */
  isEnabled: boolean;

  /**
   * 排序顺序
   */
  sortOrder: number;

  /**
   * 设备集合名称
   */
  deviceCollectionName: string;

  /**
   * 设备控制配置项列表
   */
  deviceControlConfigList: DeviceControlConfig[];
}

/**
 * 设备操作属性选项
 */
export interface DeviceOperateAttributeOption {
  /**
   * 显示标签
   */
  label: string;

  /**
   * 选项值
   */
  value: string | number;
}

/**
 * 设备操作属性
 */
export type DeviceOperateAttributeName =
  | "x"
  | "y"
  | "button"
  | "double"
  | "command"
  | "type"
  | "value"
  | "switchValue"
  | "hwnd"
  | "key";

export interface DeviceOperateAttribute {
  /**
   * 显示名称
   */
  displayName: string;

  /**
   * 属性名称
   */
  attributeName: DeviceOperateAttributeName;

  /**
   * 属性类型
   */
  attributeType: DeviceOperateAttributeType;

  /**
   * 默认值
   */
  defaultValue: string | number | boolean | null;

  /**
   * 是否必填
   */
  required: boolean;

  /**
   * 子属性列表
   */
  subAttributes: DeviceOperateAttribute[];

  /**
   * 选项列表（当attributeType为OPTION时使用）
   */
  options: DeviceOperateAttributeOption[];
}

/**
 * 设备操作项
 */
export interface DeviceOperateItem {
  /**
   * 操作代码
   */
  code: DeviceOperateCode;

  /**
   * 操作描述
   */
  description: string;

  /**
   * 操作属性列表
   */
  attributes: DeviceOperateAttribute[];
}

/**
 * 设备操作代码枚举
 */
export enum DeviceOperateCode {
  /** 获取窗口列表 */
  LIST_WINDOWS = "LIST_WINDOWS",

  /** 初始化音量 */
  INIT_VOLUME = "INIT_VOLUME",

  /** 鼠标点击 */
  MOUSE_CLICK = "MOUSE_CLICK",

  /** 打开进程 */
  OPEN_PROGRAM = "OPEN_PROGRAM",

  /** 音量控制 */
  VOLUME = "VOLUME",

  /** 更新设备状态 */
  UPDATE_STATUS = "UPDATE_STATUS",

  /** 开关控制 */
  SWITCH = "SWITCH",

  /** 关闭窗口 */
  CLOSE_WINDOWS = "CLOSE_WINDOWS",

  /** 发送键盘指令 */
  SEND_KEY = "SEND_KEY",

  /** 选择窗口 */
  SWITCH_WINDOWS = "SWITCH_WINDOWS"
}

/**
 * 设备操作属性类型枚举
 */
export enum DeviceOperateAttributeType {
  /** 整数类型 */
  INT = "INT",

  /** 字符串类型 */
  STRING = "STRING",

  /** 布尔类型 */
  BOOLEAN = "BOOLEAN",

  /** 选项类型 */
  OPTION = "OPTION"
}

/**
 * 常用操作代码常量
 */
export const COMMON_OPERATE_CODES = {
  LIST_WINDOWS: DeviceOperateCode.LIST_WINDOWS,
  INIT_VOLUME: DeviceOperateCode.INIT_VOLUME,
  MOUSE_CLICK: DeviceOperateCode.MOUSE_CLICK,
  OPEN_PROGRAM: DeviceOperateCode.OPEN_PROGRAM,
  VOLUME: DeviceOperateCode.VOLUME,
  UPDATE_STATUS: DeviceOperateCode.UPDATE_STATUS,
  SWITCH: DeviceOperateCode.SWITCH,
  CLOSE_WINDOWS: DeviceOperateCode.CLOSE_WINDOWS,
  SEND_KEY: DeviceOperateCode.SEND_KEY,
  SWITCH_WINDOWS: DeviceOperateCode.SWITCH_WINDOWS
} as const;

/**
 * 类型守卫：检查是否为有效的操作代码
 */
export function isValidOperateCode(code: string): code is DeviceOperateCode {
  return Object.values(DeviceOperateCode).includes(code as DeviceOperateCode);
}

/**
 * 类型守卫：检查是否为有效的属性类型
 */
export function isValidAttributeType(type: string): type is DeviceOperateAttributeType {
  return Object.values(DeviceOperateAttributeType).includes(type as DeviceOperateAttributeType);
}

/**
 * 产品分类类型
 */
export interface ProductCategory {
  /**
   * 创建人
   */
  createdBy: string;

  /**
   * 创建时间
   */
  createdTime: string;

  /**
   * 更新人
   */
  updatedBy: string;

  /**
   * 更新时间
   */
  updatedTime: string;

  /**
   * 分类ID
   */
  id: number;

  /**
   * 用户ID
   */
  userId: number | null;

  /**
   * 分类名称
   */
  categoryName: string;

  /**
   * 是否系统定义
   */
  isSystemDefined: boolean;

  /**
   * 显示顺序
   */
  displayOrder: number;

  /**
   * 备注信息
   */
  remark: string;
}
