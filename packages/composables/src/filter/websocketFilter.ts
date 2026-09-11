import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";

import { BaseFilter } from "./baseFilter";
import { WebSocketManager } from "./utils/WebSocketManager";

/**
 * 订阅信息类型定义
 */
interface SubscriptionInfo {
  connectionKey: string; // WebSocket 连接标识
  subscriberId: string; // 订阅者标识（通常是组件ID）
  callback?: (data: any) => void; // 组件的数据回调函数
}

/**
 * WebSocket 数据过滤器（单例）
 *
 * 职责：
 * - 实现 BaseFilter 接口
 * - 为组件提供 WebSocket 数据
 * - 管理组件的订阅生命周期
 *
 * 设计原则：
 * - 单一职责：只负责过滤器逻辑，连接管理委托给 WebSocketManager
 * - 防御性编程：完善的参数检查和错误处理
 * - 信息隐蔽：组件不需要知道连接管理的细节
 */
class WebsocketFilter extends BaseFilter {
  private static instance: WebsocketFilter | null = null;
  private readonly wsManager: WebSocketManager;
  private readonly componentSubscriptions: Map<string, SubscriptionInfo>;

  /**
   * 私有构造函数（单例模式）
   */
  private constructor() {
    super();
    this.wsManager = WebSocketManager.getInstance();
    this.componentSubscriptions = new Map();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): WebsocketFilter {
    if (!WebsocketFilter.instance) {
      WebsocketFilter.instance = new WebsocketFilter();
    }
    return WebsocketFilter.instance;
  }

  /**
   * 获取组件的输入数据（单一职责：只获取数据）
   *
   * @param target 目标组件
   * @returns 最新的 WebSocket 数据
   */
  async getInputData(target: ComponentType): Promise<any[]> {
    // 防御性编程：参数验证
    if (!this.isValidTarget(target)) {
      console.warn("[WebsocketFilter] 无效的目标组件");
      return [];
    }

    // 如果没有 WebSocket URL，返回静态数据
    if (!target.websocketUrl) {
      return target.data || [];
    }

    try {
      // 获取组件的连接信息
      const componentId = this.getComponentId(target);
      const subscription = this.componentSubscriptions.get(componentId);

      // 如果已建立连接，返回最新数据
      if (subscription) {
        return this.wsManager.getLatestData(subscription.connectionKey);
      }

      // 如果还没有连接，连接并返回初始数据
      const connectionKey = this.wsManager.connect(target.websocketUrl);
      return this.wsManager.getLatestData(connectionKey);
    } catch (error) {
      console.error("[WebsocketFilter] 获取数据失败:", error);
      return target.data || [];
    }
  }

  /**
   * 建立订阅并设置数据回调（单一职责：只负责订阅）
   *
   * @param target 目标组件
   * @param onDataReceived 数据接收回调函数
   */
  async setupSubscription(target: ComponentType | ChildComponent, onDataReceived?: (data: any) => void): Promise<void> {
    // 防御性编程：参数验证
    if (!this.isValidTarget(target)) {
      console.warn("[WebsocketFilter] 无效的目标组件");
      return;
    }

    // 如果没有 WebSocket URL，无需订阅
    if (!target.websocketUrl) {
      return;
    }

    try {
      const componentId = this.getComponentId(target);
      const url = target.websocketUrl;

      // 检查是否已订阅
      if (this.hasActiveSubscription(componentId)) {
        this.updateExistingSubscription(componentId, url, onDataReceived);
      } else {
        this.createNewSubscription(componentId, url, onDataReceived);
      }
    } catch (error) {
      console.error("[WebsocketFilter] 建立订阅失败:", error);
    }
  }

  /**
   * 更新已存在的订阅（单一职责：只负责更新订阅）
   */
  private updateExistingSubscription(componentId: string, newUrl: string, onDataReceived?: (data: any) => void): void {
    const subscription = this.componentSubscriptions.get(componentId)!;

    // URL 改变了，需要重新订阅
    if (subscription.connectionKey !== newUrl) {
      this.cleanupComponentSubscription(componentId);
      this.createNewSubscription(componentId, newUrl, onDataReceived);
      return;
    }

    // URL 没变，更新回调函数（如果提供了新的回调）
    if (onDataReceived) {
      subscription.callback = onDataReceived;
      this.componentSubscriptions.set(componentId, subscription);
    }
  }

  /**
   * 创建新订阅（单一职责：只负责建立订阅）
   */
  private createNewSubscription(componentId: string, url: string, onDataReceived?: (data: any) => void): void {
    // 连接到 WebSocket 服务（或复用现有连接）
    const connectionKey = this.wsManager.connect(url);

    // 订阅数据更新 - 传入组件的回调函数
    this.wsManager.subscribe(connectionKey, componentId, (data) => this.handleDataUpdate(data, onDataReceived));

    // 记录订阅信息
    this.componentSubscriptions.set(componentId, {
      connectionKey,
      subscriberId: componentId,
      callback: onDataReceived
    });
  }

  /**
   * 处理数据更新
   */
  private handleDataUpdate(data: any, onDataReceived?: (data: any) => void): void {
    // 触发组件传入的数据回调（优先使用）
    if (onDataReceived) {
      try {
        onDataReceived(data);
      } catch (error) {
        console.error("[WebsocketFilter] 组件数据回调执行失败:", error);
      }
    }
  }

  /**
   * 执行过滤转换
   *
   * @param filterConfig 过滤器配置
   * @param target 目标组件
   * @returns 转换后的数据
   */
  async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
    return await this.transformDataByFilter(filterConfig, target);
  }

  /**
   * 清理组件订阅
   *
   * 应在组件卸载时调用此方法
   *
   * @param componentId 组件ID（支持字符串或数字）
   */
  cleanupComponentSubscription(componentId: string | number): void {
    const id = String(componentId);
    const subscription = this.componentSubscriptions.get(id);

    if (!subscription) {
      return;
    }

    try {
      this.wsManager.unsubscribe(subscription.connectionKey, subscription.subscriberId);
      this.componentSubscriptions.delete(id);
      console.log(`[WebsocketFilter] 组件 ${id} 的订阅已清理`);
    } catch (error) {
      console.error(`[WebsocketFilter] 清理订阅失败 (${id}):`, error);
    }
  }

  /**
   * 验证目标组件是否有效
   */
  private isValidTarget(target: any): target is ComponentType {
    return target && typeof target === "object" && "id" in target;
  }

  /**
   * 获取组件ID
   */
  private getComponentId(target: ComponentType): string {
    return String(target.id);
  }

  /**
   * 检查组件是否有活跃订阅
   */
  private hasActiveSubscription(componentId: string): boolean {
    return this.componentSubscriptions.has(componentId);
  }

  /**
   * 销毁过滤器（清理所有订阅）
   */
  destroy(): void {
    // 清理所有组件订阅
    const componentIds = Array.from(this.componentSubscriptions.keys());
    componentIds.forEach((id) => this.cleanupComponentSubscription(id));

    // 调用父类的清理方法
    super.dispose();
  }

  /**
   * 重置单例实例（仅用于测试）
   */
  static resetInstance(): void {
    if (WebsocketFilter.instance) {
      WebsocketFilter.instance.destroy();
      WebsocketFilter.instance = null;
    }
  }
}

export { WebsocketFilter };
