import type { LargeScreeInfo } from "@screenwright/types";

import type { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

// ==================== 枚举 ====================

/** 资产菜单键值枚举 */
export enum AssetsMenuKeyEnum {
  /** 系统内置素材 */
  systemMaterial = "systemMaterial",
  /** 资产库 */
  assetsCloud = "assetsCloud",
  /** 本应用资产 */
  localAssets = "localAssets",
  /** AI模板（用于给 AI 创建大屏模板） */
  aiTemplate = "aiTemplate"
}

// ==================== 导航相关类型 ====================

/** 导航信息类型 */
export type NavInfo = Omit<LargeScreeInfo, "layers" | "detail" | "config" | "encodedControl"> & {
  config: string[];

  /**
   * 控制编码
   * @example
   * [图层id]-[图层控制编码]-[图层数据value值]
   * 1516180-111122-1
   */
  encodedControl: string[];
};

// ==================== 公共基础类型 ====================

/** 分页参数 */
export interface PaginationParams {
  current: number;
  size: number;
  total: number;
}

/** 分页信息（用于组件状态） */
export interface PaginationInfo {
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 资源 ID 类型（支持单个或多个） */
export type ResourceId = string | string[];

/** 分组 ID 类型（支持数字或字符串） */
export type GroupId = number | string;

/** API 函数类型 */
export type ApiFunction<T = any, R = any> = (params?: T) => Promise<R>;

// ==================== 基础结构类型 ====================

/** 带标题的基础类型 */
interface BaseWithTitle {
  title: string;
}

/** 带键值的基础类型 */
interface BaseWithKey {
  key: AssetsMenuKeyEnum;
}

/** 带分组ID的基础类型 */
interface BaseWithGroupId {
  groupId: GroupId;
}

/** 带资源ID的基础类型 */
interface BaseWithLargeId {
  largeId: ResourceId;
}

// ==================== UI 渲染类型 ====================

/** UI渲染单项类型 */
export interface MenuItemForRender {
  id?: number;
  title: string;
  name?: string;
  img: string;
  isVideo?: boolean | undefined | null;
  moduleId?: number;
  url?: string;
  /** 卡片缩略图；实际添加到画布仍使用 url/img */
  cover?: string;
  fileType?: string;
  type?: string;
  assetType?: FileTypeEnum;
}

export interface ModuleGroupForRender {
  title: string;
  children: MenuItemForRender[];
}

/**
 * 组件模块 UI渲染
 * @example
 * [{
 *  title: "图标",
 *  children: [{
 *    title: "柱状图",
 *    children: [{
 *      name: "条形图",
 *      img: "条形图图片",
 *      moduleId: 1
 *    }]
 *  }]
 * }]
 */
export interface SingleModuleTypeForRender {
  title: string;
  children: ModuleGroupForRender[] | MenuItemForRender[];
  img?: string;
  isNeedAdd?: boolean | undefined | null;
  groupId?: number;
}

export type AllModuleForRender = Array<SingleModuleTypeForRender>;

// ==================== 菜单相关类型 ====================

/** 基础资产项子元素 */
export type AssetsGroupForRender = BaseWithTitle &
  BaseWithGroupId &
  PaginationInfo & {
    children: MenuItemForRender[];
  };

export type SingleAssetsTypeForRender = BaseWithKey &
  BaseWithTitle & {
    children: AssetsGroupForRender[];
    isNeedAdd?: boolean;
  };

export type AllAssetsForRender = Array<SingleAssetsTypeForRender>;

// ==================== API 相关类型 ====================

/** 基础数据 API 请求选项 */
export interface BaseDataApiOption extends BaseWithKey, BaseWithGroupId, BaseWithLargeId {
  params: PaginationParams;
}

/** 数据 API 请求选项 */
export interface DataApiOption extends BaseWithKey, BaseWithLargeId {
  menuGroupItem: AssetsGroupForRender;
  groupType?: number;
}

/** 获取资产数据选项 */
export interface GetMaterialDataOption extends BaseWithTitle, BaseWithLargeId {
  menuGroupItem: AssetsGroupForRender | ModuleGroupForRender;
  resetUpdate: boolean;
}

/** 通用请求参数 */
export interface RequireParams extends PaginationParams, BaseWithGroupId {
  largeId?: ResourceId;
  fileType?: FileTypeEnum;
  type?: number;
  time?: 1;
}

// ==================== 处理器接口 ====================

/** 文件类型信息 */
export interface FileTypeInfo {
  fileType: string;
  isVideo: boolean;
  isAudio: boolean;
}

/** 文件类型处理器 */
export interface FileTypeProcessor {
  getFileTypeInfo(url: string): FileTypeInfo;
}

/** 数据处理器 */
export interface DataProcessor {
  process(records: Record<string, unknown>[], key: AssetsMenuKeyEnum): Record<string, unknown>[];
}

// ==================== 类型别名（向后兼容） ====================

/** @deprecated 使用 AssetsGroupForRender 替代 */
export type AssetsMenuGroupChild = AssetsGroupForRender;

/** @deprecated 使用 AssetsGroupForRender 替代 */
export type baseMaterialItemChild = AssetsGroupForRender;

/** @deprecated 使用 SingleAssetsTypeForRender 替代 */
export type baseMaterialItem = SingleAssetsTypeForRender;

/** @deprecated 使用 SingleAssetsTypeForRender 替代 */
export type MenuGroupItem = SingleAssetsTypeForRender;

/** @deprecated 使用 BaseDataApiOption 替代 */
export type baseDataApiOptionType = BaseDataApiOption;

/** @deprecated 使用 GetMaterialDataOption 替代 */
export type getMaterialDataOptionType = GetMaterialDataOption;

/** @deprecated 使用 DataApiOption 替代 */
export type dataApiOptionType = DataApiOption;

/** @deprecated 使用 RequireParams 替代 */
export type requireParams = RequireParams;

/** @deprecated 使用 MenuItemForRender 替代 */
export type menuProps = MenuItemForRender;

/** @deprecated 使用 MenuItemForRender 替代 */
export type MenuItemProps = MenuItemForRender;

/** @deprecated 使用 ModuleGroupForRender 替代 */
export type tabsMenuGroupProps = ModuleGroupForRender;

/** @deprecated 使用 ModuleGroupForRender 替代 */
export type TabsMenuGroupProps = ModuleGroupForRender;
