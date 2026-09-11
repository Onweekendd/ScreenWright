/**
 * 认证相关工具（下沉副本），与 app `@/utils/auth` 的 getToken 同 key 同行为。
 * 物料包 / use 包组件需要 token 或用户信息时从这里取，不反向依赖主包 store。
 */
const TOKEN_KEY = "bi_token";
const USER_INFO_KEY = "userInfo";

/** 获取 localStorage 中的 token */
export const getToken = (): string | null => window.localStorage.getItem(TOKEN_KEY);

/**
 * 获取 localStorage 中的用户信息（登录后由主包写入）。
 * 替代主包 useUserStoreHook().userInfo 的读取场景（非响应式，登录后用户信息固定）。
 */
export const getUserInfo = <T = any>(): T | null => {
  const item = window.localStorage.getItem(USER_INFO_KEY);
  if (!item) {
    return null;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    // localStorage 中 userInfo 为非法 JSON（历史脏数据等）时不抛异常，降级为 null，避免拖垮调用方初始化。
    return null;
  }
};
