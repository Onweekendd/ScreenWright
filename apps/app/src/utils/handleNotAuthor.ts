import { useGlobalLoading } from "@/hooks/useGlobalLoading";

import { handleUnauthorized } from "./session";
import { handleMessageBox } from "./utils";
export const handleNotAuthor = (() => {
  const { hideLoading, loadingScene } = useGlobalLoading();
  let isShowing = false;
  // 标记是否已经有待处理的权限弹窗
  let hasPendingTip = false;
  const tipText = "当前用户没有权限访问，请联系管理员";

  const showModal = () => {
    isShowing = true;
    hasPendingTip = false;
    hideLoading();
    loadingScene.value = false;
    handleMessageBox(tipText, {
      confirmButtonText: "确定"
    }).then(() => {
      isShowing = false;
      // 如果期间又触发了403，再次弹窗
      if (hasPendingTip) {
        showModal();
      }
    });
  };

  return (status: number) => {
    // 401：令牌缺失 / 过期 → 清登录态跳登录页；403：已登录但无权限 → 弹窗提示
    if (status === 401) {
      handleUnauthorized();
      return;
    }
    if (status !== 403) {
      return;
    }
    // 正在弹窗或者已经有待处理提示，直接拦截
    if (isShowing || hasPendingTip) {
      return;
    }
    hasPendingTip = true;
    showModal();
  };
})();
