import { computed, ref } from "vue";

import { ElMessage } from "element-plus";
import { debounce } from "lodash-es";

import { useDialog } from "@/hooks/useDialog";
import createDir from "@/layout/Siderbar/components/siderTree/createDir.vue";
import to from "@/utils/await-to-js";
import { handleMessageBox } from "@/utils/utils";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";
import {
  AssetsMenuKeyEnum,
  type AssetsGroupForRender,
  type MenuItemForRender,
  type ModuleGroupForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

import aiTemplateSaveForm from "./aiTemplateSaveForm.vue";
import assetsEditFrom from "./assetsEditFrom/index.vue";
import { FileTypeEnum, ResourceTypeEnum } from "./assetsEditFrom/type";

/**
 * 资产编辑选项接口
 */
interface AssetsEditOption {
  resourceType: number;
  id: number | null;
  fileUrl: string | null;
  coverFileUrl: string | null;
  name: string | null;
}

/**
 * 构建标签菜单业务逻辑 Hook
 * 负责菜单切换、滚动加载、资产和分组的 CRUD 操作
 */
export const useBuildTabsMenu = (props: {
  title: string;
  menuGroup: AssetsGroupForRender[] | MenuItemForRender[] | ModuleGroupForRender[];
}) => {
  const { dialog } = useDialog();

  // ==================== 状态管理 ====================

  /** 当前激活的菜单索引 */
  const currentActive = ref(0);

  /** 滚动容器引用 */
  const scrollContainerRef = ref<HTMLElement | null>(null);

  /** 资产编辑选项 */
  const assetsEditOption = ref<AssetsEditOption>({
    resourceType: 1,
    id: null,
    fileUrl: null,
    coverFileUrl: null,
    name: null
  });

  // ==================== 获取资产类实例 ====================

  /**
   * 获取当前资产类型对应的资产类实例
   * @returns 资产类实例，如果标题不支持则返回 null
   */
  const getAssetsClassInstance = () => {
    try {
      return assetsClassManager.getAssetsClassByTitle(props.title);
    } catch (error) {
      console.error(`无法获取资产类实例: ${props.title}`, error);
      return null;
    }
  };

  // ==================== 计算属性 ====================

  /**
   * 判断当前菜单项是否有子项
   */
  const isHasChildren = computed(() => {
    const currentItem = props.menuGroup[currentActive.value];
    if (!currentItem) return false;
    return (currentItem as AssetsGroupForRender).children !== undefined;
  });

  /**
   * 获取当前显示的子项组
   */
  const childrenGroups = computed(() => {
    if (!isHasChildren.value) {
      return props.menuGroup as MenuItemForRender[];
    }
    if (props.menuGroup.length === 0) return [];
    return (props.menuGroup[currentActive.value] as AssetsGroupForRender).children;
  });

  /**
   * 是否显示素材库上传按钮
   */
  const isMaterialLibraryUploadVisible = computed(() => {
    const materialLibraryTypes = new Set(assetsClassManager.getAddableAssetTypes());
    return materialLibraryTypes.has(props.title);
  });

  /**
   * 是否显示分组操作按钮
   */
  const materialLibraryBtnGroupShow = computed(() => {
    const editableGroupTypes = new Set(assetsClassManager.getEditableGroupAssetTypes());
    return editableGroupTypes.has(props.title);
  });

  /**
   * 获取文件类型
   */
  const fileType = computed<FileTypeEnum>(() => {
    const fileTypeMap = new Map<string, FileTypeEnum>([
      ["本应用资产", FileTypeEnum.personalScreen],
      ["系统素材", FileTypeEnum.systemMaterial]
    ]);
    return fileTypeMap.get(props.title) || FileTypeEnum.personalPageAssets;
  });

  // ==================== 菜单切换 ====================

  /**
   * 点击一级菜单切换
   * @param index 菜单索引
   * @param onUpdateData 更新数据回调函数
   */
  const clickFirstMenu = async (index: number, onUpdateData: (resetUpdate: boolean) => void) => {
    currentActive.value = index;

    // 如果有子项，触发数据更新
    if ((props.menuGroup[currentActive.value] as AssetsGroupForRender).children) {
      onUpdateData(true);
    }
  };

  // ==================== 滚动加载 ====================

  /**
   * 处理滚动事件
   * @param e 滚动事件
   * @param onUpdateData 更新数据回调函数
   */
  const handleScroll = (e: Event, onUpdateData: (resetUpdate: boolean) => void) => {
    const target = e.target as HTMLElement;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const scrollTop = target.scrollTop;

    // 滚动到底部时加载更多数据
    if (scrollHeight - scrollTop - clientHeight <= 1) {
      debouncedUpdateData(false, onUpdateData);
    }
  };

  /**
   * 防抖的数据更新函数
   */
  const debouncedUpdateData = debounce((resetUpdate: boolean, onUpdateData: (resetUpdate: boolean) => void) => {
    onUpdateData(resetUpdate);
  }, 300);

  // ==================== 资产操作 ====================

  /**
   * 打开资产上传对话框
   */
  const handleOpenDialog = (onSuccess: () => void) => {
    // AI模板：不走通用上传表单，直接将当前大屏数据保存为模板（无输入框）
    const assetsClass = getAssetsClassInstance();
    if (assetsClass?.assetsMenuKey === AssetsMenuKeyEnum.aiTemplate) {
      openAiTemplateDialog(onSuccess);
      return;
    }

    assetsEditOption.value = {
      resourceType: 1,
      id: null,
      fileUrl: null,
      coverFileUrl: null,
      name: null
    };
    openAssetsDialog(onSuccess);
  };

  /**
   * 打开「保存为 AI 模板」对话框
   * @param onSuccess 成功回调
   */
  const openAiTemplateDialog = (onSuccess: () => void) => {
    dialog({
      DialogProps: {
        title: "保存为 AI 模板",
        width: "720px",
        modalClass: "build-render-ignore"
      },
      componentProps: {},
      component: aiTemplateSaveForm,
      closeBefore: async (_componentData, done) => {
        onSuccess();
        done();
      }
    });
  };

  /**
   * 打开资产编辑对话框
   * @param onSuccess 成功回调
   */
  const openAssetsDialog = (onSuccess: () => void) => {
    const assetsClass = getAssetsClassInstance();
    if (!assetsClass) {
      ElMessage.error("未知的资产库类型");
      return;
    }
    const groupId = assetsClass.assets && assetsClass.assets.length > 0 ? assetsClass.assets[0].groupId : 0;
    dialog({
      DialogProps: {
        title: `${props.title}`,
        width: "680px",
        modalClass: "build-render-ignore"
      },
      componentProps: {
        title: props.title,
        fileType: fileType.value,
        option: assetsEditOption.value,
        availableResourceType: assetsClass.availableResourceType,
        groupId: groupId || 0
      },
      component: assetsEditFrom,
      closeBefore: async (_componentData, done) => {
        onSuccess();
        done();
      }
    });
  };

  /**
   * 更新资产
   * @param item 资产项
   * @param onSuccess 成功回调
   */
  const updateAssets = (item: MenuItemForRender, onSuccess: () => void) => {
    assetsEditOption.value = {
      resourceType: item.isVideo ? ResourceTypeEnum.video : ResourceTypeEnum.image,
      id: (item as any).id,
      fileUrl: item.isVideo ? item.url || null : item.img,
      coverFileUrl: item.isVideo ? item.img : null,
      name: item.title
    };
    openAssetsDialog(onSuccess);
  };

  /**
   * 删除资产项
   * @param item 资产项
   * @param onSuccess 成功回调
   */
  const deleteItem = async (item: MenuItemForRender, onSuccess: () => void) => {
    const isCanDelete = await handleMessageBox(`是否确认删除: ${item.title}`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      customClass: "sw-message-box build-render-ignore"
    });

    if (!isCanDelete) return;

    const itemId = (item as any).id;
    if (!itemId) {
      ElMessage.error("资产ID不存在");
      return;
    }

    // 获取资产类实例
    const assetsClass = getAssetsClassInstance();
    if (!assetsClass) {
      ElMessage.error("未知的资产库类型");
      return;
    }

    // 调用资产类的删除方法
    const [error] = await to(assetsClass.deleteAsset(itemId));

    if (error) {
      ElMessage.error(error.message || "删除失败");
      return;
    }

    ElMessage.success("删除成功");
    onSuccess();
  };

  // ==================== 分组操作 ====================

  /**
   * 添加素材库分组
   * @param onSuccess 成功回调
   */
  const addMaterialLibraryGroup = (onSuccess: (updateGroup: boolean) => void) => {
    dialog({
      DialogProps: {
        title: "新建分组",
        width: "500px",
        modalClass: "build-render-ignore"
      },
      componentProps: {},
      component: createDir,
      center: true,
      closeBefore: async (componentData, done) => {
        const dataRes = await componentData.validate();

        if (!dataRes.success) {
          done();
          return;
        }

        // 获取资产类实例
        const assetsClass = getAssetsClassInstance();
        if (!assetsClass) {
          ElMessage.error("未知的资产库类型");
          done();
          return;
        }

        // 检查是否支持分组编辑
        if (!assetsClass.isAvailableEditGroup) {
          ElMessage.error("当前资产库类型不支持分组操作");
          done();
          return;
        }

        // 调用资产类的添加分组方法
        const [error, newGroup] = await to(assetsClass.addGroup({ name: dataRes.name }));

        if (error) {
          ElMessage.error(error.message || "添加分组失败");
          done();
          return;
        }

        if (newGroup) {
          ElMessage.success("新增成功");
          onSuccess(true);
          done();
        } else {
          ElMessage.error("新增失败");
          done();
        }
      }
    });
  };

  /**
   * 删除素材库分组
   * @param onSuccess 成功回调
   */
  const delMaterialLibraryGroup = async (onSuccess: (updateGroup: boolean) => void) => {
    const groupItem = props.menuGroup[currentActive.value];
    if (!groupItem) {
      return;
    }

    const isCanDelete = await handleMessageBox(`是否确认删除: ${groupItem.title}?`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      customClass: "sw-message-box build-render-ignore"
    });

    if (!isCanDelete) return;

    if ((groupItem as AssetsGroupForRender).groupId === -2) {
      ElMessage.error("'全部'分组不能删除");
      return;
    }

    // 获取资产类实例
    const assetsClass = getAssetsClassInstance();
    if (!assetsClass) {
      ElMessage.error("未知的资产库类型");
      return;
    }

    // 检查是否支持分组编辑
    if (!assetsClass.isAvailableEditGroup) {
      ElMessage.error("当前资产库类型不支持分组操作");
      return;
    }

    // 调用资产类的删除分组方法
    const [error] = await to(
      assetsClass.deleteGroup({
        id: (groupItem as AssetsGroupForRender).groupId as number,
        name: groupItem.title,
        title: groupItem.title,
        groupId: (groupItem as AssetsGroupForRender).groupId as number
      })
    );

    if (error) {
      ElMessage.error(error.message || "删除失败");
      return;
    }

    currentActive.value = 0;
    ElMessage.success("删除成功");
    onSuccess(true);
  };

  return {
    // 状态
    currentActive,
    scrollContainerRef,
    assetsEditOption,

    // 计算属性
    isHasChildren,
    childrenGroups,
    isMaterialLibraryUploadVisible,
    materialLibraryBtnGroupShow,
    fileType,

    // 菜单操作
    clickFirstMenu,

    // 滚动加载
    handleScroll,

    // 资产操作
    handleOpenDialog,
    updateAssets,
    deleteItem,

    // 分组操作
    addMaterialLibraryGroup,
    delMaterialLibraryGroup
  };
};
