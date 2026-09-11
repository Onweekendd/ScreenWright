// 测试环境无法启用 https 无法使用 service worker，需在生产环境测试
// 由于该文件中使用了 workbox 库，因此需要在 package.json 中添加以下 dev依赖：

import { registerRoute } from "workbox-routing";

import { ForceCacheStrategy } from "./ForceCacheStrategy";

// @ts-expect-error 取消控制台打印
self.__WB_DISABLE_DEV_LOGS = true;

/**
 * 匹配 MinIO 资源请求（仅图片、视频，不包含字体）
 */
registerRoute(({ url }) => {
  const isMinioPath = url.pathname.includes("/version-test/") || url.pathname.includes("/assets/");
  const isMediaFile = /\.(png|jpg|jpeg|gif|mp4|webm)$/i.test(url.pathname);
  return isMinioPath && isMediaFile;
}, new ForceCacheStrategy());

/**
 * 匹配本地字体文件请求（/src/style/fonts/ 路径下的字体）
 */
registerRoute(({ url }) => {
  const isFontPath = url.pathname.includes("/src/style/fonts/");
  const isFontFile = /\.(woff|woff2|ttf|otf|eot)$/i.test(url.pathname);
  return isFontPath && isFontFile;
}, new ForceCacheStrategy());

console.log("[SW] MinIO 媒体资源缓存策略已激活（仅图片和视频）");
console.log("[SW] 本地字体文件缓存策略已激活（/src/style/fonts/）");
