/**
 * 选项卡项接口
 */
export interface TabItem {
  label: string;
  value: string;
  [key: string]: unknown;
}

/**
 * 触发器项，包含组件ID和触发函数
 */
interface TriggerItem {
  componentId: string;
  trigger: (info: TabItem) => void;
}

/**
 * 用于选项卡的交互管理触发
 */
export class RelatedTrigger {
  private triggerMap: Map<number, Array<TriggerItem>> = new Map<
    number,
    Array<TriggerItem>
  >();

  /**
   * 注册触发器
   * @param panelId - 面板ID
   * @param componentId - 组件ID，用于在触发时跳过自己
   * @param trigger - 触发函数
   */
  public register = ({
    panelId,
    componentId,
    trigger,
  }: {
    panelId: number;
    componentId: string;
    trigger: (info: TabItem) => void;
  }) => {
    const triggers = this.triggerMap.get(panelId) || [];
    triggers.push({ componentId, trigger });
    this.triggerMap.set(panelId, triggers);
  };

  /**
   * 触发选项卡点击事件
   * @param panelId - 面板ID
   * @param info - 触发信息
   * @param triggerComponentId - 触发组件的ID，该组件的触发器将被跳过
   */
  public trigger = ({
    panelId,
    info,
    triggerComponentId,
  }: {
    panelId: number;
    info: TabItem;
    triggerComponentId?: string;
  }) => {
    const triggers = this.triggerMap.get(panelId);
    if (triggers) {
      triggers.forEach((item) => {
        // 如果提供了 triggerComponentId，则不触发自己的触发器
        if (triggerComponentId && item.componentId === triggerComponentId) {
          return;
        }
        item.trigger(info);
      });
    }
  };

  /**
   * 获取指定面板ID下注册的所有组件ID
   * @param panelId - 面板ID
   * @returns 组件ID数组
   */
  public getComponentIds = (panelId: number): string[] => {
    const triggers = this.triggerMap.get(panelId);
    if (triggers) {
      return triggers.map((item) => item.componentId);
    }
    return [];
  };

  private static _instance: RelatedTrigger | null = null;

  private constructor() {
    // 私有构造函数，防止外部使用 new 创建实例
  }

  public static getInstance(): RelatedTrigger {
    if (!RelatedTrigger._instance) {
      RelatedTrigger._instance = new RelatedTrigger();
    }
    return RelatedTrigger._instance;
  }
}
