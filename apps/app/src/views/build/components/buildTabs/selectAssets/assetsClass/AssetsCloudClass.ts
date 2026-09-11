import { deleteMinioScene, minioGroupList, minioPage, updateFileScene, uploadMinioScene } from "@/api/assets";
import { addAssetsGroup, deleteAssetsGroup } from "@/api/dataSource";
import type { uploadFileReq } from "@/model/Assets";
import type { DetailListRes } from "@/model/Assets";
import type { BaseEntity } from "@/model/BaseEntity";
import to from "@/utils/await-to-js";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { UploadAssetParams, UploadResult } from "../assetsBaseClass";
import AssetsBaseClass from "../assetsBaseClass";
import type { MenuItemForRender, SingleAssetsTypeForRender } from "../assetsMenuType";
import { AssetsMenuKeyEnum } from "../assetsMenuType";
import type { ApiParams, AssetItem, GroupItem } from "./types";
import { validateFileByResourceType } from "./uploadValidators";

// const { MINIO_BASE_URL } = process.env;
// const { WEB_APP_MINIO_BASE_URL } = (window as any).webconfig;
/**
 * 资产库类
 * 提供云端资产库的管理功能，支持分组和资产的增删改查
 */
export default class AssetsCloudClass extends AssetsBaseClass<AssetItem, GroupItem> {
  constructor() {
    super({
      fileType: FileTypeEnum.personalPageAssets,
      assetsMenuKey: AssetsMenuKeyEnum.assetsCloud,
      availableResourceType: [ResourceTypeEnum.image, ResourceTypeEnum.video, ResourceTypeEnum.threeModel],
      isAvailableEditGroup: true,
      isAvailableEditAsset: true,
      isAvailableAddAsset: true,
      isAvailableDeleteGroup: true
    });
  }

  /**
   * 将原始分组数据转换为菜单组格式
   * @param rawGroups 从API获取的原始分组数据
   * @param isNeedAdd 是否需要添加功能
   * @returns 转换后的菜单组项数据
   */
  transformToMenuGroupItem(rawGroups: GroupItem[], isNeedAdd: boolean): SingleAssetsTypeForRender {
    const assetsMenuItem: SingleAssetsTypeForRender = {
      title: "资产库",
      key: AssetsMenuKeyEnum.assetsCloud,
      isNeedAdd: isNeedAdd,
      children: []
    };

    if (rawGroups && rawGroups.length > 0) {
      assetsMenuItem.children = rawGroups.map((item) => ({
        title: item.name,
        groupId: Number(item.id),
        pageNum: 1,
        pageSize: 15,
        total: 0,
        children: []
      }));
    }

    // 添加"全部"选项
    assetsMenuItem.children.unshift({
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
      .filter((item: any) => {
        const { isAudio } = this.getFileTypeInfo(String(item.url));
        return !isAudio;
      })
      .map((item: any) => {
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
   * 获取资产库分组列表
   * @returns Promise<GroupItem[]> 分组列表
   */
  async getAssetsGroup(): Promise<GroupItem[]> {
    const [error, res] = await to<BaseEntity<any>>(minioGroupList());

    if (error || !res?.success) {
      console.error("获取资产库分组失败:", error);
      return [];
    }

    if (!res.result?.pageGroups?.list) {
      return [];
    }

    // 转换数据格式
    const groups = res.result.pageGroups.list.map((item: any) => ({
      id: item.id,
      name: item.name,
      title: item.name,
      groupId: item.id
    }));

    this.groups = groups;
    return groups;
  }

  /**
   * 获取资产库资产列表
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
      groupId: `${params.groupId}`,
      largeId: `${params.largeId}`,
      fileType: FileTypeEnum.personalPageAssets,
      time: 1
    };

    const [error, res] = await to<DetailListRes>(minioPage(apiParams));

    if (error || !res?.success) {
      console.error("获取资产库资产列表失败:", error);
      return { results: [], total: 0 };
    }

    if (!res.result?.records) {
      return { results: [], total: 0 };
    }

    // 使用数据转换方法
    const assets = res.result.records;

    this.assets = assets;
    return {
      results: assets,
      total: res.result.total || assets.length
    };
  }

  /**
   * 添加资产库分组
   * @param group 分组信息
   * @returns Promise<GroupItem> 创建的分组信息
   */
  async addGroup(group: Partial<GroupItem>): Promise<GroupItem> {
    if (!group.name) {
      throw new Error("分组名称不能为空");
    }

    const [error, res] = await to<BaseEntity<any>>(addAssetsGroup({ name: group.name, type: 1 }));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "添加分组失败";
      throw new Error(errorMsg);
    }

    // 重新获取分组列表以更新状态
    await this.getAssetsGroup();

    return {
      id: res.result?.id || Date.now(),
      name: group.name,
      title: group.name,
      groupId: res.result?.id || Date.now()
    };
  }

  /**
   * 删除资产库分组
   * @param group 分组信息
   * @returns Promise<GroupItem> 删除的分组信息
   */
  async deleteGroup(group: GroupItem): Promise<GroupItem> {
    if (!group.id) {
      throw new Error("分组ID不能为空");
    }

    const [error, res] = await to<BaseEntity<any>>(deleteAssetsGroup(Number(group.id)));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "删除分组失败";
      throw new Error(errorMsg);
    }

    // 重新获取分组列表以更新状态
    await this.getAssetsGroup();

    return group;
  }

  /**
   * 编辑资产库资产
   * @param asset 资产信息
   * @returns Promise<AssetItem> 编辑后的资产信息
   */
  async editAsset(asset: Partial<AssetItem>): Promise<void> {
    if (!asset.id) {
      throw new Error("资产ID不能为空");
    }

    const baseParams: any = {
      name: asset.name || "",
      resourceType: asset.resourceType !== undefined ? asset.resourceType : ResourceTypeEnum.image,
      fileType: this.fileType,
      groupId: asset.groupId !== undefined ? Number(asset.groupId) : 0,
      file: asset.file as File,
      coverFile: asset.coverFile as File,
      coverFileUrl: null,
      fileUrl: null,
      applicationCode: asset.applicationCode || ""
    };

    if (asset.id !== undefined) {
      baseParams.id = String(asset.id);
    }

    const [error, res] = await to<BaseEntity<any>>(
      asset.id ? updateFileScene(baseParams) : uploadMinioScene(baseParams)
    );

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "编辑资产失败";
      throw new Error(errorMsg);
    }
  }

  /**
   * 删除资产
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
   * 上传资产库资源
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
      const uploadParams: uploadFileReq = {
        name: params.name,
        resourceType: params.resourceType,
        fileType: params.fileType,
        groupId: params.groupId,
        file: params.file,
        coverFile: params.coverFile || null,
        coverFileUrl: params.coverFileUrl || null,
        fileUrl: params.fileUrl || null,
        applicationCode: params.applicationCode || ""
      };

      // 根据是否有ID决定是新增还是编辑
      const apiMethod = params.id ? updateFileScene : uploadMinioScene;
      if (params.id) {
        (uploadParams as any).id = params.id;
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
