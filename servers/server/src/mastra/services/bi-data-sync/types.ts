/**
 * bi-data-sync 内部共享类型定义。
 * 仅类型，无运行时逻辑；各拆分模块从此处引入，避免类型在多文件间复制。
 */

export interface ScreenMeta {
  updatedTime: string;
  componentIds: number[];
}

export interface DataFlowEntry {
  emittedBy: Array<{ id: string; name: string; originField: string; onEvents: string[] }>;
  consumedBy: Array<{ filterName: string; boundTo: Array<{ id: string; name: string }> }>;
}

export interface EventFlowEntry {
  sourceId: string;
  sourceName: string;
  trigger: string;
  conditions: Array<{ field?: string; compare?: string; expected?: string }>;
  targets: Array<{ id: string; name: string; actionType: string }>;
}

/** 分组 children / 动态面板状态 config 中的直属子组件文件引用。 */
export interface ComponentFileReference {
  id: number;
  type: string;
  prop: string;
  name: string;
  /** 对应子组件目录内的实际文件名，不能按展示名称重新猜测。 */
  file: string;
}
