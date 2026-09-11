import { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { ApiParams } from "./assetsBaseClass";
import { assetsClassManager } from "./assetsClass";
import type {
  AssetsGroupForRender,
  BaseDataApiOption,
  DataProcessor,
  FileTypeProcessor,
  MenuItemForRender,
  SingleAssetsTypeForRender
} from "./assetsMenuType";
import { AssetsMenuKeyEnum } from "./assetsMenuType";

const { MINIO_BASE_URL } = process.env;

class DefaultFileTypeProcessor implements FileTypeProcessor {
  /**
   * 获取文件类型信息
   * @param url 文件URL
   * @returns 包含文件类型、是否为视频、是否为音频的信息
   */
  getFileTypeInfo(url: string): { fileType: string; isVideo: boolean; isAudio: boolean } {
    const fileType = url.toLowerCase().split(".").pop() || "";
    const isVideo = ["mp4", "webm", "ogg"].includes(fileType);
    const isAudio = ["mpeg", "wav", "ogg", "aac", "flac", "x-m4a", "m4a", "x-ms-wma", "opus", "mp3"].includes(fileType);
    return { fileType, isVideo, isAudio };
  }
}

class AssetDataProcessor implements DataProcessor {
  /**
   * 构造函数
   * @param fileTypeProcessor 文件类型处理器实例
   */
  constructor(private fileTypeProcessor: FileTypeProcessor) {}

  /**
   * 处理资产数据，过滤音频文件并添加显示信息
   * @param records 原始数据记录
   * @param key 资产菜单键值
   * @returns 处理后的数据记录
   */
  process(records: Record<string, unknown>[], _key: AssetsMenuKeyEnum): Record<string, unknown>[] {
    const filteredRecords = records.filter((item) => {
      return !this.fileTypeProcessor.getFileTypeInfo(String(item.url)).isAudio;
    });

    return filteredRecords.map((item) => {
      const { fileType, isVideo } = this.fileTypeProcessor.getFileTypeInfo(String(item.url));
      return {
        moduleId: isVideo ? 47 : 43,
        ...item,
        title: item.name,
        img: `${MINIO_BASE_URL}${item.url}`,
        type: isVideo ? "video" : "img",
        isVideo,
        fileType
      };
    });
  }
}

/**
 * 资产菜单管理器
 * 负责管理各种资产类型的菜单数据、数据处理和分页加载
 */
export class AssetsMenuManager {
  private static instance: AssetsMenuManager;
  private fileTypeProcessor: FileTypeProcessor;
  private dataProcessors!: Map<string, DataProcessor>;

  /**
   * 私有构造函数，使用单例模式
   */
  private constructor() {
    this.fileTypeProcessor = new DefaultFileTypeProcessor();
    this.initializeDataProcessors();
  }

  /**
   * 初始化数据处理器
   */
  private initializeDataProcessors(): void {
    this.dataProcessors = new Map();
    this.dataProcessors.set("default", new AssetDataProcessor(this.fileTypeProcessor));
  }

  /**
   * 获取单例实例
   * @returns AssetsMenuManager 实例
   */
  public static getInstance(): AssetsMenuManager {
    if (!AssetsMenuManager.instance) {
      AssetsMenuManager.instance = new AssetsMenuManager();
    }
    return AssetsMenuManager.instance;
  }

  /**
   * 根据资产标题获取资产配置信息
   * @param title 资产标题
   * @returns 资产配置信息，包含标题、键值和是否可添加的标志
   */
  public getAssetConfigByTitle(title: string): { title: string; key: AssetsMenuKeyEnum; canAdd: boolean } | undefined {
    try {
      // 直接从资产类管理器获取配置信息
      const assetsClass = assetsClassManager.getAssetsClassByTitle(title);

      // 从资产类获取基本信息
      const key = assetsClassManager.titleToKey(title);
      if (!key) {
        return undefined;
      }

      return {
        title,
        key,
        canAdd: assetsClass.isAvailableEditAsset || assetsClass.isAvailableEditGroup
      };
    } catch (error) {
      console.error(`获取资产配置失败: ${title}`, error);
      return undefined;
    }
  }

  /**
   * 批量获取资产库数据
   * @param assetTitles 资产标题数组
   * @returns 包含资产映射和资产数据的对象
   */
  public async getAssetsLibraryData(assetTitles: string[]) {
    const libraryMap = assetTitles.map((title) => this.getAssetConfigByTitle(title)).filter(Boolean);

    const libraryMapData: SingleAssetsTypeForRender[] = [];

    for (const item of libraryMap) {
      if (item) {
        const processedData = await this.buildAssetMenuItem(item);
        if (processedData) {
          libraryMapData.push(processedData);
        }
      }
    }

    return {
      libraryMap,
      libraryMapData
    };
  }

  /**
   * 刷新单个资产菜单项
   * @param title 资产标题
   * @returns 刷新后的菜单项数据
   */
  public async refreshAssetMenuItem(title: string) {
    const assetConfig = this.getAssetConfigByTitle(title);
    if (!assetConfig) {
      return null;
    }

    const menuItemData = await this.buildAssetMenuItem(assetConfig);
    return menuItemData;
  }

  /**
   * 构建资产菜单项
   * @param assetConfig 资产配置信息
   * @returns 构建的菜单项数据
   */
  private async buildAssetMenuItem(assetConfig: {
    title: string;
    key: AssetsMenuKeyEnum;
    canAdd: boolean;
  }): Promise<SingleAssetsTypeForRender | null> {
    try {
      // 获取对应的资产类实例
      const assetsClass = assetsClassManager.getAssetsClass(assetConfig.key);

      // 获取分组数据
      const groups = await assetsClass.getAssetsGroup();

      // 使用资产类的转换方法
      return assetsClass.transformToMenuGroupItem(groups, assetConfig.canAdd);
    } catch (error) {
      console.error(`获取${assetConfig.title}数据失败:`, error);
      return null;
    }
  }

  /**
   * 根据参数获取资产数据（直接返回资产类的结果）
   * @param option 数据获取选项
   * @returns 资产数据数组
   */
  public async fetchAssetDataByParams(option: BaseDataApiOption) {
    // 获取对应的资产类实例
    const assetsClass = assetsClassManager.getAssetsClass(option.key);

    // 构建API参数
    const apiParams: ApiParams = {
      current: option.params.current,
      size: option.params.size,
      groupId: option.groupId
    };

    // 根据不同的资产类型设置特定参数
    if (option.key === AssetsMenuKeyEnum.localAssets || option.key === AssetsMenuKeyEnum.assetsCloud) {
      apiParams.largeId = option.largeId;
      apiParams.fileType =
        option.key === AssetsMenuKeyEnum.localAssets ? FileTypeEnum.personalScreen : FileTypeEnum.personalPageAssets;
      apiParams.time = 1;
    }

    console.log("📄 分页请求参数:", {
      assetType: option.key,
      current: apiParams.current,
      size: apiParams.size,
      groupId: apiParams.groupId
    });

    // 直接使用资产类获取数据
    const result = await assetsClass.getAssets(apiParams);

    const rowData = result.results;
    const UIRenderData = assetsClass.transformAssetsData(rowData);

    console.log("📄 分页请求结果:", {
      assetType: option.key,
      returnedCount: result.results.length,
      total: result.total,
      expectedSize: apiParams.size
    });

    return {
      ...result,
      results: UIRenderData
    };
  }

  /**
   * 加载资产数据并更新分页状态
   * @param menuGroupItem 菜单组子项
   * @param assetKey 资产类型键值
   * @param largeId 大屏ID（可选）
   * @returns 更新后的菜单组子项
   */
  public async loadAssetDataWithPagination(
    menuGroupItem: AssetsGroupForRender,
    assetKey: AssetsMenuKeyEnum,
    largeId?: string | string[]
  ): Promise<AssetsGroupForRender> {
    try {
      const { results: assets, total } = await this.fetchAssetDataByParams({
        groupId: menuGroupItem.groupId,
        key: assetKey,
        largeId: largeId || "",
        params: {
          current: menuGroupItem.pageNum,
          size: menuGroupItem.pageSize,
          total: menuGroupItem.total
        }
      });

      console.log("📄 分页状态更新前:", {
        currentPage: menuGroupItem.pageNum,
        existingChildrenCount: menuGroupItem.children.length,
        newAssetsCount: assets.length,
        pageSize: menuGroupItem.pageSize
      });

      // 更新子项数据：第一页覆盖，后续页追加
      if (menuGroupItem.pageNum === 1) {
        menuGroupItem.children = assets as unknown as MenuItemForRender[];
      } else {
        menuGroupItem.children.push(...(assets as unknown as MenuItemForRender[]));
      }

      // 更新分页状态
      if (assets.length === menuGroupItem.pageSize) {
        // 如果返回的数据量等于页面大小，说明可能还有下一页
        menuGroupItem.pageNum++;
      }

      // 更新总数：使用已加载的数据量
      // 注意：这里我们使用已加载的数据量作为总数，因为API可能不返回准确的总数
      menuGroupItem.total = total;

      console.log("📄 分页状态更新后:", {
        currentPage: menuGroupItem.pageNum,
        totalChildren: menuGroupItem.children.length,
        hasMoreData: assets.length === menuGroupItem.pageSize
      });

      return menuGroupItem;
    } catch (error) {
      console.error("加载资产数据失败:", error);
      return menuGroupItem;
    }
  }

  /**
   * 重置并加载第一页数据
   * @param menuGroupItem 菜单组子项
   * @param assetKey 资产类型键值
   * @param largeId 大屏ID（可选）
   * @returns 更新后的菜单组子项
   */
  public async loadFirstPageAssetData(
    menuGroupItem: AssetsGroupForRender,
    assetKey: AssetsMenuKeyEnum,
    largeId?: string | string[]
  ): Promise<AssetsGroupForRender> {
    menuGroupItem.pageNum = 1;
    menuGroupItem.children = [];
    menuGroupItem.total = 0;
    return this.loadAssetDataWithPagination(menuGroupItem, assetKey, largeId);
  }
}

// 导出单例实例，方便直接使用
export const assetsMenuManager = AssetsMenuManager.getInstance();
