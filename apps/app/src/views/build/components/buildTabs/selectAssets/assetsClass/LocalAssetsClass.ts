import { deleteMinioScene, minioPage, updateFileScene, uploadMinioScene } from "@/api/assets";
import type { BaseEntity } from "@/model/BaseEntity";
import to from "@/utils/await-to-js";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { AssetCardView, UploadAssetParams, UploadResult } from "../assetsBaseClass";
import AssetsBaseClass from "../assetsBaseClass";
import type { MenuItemForRender, SingleAssetsTypeForRender } from "../assetsMenuType";
import { AssetsMenuKeyEnum } from "../assetsMenuType";
import type { ApiParams, AssetItem, GroupItem } from "./types";
import { validateFileByResourceType } from "./uploadValidators";

// const { MINIO_BASE_URL } = process.env;
// const { WEB_APP_MINIO_BASE_URL } = (window as any).webconfig;
/**
 * 本应用资产类
 * 提供本应用专用资产的管理功能，支持资产的增删改查，但不支持分组管理
 */
export default class LocalAssetsClass extends AssetsBaseClass<AssetItem, GroupItem> {
  constructor() {
    super({
      fileType: FileTypeEnum.personalScreen,
      assetsMenuKey: AssetsMenuKeyEnum.localAssets,
      availableResourceType: [ResourceTypeEnum.image, ResourceTypeEnum.video, ResourceTypeEnum.threeModel],
      isAvailableEditGroup: false, // 本应用资产不支持分组管理
      isAvailableEditAsset: true,
      isAvailableAddAsset: true,
      isAvailableDeleteGroup: true
    });
  }

  /**
   * 将原始分组数据转换为菜单组格式
   * @param rawGroups 从API获取的原始分组数据（本应用资产不支持分组）
   * @param isNeedAdd 是否需要添加功能
   * @returns 转换后的菜单组项数据
   */
  transformToMenuGroupItem(rawGroups: any[], isNeedAdd: boolean): SingleAssetsTypeForRender {
    const assetsMenuItem: SingleAssetsTypeForRender = {
      title: "本应用资产",
      key: AssetsMenuKeyEnum.localAssets,
      isNeedAdd: isNeedAdd,
      children: []
    };

    // 本应用资产只有默认的"全部"分组
    assetsMenuItem.children.push({
      title: "全部",
      groupId: -2,
      pageNum: 1,
      pageSize: 15,
      total: 0,
      children: []
    });

    return assetsMenuItem;
  }

  /**
   * 将原始资产数据转换为UI渲染格式
   * @param rawAssets 从API获取的原始资产数据
   * @returns 转换后的资产数据
   */
  transformAssetsData(rawAssets: AssetItem[]): MenuItemForRender[] {
    // 过滤掉音频文件并转换数据格式
    return rawAssets
      .filter((item) => {
        const { isAudio } = this.getFileTypeInfo(String(item.url));
        return !isAudio;
      })
      .map((item) => {
        const { fileType, isVideo } = this.getFileTypeInfo(String(item.url));

        return {
          id: item.id,
          name: item.name,
          title: item.name,
          img: `${item.url}`,
          url: item.url,
          type: isVideo ? "video" : "img",
          isVideo,
          fileType,
          moduleId: isVideo ? 47 : 43,
          assetType: this.fileType
        };
      });
  }

  /**
   * 本应用资产卡片：不显示标题、封面铺满、分组态布局
   */
  getCardView(item: MenuItemForRender): AssetCardView {
    return {
      ...super.getCardView(item),
      showTitle: false,
      fullBleed: true,
      groupLayout: true
    };
  }

  /**
   * 获取本应用资产分组列表
   * 本应用资产不支持分组，返回默认的"全部"分组
   * @returns Promise<GroupItem[]> 默认分组列表
   */
  async getAssetsGroup(): Promise<GroupItem[]> {
    const defaultGroups = [
      {
        id: -2,
        name: "全部",
        title: "全部",
        groupId: -2
      }
    ];

    this.groups = defaultGroups;
    return defaultGroups;
  }

  /**
   * 获取本应用资产列表
   * @param params API调用参数
   * @returns Promise<{results: AssetItem[], total: number}> 资产列表和总数
   */
  async getAssets(params?: ApiParams): Promise<{ results: AssetItem[]; total: number }> {
    if (!params) {
      return { results: [], total: 0 };
    }

    const apiParams = {
      current: params.current,
      size: params.size,
      groupId: params.groupId || "",
      largeId: Array.isArray(params.largeId) ? params.largeId[0] : params.largeId,
      fileType: FileTypeEnum.personalScreen,
      time: 1
    };

    const [error, res] = await to(minioPage(apiParams));

    if (error || !res?.success) {
      console.error("获取本应用资产列表失败:", error);
      return { results: [], total: 0 };
    }

    if (!res.result?.records) {
      return { results: [], total: 0 };
    }

    // 保存原始数据并返回
    const assets = res.result.records;

    this.assets = assets;
    return {
      results: assets,
      total: res.result.total || assets.length
    };
  }

  /**
   * 添加分组（本应用资产不支持此操作）
   * @param _group 分组信息
   * @throws Error 本应用资产不支持添加分组
   */
  async addGroup(_group: Partial<GroupItem>): Promise<GroupItem> {
    throw new Error("本应用资产不支持添加分组操作");
  }

  /**
   * 删除分组（本应用资产不支持此操作）
   * @param _group 分组信息
   * @throws Error 本应用资产不支持删除分组
   */
  async deleteGroup(_group: GroupItem): Promise<GroupItem> {
    throw new Error("本应用资产不支持删除分组操作");
  }

  /**
   * 编辑本应用资产
   * @param asset 资产信息
   * @returns Promise<void>
   */
  async editAsset(asset: Partial<AssetItem>): Promise<void> {
    if (!asset.id) {
      throw new Error("资产ID不能为空");
    }

    const uploadParams: any = {
      name: asset.name || "",
      resourceType: asset.resourceType !== undefined ? asset.resourceType : ResourceTypeEnum.image,
      fileType: this.fileType,
      groupId: asset.groupId !== undefined && asset.groupId !== null ? Number(asset.groupId) : 0,
      file: asset.file as File,
      coverFile: asset.coverFile as File,
      coverFileUrl: null,
      fileUrl: null,
      applicationCode: asset.applicationCode || ""
    };

    if (asset.id !== undefined) {
      uploadParams.id = String(asset.id);
    }

    const [error, res] = await to<BaseEntity<any>>(updateFileScene(uploadParams));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "编辑资产失败";
      throw new Error(errorMsg);
    }
  }

  /**
   * 删除本应用资产
   * @param assetId 资产ID
   */
  async deleteAsset(assetId: number): Promise<void> {
    const [error, res] = await to<BaseEntity<any>>(deleteMinioScene(assetId));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "删除资产失败";
      throw new Error(errorMsg);
    }
  }

  /**
   * 验证上传文件
   * @param file 文件对象
   * @returns 验证结果
   */
  async validateUploadFile(file: File): Promise<{ success: boolean; message: string }> {
    // 遍历所有支持的资源类型进行验证
    for (const resourceType of this.availableResourceType) {
      const result = validateFileByResourceType(file, resourceType);
      if (result.success) {
        return result;
      }
    }

    // 如果所有类型都不匹配，返回错误信息
    return {
      success: false,
      message: "文件类型不符合要求，请上传图片、视频或三维模型压缩包"
    };
  }

  /**
   * 上传本应用资源
   * @param params 上传参数
   * @returns 上传结果
   */
  async uploadAsset(params: UploadAssetParams): Promise<UploadResult> {
    // 先验证文件类型
    if (params.file) {
      const validation = await this.validateUploadFile(params.file as File);
      if (!validation.success) {
        return {
          success: false,
          message: validation.message
        };
      }
    }

    try {
      const uploadParams: any = {
        name: params.name,
        resourceType: params.resourceType,
        fileType: FileTypeEnum.personalScreen, // 本应用资产固定使用此文件类型
        groupId: params.groupId,
        file: params.file,
        largeId: params.largeId,
        coverFile: params.coverFile || null,
        coverFileUrl: params.coverFileUrl || null,
        fileUrl: params.fileUrl || null,
        applicationCode: params.applicationCode
      };

      // 根据是否有ID决定是新增还是编辑
      const apiMethod = params.id ? updateFileScene : uploadMinioScene;
      if (params.id) {
        uploadParams.id = params.id;
      }

      const [error, res] = await to<BaseEntity<any>>(apiMethod(uploadParams));

      if (error || !res?.success) {
        return {
          success: false,
          message: res?.message || error?.message || "上传失败"
        };
      }

      return {
        success: true,
        message: res.message || "上传成功",
        data: res.result
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "上传失败"
      };
    }
  }
}
