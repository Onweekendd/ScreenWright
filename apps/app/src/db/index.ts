/**
 * IndexedDB 模块统一导出文件
 */
import type { LargeScreeInfo } from "@screenwright/types";

import { createIndexConfig, createStoreConfig, IndexedDBManager } from "./IndexedDBManager";

// 导出类型定义
export type { IDBConfig, IDBIndexConfig, IDBStoreConfig, QueryOptions } from "./IndexedDBManager";

export const DB_NAME = "FteBIStorage";

export const STORE_NAME = "largeScreenInfo";

export const ACCESS_LOG_STORE = "accessLog";

export const dbManager = new IndexedDBManager({
  dbName: DB_NAME,
  version: 3, // 增加版本号以触发数据库升级，应用新的索引配置
  stores: [
    createStoreConfig<LargeScreeInfo>({
      name: STORE_NAME,
      keyPath: "id",
      enableLRU: true,
      maxLRUSize: 10, // 设置最大存储数量为10
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
