import z from "zod";

import { StepEnum } from "../types";
import type { IValueStore } from "./stateManager";

export const tokenUsageSchema = z
  .record(
    z.enum(StepEnum).describe("步骤 ID"),
    z.array(
      z.object({
        inputTokens: z.number().describe("输入 token 数量"),
        outputTokens: z.number().describe("输出 token 数量"),
        modelId: z.string().describe("模型Id")
      })
    )
  )
  .describe("各步骤的 token 使用统计");

export type TokenUsage = z.infer<typeof tokenUsageSchema>;

/**
 * 单个模型的 Token 使用情况
 * 从 TokenUsage 的值类型（数组）中提取元素类型
 */
export type SingleModelTokenUsage = TokenUsage[keyof TokenUsage][number];

/**
 * 单个模型的 Token 使用统计
 */
export interface SingleModelTokenUsageStats {
  /** 模型 ID */
  modelId: string;
  /** 输入 token 总数 */
  inputTokens: number;
  /** 输出 token 总数 */
  outputTokens: number;
  /** 总 token 数 */
  totalTokens: number;
  /** 调用次数 */
  callCount: number;
}

/**
 * 单个步骤的汇总 Token 使用情况
 */
export type StepTokenSummary = Record<
  StepEnum,
  {
    /** 模型 ID */
    modelId: string;
    /** 输入 token 总数 */
    totalInputTokens: number;
    /** 输出 token 总数 */
    totalOutputTokens: number;
    /** 总 token 数 */
    totalTokens: number;
    /** 调用次数 */
    callCount: number;
  }[]
>;

export class TokenUsageState implements IValueStore<TokenUsage> {
  private store: TokenUsage = {} as TokenUsage;

  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 获取当前存储的 Token 使用数据
   * @returns 当前 Token 使用数据，如果未初始化则返回 undefined
   */
  get(): TokenUsage | undefined {
    return this.store;
  }

  /**
   * 设置 Token 使用数据
   * @param value - 要设置的 Token 使用数据
   */
  set(value: TokenUsage): void {
    this.store = value;
  }

  /**
   * 更新 Token 使用数据
   * @param updater - 更新函数，接收当前值并返回新值
   */
  update(updater: (prev: TokenUsage | undefined) => TokenUsage): void {
    this.store = updater(this.store);
  }

  /**
   * 检查是否有 Token 使用数据
   * @returns 如果存在数据且不为空则返回 true
   */
  hasValue(): boolean {
    return this.store !== undefined && Object.keys(this.store).length > 0;
  }

  /**
   * 清空所有 Token 使用数据
   */
  clear(): void {
    this.store = {} as TokenUsage;
  }

  /**
   * 添加单次 Token 使用记录
   * @param stepId - 步骤 ID
   * @param usage - 单个模型的 Token 使用情况
   */
  addTokenUsage(stepId: StepEnum, usage: SingleModelTokenUsage): void {
    if (!this.store[stepId]) {
      this.store[stepId] = [];
    }

    this.store[stepId].push(usage);
  }

  /**
   * 获取所有步骤的 Token 使用汇总
   *
   * 汇总所有步骤的 Token 使用情况，包括：
   * - 按步骤分组的统计
   * - 按模型分组的统计
   * - 全局总计
   *
   * @returns Token 使用汇总数据
   */
  getSummarizedTokenUsage(): StepTokenSummary {
    const result = {} as StepTokenSummary;

    Object.keys(this.store).forEach((stepId) => {
      /**
       * 该步骤所有使用的模型
       */
      const stepUsage = this.store[stepId as StepEnum];

      result[stepId as StepEnum] = stepUsage.reduce(
        (pre, cur) => {
          const { modelId, inputTokens, outputTokens } = cur;

          if (!pre.find((item) => item.modelId === modelId)) {
            pre.push({
              modelId,
              totalInputTokens: inputTokens,
              totalOutputTokens: outputTokens,
              totalTokens: inputTokens + outputTokens,
              callCount: 1
            });
          } else {
            const modelForUsage = pre.find((item) => item.modelId === modelId);

            modelForUsage!.totalInputTokens += inputTokens;
            modelForUsage!.totalOutputTokens += outputTokens;
            modelForUsage!.totalTokens += inputTokens + outputTokens;
            modelForUsage!.callCount++;
          }
          return pre;
        },
        [] as StepTokenSummary[StepEnum]
      );
    });

    return result;
  }

  /**
   * 导出所有 Token 使用数据为 JSON
   * @returns JSON 字符串
   */
  exportToJson(): string {
    return JSON.stringify(this.store, null, 2);
  }

  /**
   * 从 JSON 导入 Token 使用数据
   * @param json JSON 字符串
   */
  importFromJson(json: string): void {
    try {
      this.store = JSON.parse(json);
    } catch (error) {
      console.error("导入 Token 使用数据失败:", error);
      throw new Error("无效的 JSON 格式");
    }
  }
}
