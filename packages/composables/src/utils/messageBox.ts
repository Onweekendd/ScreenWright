import type { ElMessageBoxOptions } from "element-plus";
import { ElMessageBox } from "element-plus";

/**
 * 统一的二次确认框：返回 Promise<boolean>，用户确认返回 true，取消/关闭返回 false（不抛异常）。
 * 下沉自 app 的 handleMessageBox；@screenwright/composables 内部（如 batchCompressPic）与物料包配置面板共用同一实现，
 * 避免各处各持一份确认交互而漂移。
 */
export const handleMessageBox = (text: string, options?: ElMessageBoxOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    ElMessageBox.confirm(text, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "sw-message-box",
      ...options
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};
