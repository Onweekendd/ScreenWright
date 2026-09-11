const TokenKey = "bi_token";
/**
 * @description: 获取token
 * getToken 已下沉到 @screenwright/composables（与此处同 key "bi_token" 同行为），统一从底座包 re-export，避免两份实现漂移。
 */
export { getToken } from "@screenwright/composables";

/**
 * @description: 存储token
 */
export const setToken = (token: string) => window.localStorage.setItem(TokenKey, token);

/**
 * @description: 删除token
 */
export const removeToken = () => window.localStorage.removeItem(TokenKey);

/**
 * @description: 获取Active:String=>Object
 */
export const getActive = (key: string) => {
  const item = window.localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

/**
 * @description: 设置Active:String=>Object
 */
export const setActive = (key: string, value: any) => window.localStorage.setItem(key, JSON.stringify(value));

/**
 * @description: 删除Active:String=>Object
 */
export const deleteActive = (key: string) => window.localStorage.removeItem(key);

/**
 * @description: 批量设置
 */
export const setStorageAll = (keys: Array<string>, values: string) =>
  keys.forEach((key, i) => window.localStorage.setItem(key, JSON.stringify(values[i])));
/**
 * @description: 批量删除
 */
export const deleteStorageAll = (
  keys = ["bi_token", "userInfo", "nodes", "seat", "teamInfo", "NOFLYZONE", "pro__Access-Token", "pro__Login_Userinfo"]
) => keys.forEach((key) => window.localStorage.removeItem(key));

//  设置session

export const getSession = (key: string) => {
  const item = sessionStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

//  删除session
export const deleteSession = (key: string) => {
  sessionStorage.removeItem(key);
};

//  设置session-verify
export const setVerify = (key: string, value: string) => window.sessionStorage.setItem(key, JSON.stringify(value));
export const getVerify = (key: string) => {
  const item = window.sessionStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};
export const deleteVerify = (key: string) => window.sessionStorage.removeItem(key);
