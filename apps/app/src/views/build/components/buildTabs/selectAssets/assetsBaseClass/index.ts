import type { FileTypeEnum, Form, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { AssetsMenuKeyEnum, MenuItemForRender, SingleAssetsTypeForRender } from "../assetsMenuType";

/**
 * API调用参数接口
 */
export interface ApiParams {
  /** 当前页码 */
  current: number;
  /** 每页大小 */
  size: number;
  /** 总数 */
  total?: number;
  /** 分组ID */
  groupId?: number | string;
  /** 大屏ID */
  largeId?: string | string[];
  /** 文件类型 */
  fileType?: FileTypeEnum;
  /** 类型标识 */
  type?: number;
  /** 时间标识 */
  time?: number;
  /** 应用编码 */
  applicationCode?: string;
}

/**
 * 上传资产参数接口，与 Form 类型兼容
 */
export type UploadAssetParams = Form;

/**
 * 上传结果接口
 */
export interface UploadResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message?: string;
  /** 返回数据 */
  data?: any;
}

/** 卡片预览区渲染类型 */
export type AssetCardPreview = "image" | "video" | "archive";

/** 卡片角标图标类型；null 表示不显示角标 */
export type AssetCardBadge = "image" | "video" | "archive" | null;

/**
 * 资产卡片视图模型
 * 由资产类产出，UI（assetsItem.vue）只负责消费渲染，
 * 不再根据资产标题字符串（如 "代码库"/"本应用资产"）在模板里做分支判断。
 */
export interface AssetCardView {
  /** 卡片标题 */
  title: string;
  /** 封面原始地址（模板侧再经 setMinioUrl 处理） */
  cover: string;
  /** 是否显示标题文本 */
  showTitle: boolean;
  /** 预览区渲染类型 */
  preview: AssetCardPreview;
  /** 右上角类型角标；null 不显示 */
  badge: AssetCardBadge;
  /** 是否显示「选择」按钮 */
  showSelect: boolean;
  /** 是否显示「更新」按钮 */
  showUpdate: boolean;
  /** 封面铺满布局（本应用资产：inside-img-assets + 角标靠上） */
  fullBleed: boolean;
  /** 分组态布局（local-assets，用于本应用资产/用户资产） */
  groupLayout: boolean;
}

/**
 * 素材库资源基础类
 */
abstract class AssetsBaseClass<Asset, Group> {
  /**
   * 素材库资源
   */
  assets: Asset[];

  /**
   * 素材库资源分组
   */
  groups: Group[];

  /**
   * 文件类型
   */
  fileType: FileTypeEnum;

  /**
   * 标题
   */
  assetsMenuKey: AssetsMenuKeyEnum;

  /**
   * 可用的资源类型
   */
  availableResourceType: ResourceTypeEnum[];

  /**
   * 是否可编辑素材库资源分组
   */
  isAvailableEditGroup: boolean;

  /**
   * 是否可编辑素材库资源
   */
  isAvailableEditAsset: boolean;

  /**
   * 是否可编辑素材库资源
   */
  isAvailableAddAsset: boolean;

  /**
   * 是否可删除素材库资源分组
   */
  isAvailableDeleteGroup: boolean;

  constructor({
    fileType,
    assetsMenuKey,
    availableResourceType,
    isAvailableEditGroup,
    isAvailableEditAsset,
    isAvailableAddAsset,
    isAvailableDeleteGroup
  }: {
    fileType: FileTypeEnum;
    assetsMenuKey: AssetsMenuKeyEnum;
    availableResourceType: ResourceTypeEnum[];
    isAvailableEditGroup: boolean;
    isAvailableEditAsset: boolean;
    isAvailableDeleteGroup: boolean;
    isAvailableAddAsset: boolean;
  }) {
    this.assets = [];
    this.groups = [];
    this.fileType = fileType;
    this.availableResourceType = availableResourceType;
    this.isAvailableEditGroup = isAvailableEditGroup;
    this.isAvailableEditAsset = isAvailableEditAsset;
    this.isAvailableAddAsset = isAvailableAddAsset;
    this.isAvailableDeleteGroup = isAvailableDeleteGroup;
    this.assetsMenuKey = assetsMenuKey;
  }

  /**
   * 将原始分组数据转换为菜单组格式
   * @param rawGroups 从API获取的原始分组数据
   * @param isNeedAdd 是否需要添加功能
   * @returns 转换后的菜单组项数据
   */
  abstract transformToMenuGroupItem(rawGroups: Group[], isNeedAdd: boolean): SingleAssetsTypeForRender;

  /**
   * 将原始资产数据转换为UI渲染格式
   * @param rawAssets 从API获取的原始资产数据
   * @returns 转换后的资产数据
   */
  abstract transformAssetsData(rawAssets: Asset[]): MenuItemForRender[];

  /**
   * 检查文件类型信息
   * @param url 文件URL
   * @returns 文件类型信息
   */
  protected getFileTypeInfo(url: string): { fileType: string; isVideo: boolean; isAudio: boolean } {
    const fileType = url.toLowerCase().split(".").pop() || "";
    const isVideo = ["mp4", "webm", "ogg"].includes(fileType);
    const isAudio = ["mpeg", "wav", "ogg", "aac", "flac", "x-m4a", "m4a", "x-ms-wma", "opus", "mp3"].includes(fileType);
    return { fileType, isVideo, isAudio };
  }

  /**
   * 判断文件名是否为压缩包
   * @param filename 文件名
   */
  protected isArchiveName(filename: string): boolean {
    const archiveExtensions = [".zip", ".7z", ".rar", ".gz", ".tar"];
    const lower = (filename || "").toLowerCase();
    return archiveExtensions.some((ext) => lower.endsWith(ext));
  }

  /**
   * 生成单张资产卡片的视图模型
   * 默认实现适用于普通图片/视频素材（系统资产、资产库等）；
   * 各子类按需 override 局部字段即可，UI 不必再感知具体资产类型。
   * @param item 已转换的渲染项
   */
  getCardView(item: MenuItemForRender): AssetCardView {
    const isVideo = Boolean(item.isVideo);
    return {
      title: item.title,
      cover: item.img,
      showTitle: true,
      preview: isVideo ? "video" : "image",
      badge: isVideo ? "video" : this.isArchiveName(item.title) ? "archive" : "image",
      showSelect: true,
      showUpdate: true,
      fullBleed: false,
      groupLayout: false
    };
  }

  /**
   * 获取素材库资源分组
   */
  abstract getAssetsGroup(): Promise<Group[]>;

  /**
   * 获取素材库资源
   */
  abstract getAssets(params?: ApiParams): Promise<{
    results: Asset[];
    total: number;
  }>;

  /**
   * 添加素材库资源分组
   */
  abstract addGroup(group: Partial<Group>): Promise<Group>;

  /**
   * 删除素材库资源分组
   */
  abstract deleteGroup(group: Group): Promise<Group>;

  /**
   * 编辑素材库资源
   */
  abstract editAsset(asset: Partial<Asset>): Promise<void>;

  /**
   * 删除素材库资源
   * @param assetId 资产ID
   */
  abstract deleteAsset(assetId: number): Promise<void>;

  /**
   * 验证上传文件
   * @param file 文件对象
   * @returns 验证结果
   */
  abstract validateUploadFile(file: File): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * 上传资源
   * @param params 上传参数
   * @returns 上传结果
   */
  abstract uploadAsset(params: Form): Promise<UploadResult>;
}

export default AssetsBaseClass;
