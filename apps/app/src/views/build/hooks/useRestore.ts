import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { removeVersionCode } from "@/utils/version";

import { useHistoryData } from "../command/useHistoryData";
import { useCustomAnimation } from "../components/buildConfig/attrsRender/components/customAnimation/useCustomAnimation";
import { useStatusAnimation } from "../components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useAddKeyboard } from "../components/buildRender/hooks/useAddKeyboard";
import { useAlignmentWasm } from "../components/buildRender/hooks/useAlignmentWasm";
import { useEditStore } from "../components/buildRender/hooks/useEditStore";
import { useCacheTime } from "../useCacheTime";
import { useGlobalComponentData } from "../useGlobalComponentData";
import { useLargeScreenInfo } from "../useLargeScreenInfo";

/**
 * 统一的恢复/清除 hooks
 * @description 提供统一的清除功能，用于重置所有相关状态
 */
export const useRestore = () => {
  const { resetEditStore } = useEditStore();
  const { resetNavInfo } = useLargeScreenInfo();
  const { resetGroupData } = useGlobalComponentData();
  const { clearHistory } = useHistoryData();
  const { onClear } = useCallbackArguments();
  const { resetCustomAnimation } = useCustomAnimation();
  const { resetState: resetStatusAnimation } = useStatusAnimation();
  const { clearCacheTime } = useCacheTime();
  const { clean: cleanAddKeyboard } = useAddKeyboard();
  const { resetAlignmentInstance } = useAlignmentWasm();

  /**
   * 执行完整的恢复操作
   * @description 清除所有相关状态，包括版本代码、历史记录、编辑状态、导航信息、组件数据、动画状态、缓存时间、键盘状态等
   */
  const restore = () => {
    // 清除版本代码
    removeVersionCode();

    // 清除历史记录
    clearHistory();

    // 清除回调参数
    onClear();

    // 重置编辑状态
    resetEditStore();

    // 重置导航信息
    resetNavInfo();

    // 重置组件数据
    resetGroupData();

    // 重置自定义动画
    resetCustomAnimation();

    // 重置状态动画
    resetStatusAnimation();

    // 清除缓存时间
    clearCacheTime();

    // 清除键盘状态
    cleanAddKeyboard();

    // 重置对齐线
    resetAlignmentInstance();
  };

  /**
   * 仅清除数据相关状态
   * @description 清除组件数据、导航信息、编辑状态等数据相关状态
   */
  const restoreData = () => {
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    clearHistory();
  };

  /**
   * 仅清除动画相关状态
   * @description 清除自定义动画和状态动画
   */
  const restoreAnimation = () => {
    resetCustomAnimation();
    resetStatusAnimation();
  };

  /**
   * 仅清除交互相关状态
   * @description 清除回调参数、键盘状态等交互相关状态
   */
  const restoreInteraction = () => {
    onClear();
    cleanAddKeyboard();
  };

  /**
   * 仅清除缓存相关状态
   * @description 清除缓存时间和版本代码
   */
  const restoreCache = () => {
    removeVersionCode();
    clearCacheTime();
  };

  return {
    restore,
    restoreData,
    restoreAnimation,
    restoreInteraction,
    restoreCache,
    // 暴露单个清除函数，以便单独使用
    removeVersionCode,
    clearHistory,
    onClear,
    resetEditStore,
    resetNavInfo,
    resetGroupData,
    resetCustomAnimation,
    resetStatusAnimation,
    clearCacheTime,
    cleanAddKeyboard
  };
};
