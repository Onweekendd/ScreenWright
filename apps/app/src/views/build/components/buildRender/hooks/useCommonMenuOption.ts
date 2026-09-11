import type { Ref } from "vue";
import { computed } from "vue";

import { notAllowToDynamicPanel } from "../../buildConfig/constants";
import type { PanelInfo } from "../../common/useCommonPanelData";
import type { PanelState } from "../core/SystemComponent/type";
import type { MenuOptionsItemType } from "../type";
import { ContextMenuType } from "../type";
import { useAction } from "./useAction";
import { useClipboard } from "./useClipboard";
import { useCommonPanelAction } from "./useCommonPanelAction";
import { useEditStore } from "./useEditStore";

export const useCommonMenuOption = ({
  // 面板信息相关
  panelInfo,
  activeStatusId,
  panelData
}: {
  panelInfo: Ref<PanelInfo>;
  activeStatusId: Ref<string>;
  panelData: Ref<PanelState[]>;
}) => {
  const { selectTargetData } = useEditStore();
  const { lock, handleAsyncOption } = useAction({ isDynamicPanel: true });
  const { handleCopyComponent, clearRecordChart, handleCopyStyle, handlePasteStyle } = useClipboard();
  const {
    handleTopAndUpdate,
    handleBottomAndUpdate,
    handleMoveUpAndUpdate,
    handleMoveDownAndUpdate,
    handleGroupAndUpdate,
    handleUnGroupAndUpdate,
    handleDelComponentAndUpdate,
    handleToDynamicPanelAndUpdate,
    handlePasteAndUpdate
  } = useCommonPanelAction({ panelInfo, activeStatusId, panelData });

  /**
   * 分组按钮可用
   */
  const isCanGroup = computed(() => {
    if (selectTargetData.value.length < 2) return true;

    if (selectTargetData.value.length >= 2) {
      // 说明是和分组组合, 不能分组
      const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
      // 说明是和分组内部元素组合, 不能分组
      const isHasParent = selectTargetData.value.some((v) => v && v.parent);
      return isHasGroup || isHasParent;
    }
    return false;
  });

  /**
   * 转换成动态面板可用
   */
  const isCanTranslateDynamicPanel = computed(() => {
    if (selectTargetData.value.length < 2) return true;
    const isHasPanel = selectTargetData.value.some(
      (v) => v && v.component && notAllowToDynamicPanel.find((item) => item === v.component.prop)
    );

    if (isHasPanel) {
      return true;
    }

    if (selectTargetData.value.length >= 2) {
      // 说明是和分组内部元素组合, 不能分组
      const isHasParent = selectTargetData.value.some((v) => v && v.parent);

      return isHasParent;
    }
    return false;
  });

  /**
   * 解散分组是否可用
   */
  const isCanUnGroup = computed(() => {
    if (selectTargetData.value.length === 0) return true;
    if (selectTargetData.value.length === 1) {
      const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
      return !isHasGroup;
    }
    if (selectTargetData.value.length > 1) {
      const isAllGroup = selectTargetData.value.every((v) => v && v.children && v.children.length > 0);
      return !isAllGroup;
    }
    return false;
  });

  /**
   * 置顶图层是否可用
   */
  const isTopDisabled = computed(() => {
    return selectTargetData.value.length >= 2;
  });

  /**
   * 公共菜单选项
   */
  const commonMenuOptions = computed<MenuOptionsItemType[]>(() => [
    {
      label: "置顶图层",
      key: ContextMenuType.TOP,
      icon: "iconfont-zhiding",
      fnHandle: handleTopAndUpdate,
      disabled: isTopDisabled.value
    },
    {
      label: "置底图层",
      key: ContextMenuType.BOTTOM,
      icon: "iconfont-zhidi",
      fnHandle: handleBottomAndUpdate,
      disabled: isTopDisabled.value
    },
    {
      label: "上移一层",
      key: ContextMenuType.UP,
      icon: "ArrowUp",
      fnHandle: handleMoveUpAndUpdate
    },
    {
      label: "下移一层",
      key: ContextMenuType.DOWN,
      icon: "ArrowDown",
      fnHandle: handleMoveDownAndUpdate
    },
    {
      label: "组合分组",
      key: ContextMenuType.GROUP,
      icon: "iconfont-chengzu1",
      fnHandle: async () => {
        if (isCanGroup.value) return;
        await handleGroupAndUpdate();
      },
      disabled: isCanGroup.value
    },
    {
      label: "组合动态面板",
      key: ContextMenuType.TranslateDynamicPanel,
      icon: "iconfont-chengzu1",
      fnHandle: async () => {
        if (isCanTranslateDynamicPanel.value) return;
        await handleToDynamicPanelAndUpdate();
      },
      disabled: isCanTranslateDynamicPanel.value
    },
    {
      label: "解散分组",
      key: ContextMenuType.UN_GROUP,
      icon: "iconfont-jiesan",
      fnHandle: () => {
        if (isCanUnGroup.value) return;
        handleUnGroupAndUpdate();
      },
      disabled: isCanUnGroup.value
    },
    {
      label: "锁定",
      icon: "iconfont-ai242",
      key: ContextMenuType.LOCK,
      fnHandle: () => {
        lock();
      }
    },
    {
      label: "删除图层",
      key: ContextMenuType.DEL,
      icon: "iconfont-shanchu",
      fnHandle: handleDelComponentAndUpdate
    },
    {
      label: "复制图层",
      key: ContextMenuType.COPY,
      icon: "DocumentCopy",
      fnHandle: () => {
        if (selectTargetData.value.length === 0) return;
        handleCopyComponent();
      }
    },
    {
      label: "粘贴图层",
      key: ContextMenuType.PASTE,
      icon: "Document",
      fnHandle: async () => {
        try {
          await handlePasteAndUpdate();
        } catch (error) {
          console.error(error);
        }
      }
    },
    {
      label: "复制样式",
      key: ContextMenuType.COPY_STYLE,
      icon: "DocumentCopy",
      fnHandle: () => {
        handleCopyStyle();
      }
    },
    {
      label: "粘贴样式",
      key: ContextMenuType.PASTE_STYLE,
      icon: "Document",
      fnHandle: () => {
        handlePasteStyle();
      }
    },
    {
      label: "同步样式",
      key: ContextMenuType.SYNC_STYLE,
      icon: "DocumentCopy",
      fnHandle: () => {
        handleAsyncOption();
      }
    },
    {
      label: "清空剪切板",
      icon: "iconfont-eraser",
      key: ContextMenuType.CLEAR,
      fnHandle: () => {
        clearRecordChart();
      }
    }
  ]);

  return { commonMenuOptions };
};
