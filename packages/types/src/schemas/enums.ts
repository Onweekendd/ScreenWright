import { z } from "zod";

// 导入组件枚举类型和动作相关枚举
import {
  BarEchartEnum,
  EquipmentEnum,
  ExhibitEnum,
  extendsEnum,
  FolderEnum,
  indicatorEchartEnum,
  indicatorEnum,
  interactiveEnum,
  lineEchartEnum,
  mediaEnum,
  otherEchartEnum,
  PanelEnum,
  pieEchartEnum,
  projectEchartEnum,
  ringEchartEnum,
  scatterEchartEnum,
  textEnum,
  ThirdPartEnum,
  threeComponentEnum
} from "../types/componentProp";

// ============================================
// Component Enum Schemas
// ============================================

/** 图表类型枚举 Schema */
export const BarEchartEnumSchema = z.enum(Object.values(BarEchartEnum));
export const lineEchartEnumSchema = z.enum(Object.values(lineEchartEnum));
export const otherEchartEnumSchema = z.enum(Object.values(otherEchartEnum));
export const pieEchartEnumSchema = z.enum(Object.values(pieEchartEnum));
export const projectEchartEnumSchema = z.enum(Object.values(projectEchartEnum));
export const ringEchartEnumSchema = z.enum(Object.values(ringEchartEnum));
export const scatterEchartEnumSchema = z.enum(Object.values(scatterEchartEnum));
export const indicatorEchartEnumSchema = z.enum(Object.values(indicatorEchartEnum));

/** 媒体类型枚举 Schema */
export const mediaEnumSchema = z.enum(Object.values(mediaEnum));

/** 展品类型枚举 Schema */
export const ExhibitEnumTypeSchema = z.enum(Object.values(ExhibitEnum));

/** 设备类型枚举 Schema */
export const EquipmentEnumTypeSchema = z.enum(Object.values(EquipmentEnum));

/** 文件夹类型枚举 Schema */
export const FolderTypeSchema = z.enum(Object.values(FolderEnum));

/** 指标类型枚举 Schema */
export const indicatorEnumSchema = z.enum(Object.values(indicatorEnum));

/** 交互类型枚举 Schema */
export const interactiveEnumSchema = z.enum(Object.values(interactiveEnum));

/** 文本类型枚举 Schema */
export const textEnumSchema = z.enum(Object.values(textEnum));

/** 第三方类型枚举 Schema */
export const thirdPartyEnumSchema = z.enum(Object.values(ThirdPartEnum));

/** 3D组件类型枚举 Schema */
export const threeComponentEnumSchema = z.enum(Object.values(threeComponentEnum));

/** 扩展类型枚举 Schema */
export const extendsEnumTypeSchema = z.enum(Object.values(extendsEnum));

/** 面板类型枚举 Schema */
export const PanelEnumSchema = z.enum(Object.values(PanelEnum));

/** 所有组件类型的联合 Schema */
export const allComponentTypeSchema = z.union([
  BarEchartEnumSchema,
  lineEchartEnumSchema,
  otherEchartEnumSchema,
  pieEchartEnumSchema,
  projectEchartEnumSchema,
  ringEchartEnumSchema,
  scatterEchartEnumSchema,
  indicatorEchartEnumSchema,
  mediaEnumSchema,
  ExhibitEnumTypeSchema,
  EquipmentEnumTypeSchema,
  FolderTypeSchema,
  extendsEnumTypeSchema,
  indicatorEnumSchema,
  interactiveEnumSchema,
  textEnumSchema,
  thirdPartyEnumSchema,
  threeComponentEnumSchema,
  PanelEnumSchema
]);
