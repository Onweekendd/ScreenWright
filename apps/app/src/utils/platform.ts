/**
 * 运行环境判断工具。
 * 桌面端 = Tauri 外壳（构建 mode 为 desktop，或运行时注入了 Tauri 内部对象）。
 */

/** 当前是否运行在桌面端（Tauri）外壳中。 */
export const isDesktop = (): boolean => {
  if (import.meta.env.MODE === "desktop") {
    return true;
  }
  return typeof window !== "undefined" && ("isTauri" in window || "__TAURI_INTERNALS__" in window);
};

/** 当前是否运行在普通 Web 浏览器中。 */
export const isWeb = (): boolean => !isDesktop();
