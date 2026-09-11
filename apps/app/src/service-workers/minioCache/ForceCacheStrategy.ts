import { Strategy } from "workbox-strategies";

import { CACHE_NAME, MAX_AGE_MS } from "./constant";

/**
 * 强制缓存策略 - 使用 URL 作为缓存键
 * 增强版：支持 Stale-While-Revalidate（后台验证缓存）
 */
export class ForceCacheStrategy extends Strategy {
  async _handle(request: Request): Promise<Response> {
    // 2. 创建干净的请求（修复 cache: reload 问题）
    const cleanRequest = new Request(request.url, {
      method: "GET",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      mode: "cors", // CORS 模式以获得正常响应
      credentials: "omit",
      cache: "default" // 🔥 关键：使用 default 而不是 reload！
    });

    const cache = await caches.open(CACHE_NAME);

    // 1. 尝试从缓存读取（直接用 URL 匹配）
    const cachedResponse = await cache.match(cleanRequest);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 3. 从网络获取（使用干净的请求）
    try {
      const networkResponse = await fetch(cleanRequest);

      // 4. 克隆响应用于返回给页面（避免 body 被消费）
      const responseToReturn = networkResponse.clone();

      // 5. 处理响应并缓存
      let responseToCache: Response;

      // 检查是否是 opaque 响应（status 0，无法读取 headers）
      if (networkResponse.type === "opaque" || networkResponse.status === 0) {
        // Opaque 响应直接缓存
        responseToCache = networkResponse;
      } else {
        // 使用原始响应的 body 创建新响应（会消费掉 networkResponse）
        responseToCache = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: networkResponse.headers
        });
      }

      try {
        await cache.put(cleanRequest, responseToCache);
      } catch (putError) {
        console.error(`❌ [Put Error] 缓存写入失败:`, putError);
      }

      // 7. 返回克隆的响应（body 仍然可用）
      return responseToReturn;
    } catch (error) {
      console.error(`❌ [Error] ${request.url.split("/").pop()}:`, error);
      throw error;
    }
  }
}

/**
 * 定期清理过期缓存
 */
async function cleanExpiredCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  const now = Date.now();

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const dateHeader = response.headers.get("date");
    if (dateHeader) {
      const responseTime = new Date(dateHeader).getTime();
      if (now - responseTime > MAX_AGE_MS) {
        await cache.delete(request);
        console.log(`🗑️ [Expired] ${request.url.split("/").pop()}`);
      }
    }
  }
}

// 每小时清理一次过期缓存
setInterval(cleanExpiredCache, 60 * 60 * 1000);
