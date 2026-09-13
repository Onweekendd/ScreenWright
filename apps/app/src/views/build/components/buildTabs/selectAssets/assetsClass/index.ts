import { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type AssetsBaseClass from "../assetsBaseClass";
import { AssetsMenuKeyEnum } from "../assetsMenuType";
import AiTemplateClass from "./AiTemplateClass";
import AssetsCloudClass from "./AssetsCloudClass";
import LocalAssetsClass from "./LocalAssetsClass";
import SystemMaterialClass from "./SystemMaterialClass";
import type { AssetItem, GroupItem } from "./types";

// 导出所有资产类
export { AiTemplateClass, AssetsCloudClass, LocalAssetsClass, SystemMaterialClass };

// 导出类型定义
export * from "./types";

// 标题到 AssetsMenuKeyEnum 的映射
export const TITLE_TO_KEY_MAP: Record<string, AssetsMenuKeyEnum> = {
  系统素材: AssetsMenuKeyEnum.systemMaterial,
  资产库: AssetsMenuKeyEnum.assetsCloud,
  本应用资产: AssetsMenuKeyEnum.localAssets,
  AI模板: AssetsMenuKeyEnum.aiTemplate
};

// FileTypeEnum 到标题的映射
export const FILE_TYPE_TO_TITLE_MAP: Record<number, string> = {
  [FileTypeEnum.systemMaterial]: "系统素材",
  [FileTypeEnum.personalScreen]: "本应用资产",
  [FileTypeEnum.personalPageAssets]: "资产库",
  [FileTypeEnum.cityEditorAssets]: "城市编辑器资产"
};

// 资产类工厂，根据 AssetsMenuKeyEnum 创建对应的资产类实例
export const createAssetsClass = (key: AssetsMenuKeyEnum): AssetsBaseClass<any, any> => {
  const assetClassMap = new Map<AssetsMenuKeyEnum, () => AssetsBaseClass<any, any>>([
    [AssetsMenuKeyEnum.systemMaterial, () => new SystemMaterialClass()],
    [AssetsMenuKeyEnum.localAssets, () => new LocalAssetsClass()],
    [AssetsMenuKeyEnum.assetsCloud, () => new AssetsCloudClass()],
    [AssetsMenuKeyEnum.aiTemplate, () => new AiTemplateClass()]
  ]);

  const createClass = assetClassMap.get(key);
  if (!createClass) {
    throw new Error(`不支持的资产类型: ${key}`);
  }

  return createClass();
};

// 根据标题创建资产类实例（兼容性函数）
export const createAssetsClassByTitle = (title: string): AssetsBaseClass<AssetItem, GroupItem> => {
  const key = TITLE_TO_KEY_MAP[title];
  if (!key) {
    throw new Error(`不支持的资产类型标题: ${title}`);
  }
  return createAssetsClass(key);
};

// 根据 FileTypeEnum 获取标题
export const getTitleByFileType = (fileType: FileTypeEnum): string => {
  return FILE_TYPE_TO_TITLE_MAP[fileType] || "未知资产类型";
};

// 根据标题获取 FileTypeEnum
export const getFileTypeByTitle = (title: string): FileTypeEnum | undefined => {
  const entry = Object.entries(FILE_TYPE_TO_TITLE_MAP).find(([_, value]) => value === title);
  return entry ? (Number(entry[0]) as FileTypeEnum) : undefined;
};

// 获取所有资产类实例
export const getAllAssetClassInstances = (): AssetsBaseClass<any, any>[] => {
  return Object.values(AssetsMenuKeyEnum).map((key) => createAssetsClass(key));
};

// 根据编辑分组能力筛选资产类
export const getAssetClassesByEditGroupCapability = (canEditGroup: boolean): AssetsBaseClass<any, any>[] => {
  return getAllAssetClassInstances().filter((instance) => instance.isAvailableEditGroup === canEditGroup);
};

// 根据编辑资产能力筛选资产类
export const getAssetClassesByEditAssetCapability = (canEditAsset: boolean): AssetsBaseClass<any, any>[] => {
  return getAllAssetClassInstances().filter((instance) => instance.isAvailableEditAsset === canEditAsset);
};

// 根据编辑能力和资产类型筛选资产类
export const getAssetClassesByEditCapabilities = (
  canEditGroup: boolean,
  canEditAsset: boolean
): AssetsBaseClass<any, any>[] => {
  return getAllAssetClassInstances().filter(
    (instance) => instance.isAvailableEditGroup === canEditGroup && instance.isAvailableEditAsset === canEditAsset
  );
};

// 资产类管理器，提供统一的资产操作接口
export class AssetsClassManager {
  private static instance: AssetsClassManager;
  private classInstances = new Map<AssetsMenuKeyEnum, AssetsBaseClass<AssetItem, GroupItem>>();

  private constructor() {}

  public static getInstance(): AssetsClassManager {
    if (!AssetsClassManager.instance) {
      AssetsClassManager.instance = new AssetsClassManager();
    }
    return AssetsClassManager.instance;
  }

  /**
   * 获取资产类实例
   * @param key 资产类型枚举
   * @returns 资产类实例
   */
  public getAssetsClass(key: AssetsMenuKeyEnum): AssetsBaseClass<AssetItem, GroupItem> {
    if (!this.classInstances.has(key)) {
      this.classInstances.set(key, createAssetsClass(key));
    }
    return this.classInstances.get(key)!;
  }

  /**
   * 根据标题获取资产类实例（兼容性方法）
   * @param title 资产类型标题
   * @returns 资产类实例
   */
  public getAssetsClassByKey(key: AssetsMenuKeyEnum): AssetsBaseClass<any, any> {
    if (!key) {
      throw new Error(`不支持的资产类型标题: ${key}`);
    }
    return this.getAssetsClass(key);
  }

  /**
   * 根据标题获取资产类实例（兼容性方法）
   * @param title 资产类型标题
   * @returns 资产类实例
   */
  public getAssetsClassByTitle(title: string): AssetsBaseClass<AssetItem, GroupItem> {
    const key = TITLE_TO_KEY_MAP[title];
    if (!key) {
      throw new Error(`不支持的资产类型标题: ${title}`);
    }
    return this.getAssetsClass(key);
  }

  /**
   * 清除缓存的实例
   * @param key 可选的特定资产类型，不传则清除所有缓存
   */
  public clearCache(key?: AssetsMenuKeyEnum) {
    if (key) {
      this.classInstances.delete(key);
    } else {
      this.classInstances.clear();
    }
  }

  /**
   * 根据标题清除缓存（兼容性方法）
   * @param title 资产类型标题
   */
  public clearCacheByTitle(title: string) {
    const key = TITLE_TO_KEY_MAP[title];
    if (key) {
      this.clearCache(key);
    }
  }

  /**
   * 获取所有可用的资产类型标题
   * @returns 资产类型标题数组
   */
  public getAllAssetTypes(): string[] {
    return Object.keys(TITLE_TO_KEY_MAP);
  }

  /**
   * 根据标题获取对应的枚举键
   * @param title 资产类型标题
   * @returns 对应的 AssetsMenuKeyEnum 键值
   */
  public titleToKey(title: string): AssetsMenuKeyEnum | undefined {
    return TITLE_TO_KEY_MAP[title];
  }

  /**
   * 根据 FileTypeEnum 获取标题
   * @param fileType 文件类型枚举
   * @returns 对应的资产类型标题
   */
  public getTitleByFileType(fileType: FileTypeEnum): string {
    return FILE_TYPE_TO_TITLE_MAP[fileType] || "未知资产类型";
  }

  /**
   * 根据标题获取 FileTypeEnum
   * @param title 资产类型标题
   * @returns 对应的 FileTypeEnum 值
   */
  public getFileTypeByTitle(title: string): FileTypeEnum | undefined {
    const entry = Object.entries(FILE_TYPE_TO_TITLE_MAP).find(([_, value]) => value === title);
    return entry ? (Number(entry[0]) as FileTypeEnum) : undefined;
  }

  /**
   * 获取所有可用的 FileTypeEnum
   * @returns FileTypeEnum 数组
   */
  public getAllFileTypes(): FileTypeEnum[] {
    return Object.keys(FILE_TYPE_TO_TITLE_MAP).map((key) => Number(key) as FileTypeEnum);
  }

  /**
   * 获取所有可用的 FileTypeEnum 和对应标题的映射
   * @returns FileTypeEnum 到标题的映射对象
   */
  public getFileTypeTitleMap(): Record<number, string> {
    return { ...FILE_TYPE_TO_TITLE_MAP };
  }

  /**
   * 获取所有资产类实例
   * @returns 所有资产类实例数组
   */
  public getAllAssetClassInstances(): AssetsBaseClass<AssetItem, GroupItem>[] {
    return Object.values(AssetsMenuKeyEnum).map((key) => this.getAssetsClass(key));
  }

  /**
   * 根据编辑分组能力筛选资产类
   * @param canEditGroup 是否可编辑分组
   * @returns 符合条件的资产类实例数组
   */
  public getAssetClassesByEditGroupCapability(canEditGroup: boolean): AssetsBaseClass<AssetItem, GroupItem>[] {
    return this.getAllAssetClassInstances().filter((instance) => instance.isAvailableEditGroup === canEditGroup);
  }

  /**
   * 根据编辑资产能力筛选资产类
   * @param canEditAsset 是否可编辑资产
   * @returns 符合条件的资产类实例数组
   */
  public getAssetClassesByEditAssetCapability(canEditAsset: boolean): AssetsBaseClass<AssetItem, GroupItem>[] {
    return this.getAllAssetClassInstances().filter((instance) => instance.isAvailableEditAsset === canEditAsset);
  }

  /**
   * 根据添加资产能力筛选资产类
   * @param canAddAsset 是否可添加资产
   * @returns 符合条件的资产类实例数组
   */
  public getAssetClassesByAddAssetCapability(canAddAsset: boolean): AssetsBaseClass<AssetItem, GroupItem>[] {
    return this.getAllAssetClassInstances().filter((instance) => instance.isAvailableAddAsset === canAddAsset);
  }

  /**
   * 根据编辑能力和筛选资产类
   * @param canEditGroup 是否可编辑分组
   * @param canEditAsset 是否可编辑资产
   * @returns 符合条件的资产类实例数组
   */
  public getAssetClassesByEditCapabilities(
    canEditGroup: boolean,
    canEditAsset: boolean
  ): AssetsBaseClass<AssetItem, GroupItem>[] {
    return this.getAllAssetClassInstances().filter(
      (instance) => instance.isAvailableEditGroup === canEditGroup && instance.isAvailableEditAsset === canEditAsset
    );
  }

  /**
   * 获取可编辑分组的资产类型标题
   * @returns 可编辑分组的资产类型标题数组
   */
  public getEditableGroupAssetTypes(): string[] {
    return this.getAssetClassesByEditGroupCapability(true)
      .map((instance) => {
        const keys = Object.keys(TITLE_TO_KEY_MAP);
        return keys.find((title) => TITLE_TO_KEY_MAP[title] === instance.assetsMenuKey);
      })
      .filter((title): title is string => Boolean(title));
  }

  /**
   * 获取可编辑资产的资产类型标题
   * @returns 可编辑资产的资产类型标题数组
   */
  public getEditableAssetTypes(): string[] {
    return this.getAssetClassesByEditAssetCapability(true)
      .map((instance) => {
        const keys = Object.keys(TITLE_TO_KEY_MAP);
        return keys.find((title) => TITLE_TO_KEY_MAP[title] === instance.assetsMenuKey);
      })
      .filter((title): title is string => Boolean(title));
  }

  /**
   * 获取可添加资产的资产类型标题
   * @returns 可添加资产的资产类型标题数组
   */
  public getAddableAssetTypes(): string[] {
    return this.getAssetClassesByAddAssetCapability(true)
      .map((instance) => {
        const keys = Object.keys(TITLE_TO_KEY_MAP);
        return keys.find((title) => TITLE_TO_KEY_MAP[title] === instance.assetsMenuKey);
      })
      .filter((title): title is string => Boolean(title));
  }

  /**
   * 获取只读资产类型标题
   * @returns 只读资产类型标题数组
   */
  public getReadOnlyAssetTypes(): string[] {
    return this.getAssetClassesByEditCapabilities(false, false)
      .map((instance) => {
        const keys = Object.keys(TITLE_TO_KEY_MAP);
        return keys.find((title) => TITLE_TO_KEY_MAP[title] === instance.assetsMenuKey);
      })
      .filter((title): title is string => Boolean(title));
  }

  /**
   * 获取所有可以删除资产的类实例
   * @returns 可以删除资产的类实例数组
   */
  public getDeletableAssetClassInstances(): AssetsBaseClass<AssetItem, GroupItem>[] {
    return this.getAllAssetClassInstances().filter((instance) => instance.isAvailableEditAsset === true);
  }

  /**
   * 获取所有可以删除资产的资产类型标题
   * @returns 可以删除资产的资产类型标题数组
   */
  public getDeletableAssetTypes(): string[] {
    return this.getDeletableAssetClassInstances()
      .map((instance) => {
        const keys = Object.keys(TITLE_TO_KEY_MAP);
        return keys.find((title) => TITLE_TO_KEY_MAP[title] === instance.assetsMenuKey);
      })
      .filter((title): title is string => Boolean(title));
  }

  /**
   * 判断指定标题的资产类型是否可以删除资产
   * @param title 资产类型标题
   * @returns 是否可以删除
   */
  public canDeleteAsset(title: string): boolean {
    const key = TITLE_TO_KEY_MAP[title];
    if (!key) {
      return false;
    }
    const instance = this.getAssetsClass(key);
    return instance.isAvailableEditAsset;
  }
}

// 导出单例管理器实例
export const assetsClassManager = AssetsClassManager.getInstance();

// 使用示例：
// 获取所有资产类实例并根据编辑能力进行筛选
// const allInstances = assetsClassManager.getAllAssetClassInstances()
// const editableGroupInstances = assetsClassManager.getAssetClassesByEditGroupCapability(true)
// const editableAssetInstances = assetsClassManager.getAssetClassesByEditAssetCapability(true)
// const readOnlyInstances = assetsClassManager.getAssetClassesByEditCapabilities(false, false)

// 获取资产类型标题
// const editableGroupTypes = assetsClassManager.getEditableGroupAssetTypes()
// const editableAssetTypes = assetsClassManager.getEditableAssetTypes()
// const readOnlyTypes = assetsClassManager.getReadOnlyAssetTypes()

// 获取可删除资产的类实例和类型
// const deletableInstances = assetsClassManager.getDeletableAssetClassInstances()
// const deletableTypes = assetsClassManager.getDeletableAssetTypes()
// const canDelete = assetsClassManager.canDeleteAsset("资产库") // true

// 使用资产类实例进行删除操作
// const assetsClass = assetsClassManager.getAssetsClassByTitle("资产库")
// await assetsClass.deleteAsset(assetId)
