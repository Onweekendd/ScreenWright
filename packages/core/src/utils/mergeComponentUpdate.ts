import { deepClone } from "./deepClone";

const blockedKeys = new Set(["__proto__", "constructor", "prototype"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === null || prototype === Object.prototype;
};

/**
 * 把组件更新原地合并到画布持有的对象上。
 *
 * 对象保持增量合并；数组代表字段的完整新值，必须整段替换。这样既保留画布上的组件对象引用，
 * 又不会出现 lodash merge 按下标合并数组、导致旧尾项残留的问题。
 */
export function mergeComponentUpdate<T extends object>(target: T, update: Partial<T>): T {
  const targetRecord = target as Record<string, unknown>;

  for (const key of Object.keys(update)) {
    if (blockedKeys.has(key)) {
      continue;
    }

    const incomingValue = (update as Record<string, unknown>)[key];
    // 与 lodash merge 保持一致：undefined 不覆盖现有值。
    if (incomingValue === undefined) {
      continue;
    }

    const currentValue = targetRecord[key];
    if (Array.isArray(incomingValue)) {
      targetRecord[key] = deepClone(incomingValue);
    } else if (isPlainObject(incomingValue) && isPlainObject(currentValue)) {
      mergeComponentUpdate(currentValue, incomingValue);
    } else {
      targetRecord[key] = deepClone(incomingValue);
    }
  }

  return target;
}

/** 用完整组件快照原地覆盖现有对象，同时保留画布持有的根对象引用。 */
export function replaceComponentSnapshot<T extends object>(target: T, snapshot: T): T {
  const targetRecord = target as Record<string, unknown>;
  const snapshotRecord = snapshot as Record<string, unknown>;

  for (const key of Object.keys(targetRecord)) {
    if (!Object.prototype.hasOwnProperty.call(snapshotRecord, key)) {
      delete targetRecord[key];
    }
  }
  for (const key of Object.keys(snapshotRecord)) {
    if (!blockedKeys.has(key)) {
      targetRecord[key] = deepClone(snapshotRecord[key]);
    }
  }

  return target;
}
