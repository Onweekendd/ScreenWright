import { ref } from "vue";

import type { MenuOptionsItemType } from "../type";
import { ContextMenuType } from "../type";
import { useAction } from "./useAction";
import { useClipboard } from "./useClipboard";

export const useMenuOptions = () => {
  const {
    handleMoveDown,
    handleMoveUp,
    handleGroup,
    handleToDynamicPanel,
    handleUnGroup,
    handleDelComponent,
    lock,
    handleTop,
    handleBottom,
    handleAsyncOption
  } = useAction();

  const { handleCopyComponent, handlePasteComponent, clearRecordChart, handleCopyStyle, handlePasteStyle } =
    useClipboard();

  const defaultOptions = ref<MenuOptionsItemType[]>([
    {
      label: "置顶图层",
      key: ContextMenuType.TOP,
      icon: "iconfont-zhiding",
      fnHandle: () => {
        handleTop();
      }
    },
    {
      label: "置底图层",
      key: ContextMenuType.BOTTOM,
      icon: "iconfont-zhidi",
      fnHandle: () => {
        handleBottom();
      }
    },
    {
      label: "上移一层",
      key: ContextMenuType.UP,
      icon: "ArrowUp",
      fnHandle: () => {
        handleMoveUp();
      }
    },
    {
      label: "下移一层",
      key: ContextMenuType.DOWN,
      icon: "ArrowDown",
      fnHandle: () => {
        handleMoveDown();
      }
    },
    {
      label: "组合分组",
      key: ContextMenuType.GROUP,
      icon: "iconfont-chengzu1",
      fnHandle: () => {
        handleGroup();
      }
    },
    {
      label: "组合动态面板",
      key: ContextMenuType.TranslateDynamicPanel,
      icon: "iconfont-chengzu1",
      fnHandle: () => {
        handleToDynamicPanel();
      }
    },
    {
      label: "解散分组",
      key: ContextMenuType.UN_GROUP,
      icon: "iconfont-jiesan",
      fnHandle: () => {
        handleUnGroup();
      }
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
      fnHandle: () => {
        handleDelComponent();
      }
    },
    {
      label: "复制图层",
      key: ContextMenuType.COPY,
      icon: "DocumentCopy",
      fnHandle: () => {
        handleCopyComponent();
      }
    },
    {
      label: "粘贴图层",
      key: ContextMenuType.PASTE,
      icon: "Document",
      fnHandle: () => {
        handlePasteComponent();
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
        console.log("1");
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
  return { defaultOptions };
};
