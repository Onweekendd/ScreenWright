import type {
  Action as ParticleAction,
  ActionAnimation,
  AllComponentType,
  Animation,
  BindComponent,
  Callback,
  CallbackManager,
  CallbackSource,
  CallbackTarget,
  ChildComponent,
  ComponentMinioAsset,
  ComponentType,
  Condition,
  DataRemark,
  DataSourceType,
  DbItem,
  EncodeAction,
  EncodeEvent,
  Event,
  Filter,
  IotAddress,
  ListenArg,
  MinioResource,
  StandardComponentType,
  TempPool,
  WebSocketDataSource
} from "@screenwright/types";
type Action = Required<ParticleAction>;

export type { Action };

import { DataType, FolderEnum } from "@screenwright/types";

import {
  indicatorEnum,
  interactiveEnum,
  mediaEnum,
  textEnum,
  threeComponentEnum
} from "@/components/componentEntry/type";

import type { AllEchartType } from "../buildRender/core/BaseComponent/type";
import type { PanelState, PanelType } from "../buildRender/core/SystemComponent/type";
import { ExhibitEnumType } from "./core/ExhibitComponent/type";
import { extendsChildComponentEnumType, extendsEnumType } from "./core/ExtendsComponents/type";
import type { sceneEnumType } from "./core/SceneComponent/type";
import { ThirdPartEnumType } from "./core/ThirdParty/type";

export const renderFolderType: FolderEnum[] = [FolderEnum.group];

export {
  ActionAnimation,
  AllComponentType,
  Animation,
  BindComponent,
  Callback,
  CallbackManager,
  CallbackSource,
  CallbackTarget,
  ChildComponent,
  ComponentMinioAsset,
  ComponentType,
  Condition,
  DataRemark,
  DataSourceType,
  DataType,
  DbItem,
  AllEchartType as EchartEnum,
  EncodeAction,
  EncodeEvent,
  Event,
  ExhibitEnumType,
  extendsChildComponentEnumType,
  extendsEnumType,
  Filter,
  FolderEnum as FolderType,
  indicatorEnum,
  interactiveEnum,
  IotAddress,
  ListenArg,
  mediaEnum,
  MinioResource,
  PanelType as PanelEnum,
  sceneEnumType,
  StandardComponentType,
  TempPool,
  textEnum,
  ThirdPartEnumType,
  threeComponentEnum,
  WebSocketDataSource
};

// 右键菜单类型
export enum ContextMenuType {
  // 置顶
  TOP = "top",
  // 置底
  BOTTOM = "bottom",
  // 上移
  UP = "up",
  // 下移
  DOWN = "down",
  // 成组
  GROUP = "group",
  // 解组
  UN_GROUP = "unGroup",
  // 删除图层
  DEL = "delete",
  // 复制图层
  COPY = "copy",
  // 粘贴图层
  PASTE = "paste",
  // 复制样式
  COPY_STYLE = "copyStyle",
  // 粘贴样式
  PASTE_STYLE = "pasteStyle",
  // 同步样式
  SYNC_STYLE = "syncStyle",
  // 添加案例
  ADD_CASE = "addCase",
  // 添加用户案例
  ADD_PERSON_CASE = "addPersonCase",
  // 锁定
  LOCK = "lock",
  // 解锁
  UN_LOCK = "unLock",
  // 清除
  CLEAR = "clear",
  // 转换成动态面板
  TranslateDynamicPanel = "translateDynamicPanel"
}

export interface MenuOptionsItemType {
  label: string;
  key: ContextMenuType;
  icon: string;
  fnHandle?: (targetStatus?: PanelState) => void;
  disabled?: boolean;
  hidden?: boolean;
}

// 操作目标
export interface TargetChartType {
  hoverId?: number;
  selectId: string[];
}
// 编辑画布属性
export enum EditCanvasTypeEnum {
  EDIT_LAYOUT_DOM = "editLayoutDom",
  EDIT_CONTENT_DOM = "editContentDom",
  OFFSET = "offset",
  SCALE = "scale",
  USER_SCALE = "userScale",
  LOCK_SCALE = "lockScale",
  IS_CREATE = "isCreate",
  IS_DRAG = "isDrag",
  IS_SELECT = "isSelect",
  IS_CODE_EDIT = "isCodeEdit"
}
// 鼠标点击左右键
export enum MouseEventButton {
  LEFT = 1,
  RIGHT = 2
}

export interface EditCanvasType {
  editLayoutDom: HTMLElement | null;
  editContentDom: HTMLElement | null;
  offset: number;
  userScale: number;
  lockScale: boolean;
  isCreate: boolean;
  isDrag: boolean;
  isSelect: boolean;
  isCodeEdit: boolean;
}

// 页面拖拽键名
export enum DragKeyEnum {
  DRAG_KEY = "ComponentData"
}

export interface IComponent {
  width: number;
  height: number;
  name: string;
  prop: string;
}

export enum direction {
  l = "l",
  t = "t",
  b = "b",
  r = "r",
  lt = "lt",
  rt = "rt",
  lb = "lb",
  rb = "rb"
}

export interface LayerInfo {
  color: string;
  name: string;
  callBackField: string;
  childNodeField: string;
}

export interface Scale {
  lock: boolean;
  origin: string;
  originGrid: OriginGrid;
  x: number;
  y: number;
}

interface OriginGrid {
  left: string;
  top: string;
}

export interface Translate {
  toX: number;
  toY: number;
}

export interface Ue4Config {
  messageName: string;
  messageJson: string;
  messageContent: string;
  messageType: string;
}

export interface SceneObjectExplosion {
  index: string;
  lidName: string;
  baseName: string;
  type: string;
}
