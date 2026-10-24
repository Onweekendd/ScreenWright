import { generateKeyBetween, generateNKeysBetween } from "./fractionalIndex";

/**
 * 叠放层级（zIndex）：字符串排序键，参考 tldraw 的 IndexKey（同一套 fractional indexing）。
 *
 * - 比较一律用字符串比较（`<` / `>`，按 UTF-16 码元），**不要**用 `localeCompare`，也不要 `Number()`；
 * - 键越大越靠上（与旧的数字 zIndex 同向）；
 * - 在任意两个相邻键之间都能再插入一个键，插入/移动一个组件只需要改它自己的键，不用像数字那样
 *   整段重排或互换（旧写法拖一次要写回一串兄弟组件）；
 * - 生成是确定性的（不加抖动）：前端与后端重演同一个操作必须得到同一个键。
 *
 * 键本身不带语义，只有大小关系有意义。
 */
export type ZIndex = string;

/** 第一个键。空容器里放第一个组件、或没有历史键可参照时用它 */
export const INDEX_ZERO: ZIndex = "a0";

/**
 * 排序/取极值接受的层级值。类型上只有字符串，但没经过 setLayers 的数据（引用面板里别的大屏的组件、
 * 老版本留下的临时对象）可能还是旧的数字，所以比较时按需换成键，不让一个旧数字拖垮整个排序。
 */
type ZIndexInput = ZIndex | number;

interface HasZIndex {
  zIndex: ZIndexInput;
}

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 是否是合法的排序键（含「空串、整数部分长度不对、小数部分以 0 结尾」这类 fractional-indexing 不认的写法） */
export const isValidZIndex = (value: unknown): value is ZIndex => {
  if (typeof value !== "string" || value === "") {
    return false;
  }
  try {
    generateKeyBetween(value, null);
    return true;
  } catch {
    return false;
  }
};

const toKey = (value: ZIndexInput): ZIndex => (typeof value === "string" ? value : normalizeZIndex(value));

/** 字符串比较：a 在 b 下面返回负数。给 `Array.prototype.sort` 用 */
export const compareZIndex = (a: ZIndexInput, b: ZIndexInput): number => {
  const keyA = toKey(a);
  const keyB = toKey(b);
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
};

/** 按层级排序，返回新数组。`asc`：下层在前（渲染顺序）；`desc`：上层在前（图层树顺序）。同键保持原次序 */
export const sortByZIndex = <T extends HasZIndex>(items: readonly T[], direction: "asc" | "desc" = "asc"): T[] => {
  const sorted = [...items].sort((a, b) => compareZIndex(a.zIndex, b.zIndex));
  return direction === "desc" ? sorted.reverse() : sorted;
};

/**
 * 取极值用的键：非法的键（如 agent 手写的 `a20`，小数部分以 0 结尾）直接忽略。
 * 极值的用途是「在它上面 / 下面再生成一个键」，而 generateKeyBetween 见到非法键会抛——
 * 一个坏键不能让整个容器再也加不进新组件（实测一次批量创建 18 个组件全部因此失败）。
 * 坏键本身留给 assignOrderedZIndexes 在重排时修掉。
 */
const validKeyOf = (value: ZIndexInput): ZIndex | null => {
  const key = toKey(value);
  return isValidZIndex(key) ? key : null;
};

/** 一组组件里最上层的键；空数组返回 null */
export const maxZIndex = (items: readonly HasZIndex[]): ZIndex | null => {
  let max: ZIndex | null = null;
  for (const { zIndex } of items) {
    const key = validKeyOf(zIndex);
    if (key === null) {
      continue;
    }
    if (max === null || key > max) {
      max = key;
    }
  }
  return max;
};

/** 一组组件里最下层的键；空数组返回 null */
export const minZIndex = (items: readonly HasZIndex[]): ZIndex | null => {
  let min: ZIndex | null = null;
  for (const { zIndex } of items) {
    const key = validKeyOf(zIndex);
    if (key === null) {
      continue;
    }
    if (min === null || key < min) {
      min = key;
    }
  }
  return min;
};

/** 比 index 更靠上的键；不传则是第一个键 */
export const getIndexAbove = (index?: ZIndex | null): ZIndex => generateKeyBetween(index ?? null, null);

/** 比 index 更靠下的键；不传则是第一个键 */
export const getIndexBelow = (index?: ZIndex | null): ZIndex => generateKeyBetween(null, index ?? null);

/** 夹在 lower 与 upper 之间的键；两端都可以省略。要求 lower < upper */
export const getIndexBetween = (lower?: ZIndex | null, upper?: ZIndex | null): ZIndex =>
  generateKeyBetween(lower ?? null, upper ?? null);

/** 夹在 lower 与 upper 之间、依次递增的 count 个键 */
export const getIndicesBetween = (lower: ZIndex | null | undefined, upper: ZIndex | null | undefined, count: number) =>
  generateNKeysBetween(lower ?? null, upper ?? null, count);

/**
 * 「顶到最上层」要用的键：比容器里现有的都高；容器为空时是第一个键。
 *
 * 取代旧的 `getMaxIndex(list) + 1`。注意不能再写 `+ 1`：字符串相加是拼接，
 * 而且 TS 不会报错。
 */
export const getTopIndex = (items: readonly HasZIndex[]): ZIndex => getIndexAbove(maxZIndex(items));

/** 「沉到最底层」要用的键：比容器里现有的都低；容器为空时是第一个键 */
export const getBottomIndex = (items: readonly HasZIndex[]): ZIndex => getIndexBelow(minZIndex(items));

/**
 * 最长严格递增子序列（按键比较）的下标集合：这些成员的键本来就符合期望次序，原样保留。
 */
const longestIncreasingKeys = (keys: readonly (ZIndex | null)[]): Set<number> => {
  // tails[len] = 长度为 len+1 的递增子序列的最小结尾下标
  const tails: number[] = [];
  const prev: number[] = new Array(keys.length).fill(-1);

  keys.forEach((key, i) => {
    if (key === null) {
      return;
    }
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((keys[tails[mid]] as ZIndex) < key) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    prev[i] = lo > 0 ? tails[lo - 1] : -1;
    tails[lo] = i;
  });

  const kept = new Set<number>();
  let cursor = tails.length > 0 ? tails[tails.length - 1] : -1;
  while (cursor !== -1) {
    kept.add(cursor);
    cursor = prev[cursor];
  }
  return kept;
};

/**
 * 断言这一串成员按「从下到上」的次序叠放：就地改它们的 zIndex，返回键被改动的成员。
 *
 * 次序已经对的成员**保持原键**（取最长的已有序子序列），只给错位的、键非法的、键重复的成员
 * 在邻居之间插新键——拖动一个组件只会改它一个。需要把改动写回后端的调用方，照着返回值逐个写。
 *
 * @param bottomToTop 期望的叠放次序，第 0 项在最底层
 */
export const assignOrderedZIndexes = <T extends { zIndex: ZIndex }>(bottomToTop: readonly T[]): T[] => {
  const keys = bottomToTop.map((item) => (isValidZIndex(item.zIndex) ? item.zIndex : null));
  const kept = longestIncreasingKeys(keys);
  const changed: T[] = [];

  let i = 0;
  while (i < bottomToTop.length) {
    if (kept.has(i)) {
      i += 1;
      continue;
    }
    // 连续一段需要新键的成员，夹在前后两个保留成员之间一次生成，保证段内也递增
    let end = i;
    while (end < bottomToTop.length && !kept.has(end)) {
      end += 1;
    }
    const lower = i > 0 ? bottomToTop[i - 1].zIndex : null;
    const upper = end < bottomToTop.length ? bottomToTop[end].zIndex : null;
    const fresh = generateNKeysBetween(lower, upper, end - i);
    fresh.forEach((key, offset) => {
      bottomToTop[i + offset].zIndex = key;
      changed.push(bottomToTop[i + offset]);
    });
    i = end;
  }
  return changed;
};

const digitsOf = (value: number, width: number): string => {
  let rest = value;
  let out = "";
  for (let i = 0; i < width; i += 1) {
    out = BASE62[rest % 62] + out;
    rest = Math.floor(rest / 62);
  }
  return out;
};

/**
 * 旧的数字 zIndex 换成字符串键：保序、确定性、不依赖兄弟组件，所以不管在哪一层读进来都能就地换。
 *
 * 用的是 fractional-indexing 的「整数键」：`a0`…`az` 是 0…61，再往上依次加长（`b00`…）。
 * 相同的数字得到相同的键，所以数字相同的组件换完还是同一层（和以前一样）。
 */
export const legacyNumberToZIndex = (value: number): ZIndex => {
  const n = Number.isFinite(value) ? Math.floor(value) : 0;
  if (n >= 0) {
    let rest = n;
    // 整数部分总长 length（含头字符）：a→2 位，b→3 位…，每多一位容量 ×62
    for (let length = 2; length <= 27; length += 1) {
      const capacity = 62 ** (length - 1);
      if (rest < capacity) {
        return String.fromCharCode("a".charCodeAt(0) + length - 2) + digitsOf(rest, length - 1);
      }
      rest -= capacity;
    }
    return String.fromCharCode("z".charCodeAt(0)) + "z".repeat(26);
  }
  // 负数：Z→2 位，Y→3 位…，-1 是 Zz，越负越小
  let rest = -n - 1;
  for (let length = 2; length <= 27; length += 1) {
    const capacity = 62 ** (length - 1);
    if (rest < capacity) {
      return String.fromCharCode("Z".charCodeAt(0) - (length - 2)) + digitsOf(capacity - 1 - rest, length - 1);
    }
    rest -= capacity;
  }
  return "A" + "0".repeat(26);
};

/** 任何来路的 zIndex 值 → 合法的键：键原样返回，数字按 {@link legacyNumberToZIndex} 换，其余（缺失/乱写）回到第一个键 */
export const normalizeZIndex = (value: unknown): ZIndex => {
  if (typeof value === "string") {
    return isValidZIndex(value) ? value : INDEX_ZERO;
  }
  if (typeof value === "number") {
    return legacyNumberToZIndex(value);
  }
  return INDEX_ZERO;
};

/** 递归时不往里走的键：图表 option / 数据体量大，里面也不会有组件 */
const SKIPPED_KEYS = new Set(["option", "data", "props", "dataSource", "events", "cbArgs", "listenArgs"]);

const looksLikeComponent = (node: Record<string, unknown>): boolean =>
  "zIndex" in node && typeof node.component === "object" && node.component !== null;

/**
 * 把一棵（或一批）组件树里残留的数字 zIndex 就地换成字符串键，返回是否改动过。
 *
 * 老数据（库里的大屏 / 模板 / 磁盘上的组件文件）零散地带着数字。读进来的第一道口子调一次，
 * 后面所有代码就只需要面对字符串。幂等：已经是键的不动。
 *
 * 认「组件」的依据是同时有 `zIndex` 和 `component` 对象——状态动画配置里也有个叫 zIndex 的属性，
 * 但它没有 `component`，不会被误改。
 */
export const migrateLegacyZIndex = (root: unknown): boolean => {
  let changed = false;
  const seen = new WeakSet<object>();

  const visit = (node: unknown): void => {
    if (typeof node !== "object" || node === null || seen.has(node)) {
      return;
    }
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const record = node as Record<string, unknown>;
    if (looksLikeComponent(record) && typeof record.zIndex !== "string") {
      record.zIndex = normalizeZIndex(record.zIndex);
      changed = true;
    }
    for (const [key, value] of Object.entries(record)) {
      if (!SKIPPED_KEYS.has(key)) {
        visit(value);
      }
    }
  };

  visit(root);
  return changed;
};
