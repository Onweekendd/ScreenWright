import { deleteAiTemplate, pageAiTemplate, saveAiTemplate, updateAiTemplate } from "@/api/aiTemplate";
import type { LargeScreenAiConfig } from "@/model/AiTemplate";
import to from "@/utils/await-to-js";
import { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { AssetCardView } from "../assetsBaseClass";
import AssetsBaseClass from "../assetsBaseClass";
import type { MenuItemForRender, SingleAssetsTypeForRender } from "../assetsMenuType";
import { AssetsMenuKeyEnum } from "../assetsMenuType";
import type { ApiParams, GroupItem } from "./types";

/**
 * AI模板类
 * 用于管理"AI模板"素材：这些模板供 AI 创建大屏使用。
 * 接口侧没有分组概念，因此只读单列展示（虚拟"全部"分组），支持删除，不支持分组与上传。
 */
export default class AiTemplateClass extends AssetsBaseClass<LargeScreenAiConfig, GroupItem> {
  constructor() {
    super({
      fileType: FileTypeEnum.personalPageAssets,
      assetsMenuKey: AssetsMenuKeyEnum.aiTemplate,
      availableResourceType: [],
      isAvailableEditGroup: false,
      isAvailableEditAsset: true,
      isAvailableAddAsset: true,
      isAvailableDeleteGroup: false
    });
  }

  /**
   * 将原始分组数据转换为菜单组格式
   * AI模板无分组概念，固定返回一个虚拟"全部"分组
   */
  transformToMenuGroupItem(_rawGroups: GroupItem[], _isNeedAdd: boolean): SingleAssetsTypeForRender {
    return {
      title: "AI模板",
      key: AssetsMenuKeyEnum.aiTemplate,
      isNeedAdd: false,
      children: [
        {
          title: "全部",
          groupId: -2,
          pageNum: 1,
          pageSize: 15,
          total: 0,
          children: []
        }
      ]
    };
  }

  /**
   * 将原始AI模板数据转换为UI渲染格式
   * @param rawAssets 从API获取的原始AI模板数据
   */
  transformAssetsData(rawAssets: LargeScreenAiConfig[]): MenuItemForRender[] {
    return rawAssets.map((item) => ({
      ...item,
      id: item.id,
      title: item.name || "未命名模板",
      name: item.name,
      img: item.coverUrl || "",
      type: "aiTemplate",
      isVideo: false,
      fileType: "aiTemplate",
      moduleId: 0
    }));
  }

  /**
   * AI模板卡片：无类型角标、不显示「更新」按钮（不支持上传），仅展示封面+名称+选择/删除
   */
  getCardView(item: MenuItemForRender): AssetCardView {
    return {
      ...super.getCardView(item),
      badge: null,
      showUpdate: false
    };
  }

  /**
   * AI模板无分组，返回空数组
   */
  async getAssetsGroup(): Promise<GroupItem[]> {
    return [];
  }

  /**
   * 将当前大屏保存为 AI 模板
   * @param config 调用方收集好的模板数据（screenData 为 stringify 后的当前大屏数据）
   * @returns 保存后的 AI 模板配置
   */
  async saveScreenTemplate(config: LargeScreenAiConfig): Promise<LargeScreenAiConfig> {
    const [error, res] = await to(saveAiTemplate(config));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "保存AI模板失败";
      throw new Error(errorMsg);
    }

    return res.result;
  }

  /**
   * 分页获取AI模板列表
   * @param params API调用参数（仅使用分页字段）
   */
  async getAssets(params?: ApiParams): Promise<{ results: LargeScreenAiConfig[]; total: number }> {
    if (!params) {
      return { results: [], total: 0 };
    }

    const [error, res] = await to(pageAiTemplate({ current: params.current, size: params.size }));

    if (error || !res?.success || !res.result?.records) {
      console.error("获取AI模板列表失败:", error);
      return { results: [], total: 0 };
    }

    const assets = res.result.records;
    this.assets = assets;

    return {
      results: assets,
      total: res.result.total || assets.length
    };
  }

  /**
   * AI模板不支持分组
   */
  async addGroup(): Promise<GroupItem> {
    throw new Error("AI模板不支持分组操作");
  }

  /**
   * AI模板不支持分组
   */
  async deleteGroup(): Promise<GroupItem> {
    throw new Error("AI模板不支持分组操作");
  }

  /**
   * 编辑AI模板（走更新接口）
   * @param asset AI模板配置
   */
  async editAsset(asset: Partial<LargeScreenAiConfig>): Promise<void> {
    if (!asset.id) {
      throw new Error("AI模板ID不能为空");
    }

    const [error, res] = await to(updateAiTemplate(asset));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "更新AI模板失败";
      throw new Error(errorMsg);
    }
  }

  /**
   * 删除AI模板
   * @param assetId AI模板ID
   */
  async deleteAsset(assetId: number): Promise<void> {
    const [error, res] = await to(deleteAiTemplate(assetId));

    if (error || !res?.success) {
      const errorMsg = res?.message || error?.message || "删除AI模板失败";
      throw new Error(errorMsg);
    }
  }

  /**
   * AI模板不支持上传
   */
  async validateUploadFile(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: "AI模板不支持上传" };
  }

  /**
   * AI模板不支持上传
   */
  async uploadAsset(): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: "AI模板不支持上传" };
  }
}
