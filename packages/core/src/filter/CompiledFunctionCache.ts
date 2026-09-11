/**
 * 编译函数缓存管理器 - 单例模式（框架无关）。
 * 使用 filter.name 作为 key 缓存已编译的过滤器函数，避免重复编译开销。
 */

import type { Filter } from "@screenwright/types";

interface CacheEntry {
  code: string;
  fn: (data: any, args?: any) => any;
  lastAccessed: number; // 最后访问时间戳（用于 LRU）
  compileTime: number; // 编译耗时（毫秒）
}

interface CacheConfig {
  maxSize: number; // 最大缓存数量
  enableLogging: boolean; // 是否启用日志
  evictionPolicy: "LRU" | "FIFO"; // 缓存驱逐策略
}

export class CompiledFunctionCache {
  private static instance: CompiledFunctionCache;
  // 使用 filter.name 作为 key（短字符串，效率高）
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    codeChanges: 0,
    totalSize: 0,
    totalCompileTime: 0, // 累计编译时间
    avgCompileTime: 0 // 平均编译时间
  };

  private config: CacheConfig = {
    maxSize: 100, // 默认最多缓存100个过滤器
    enableLogging: false, // 生产环境默认关闭日志
    evictionPolicy: "LRU" // 默认使用 LRU 策略
  };

  private constructor() {
    // 检测开发环境
    if (process.env.NODE_ENV === "development") {
      this.config.enableLogging = true;
    }
  }

  /** 获取单例实例 */
  public static getInstance(): CompiledFunctionCache {
    if (!CompiledFunctionCache.instance) {
      CompiledFunctionCache.instance = new CompiledFunctionCache();
    }
    return CompiledFunctionCache.instance;
  }

  /** 配置缓存选项 */
  public configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取或编译函数
   * @param filter 过滤器对象，包含 name 和 dataFormatter
   * @returns 编译后的函数
   */
  public getOrCompile(filter: Filter): (data: any, args?: any) => any {
    const { name, dataFormatter } = filter;

    // 输入验证
    if (!name || typeof name !== "string") {
      throw new Error("Filter name must be a non-empty string");
    }

    const entry = this.cache.get(name);
    const now = Date.now();

    // 缓存命中且代码相同
    if (entry && entry.code === dataFormatter) {
      this.stats.hits++;
      entry.lastAccessed = now;
      return entry.fn;
    }

    // 代码有变化或首次编译
    if (entry && entry.code !== dataFormatter) {
      this.stats.codeChanges++;
    } else {
      this.stats.misses++;
    }

    try {
      // 记录编译开始时间
      const compileStart = performance.now();

      // 编译新函数
      const compiledFunction = new Function("return " + dataFormatter)() as (data: any, args?: any) => any;

      // 计算编译耗时
      const compileTime = performance.now() - compileStart;

      // 更新统计信息
      this.stats.totalCompileTime += compileTime;
      const compileCount = this.stats.misses + this.stats.codeChanges;
      this.stats.avgCompileTime = this.stats.totalCompileTime / compileCount;

      // 保存到缓存（包含完整的 CacheEntry 信息）
      this.cache.set(name, {
        code: dataFormatter,
        fn: compiledFunction,
        lastAccessed: now,
        compileTime: compileTime
      });

      this.stats.totalSize = this.cache.size;

      // 检查是否需要驱逐缓存
      this.evictIfNeeded();

      return compiledFunction;
    } catch (error) {
      console.error(`[CompiledFunctionCache] Failed to compile filter '${name}': ${dataFormatter}`, error);
      throw error;
    }
  }

  /** 当缓存超过限制时驱逐条目 */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.config.maxSize) {
      return;
    }

    const entriesToDelete = this.cache.size - this.config.maxSize;

    if (this.config.evictionPolicy === "LRU") {
      // LRU: 删除最久未使用的条目
      const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      for (let i = 0; i < entriesToDelete; i++) {
        const [key] = entries[i];
        this.cache.delete(key);
      }
    } else {
      // FIFO: 删除最早添加的条目
      let deleted = 0;
      for (const key of this.cache.keys()) {
        if (deleted >= entriesToDelete) {
          break;
        }
        this.cache.delete(key);
        deleted++;
      }
    }

    this.stats.totalSize = this.cache.size;
    console.warn(
      `[CompiledFunctionCache] Cache size exceeded limit (${this.config.maxSize}). ` +
        `Evicted ${entriesToDelete} entries using ${this.config.evictionPolicy} policy.`
    );
  }

  /** 清除所有缓存 */
  public clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
  }

  /** 清除指定的缓存项 */
  public remove(filterName: string): boolean {
    const result = this.cache.delete(filterName);
    if (result) {
      this.stats.totalSize = this.cache.size;
    }
    return result;
  }

  /** 重置统计信息（用于测试和调试） */
  public resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.codeChanges = 0;
    this.stats.totalCompileTime = 0;
    this.stats.avgCompileTime = 0;
    // 不重置 totalSize，因为缓存内容仍在
  }

  /**
   * 更新过滤器缓存 - 当过滤器代码变化时调用
   * @param filter 更新后的过滤器对象
   */
  public updateFilter(filter: Filter): void {
    const { name, dataFormatter } = filter;
    const entry = this.cache.get(name);

    // 如果缓存存在且代码不同，删除旧缓存强制重新编译
    if (entry && entry.code !== dataFormatter) {
      this.remove(name);
    }
  }

  /** 获取缓存统计信息 */
  public getStats() {
    const totalRequests = this.stats.hits + this.stats.misses + this.stats.codeChanges;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(2) : "0.00";

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      codeChanges: this.stats.codeChanges,
      hitRate: `${hitRate}%`,
      cacheSize: this.stats.totalSize,
      totalRequests,
      avgCompileTime: this.stats.avgCompileTime.toFixed(3),
      totalCompileTime: this.stats.totalCompileTime.toFixed(3)
    };
  }

  /** 检查缓存大小（用于内存监控） */
  public size(): number {
    return this.cache.size;
  }

  /** 检查某个过滤器是否已缓存 */
  public has(filterName: string): boolean {
    return this.cache.has(filterName);
  }

  /** 获取指定过滤器的缓存条目（用于调试） */
  public getEntry(filterName: string): CacheEntry | undefined {
    return this.cache.get(filterName);
  }

  /** 获取所有缓存的过滤器名称 */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /** 估算内存使用量（单位：字节，粗略估算） */
  public estimateMemoryUsage(): number {
    let totalBytes = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalBytes += key.length * 2; // 字符串通常占用 2 字节/字符
      totalBytes += entry.code.length * 2;
      totalBytes += 100; // 函数和其他字段的估算开销
    }

    return totalBytes;
  }
}

// 导出单例实例的工厂函数
export const getCompiledFunctionCache = (): CompiledFunctionCache => {
  return CompiledFunctionCache.getInstance();
};
