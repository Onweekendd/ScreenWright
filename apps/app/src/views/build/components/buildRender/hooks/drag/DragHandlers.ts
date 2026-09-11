/**
 * 拖拽策略具体实现类
 * 包含各种面板类型的拖拽策略
 */
import type { DragContext } from "./DragContext";
import type { DragStrategy } from "./DragHandler";

/**
 * 非动态面板策略
 * 处理非动态面板的拖拽操作
 */
export class NonDynamicPanelStrategy implements DragStrategy {
  canHandle(context: DragContext): boolean {
    return !context.isPanel;
  }

  async execute(context: DragContext): Promise<boolean> {
    try {
      await context.addComponentList(context.dropData, context.position);
      return true;
    } catch (error) {
      console.error("非动态面板拖拽处理失败:", error);
      return false;
    }
  }
}

/**
 * 常规动态面板策略
 * 处理普通动态面板的拖拽操作
 */
export class RegularDynamicPanelStrategy implements DragStrategy {
  canHandle(context: DragContext): boolean {
    return context.isDynamicPanel();
  }

  async execute(context: DragContext): Promise<boolean> {
    try {
      await context.addComponentToPanel(context.dropData, context.position);
      return true;
    } catch (error) {
      console.error("常规动态面板拖拽处理失败:", error);
      return false;
    }
  }
}

/**
 * 编码面板策略
 * 处理编码面板的拖拽操作
 */
export class EncodePanelStrategy implements DragStrategy {
  canHandle(context: DragContext): boolean {
    return context.isEncodePanel();
  }

  async execute(context: DragContext): Promise<boolean> {
    try {
      await context.addComponentToEncodePanel(context.dropData, context.position);
      return true;
    } catch (error) {
      console.error("编码面板拖拽处理失败:", error);
      return false;
    }
  }
}
