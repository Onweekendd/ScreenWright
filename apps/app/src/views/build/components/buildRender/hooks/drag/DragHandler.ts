/**
 * 拖拽策略接口
 * 定义拖拽处理的策略接口
 */
import type { DragContext } from "./DragContext";

export interface DragStrategy {
  /**
   * 判断是否可以处理当前拖拽上下文
   * @param context 拖拽上下文
   * @returns 是否可以处理
   */
  canHandle(context: DragContext): boolean;

  /**
   * 执行拖拽处理逻辑
   * @param context 拖拽上下文
   * @returns 处理是否成功
   */
  execute(context: DragContext): Promise<boolean>;
}
