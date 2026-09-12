// 导入组件属性类型
import type { Animation } from "./component-animation";
import type { AllComponentType, ExtendsChildComponentEnum } from "./componentProp";
import { FolderEnum } from "./componentProp";
import type { DataRemark } from "./data-mapping";
import type { DataSourceType, DbItem, IotAddress, WebSocketDataSource } from "./data-source";
// 导入新模块的类型
import { DataType } from "./data-type";
// 导入 Event 相关类型（在 StandardComponentType 中使用）
import type { EncodeEvent, Event } from "./event";
import type {
  BindComponent,
  Callback,
  CallbackManager,
  CallbackRelation,
  CallbackSource,
  CallbackTarget,
  Filter,
  ListenArg,
  TempPool
} from "./filter";
import type { ComponentMinioAsset, MinioResource } from "./minio-resource";

// ============================================
// Re-export all types for backward compatibility
// ============================================

// 重新导出组件属性类型
export type { AllComponentType };
export { FolderEnum };

// 重新导出数据类型
export { DataType };

// 重新导出动画类型
export type { Animation };

// 重新导出过滤器相关类型
export type {
  BindComponent,
  Callback,
  CallbackManager,
  CallbackRelation,
  CallbackSource,
  CallbackTarget,
  Filter,
  ListenArg,
  TempPool
};

// 重新导出数据源相关类型
export type { DataSourceType, DbItem, IotAddress, WebSocketDataSource };

// 重新导出数据映射类型
export type { DataRemark };

// 重新导出 Minio 资源类型
export type { ComponentMinioAsset, MinioResource };

// 重新导出 Event 类型
export type { EncodeEvent, Event };

export type { PanelState, SystemComponentProps } from "./panel";

// ============================================
// Core Component Types (defined in this file)
// ============================================

export interface ChildComponent<Option = any> extends Omit<StandardComponentType, "component" | "option" | "id"> {
  id: string;
  isEdit: boolean;
  show: boolean;
  showOperation: boolean;
  type: string;
  dataMethod: "get" | "post" | "put" | "delete";
  dataType: number;
  requestHeader: Record<string, any>;
  requestBody: Record<string, any>;
  crossOrigin: boolean;
  needCookie: boolean;
  autoRefresh: boolean;
  sql: string;
  component: {
    prop: ExtendsChildComponentEnum | string;
    width: number;
    height: number;
    name: string;
  };
  option: Option;
  [key: string]: any;
}

export enum verticalConstEnum {
  Top = "Top",
  Bottom = "Bottom",
  Center = "Center"
  //   TopAndBottom = "TopAndBottom"
}

export enum horizontalConstEnum {
  Left = "Left",
  Right = "Right",
  Center = "Center"
  //   LeftAndRight = "LeftAndRight"
}

/**
 * 标准组件类型
 * @description 标准化组件的基础类型定义，包含组件的所有核心属性
 * @template ComponentProp - 组件属性类型，默认为 AllComponentType
 * @template Option - 组件选项类型，默认为 any
 * @template Data - 组件数据类型，默认为 any
 */
export interface StandardComponentType<
  ComponentProp extends AllComponentType = AllComponentType,
  Option = any,
  Data = any
> {
  /** 组件ID */
  id: number;

  /** 组件基础配置 */
  component: {
    /** 组件属性 */
    prop: ComponentProp;

    /** 宽度 */
    width: number;

    /** 高度 */
    height: number;

    /** 组件名称 */
    name: string;
  };

  /** 是否为分组（可选） */
  group?: boolean;

  /** 是否被选中（可选） */
  selected?: boolean;

  /** 子组件列表（可选） */
  children?: ComponentType[];

  /** 组件名称 */
  name: string;

  /** 左边距 */
  left: number;

  /** 顶边距 */
  top: number;

  /** 是否锁定 */
  isLock?: boolean;

  /** Z轴层级 */
  zIndex: number;

  /** 是否显示 */
  display: boolean;

  /** 组件选项配置 */
  option: Option;

  /** 组件数据 */
  data: Data;

  /** 组件图片 */
  img: string;

  /** 组件标题 */
  title: string;

  /** 监听参数列表 */
  listenArgs: ListenArg[];

  /** 回调参数列表 */
  cbArgs: Callback[];

  /** 是否开启过滤器 */
  openFilter?: boolean;

  /** 数据源 */
  dataSource: DataSourceType;

  /** 数据类型 */
  dataType: DataType;

  /** 数据映射配置列表 */
  dataRemark?: DataRemark[];

  /** 事件列表 */
  events: Event[];

  /** 加密事件列表（可选） */
  encodes?: EncodeEvent[];

  /** URL（可选） */
  url?: string;

  /** 路径（可选） */
  path?: string;

  /** 数据查询（可选） */
  dataQuery?: string;

  /** 加载动画配置 */
  loadAnimation: Animation;

  /** 预设子组件列表（可选） */
  presetChild?: ChildComponent[];

  /** 素材库条目列表（可选）。注意不是 MinioResource，见 ComponentMinioAsset 的说明 */
  minioArr?: ComponentMinioAsset[];

  /** 是否启用数据分析（可选） */
  enableDataAnalysis?: boolean;

  /** 数据分析名称（可选） */
  dataAnalysisName?: string;

  /** 父组件ID（可选） */
  parent?: number;

  /** 单位铺满类型（可选） */
  unitPavenType?: "percent";

  /** @description 约束布局 纵向 */
  verticalConst?: verticalConstEnum;

  /** @description 约束布局 横向 */
  horizontalConst?: horizontalConstEnum;
}

/**
 * 组件类型（允许任意扩展字段）
 * @description 标准组件类型的扩展版本，允许添加任意字段，但限制某些冲突字段
 * @template ComponentProp - 组件属性类型，默认为 AllComponentType
 * @template Option - 组件选项类型，默认为 any
 * @template Data - 组件数据类型，默认为 any
 */
export type ComponentType<
  ComponentProp extends AllComponentType = AllComponentType,
  Option = any,
  Data = any
> = StandardComponentType<ComponentProp, Option, Data> & {
  /** 其他任意属性 */
  [key: string]: any;
} & {
  /** 宽度字段被限制（可选） */
  width?: never;

  /** 高度字段被限制（可选） */
  height?: never;

  /** 父级动态面板ID列表（可选） */
  parentDynamicPanelId?: number[];

  /** 父级编码ID（可选） */
  parentEncodeId?: string;
};
