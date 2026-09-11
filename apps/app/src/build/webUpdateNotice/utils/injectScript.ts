import type { RuntimeScriptOptions } from "../types";

/**
 * 创建并启动版本更新检查（仅接口占位）
 */
export function createUpdateChecker(_options: RuntimeScriptOptions): void {
  // no-op: runtime starter
}

/**
 * 比较远端与本地版本是否不同（仅接口占位）
 */
export function compareVersion(_remote: string, _local: string): boolean {
  // no-op: return true if different
  return false;
}

/**
 * 绑定页面可见性变化时的检查处理（仅接口占位）
 */
export function bindVisibilityCheck(_handler: () => void): void {
  // no-op
}

/**
 * 绑定资源加载错误时的检查处理（仅接口占位）
 */
export function bindResourceErrorCheck(_handler: () => void): void {
  // no-op
}

/**
 * 显示内置的默认更新提示（仅接口占位）
 */
export function showDefaultNotice(_params: { locale: string; onRefresh: () => void; onLater?: () => void }): void {
  // no-op: default UI
}
