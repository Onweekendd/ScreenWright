/**
 * 组件在树中的挂载位置。
 *
 * 省略（undefined）表示大屏根级。与 Screenwright suspend 协议里的 placement 同形，
 * 两侧用同一套语义描述"放在哪"，避免各自解释一遍。
 */
export interface ComponentPlacement {
  /** 目标容器组件 id */
  parentId: number;
  /** 目标容器类型 */
  parentType: "group" | "dynamicPanel";
  /** 动态面板的目标状态 id；省略时落到第一个状态 */
  stateId?: string;
}

/** 组件 id：树里存的是 number，但路径/协议里常以字符串出现，读取入口统一容纳两者。 */
export type ComponentId = number | string;
