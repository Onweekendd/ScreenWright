import { setMinioUrl } from "@/utils/config";

import type { SystemComponentProps } from "../../views/build/components/buildRender/core/SystemComponent/type";

/**
 * 提取面板数据中的所有 Minio 资源 URL
 */
function getMinioList(panelDataStr: string): string[] {
  if (!panelDataStr) return [];

  try {
    // 匹配 version-test/ 开头的图片和视频 URL
    const matches = panelDataStr.match(/version-test\/.{1,80}\.(png|jpg|jpeg|mp4|webm)/gi);
    if (!matches) return [];
    return [...new Set(matches)];
  } catch (error) {
    console.error("解析面板数据失败:", error);
    return [];
  }
}

const PRELOAD_CONCURRENCY = 6;

/**
 * 通用并发预加载器（图片 + 视频），返回 Promise，resolve 时表示所有资源已触发完成（成功或失败）。
 * @param urls 资源 URL（已转换为可访问的 Minio URL）
 */
function preloadResources(urls: string[]): Promise<{ images: HTMLImageElement[]; videos: HTMLVideoElement[] }> {
  return new Promise((resolve) => {
    const images: HTMLImageElement[] = [];
    const videos: HTMLVideoElement[] = [];

    if (!urls || urls.length === 0) {
      resolve({ images, videos });
      return;
    }

    console.log(`[预加载] 开始分批预加载 ${urls.length} 个资源，总并发数: ${PRELOAD_CONCURRENCY}`);

    let currentIndex = 0;
    let activeLoads = 0;
    let completed = 0;
    const total = urls.length;

    const loadOne = (url: string) => {
      return new Promise<void>((res) => {
        // =============== 修复 1：添加全局超时，防止永远不回调 ===============
        const timeout = setTimeout(() => {
          console.warn("⏰ 预加载超时：", url);
          res();
        }, 5000);

        try {
          if (isImageUrl(url)) {
            const img = new Image();
            img.onload = () => {
              console.log(`✅ [预加载] 图片加载成功:`, url);
              images.push(img);
              clearTimeout(timeout);
              res();
            };
            img.onerror = () => {
              console.warn(`❌ [预加载] 图片加载失败:`, url);
              images.push(img);
              clearTimeout(timeout);
              res();
            };
            img.src = url;
          } else if (isVideoUrl(url)) {
            const video = document.createElement("video");
            // =============== 修复 2：视频不使用 metadata，避免不回调 ===============
            video.preload = "auto";
            video.muted = true;
            video.oncanplay = () => {
              console.log(`✅ [预加载] 视频加载成功:`, url);
              videos.push(video);
              clearTimeout(timeout);
              res();
            };
            video.onerror = () => {
              console.warn(`❌ [预加载] 视频加载失败:`, url);
              videos.push(video);
              clearTimeout(timeout);
              res();
            };
            video.src = url;
            video.load();
          } else {
            clearTimeout(timeout);
            res();
          }
        } catch (e) {
          console.warn("[预加载] 加载异常:", e);
          clearTimeout(timeout);
          res();
        }
      });
    };

    const loadNext = () => {
      while (activeLoads < PRELOAD_CONCURRENCY && currentIndex < total) {
        const url = urls[currentIndex++];
        activeLoads++;
        loadOne(url)
          .catch(() => {
            /* noop */
          })
          .then(() => {
            activeLoads--;
            completed++;
            if (completed >= total) {
              resolve({ images, videos });
            } else {
              loadNext();
            }
          });
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => loadNext(), { timeout: 1500 });
    } else {
      setTimeout(() => loadNext(), 0);
    }
  });
}

/**
 * 判断是否是图片 URL
 */
function isImageUrl(url: string): boolean {
  return /version-test\/.{1,80}\.(png|jpg|jpeg)/i.test(url);
}

/**
 * 判断是否是视频 URL
 */
function isVideoUrl(url: string): boolean {
  return /version-test\/.{1,80}\.(mp4|webm)/i.test(url);
}

/**
 * Minio 资源预加载 Hook（不使用 DOM，使用 JavaScript 对象）
 */
export function useMinioPreload() {
  const imageRefs: HTMLImageElement[] = [];
  const videoRefs: HTMLVideoElement[] = [];

  const startPreload = async (component: SystemComponentProps) => {
    if (!component) return { images: [] as HTMLImageElement[], videos: [] as HTMLVideoElement[] };

    try {
      // 提取所有 Minio URL
      const panelDataStr = JSON.stringify(component);
      const urls = getMinioList(panelDataStr);

      console.log("[预加载] 提取到的原始 URLs:", urls);

      const preloadUrls = urls.map((url) => setMinioUrl(url));
      console.log("[预加载] 转换后 URLs:", preloadUrls);

      const { images, videos } = await preloadResources(preloadUrls);
      imageRefs.push(...images);
      videoRefs.push(...videos);
      console.log(`✅ 预加载完成，图片 ${images.length}，视频 ${videos.length}`);
      return { images, videos };
    } catch (error) {
      console.error("❌ 预加载资源失败:", error);
      return { images: [] as HTMLImageElement[], videos: [] as HTMLVideoElement[] };
    }
  };

  const cleanup = () => {
    // 销毁图片对象
    imageRefs.forEach((img) => {
      img.onload = null;
      img.onerror = null;
      img.src = ""; // 清空 src，释放资源
    });
    // 销毁视频对象
    videoRefs.forEach((video) => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.src = "";
      video.removeAttribute("src");
      video.load(); // 触发资源释放
    });
    // 清空数组
    imageRefs.length = 0;
    videoRefs.length = 0;
  };

  return {
    startPreload,
    cleanup
  };
}
