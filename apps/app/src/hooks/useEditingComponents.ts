/**
 * 追踪"正在被 agent 编辑"的组件 id 集合，供画布渲染层叠加扫光效果。
 *
 * 模块级单例（不是 Pinia store）：这类纯 UI 提示状态没有持久化/多处 action 的需求，
 * 用一个模块作用域的 reactive 就够了，聊天面板（写入方）和画布（读取方）分处两棵组件树，
 * import 同一个模块自然共享同一份状态，不需要为它专门开一个 store module。
 *
 * 用引用计数而不是简单的 add/delete：同一个组件短时间内可能被多个工具调用同时命中
 * （比如一次批量 edit_files 里出现两次），后进的调用先结束不该把还在跑的那次的高亮撤掉。
 */
import { reactive } from "vue";

const refCounts = new Map<string, number>();

/** 当前正在编辑的组件 id（字符串形式，和画布渲染层 `component.id` 的比较口径一致）。 */
export const editingComponentIds = reactive(new Set<string>());

export const markComponentEditing = (id: string): void => {
  const next = (refCounts.get(id) ?? 0) + 1;
  refCounts.set(id, next);
  editingComponentIds.add(id);
};

export const unmarkComponentEditing = (id: string): void => {
  const next = (refCounts.get(id) ?? 0) - 1;
  if (next <= 0) {
    refCounts.delete(id);
    editingComponentIds.delete(id);
  } else {
    refCounts.set(id, next);
  }
};
