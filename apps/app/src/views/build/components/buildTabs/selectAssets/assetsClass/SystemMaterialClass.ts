import { minioGroupList, systemMaterialPage } from "@/api/assets";
import type { DetailListRes } from "@/model/Assets";
import type { BaseEntity } from "@/model/BaseEntity";
import to from "@/utils/await-to-js";
import type { Form } from "@/views/build/components/buildTabs/assetsEditFrom/type";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { AssetCardView, UploadResult } from "../assetsBaseClass";
import AssetsBaseClass from "../assetsBaseClass";
import type { MenuItemForRender, SingleAssetsTypeForRender } from "../assetsMenuType";
import { AssetsMenuKeyEnum } from "../assetsMenuType";
import type { ApiParams, AssetItem, GroupItem } from "./types";

interface SystemGroupsResult {
  systemGroups?: {
    list?: Array<{ id: number | string; name: string }>;
  };
}

/** 数据库中的全局只读系统素材。 */
export default class SystemMaterialClass extends AssetsBaseClass<AssetItem, GroupItem> {
  constructor() {
    super({
      fileType: FileTypeEnum.systemMaterial,
      assetsMenuKey: AssetsMenuKeyEnum.systemMaterial,
      availableResourceType: [ResourceTypeEnum.image, ResourceTypeEnum.video],
      isAvailableEditGroup: false,
      isAvailableEditAsset: false,
      isAvailableAddAsset: false,
      isAvailableDeleteGroup: false
    });
  }

  transformToMenuGroupItem(rawGroups: GroupItem[], _isNeedAdd: boolean): SingleAssetsTypeForRender {
    const children = rawGroups.map((item) => ({
      title: item.name,
      groupId: Number(item.id),
      pageNum: 1,
      pageSize: 15,
      total: 0,
      children: []
    }));
    children.unshift({ title: "全部", groupId: -2, pageNum: 1, pageSize: 15, total: 0, children: [] });
    return {
      title: "系统素材",
      key: AssetsMenuKeyEnum.systemMaterial,
      isNeedAdd: false,
      children
    };
  }

  transformAssetsData(rawAssets: AssetItem[]): MenuItemForRender[] {
    return rawAssets.map((item) => {
      const { fileType, isVideo } = this.getFileTypeInfo(String(item.url));
      return {
        id: item.id,
        name: item.name,
        title: item.name,
        img: item.url,
        url: item.url,
        cover: item.cover || item.url,
        type: isVideo ? "video" : "img",
        isVideo,
        fileType,
        moduleId: isVideo ? 47 : 43,
        assetType: this.fileType
      };
    });
  }

  getCardView(item: MenuItemForRender): AssetCardView {
    return { ...super.getCardView(item), cover: item.cover || item.img, showUpdate: false };
  }

  async getAssetsGroup(): Promise<GroupItem[]> {
    const [error, res] = await to<BaseEntity<SystemGroupsResult>>(minioGroupList());
    if (error || !res?.success || !res.result?.systemGroups?.list) {
      console.error("获取系统素材分组失败:", error);
      return [];
    }
    const groups = res.result.systemGroups.list.map((item) => ({
      id: item.id,
      name: item.name,
      title: item.name,
      groupId: item.id
    }));
    this.groups = groups;
    return groups;
  }

  async getAssets(params?: ApiParams): Promise<{ results: AssetItem[]; total: number }> {
    if (!params) {
      return { results: [], total: 0 };
    }
    const [error, res] = await to<DetailListRes>(
      systemMaterialPage({
        current: params.current,
        size: params.size,
        groupId: params.groupId ?? -2,
        fileType: FileTypeEnum.systemMaterial,
        time: 1
      })
    );
    if (error || !res?.success || !res.result?.records) {
      console.error("获取系统素材失败:", error);
      return { results: [], total: 0 };
    }
    this.assets = res.result.records;
    return { results: this.assets, total: res.result.total || this.assets.length };
  }

  async addGroup(): Promise<GroupItem> {
    throw new Error("系统素材不支持新增分组");
  }

  async deleteGroup(): Promise<GroupItem> {
    throw new Error("系统素材不支持删除分组");
  }

  async editAsset(): Promise<void> {
    throw new Error("系统素材不支持编辑");
  }

  async deleteAsset(): Promise<void> {
    throw new Error("系统素材不支持删除");
  }

  async validateUploadFile(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: "系统素材不支持上传" };
  }

  async uploadAsset(_params: Form): Promise<UploadResult> {
    return { success: false, message: "系统素材不支持上传" };
  }
}
