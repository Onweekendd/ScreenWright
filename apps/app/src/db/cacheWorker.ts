/**
 * 缓存处理Worker
 * 负责处理缓存数据的构建和数据库写入操作，避免主线程阻塞
 */
import { apiClient } from "@screenwright/server/rpc";
import type { LargeScreeInfo, LargeScreenDetailInfo, ParsedLargeScreenInfo } from "@screenwright/types";
import dayjs from "dayjs";

import { buildScreenVersionKey } from "@/utils/screenWorkspace";
import type { StatusAnimationResponse } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { parseIfNeeded } from "@/views/build/useLargeScreenInfo";

import { createIndexConfig, createStoreConfig, IndexedDBManager } from "./IndexedDBManager";

// 数据库配置
const DB_NAME = "FteBIStorage";
const STORE_NAME = "largeScreenInfo";
const ACCESS_LOG_STORE = "accessLog";

// Worker中的数据库管理器实例
let dbManager: IndexedDBManager | null = null;

// 防抖函数实现
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// 缓存数据接口
export interface CacheData {
  id: string;
  result: ParsedLargeScreenInfo;
  cacheTime: number;
}

// Worker消息类型定义
export interface WorkerMessage {
  type: "CACHE_DATA" | "GET_CACHE_DATA" | "INIT_DB";
  payload: any;
  requestId?: string;
}

export interface WorkerResponse {
  type: "CACHE_COMPLETE" | "CACHE_ERROR" | "GET_CACHE_COMPLETE" | "GET_CACHE_ERROR" | "INIT_COMPLETE";
  payload: any;
  requestId?: string;
}

// 缓存数据构建的输入参数
export interface BuildCacheDataInput extends LargeScreeInfo {
  customCacheTime?: number | string;
}

export interface CacheOptions {
  syncWorkspace?: boolean;
}

export interface CacheWorkerPayload {
  input: BuildCacheDataInput;
  options?: CacheOptions;
}

/**
 * 初始化数据库
 */
async function initDatabase(): Promise<void> {
  if (!dbManager) {
    dbManager = new IndexedDBManager({
      dbName: DB_NAME,
      version: 3,
      stores: [
        createStoreConfig<LargeScreeInfo>({
          name: STORE_NAME,
          keyPath: "id",
          enableLRU: true,
          indexes: [
            createIndexConfig<LargeScreeInfo>({
              name: "id",
              keyPath: "id"
            }),
            createIndexConfig<LargeScreeInfo>({
              name: "versionCode",
              keyPath: "versionCode"
            })
          ]
        })
      ],
      lruConfig: {
        enabled: true,
        accessLogStore: ACCESS_LOG_STORE,
        defaultMaxSize: 10
      }
    });
  }
}

/**
 * 构建缓存数据（包含 cacheTime）
 */
function buildCacheEntry(input: BuildCacheDataInput): CacheData {
  const { layers, detail, dataFilterArr, aniFrameSet, statusAnimation, config, encodedControl, ...rest } = input;

  const result: ParsedLargeScreenInfo = {
    layers: [...layers.map((item) => parseIfNeeded(item, {} as ComponentType))],
    detail: parseIfNeeded(detail, {} as LargeScreenDetailInfo),
    dataFilterArr: parseIfNeeded(dataFilterArr, {}),
    aniFrameSet: parseIfNeeded(aniFrameSet, {}),
    statusAnimation: parseIfNeeded(statusAnimation, {} as StatusAnimationResponse),
    config: parseIfNeeded(config, [] as string[]),
    encodedControl: parseIfNeeded(encodedControl, [] as string[]),
    ...rest
  } as ParsedLargeScreenInfo;

  let cacheTime = new Date().getTime();
  if (input.customCacheTime) {
    cacheTime =
      typeof input.customCacheTime === "string" ? dayjs(input.customCacheTime).valueOf() : input.customCacheTime;
  }

  return {
    id: buildScreenVersionKey(result.id, result.versionCode),
    result,
    cacheTime
  };
}

/**
 * 缓存数据到 IndexedDB
 */
async function cacheDataToIndexedDB(entry: CacheData): Promise<void> {
  await initDatabase();

  try {
    const existingData = await dbManager!.get(STORE_NAME, entry.id);
    if (existingData) {
      await dbManager!.put(STORE_NAME, entry);
    } else {
      await dbManager!.add(STORE_NAME, entry);
    }
  } catch (error) {
    console.error("IndexedDB操作失败:", error);
    await dbManager!.add(STORE_NAME, entry);
  }
}

async function syncBIDataToWorkspace(cacheData: CacheData): Promise<void> {
  // customCacheTime 是前端缓存打的时间戳（每次同步都变），只用于 IndexedDB；
  // 上传工作区前剥离，避免它漏进 info.json 造成每次提交都产生噪声 diff。
  const { customCacheTime: _drop, ...resultForWorkspace } = cacheData.result as ParsedLargeScreenInfo & {
    customCacheTime?: number | string;
  };
  await apiClient.customApi["sync-global-data"].$post({
    json: {
      id: cacheData.id,
      parsedLargeScreenInfo: resultForWorkspace,
      cacheTime: cacheData.cacheTime
    }
  });
}

/**
 * 缓存数据到 IndexedDB 并同步到 Workspace
 */
async function cacheAndSync(
  input: BuildCacheDataInput,
  options: CacheOptions = { syncWorkspace: true }
): Promise<void> {
  const entry = buildCacheEntry(input);

  const { syncWorkspace } = options;

  await Promise.all(
    syncWorkspace ? [cacheDataToIndexedDB(entry), syncBIDataToWorkspace(entry)] : [cacheDataToIndexedDB(entry)]
  );
}

/**
 * 获取缓存数据
 */
async function getCacheData(id: number, versionCode: string): Promise<CacheData | undefined> {
  await initDatabase();
  const cacheData = await dbManager!.get(STORE_NAME, buildScreenVersionKey(id, versionCode));
  return cacheData as CacheData | undefined;
}

// 创建防抖的缓存+同步函数
const debouncedCacheAndSync = debounce(cacheAndSync, 200);

// 监听主线程消息
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, requestId } = event.data;

  try {
    switch (type) {
      case "INIT_DB":
        await initDatabase();
        self.postMessage({
          type: "INIT_COMPLETE",
          payload: { success: true },
          requestId
        } as WorkerResponse);
        break;

      case "CACHE_DATA":
        // 使用防抖函数处理缓存+同步
        {
          const { input, options } = payload as CacheWorkerPayload;
          await debouncedCacheAndSync(input, options);
        }
        self.postMessage({
          type: "CACHE_COMPLETE",
          payload: { success: true, timestamp: new Date().getTime() },
          requestId
        } as WorkerResponse);
        break;

      case "GET_CACHE_DATA": {
        const { id, versionCode } = payload;
        const cacheData = await getCacheData(id, versionCode);
        self.postMessage({
          type: "GET_CACHE_COMPLETE",
          payload: cacheData,
          requestId
        } as WorkerResponse);
        break;
      }

      default:
        console.warn("Unknown message type:", type);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    self.postMessage({
      type: type === "CACHE_DATA" ? "CACHE_ERROR" : "GET_CACHE_ERROR",
      payload: { error: errorMessage },
      requestId
    } as WorkerResponse);
  }
});

// Worker准备就绪消息
self.postMessage({
  type: "INIT_COMPLETE",
  payload: { ready: true }
} as WorkerResponse);
