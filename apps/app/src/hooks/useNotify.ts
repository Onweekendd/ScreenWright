// 封装notify hook
import type { NotificationParams } from "element-plus";
import { ElNotification } from "element-plus";

export type NotifyType = "success" | "warning" | "info" | "error";
export type NotifyPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface NotifyOptions<T = any> {
  title?: string;
  message?: string;
  type?: NotifyType;
  duration?: number;
  onClose?: () => void;
  onClick?: () => void;
  close?: (componentData: any, done: () => void) => void;
  center?: boolean;
  visible?: boolean;
  componentProps?: T;
  customClass?: string;
  position?: NotifyPosition;
}

export const useNotify = () => {
  const defaultOptions: NotificationParams = {
    title: "",
    duration: 8000,
    customClass: "el-notification-custom",
    dangerouslyUseHTMLString: true,
    position: "bottom-right",
    offset: 40
  };

  const notify = <T = any>(options: NotifyOptions<T>) => {
    const mergedOptions: NotificationParams = {
      ...defaultOptions,
      ...options,
      message: options.message || "",
      title: options.title || defaultOptions.title
    };

    return ElNotification(mergedOptions);
  };

  // 快捷方法
  const success = (message: string, title?: string) => notify({ type: "success", message, title });

  const error = (message: string, title?: string) => notify({ type: "error", message, title });

  const warning = (message: string, title?: string) => notify({ type: "warning", message, title });

  const info = (message: string, title?: string) => notify({ type: "info", message, title });

  return {
    notify,
    success,
    error,
    warning,
    info
  };
};
