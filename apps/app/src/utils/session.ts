import { removeToken } from "@/utils/auth";

/**
 * 登录态相关的纯函数工具。
 * 刻意不引入 router / store：会被 axios 拦截器、handleNotAuthor 等底层模块引用，
 * 一旦依赖 router 就会形成 router → views → utils → router 的循环引用。
 */

/** 登录后需要随令牌一起清掉的本地缓存 */
const USER_CACHE_KEYS = ["userInfo", "routeData"];

/** 无需登录即可访问的页面：登录页本身、已发布大屏的分享预览（/view/:id） */
const LOGIN_PATH = "/login";
const PUBLIC_VIEW_PREFIX = "/view/";

const DEFAULT_HOME = "/display";

const appBase = (): string => {
  const base = process.env.PUBLIC_PATH || "/";
  return base.endsWith("/") ? base : `${base}/`;
};

/** 当前地址去掉部署前缀后的应用内路径（含 query） */
export const currentAppPath = (): string => {
  const { pathname, search } = window.location;
  const base = appBase();
  const path = pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : pathname;
  return `${path}${search}`;
};

export const isPublicAppPath = (path: string): boolean => {
  const pathname = path.split(/[?#]/)[0];
  return pathname === LOGIN_PATH || pathname.startsWith(PUBLIC_VIEW_PREFIX);
};

/**
 * 登录后跳转目标只接受应用内路径，防止 `?redirect=https://evil.com` 之类的开放重定向。
 */
export const safeRedirectTarget = (raw: unknown): string => {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return DEFAULT_HOME;
  }
  return raw.split(/[?#]/)[0] === LOGIN_PATH ? DEFAULT_HOME : raw;
};

/** 清掉令牌与用户相关缓存 */
export const clearSession = (): void => {
  removeToken();
  USER_CACHE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

/** 整页跳转到登录页（整页刷新会一并重置内存里的动态路由、菜单、store 等状态） */
export const redirectToLogin = (redirect?: string): void => {
  const query =
    redirect && safeRedirectTarget(redirect) !== DEFAULT_HOME ? `?redirect=${encodeURIComponent(redirect)}` : "";
  window.location.assign(`${appBase()}login${query}`);
};

let redirecting = false;

/**
 * 令牌失效（后端返回 401）时的统一处理：清登录态并跳登录页。
 * 已在登录页 / 公开预览页时不动，避免死循环或把匿名访客踢走。
 */
export const handleUnauthorized = (): void => {
  const path = currentAppPath();
  if (redirecting || isPublicAppPath(path)) {
    return;
  }
  redirecting = true;
  clearSession();
  redirectToLogin(path);
};
