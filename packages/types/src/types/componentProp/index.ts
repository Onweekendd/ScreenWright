/**
 * 组件属性类型
 * @description 所有组件类型的枚举和联合类型定义
 */

// Echart 图表类型 - 新的 enum
import {
  AllEchartEnum,
  BarEchartEnum,
  IndicatorEchartEnum,
  // 旧的小写别名，保持向后兼容
  indicatorEchartEnum,
  LineEchartEnum,
  lineEchartEnum,
  OtherEchartEnum,
  otherEchartEnum,
  PieEchartEnum,
  pieEchartEnum,
  ProjectEchartEnum,
  projectEchartEnum,
  RingEchartEnum,
  ringEchartEnum,
  ScatterEchartEnum,
  scatterEchartEnum
} from "./echart";

export {
  AllEchartEnum,
  BarEchartEnum,
  IndicatorEchartEnum,
  // 旧的小写别名，保持向后兼容
  indicatorEchartEnum,
  LineEchartEnum,
  lineEchartEnum,
  OtherEchartEnum,
  otherEchartEnum,
  PieEchartEnum,
  pieEchartEnum,
  ProjectEchartEnum,
  projectEchartEnum,
  RingEchartEnum,
  ringEchartEnum,
  ScatterEchartEnum,
  scatterEchartEnum
};

// Echart 类型别名以保持向后兼容
export type {
  AllEchartType,
  BarEchartType,
  EchartComponentType,
  indicatorEchartType,
  lineEchartsType,
  otherEchartType,
  pieEchartType,
  projectEchartType,
  ringEchartType,
  scatterEchartType
} from "./echart";

// 面板类型
export type { PanelType } from "./panel";
export { PanelEnum } from "./panel";

// 文本组件类型
export { TextEnum, textEnum } from "./text";

// 指标组件类型
export { IndicatorEnum, indicatorEnum } from "./indicator";

// 媒体组件类型
export { MediaEnum, mediaEnum } from "./media";

// 交互组件类型
export { InteractiveEnum, interactiveEnum } from "./interactive";

// 三维组件类型
export { ThreeComponentEnum, threeComponentEnum } from "./three-component";

// 场景组件类型
export type { sceneEnumType } from "./scene";
export { SceneEnum, sceneEnum } from "./scene";

// 展品组件类型
export type { ExhibitEnumType } from "./exhibit";
export { ExhibitEnum } from "./exhibit";

// 设备组件类型
export type { EquipmentEnumType } from "./equipment";
export { EquipmentEnum } from "./equipment";

// 第三方组件类型
export type { ThirdPartEnumType } from "./third-party";
export { ThirdPartEnum } from "./third-party";

// 扩展组件类型
export type { extendsChildComponentEnumType, extendsEnumType } from "./extends";
export { ExtendsChildComponentEnum, extendsChildComponentEnum, ExtendsEnum, extendsEnum } from "./extends";

// 导入所有枚举类型以创建联合类型
import type { EchartComponentType } from "./echart";
import { EquipmentEnum } from "./equipment";
import { ExhibitEnum } from "./exhibit";
import { ExtendsChildComponentEnum, ExtendsEnum } from "./extends";
import { IndicatorEnum } from "./indicator";
import { InteractiveEnum } from "./interactive";
import { MediaEnum } from "./media";
import { PanelEnum } from "./panel";
import { SceneEnum } from "./scene";
import { TextEnum } from "./text";
import { ThirdPartEnum } from "./third-party";
import { ThreeComponentEnum } from "./three-component";

/**
 * 文件夹枚举
 * @description 文件夹组件的类型标识
 */
export enum FolderEnum {
  /** 分组文件夹 */
  group = "sw-folder"
}

/** @deprecated 使用 FolderEnum 代替 */
export type FolderType = FolderEnum;

export const allComponentType: AllComponentType[] = [
  ...Object.values(BarEchartEnum),
  ...Object.values(IndicatorEchartEnum),
  ...Object.values(LineEchartEnum),
  ...Object.values(OtherEchartEnum),
  ...Object.values(PieEchartEnum),
  ...Object.values(ProjectEchartEnum),
  ...Object.values(RingEchartEnum),
  ...Object.values(ScatterEchartEnum),
  ...Object.values(PanelEnum),
  ...Object.values(TextEnum),
  ...Object.values(SceneEnum),
  ...Object.values(ThreeComponentEnum),
  ...Object.values(ThirdPartEnum),
  ...Object.values(MediaEnum),
  ...Object.values(InteractiveEnum),
  ...Object.values(IndicatorEnum),
  ...Object.values(ExhibitEnum),
  ...Object.values(ExtendsChildComponentEnum),
  ...Object.values(ExtendsEnum),
  ...Object.values(EquipmentEnum),
  ...Object.values(FolderEnum)
];

/**
 * 所有组件类型的联合类型
 * @description 包含所有组件类型的联合类型，用于类型检查和约束
 */
export type AllComponentType =
  | EchartComponentType
  | PanelEnum
  | TextEnum
  | IndicatorEnum
  | MediaEnum
  | InteractiveEnum
  | ThreeComponentEnum
  | SceneEnum
  | ExhibitEnum
  | EquipmentEnum
  | ThirdPartEnum
  | FolderEnum
  | ExtendsChildComponentEnum
  | ExtendsEnum;
