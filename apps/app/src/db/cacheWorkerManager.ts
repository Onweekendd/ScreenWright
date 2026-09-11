/**
 * 缓存Worker管理器
 * 负责管理缓存Worker的生命周期和消息通信
 */
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { FolderType } from "@/views/build/components/buildRender/type";

import type {
  BuildCacheDataInput,
  CacheData,
  CacheOptions,
  CacheWorkerPayload,
  WorkerMessage,
  WorkerResponse
} from "./cacheWorker";

export class CacheWorkerManager {
  private worker: Worker | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  private isInitialized = false;

  /**
   * 初始化Worker
   */
  async init(): Promise<void> {
    if (this.worker || this.isInitialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // 创建Worker实例
        this.worker = new Worker(new URL("./cacheWorker.ts", import.meta.url), { type: "module" });

        // 监听Worker消息
        this.worker.addEventListener("message", this.handleWorkerMessage.bind(this));

        // 监听Worker错误
        this.worker.addEventListener("error", (error) => {
          console.error("Cache Worker 错误:", error);
          reject(error);
        });

        // 等待Worker初始化完成
        const initTimeout = setTimeout(() => {
          reject(new Error("Worker 初始化超时"));
        }, 200000);

        const checkInit = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === "INIT_COMPLETE" && event.data.payload.ready) {
            this.isInitialized = true;
            clearTimeout(initTimeout);
            this.worker?.removeEventListener("message", checkInit);
            resolve(undefined);
          }
        };

        this.worker.addEventListener("message", checkInit);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, payload, requestId } = event.data;

    // 如果有requestId，处理对应的Promise
    if (requestId && this.pendingRequests.has(requestId)) {
      const { resolve, reject } = this.pendingRequests.get(requestId)!;
      this.pendingRequests.delete(requestId);

      if (type.endsWith("_ERROR")) {
        reject(new Error(payload.error || "未知错误"));
      } else {
        resolve(payload);
      }
      return;
    }

    // 处理不需要响应的消息
    switch (type) {
      case "CACHE_COMPLETE":
        console.log("缓存操作完成:", payload);
        // 可以在这里触发全局事件或回调
        break;
      case "CACHE_ERROR":
        console.error("缓存操作失败:", payload.error);
        break;
      default:
        console.log("收到Worker消息:", type, payload);
    }
  }

  /**
   * 安全地向Worker发送消息
   * 如果直接发送失败，尝试通过JSON序列化后再发送
   */
  private postMessageSafely(message: WorkerMessage): void {
    try {
      this.worker!.postMessage(message);
    } catch (error) {
      console.warn(error);

      const jsonfiedMessage = JSON.stringify(message);
      this.worker!.postMessage(JSON.parse(jsonfiedMessage));
    }
  }

  /**
   * 发送消息到Worker
   */
  private sendMessage<T>(type: WorkerMessage["type"], payload: any, needResponse = false): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error("Worker 未初始化"));
    }

    const requestId = needResponse ? `req_${++this.requestId}` : undefined;

    const message: WorkerMessage = {
      type,
      payload,
      requestId
    };

    if (needResponse && requestId) {
      return new Promise<T>((resolve, reject) => {
        this.pendingRequests.set(requestId, { resolve, reject });

        // 设置超时
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error("请求超时"));
          }
        }, 30000); // 30秒超时

        this.postMessageSafely(message);
      });
    } else {
      this.postMessageSafely(message);
      return Promise.resolve({} as T);
    }
  }

  /**
   * 缓存数据（异步，不等待完成）
   */
  async cacheData(input: BuildCacheDataInput, options?: CacheOptions): Promise<void> {
    await this.ensureInitialized();
    // 不等待响应，直接发送消息
    this.sendMessage("CACHE_DATA", { input, options } satisfies CacheWorkerPayload, false);
  }

  /**
   * 缓存数据并等待完成
   */
  async cacheDataWithResponse(input: BuildCacheDataInput): Promise<{ success: boolean; timestamp: number }> {
    await this.ensureInitialized();
    try {
      return await this.sendMessage<{ success: boolean; timestamp: number }>(
        "CACHE_DATA",
        { input } satisfies CacheWorkerPayload,
        true
      );
    } catch (error) {
      console.error("缓存数据失败:", error);

      const { layers } = input;
      return await this.sendMessage<{ success: boolean; timestamp: number }>(
        "CACHE_DATA",
        {
          input: {
            ...input,
            layers: layers.map((item) => {
              if (typeof item === "string") {
                return item;
              }

              const shouldStringify = [PanelType.dynamicPanel, PanelType.encodePanel, FolderType.group] as const;

              if (shouldStringify.some((prop) => prop === item.component.prop)) {
                return JSON.stringify(item);
              }

              return item;
            }) as BuildCacheDataInput["layers"]
          }
        } satisfies CacheWorkerPayload,
        true
      );
    }
  }

  /**
   * 获取缓存数据
   */
  async getCacheData(id: number, versionCode: string): Promise<CacheData | undefined> {
    await this.ensureInitialized();
    return this.sendMessage<CacheData | undefined>("GET_CACHE_DATA", { id, versionCode }, true);
  }

  /**
   * 确保Worker已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * 销毁Worker
   */
  destroy(): void {
    if (this.worker) {
      // 清理待处理的请求
      this.pendingRequests.forEach(({ reject }) => {
        reject(new Error("Worker 已销毁"));
      });
      this.pendingRequests.clear();

      // 终止Worker
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// 创建全局实例
export const cacheWorkerManager = new CacheWorkerManager();

// 在页面卸载时销毁Worker
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    cacheWorkerManager.destroy();
  });
}
