/**
 * vue-part（vue2 片段）组件的公共类型
 *
 * 由 bi-data-sync 写盘 .vue 时通过 JSDoc 注入到 <script> 顶部，供 agent 在
 * workspace/tsconfig.json 下用 vue-tsc 检查 generate 函数的 info 用法与返回结构。
 * 仅作类型检查用，运行时由 funBI 注入真实 info、并调用 generate(info)。
 */
import type { ComponentOptions } from "vue";

/** vue-part generate 函数的 info 参数 */
export interface VuePartInfo {
  /** 组件 id */
  id: number;
  /** 绑定数据（来自组件 dataSource） */
  list: Record<string, any>[];
  /** 通信函数，触发交互事件，固定函数名为 fireCustomCode_${组件id} */
  emitEvent: (eventName: string, payload?: any) => void;
  /** 内置工具函数 */
  defaultFun: {
    /** 深拷贝 */
    cloneDeep: <T>(obj: T) => T;
    /** 防抖 */
    debounce: (fn: Function, delay: number) => Function;
    /** 节流 */
    throttle: (fn: Function, delay: number) => Function;
  };
}

/**
 * Vue 2 组件选项对象（generate 函数返回值）
 * 采用 vue 官方 ComponentOptions 提供权威字段补全，交叉 Record<string, any> 兜底，
 * 避免自定义顶层字段 / template 变量在 vue-tsc 下误报。
 *
 * 注意泛型实参用 `any` 而非 `Vue`：ComponentOptions 用首个泛型 V 给 methods/computed/
 * watch/生命周期钩子里的 `this` 定型。若传 `Vue`，`this` 被锁成基础 Vue 实例，访问
 * `data()` 里声明的属性（如 `this.inputText`）会误报 TS2339；传 `any` 则把这些 `this`
 * 放宽为 any，消除该类误报。`info` 仍靠 `@param VuePartInfo` 强检查，不受影响。
 */
export type Vue2ComponentOptions = ComponentOptions<any> & Record<string, any>;
