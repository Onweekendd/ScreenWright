/**
 * IndexedDB 基础操作管理类
 * 提供对 IndexedDB 的封装操作，包括数据库创建、表操作、增删改查等功能
 */

// 泛型约束：确保K是T的键，并且是string类型
export interface IDBStoreConfig<T = any> {
  /** 存储对象名称 */
  name: string;
  /** 主键配置 - 必须是数据对象T的字符串键 */
  keyPath?: Extract<keyof T, string>;
  /** 是否自动递增 */
  autoIncrement?: boolean;
  /** 索引配置 */
  indexes?: IDBIndexConfig<T>[];
  /** 是否启用LRU管理 */
  enableLRU?: boolean;
  /** LRU最大存储数量 */
  maxLRUSize?: number;
}

export interface IDBIndexConfig<T = any> {
  /** 索引名称 */
  name: string;
  /** 索引键名 - 必须是数据对象T的字符串键 */
  keyPath: Extract<keyof T, string>;
  /** 是否唯一 */
  unique?: boolean;
}

export interface IDBConfig {
  /** 数据库名称 */
  dbName: string;
  /** 数据库版本 */
  version: number;
  /** 对象存储配置 */
  stores: IDBStoreConfig<any>[];
  /** LRU存储管理配置 */
  lruConfig?: LRUStorageConfig;
}

export interface LRUStorageConfig {
  /** 是否启用LRU存储管理 */
  enabled: boolean;
  /** 访问记录存储名称 */
  accessLogStore: string;
  /** 默认最大存储数量 */
  defaultMaxSize: number;
}

export interface AccessLogEntry {
  /** 记录ID */
  id: string;
  /** 存储名称 */
  storeName: string;
  /** 数据主键 */
  dataKey: string;
  /** 最后访问时间 */
  lastAccessed: number;
  /** 访问次数 */
  accessCount: number;
}

export interface QueryOptions<T = any> {
  /** 查询条件 */
  where?: Partial<T>;
  /** 排序字段 - 必须是数据对象T的字符串键 */
  orderBy?: Extract<keyof T, string>;
  /** 排序方向 */
  order?: "asc" | "desc";
  /** 限制数量 */
  limit?: number;
  /** 跳过数量 */
  offset?: number;
}

// 工厂函数：创建类型安全的存储配置
export function createStoreConfig<T>(config: IDBStoreConfig<T>): IDBStoreConfig<T> {
  return config;
}

// 工厂函数：创建类型安全的索引配置
export function createIndexConfig<T>(config: IDBIndexConfig<T>): IDBIndexConfig<T> {
  return config;
}

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: IDBConfig;
  private isOpening = false;

  constructor(config: IDBConfig) {
    this.config = config;

    // 如果启用LRU管理，确保访问记录存储存在
    if (this.config.lruConfig?.enabled) {
      this.ensureAccessLogStore();
    }
  }

  /**
   * 确保访问记录存储存在
   */
  private ensureAccessLogStore(): void {
    const accessLogStoreName = this.config.lruConfig!.accessLogStore;
    const hasAccessLogStore = this.config.stores.some((store) => store.name === accessLogStoreName);

    if (!hasAccessLogStore) {
      this.config.stores.push({
        name: accessLogStoreName,
        keyPath: "id",
        autoIncrement: false,
        indexes: [
          { name: "storeName", keyPath: "storeName" },
          { name: "lastAccessed", keyPath: "lastAccessed" },
          { name: "storeNameAndKey", keyPath: "storeName", unique: false }
        ]
      });
    }
  }

  /**
   * 打开数据库连接
   * @returns Promise<IDBDatabase>
   */
  async open(): Promise<IDBDatabase> {
    if (this.db && this.db.version === this.config.version) {
      return this.db;
    }

    if (this.isOpening) {
      // 如果正在打开，等待打开完成
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isOpening) {
            clearInterval(checkInterval);
            if (this.db) {
              resolve(this.db);
            } else {
              reject(new Error("数据库打开失败"));
            }
          }
        }, 50);
      });
    }

    this.isOpening = true;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        this.isOpening = false;
        reject(new Error(`打开数据库失败: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.isOpening = false;
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  /**
   * 创建对象存储
   * @param db IDBDatabase 实例
   */
  private createStores(db: IDBDatabase): void {
    this.config.stores.forEach((storeConfig) => {
      // 如果存储已存在，先删除
      if (db.objectStoreNames.contains(storeConfig.name)) {
        db.deleteObjectStore(storeConfig.name);
      }

      // 创建对象存储
      const store = db.createObjectStore(storeConfig.name, {
        keyPath: storeConfig.keyPath,
        autoIncrement: storeConfig.autoIncrement ?? true
      });

      // 创建索引
      if (storeConfig.indexes) {
        storeConfig.indexes.forEach((indexConfig) => {
          store.createIndex(indexConfig.name, indexConfig.keyPath, {
            unique: indexConfig.unique ?? false
          });
        });
      }
    });
  }

  /**
   * 添加数据 - 带LRU管理
   * @param storeName 存储名称
   * @param data 要添加的数据
   * @returns Promise<any> 返回添加的数据
   */
  async add<T = any>(storeName: string, data: T): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => {
        // 执行LRU管理
        if (this.shouldApplyLRU(storeName)) {
          const dataKey = this.getDataKey(storeName, data);
          Promise.all([this.updateAccessLog(storeName, dataKey, "add"), this.enforceStorageLimits(storeName)]).catch(
            (error) => console.error("LRU管理失败:", error)
          );
        }
        resolve(data);
      };

      request.onerror = () => {
        reject(new Error(`添加数据失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 更新数据 - 带LRU管理（全量覆盖）
   * @param storeName 存储名称
   * @param data 要更新的数据
   * @returns Promise<any> 返回更新的数据
   */
  async put<T = any>(storeName: string, data: T): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        // 执行LRU管理
        if (this.shouldApplyLRU(storeName)) {
          const dataKey = this.getDataKey(storeName, data);
          Promise.all([this.updateAccessLog(storeName, dataKey, "update"), this.enforceStorageLimits(storeName)]).catch(
            (error) => console.error("LRU管理失败:", error)
          );
        }
        resolve(data);
      };

      request.onerror = () => {
        reject(new Error(`更新数据失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 根据主键获取单条数据 - 带LRU管理
   * @param storeName 存储名称
   * @param key 主键值
   * @returns Promise<T | undefined>
   */
  async get<T = any>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;

        // 执行LRU管理 - 更新访问记录
        if (result && this.shouldApplyLRU(storeName)) {
          this.updateAccessLog(storeName, String(key), "read").catch((error) => console.error("LRU管理失败:", error));
        }

        resolve(result);
      };

      request.onerror = () => {
        reject(new Error(`获取数据失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 获取所有数据
   * @param storeName 存储名称
   * @param options 查询选项
   * @returns Promise<T[]>
   */
  async getAll<T = any>(storeName: string, options: QueryOptions<T> = {}): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);

      let request: IDBRequest<T[]>;

      // 如果有排序要求，使用索引
      if (options.orderBy) {
        try {
          const index = store.index(options.orderBy);
          request = index.getAll(undefined, options.limit);
        } catch (error) {
          // 如果索引不存在，回退到普通查询
          request = store.getAll(undefined, options.limit);
        }
      } else {
        request = store.getAll(undefined, options.limit);
      }

      request.onsuccess = () => {
        let results = request.result || [];

        // 应用过滤条件
        if (options.where) {
          results = results.filter((item) => {
            return Object.entries(options.where!).every(([key, value]) => {
              return (item as any)[key] === value;
            });
          });
        }

        // 应用偏移
        if (options.offset) {
          results = results.slice(options.offset);
        }

        resolve(results);
      };

      request.onerror = () => {
        reject(new Error(`获取所有数据失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 根据索引查询数据
   * @param storeName 存储名称
   * @param indexName 索引名称 - 必须是数据对象的字符串键
   * @param value 索引值
   * @returns Promise<T[]>
   */
  async getByIndex<T = any>(storeName: string, indexName: Extract<keyof T, string>, value: IDBValidKey): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);

      try {
        const index = store.index(indexName as string);
        const request = index.getAll(value);

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error(`通过索引获取数据失败: ${request.error?.message}`));
        };
      } catch (error) {
        reject(new Error(`索引 "${String(indexName)}" 不存在`));
      }
    });
  }

  /**
   * 删除数据 - 带LRU管理
   * @param storeName 存储名称
   * @param key 主键值
   * @returns Promise<boolean>
   */
  async delete(storeName: string, key: IDBValidKey): Promise<boolean> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        // 删除对应的访问记录
        if (this.shouldApplyLRU(storeName)) {
          this.removeAccessLog(storeName, String(key)).catch((error) => console.error("LRU管理失败:", error));
        }
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`删除数据失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 清空存储
   * @param storeName 存储名称
   * @returns Promise<boolean>
   */
  async clear(storeName: string): Promise<boolean> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`清空存储失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 获取数据总数
   * @param storeName 存储名称
   * @returns Promise<number>
   */
  async count(storeName: string): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`获取数据总数失败: ${request.error?.message}`));
      };
    });
  }

  /**
   * 批量操作
   * @param storeName 存储名称
   * @param operations 操作列表
   * @returns Promise<boolean>
   */
  async batch(
    storeName: string,
    operations: Array<{
      type: "add" | "put" | "delete";
      data?: any;
      key?: IDBValidKey;
    }>
  ): Promise<boolean> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      let completedOperations = 0;
      const totalOperations = operations.length;

      if (totalOperations === 0) {
        resolve(true);
        return;
      }

      const checkComplete = () => {
        completedOperations++;
        if (completedOperations === totalOperations) {
          resolve(true);
        }
      };

      operations.forEach((operation) => {
        let request: IDBRequest;

        switch (operation.type) {
          case "add":
            request = store.add(operation.data);
            break;
          case "put":
            request = store.put(operation.data);
            break;
          case "delete":
            request = store.delete(operation.key!);
            break;
          default:
            throw new Error(`不支持的操作类型: ${operation.type}`);
        }

        request.onsuccess = checkComplete;
        request.onerror = () => {
          reject(new Error(`批量操作失败: ${request.error?.message}`));
        };
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 删除整个数据库
   * @returns Promise<boolean>
   */
  async deleteDatabase(): Promise<boolean> {
    this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.config.dbName);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`删除数据库失败: ${request.error?.message}`));
      };
    });
  }

  // ==================== LRU存储管理方法 ====================

  /**
   * 判断是否应该应用LRU管理
   * @param storeName 存储名称
   * @returns 是否启用LRU
   */
  private shouldApplyLRU(storeName: string): boolean {
    if (!this.config.lruConfig?.enabled) {
      return false;
    }

    const storeConfig = this.config.stores.find((store) => store.name === storeName);
    return storeConfig?.enableLRU ?? false;
  }

  /**
   * 获取数据主键
   * @param storeName 存储名称
   * @param data 数据对象
   * @returns 主键值
   */
  private getDataKey(storeName: string, data: any): string {
    const storeConfig = this.config.stores.find((store) => store.name === storeName);
    const keyPath = storeConfig?.keyPath;

    if (keyPath && data[keyPath]) {
      return String(data[keyPath]);
    }

    // 如果没有keyPath或无法获取，使用随机key
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 更新访问记录
   * @param storeName 存储名称
   * @param dataKey 数据主键
   * @param action 操作类型
   */
  private async updateAccessLog(storeName: string, dataKey: string, _action: "read" | "add" | "update"): Promise<void> {
    if (!this.config.lruConfig?.enabled) {
      return;
    }

    const accessLogStoreName = this.config.lruConfig.accessLogStore;
    const logId = `${storeName}:${dataKey}`;
    const now = Date.now();

    try {
      const db = await this.open();
      const transaction = db.transaction([accessLogStoreName], "readwrite");
      const store = transaction.objectStore(accessLogStoreName);

      // 获取现有记录
      const getRequest = store.get(logId);

      getRequest.onsuccess = () => {
        const existingLog = getRequest.result as AccessLogEntry | undefined;

        const newLog: AccessLogEntry = {
          id: logId,
          storeName,
          dataKey,
          lastAccessed: now,
          accessCount: existingLog ? existingLog.accessCount + 1 : 1
        };

        // 更新或创建记录
        store.put(newLog);
      };
    } catch (error) {
      console.error(`更新访问记录失败: ${error}`);
    }
  }

  /**
   * 移除访问记录
   * @param storeName 存储名称
   * @param dataKey 数据主键
   */
  private async removeAccessLog(storeName: string, dataKey: string): Promise<void> {
    if (!this.config.lruConfig?.enabled) {
      return;
    }

    const accessLogStoreName = this.config.lruConfig.accessLogStore;
    const logId = `${storeName}:${dataKey}`;

    try {
      const db = await this.open();
      const transaction = db.transaction([accessLogStoreName], "readwrite");
      const store = transaction.objectStore(accessLogStoreName);

      store.delete(logId);
    } catch (error) {
      console.error(`移除访问记录失败: ${error}`);
    }
  }

  /**
   * 强制执行存储限制
   * @param storeName 存储名称
   */
  private async enforceStorageLimits(storeName: string): Promise<void> {
    if (!this.config.lruConfig?.enabled) {
      return;
    }

    const storeConfig = this.config.stores.find((store) => store.name === storeName);
    const maxSize = storeConfig?.maxLRUSize ?? this.config.lruConfig.defaultMaxSize;

    try {
      // 获取当前存储数量
      const currentCount = await this.count(storeName);

      if (currentCount <= maxSize) {
        return;
      }

      // 需要清理的数量
      const toRemoveCount = currentCount - maxSize;

      // 获取最久未访问的记录
      const lruEntries = await this.getLRUEntries(storeName, toRemoveCount);

      // 删除最久未访问的数据
      for (const entry of lruEntries) {
        await this.delete(storeName, entry.dataKey);
        console.log(`LRU清理: 删除 ${storeName}:${entry.dataKey}`);
      }
    } catch (error) {
      console.error(`执行存储限制失败: ${error}`);
    }
  }

  /**
   * 获取最久未访问的记录
   * @param storeName 存储名称
   * @param count 获取数量
   * @returns 访问记录列表
   */
  private async getLRUEntries(storeName: string, count: number): Promise<AccessLogEntry[]> {
    if (!this.config.lruConfig?.enabled) {
      return [];
    }

    const accessLogStoreName = this.config.lruConfig.accessLogStore;

    try {
      const db = await this.open();
      const transaction = db.transaction([accessLogStoreName], "readonly");
      const store = transaction.objectStore(accessLogStoreName);
      const index = store.index("storeName");

      return new Promise((resolve, reject) => {
        const entries: AccessLogEntry[] = [];
        const request = index.openCursor(IDBKeyRange.only(storeName));

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            entries.push(cursor.value as AccessLogEntry);
            cursor.continue();
          } else {
            // 按最后访问时间排序，取最旧的记录
            entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
            resolve(entries.slice(0, count));
          }
        };

        request.onerror = () => {
          reject(new Error(`获取LRU记录失败: ${request.error?.message}`));
        };
      });
    } catch (error) {
      console.error(`获取LRU记录失败: ${error}`);
      return [];
    }
  }

  /**
   * 获取存储的LRU统计信息
   * @param storeName 存储名称
   * @returns LRU统计信息
   */
  async getLRUStats(storeName: string): Promise<{
    currentCount: number;
    maxSize: number;
    recentAccess: AccessLogEntry[];
  }> {
    const storeConfig = this.config.stores.find((store) => store.name === storeName);
    const maxSize = storeConfig?.maxLRUSize ?? this.config.lruConfig?.defaultMaxSize ?? 0;
    const currentCount = await this.count(storeName);

    // 获取最近访问的记录
    const recentAccess = await this.getRecentAccessEntries(storeName, 10);

    return {
      currentCount,
      maxSize,
      recentAccess
    };
  }

  /**
   * 获取最近访问的记录
   * @param storeName 存储名称
   * @param limit 限制数量
   * @returns 最近访问记录
   */
  private async getRecentAccessEntries(storeName: string, limit: number): Promise<AccessLogEntry[]> {
    if (!this.config.lruConfig?.enabled) {
      return [];
    }

    const accessLogStoreName = this.config.lruConfig.accessLogStore;

    try {
      const db = await this.open();
      const transaction = db.transaction([accessLogStoreName], "readonly");
      const store = transaction.objectStore(accessLogStoreName);
      const index = store.index("storeName");

      return new Promise((resolve, reject) => {
        const entries: AccessLogEntry[] = [];
        const request = index.openCursor(IDBKeyRange.only(storeName));

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            entries.push(cursor.value as AccessLogEntry);
            cursor.continue();
          } else {
            // 按最后访问时间降序排序
            entries.sort((a, b) => b.lastAccessed - a.lastAccessed);
            resolve(entries.slice(0, limit));
          }
        };

        request.onerror = () => {
          reject(new Error(`获取最近访问记录失败: ${request.error?.message}`));
        };
      });
    } catch (error) {
      console.error(`获取最近访问记录失败: ${error}`);
      return [];
    }
  }
}
