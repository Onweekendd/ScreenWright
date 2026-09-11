import type { PrismaClient } from "~/generated/prisma/client";

import { Logger } from "@/mastra/mcp/figma-context-mcp/server/utils/logger";
import { prismaClient } from "@/mastra/storage/prisma";

export interface KeySelectionResult {
  keyValue: string;
  keyId: string;
}

/**
 * Figma API Key Pool 管理器（单例模式）
 *
 * @description
 * 管理多个 Figma API Keys，实现智能轮换和限流处理
 * - 自动选择最优 key（基于使用状态）
 * - 自动标记和恢复被限流的 key
 * - 持久化使用统计到数据库
 */
export class FigmaKeyPoolManager {
  private static instance: FigmaKeyPoolManager | null = null;
  private prisma: PrismaClient;
  private currentKeyId: string | null = null;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取 Key Pool Manager 单例实例
   *
   * @returns 返回单例实例
   */
  static getInstance(): FigmaKeyPoolManager {
    if (!FigmaKeyPoolManager.instance) {
      FigmaKeyPoolManager.instance = new FigmaKeyPoolManager(prismaClient);
    }
    return FigmaKeyPoolManager.instance;
  }

  /**
   * 智能选择最优的 API Key
   * 优先级：健康且使用次数少的 > 健康的 > 最近可能恢复的
   */
  async selectOptimalKey(): Promise<KeySelectionResult> {
    const now = new Date();

    // 1. 首先检查并恢复已过限流期的 keys
    await this.restoreRateLimitedKeys(now);

    // 2. 查询所有可用的 keys（优先级排序）
    const candidates = await this.prisma.figmaKey.findMany({
      where: {
        isActive: true,
        isRateLimited: false
      },
      orderBy: [
        { totalRequests: "asc" }, // 使用次数少的优先
        { lastUsedAt: "asc" } // 很久没用的优先
      ],
      take: 3 // 取前3个候选（如果有的话）
    });

    if (candidates.length === 0) {
      const status = await this.getStatus();
      Logger.error(`[KeyPool] 所有 key 都被限流或禁用。状态: ${JSON.stringify(status)}`);

      // 计算最快恢复时间
      const nextAvailable = await this.prisma.figmaKey.findFirst({
        where: { isRateLimited: true },
        orderBy: { rateLimitEnd: "asc" },
        select: { rateLimitEnd: true }
      });

      const waitTime = nextAvailable?.rateLimitEnd
        ? Math.ceil((nextAvailable.rateLimitEnd.getTime() - Date.now()) / 1000 / 60)
        : "未知";

      throw new Error(`所有 Figma API Key 都被限流。请等待 ${waitTime} 分钟后重试，或联系管理员添加更多 key。`);
    }

    // 3. 从候选中随机选择一个（避免总是用同一个）
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    this.currentKeyId = selected.id;
    Logger.log(`[KeyPool] 选中 key: ${selected.name || selected.id} (已使用 ${selected.totalRequests} 次)`);

    return {
      keyValue: selected.keyValue,
      keyId: selected.id
    };
  }

  /**
   * 标记 key 被限流（429 错误）
   */
  async markRateLimited(keyId: string, retryAfter?: number): Promise<void> {
    const now = new Date();
    const rateLimitEnd = new Date(now.getTime() + (retryAfter || 3600) * 1000); // 默认1小时

    await this.prisma.figmaKey.update({
      where: { id: keyId },
      data: {
        isRateLimited: true,
        rateLimitStart: now,
        rateLimitEnd,
        consecutive429Count: { increment: 1 },
        failedRequests: { increment: 1 }
      }
    });

    Logger.error(`[KeyPool] Key ${keyId} 被限流，预计恢复时间: ${rateLimitEnd.toISOString()}`);
  }

  /**
   * 记录请求成功
   */
  async recordSuccess(keyId: string): Promise<void> {
    await this.prisma.figmaKey.update({
      where: { id: keyId },
      data: {
        totalRequests: { increment: 1 },
        successRequests: { increment: 1 },
        lastUsedAt: new Date(),
        lastSuccessAt: new Date(),
        consecutive429Count: 0 // 重置连续错误计数
      }
    });
  }

  /**
   * 记录请求失败（非 429）
   */
  async recordFailure(keyId: string, _errorMessage: string): Promise<void> {
    await this.prisma.figmaKey.update({
      where: { id: keyId },
      data: {
        totalRequests: { increment: 1 },
        failedRequests: { increment: 1 },
        lastUsedAt: new Date()
      }
    });
  }

  /**
   * 检查并恢复已过限流期的 keys
   */
  private async restoreRateLimitedKeys(now: Date): Promise<void> {
    const restored = await this.prisma.figmaKey.updateMany({
      where: {
        isRateLimited: true,
        rateLimitEnd: { lte: now }
      },
      data: {
        isRateLimited: false,
        rateLimitStart: null,
        rateLimitEnd: null
      }
    });

    if (restored.count > 0) {
      Logger.log(`[KeyPool] 恢复了 ${restored.count} 个限流的 key`);
    }
  }

  /**
   * 获取当前 key pool 状态（用于监控）
   */
  async getStatus() {
    const keys = await this.prisma.figmaKey.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        isRateLimited: true,
        totalRequests: true,
        successRequests: true,
        failedRequests: true,
        lastUsedAt: true,
        rateLimitEnd: true
      }
    });

    return {
      total: keys.length,
      active: keys.filter((k) => k.isActive).length,
      rateLimited: keys.filter((k) => k.isRateLimited).length,
      available: keys.filter((k) => k.isActive && !k.isRateLimited).length,
      keys
    };
  }

  /**
   * 获取当前正在使用的 key ID
   */
  getCurrentKeyId(): string | null {
    return this.currentKeyId;
  }

  /**
   * 重置当前 key ID（用于切换 key 时）
   */
  resetCurrentKeyId(): void {
    this.currentKeyId = null;
  }
}
