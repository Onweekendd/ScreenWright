/**
 * 物联操作码类型
 * @description 定义物联网设备的操作类型
 */
export type OperateCode =
  | "SWITCH" // 开关控制
  | "VOLUME" // 音量控制
  | "BUTTON" // 按钮控制
  | "LIST_WINDOWS" // 窗口列表
  | "SWITCH_WINDOWS"; // 窗口切换

/**
 * 物联网配置接口
 * @description 定义物联网设备的控制参数和配置信息
 */
export interface IotConfig {
  /** 操作码，定义设备控制类型 */
  operateCode: OperateCode;

  /** 物联网地址（可选） */
  iotAddress?: string;

  /** 产品品牌 ID（可选） */
  productBrandId?: string;

  /** 产品分类 ID（可选） */
  productCategoryId?: string;

  /** 产品编码（可选） */
  productCode?: string;

  /** 分组 ID（可选） */
  groupId?: string;

  /** 设备分组 ID（可选） */
  deviceGroupId?: string;

  /** 设备 ID（可选） */
  deviceId?: string;

  /** 集成控制 ID（可选） */
  integratedControlId?: string;

  /** 操作描述（可选） */
  operateDescription?: string;

  /** 操作参数，键值对形式（可选） */
  params?: Record<string, any>;

  /** 电路编号（可选） */
  circuitIndex?: number;

  /** 选中的状态（可选） */
  selectedStatus?: number;

  /** 设备类型：单设备或集成设备（可选） */
  deviceType?: "single" | "integrated";
}
