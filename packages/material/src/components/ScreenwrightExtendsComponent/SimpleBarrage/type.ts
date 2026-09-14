type ImportConfig = {
  apiUrl: string;
  method: "POST" | "GET";
  headers: Array<{
    key: string;
    value: string;
  }>;
  body: Array<{
    key: string;
    value: string;
  }>;
};

/** @description 图片填充方式 */
type FitType = "none" | "fill" | "scale-down" | "cover" | "contain";

/** @description 文本阴影配置 */
interface TextShadow {
  /** @description 阴影颜色 */
  color: string;
  /** @description X轴偏移 */
  x: number;
  /** @description Y轴偏移 */
  y: number;
  /** @description 模糊半径 */
  blur: number;
}

/** @description 文本样式配置 */
export interface TextStyle {
  /** @description 样式名称 */
  name: string;
  /** @description 字体颜色 */
  fontColor: string;
  /** @description 字体大小 */
  fontSize: number;
  /** @description 字体族 */
  fontFamily: string;
  /** @description 字间距 */
  letterSpacing: number;
  /** @description 是否加粗 */
  fontWeight: boolean;
  /** @description 是否斜体 */
  fontStyle: boolean;
  /** @description 是否启用文本阴影 */
  isTextShadow: boolean;
  /** @description 文本阴影配置 */
  textShadow: TextShadow;
  backgroundImage: string;
}

/** @description 当前选项的类型定义 */
export interface Option {
  /** @description 弹幕行数 */
  lineNum: number;
  /** @description 弹幕速度 (0-1) */
  speed: number;
  /** @description 是否自动循环 */
  loop: boolean;
  /** @description 是否支持悬停 */
  isHover: boolean;
  /** @description 文本样式列表 */
  stylesList: TextStyle[];
  /** @description 图片适应方式 */
  imageObjectFit: FitType;
  /** @description 图片最小高度 */
  imageMinHeight: number;
  /** @description 图片最大高度 */
  imageMaxHeight: number;
  /** @description 导入类型 */
  importType: "systemInterface" | "customInterface";
  /** @description 导入配置 */
  importConfig: ImportConfig;
  /** @description 图片宽度 */
  imageWidth: number;
  /** @description 图片高度 */
  imageHeight: number;
  textBoxBorderRadius: number;
  textBoxPadding: [number, number, number, number];
  /** @description 缩放比例 */
  scale: number;
}

export type DataItem = {
  /** @description 弹幕文本 */
  text: string;

  /** @description 类型 */
  type?: "text" | "image";
};

export interface SimpleBarrageListParams {
  /**
   * 每页显示条数，默认 10
   */
  size?: number;

  /**
   * 当前页，默认1
   */
  current?: number;

  /**
   * 名称
   */
  name?: string;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 关联弹幕组件id
   */
  layerScrollId?: number;

}

export interface PaginationResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  orders: any[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  maxLimit: null | number;
  countId: null | number;
  pages: number;
}

export interface DataFilterItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  layerScrollId: number;
  sort: number | null;
  signUrl: string;
  status: number | null;
  remark: string | null;
}
