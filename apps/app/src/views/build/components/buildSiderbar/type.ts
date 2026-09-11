import type { ComponentType } from "../buildRender/type";

export interface CustomDragEvent {
  /** 拖拽元素 */
  dragged: HTMLDivElement;

  /** 拖拽上下文信息 */
  draggedContext: {
    /** 被拖拽的元素 */
    element: ComponentType;
    /** 未来位置索引 */
    futureIndex: number;
    /** 当前索引 */
    index: number;
  };

  /** 拖拽元素的位置信息 */
  dragRest: {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  };

  /** 源DOM元素 */
  from: HTMLDivElement;

  /** 是否为可信事件 */
  isTrusted: boolean;

  /** 原始事件对象 */
  originalEvent: Event;

  /** 相关联的DOM元素 */
  related: HTMLDivElement;

  /** 相关联的上下文信息 */
  relatedContext: {
    /** 组件信息 */
    component: {
      [key: string]: any;
    };
    /** 相关元素 */
    element: ComponentType;
    /** 索引 */
    index: number;
    /** 列表数据 */
    list: ComponentType[];
  };

  /** 相关元素的位置信息 */
  relatedRect: {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  };

  /** 目标DOM元素 */
  to: HTMLDivElement;

  /** 是否在目标元素之后插入 */
  willInsertAfter: boolean;
}
