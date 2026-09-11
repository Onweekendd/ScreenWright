/**
 * 轻量深拷贝（避免 core 依赖 lodash）。
 *
 * 【为什么不能用 structuredClone】事件抛出值来自宿主，里面常常挂着函数、类实例、
 * DOM 节点、Vue 组件实例——structuredClone 遇到这些直接抛 DataCloneError，
 * 整条派发链路会跟着中断。前端历来用 lodash cloneDeep，本函数与它在这件事上行为一致：
 * 能安全克隆的克隆，克隆不了的按引用透传。
 *
 * 克隆：数组 / 纯对象 / Date / Map / Set（循环引用按 lodash 的做法保持同一份）
 * 透传：函数、类实例、DOM 节点、Symbol 键上的值
 */
export function deepClone<T>(value: T): T {
  return cloneValue(value, new WeakMap<object, unknown>()) as T;
}

function cloneValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  const source = value as object;
  if (seen.has(source)) {
    return seen.get(source);
  }

  if (source instanceof Date) {
    return new Date(source.getTime());
  }

  if (Array.isArray(source)) {
    const out: unknown[] = [];
    seen.set(source, out);
    for (const item of source) {
      out.push(cloneValue(item, seen));
    }
    return out;
  }

  if (source instanceof Map) {
    const out = new Map<unknown, unknown>();
    seen.set(source, out);
    source.forEach((v, k) => out.set(cloneValue(k, seen), cloneValue(v, seen)));
    return out;
  }

  if (source instanceof Set) {
    const out = new Set<unknown>();
    seen.set(source, out);
    source.forEach((v) => out.add(cloneValue(v, seen)));
    return out;
  }

  // 只克隆纯对象：类实例、DOM 节点等按引用透传，克隆它们既不安全也没意义
  const proto = Object.getPrototypeOf(source) as object | null;
  if (proto !== null && proto !== Object.prototype) {
    return source;
  }

  const out: Record<string, unknown> = {};
  seen.set(source, out);
  for (const key of Object.keys(source)) {
    out[key] = cloneValue((source as Record<string, unknown>)[key], seen);
  }
  return out;
}
