/**
 * 分数排序键（fractional indexing）。
 *
 * 移植自 rocicorp/fractional-indexing（CC0 / 公有领域），tldraw 的 IndexKey 也是这套键。
 * 不直接装依赖：core 要保持零依赖，且这里的键必须在前后端逐位一致（后端重演操作要得到和前端
 * 同一个键），固定一份实现比对齐两边的依赖版本省心。
 *
 * 键的结构：整数部分（头字符决定长度：a→2 位、b→3 位…；Z→2 位、Y→3 位…）+ 小数部分。
 * 比较用普通字符串比较。任意两个键之间都能再生成一个键，且生成是确定性的。
 */

const BASE_62_DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SMALLEST_INTEGER = `A${BASE_62_DIGITS[0].repeat(26)}`;

/** a < result < b 的小数部分。a 为空串表示「0.」，b 为 null 表示无上界 */
const midpoint = (a: string, b: string | null, digits: string): string => {
  const zero = digits[0];
  if (b !== null && a >= b) {
    throw new Error(`${a} >= ${b}`);
  }
  if (a.slice(-1) === zero || (b && b.slice(-1) === zero)) {
    throw new Error("trailing zero");
  }
  if (b) {
    // 去掉最长公共前缀（a 不够长的部分按 0 补）
    let n = 0;
    while ((a[n] || zero) === b[n]) {
      n += 1;
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits);
    }
  }
  // 第一位（或缺位）不同
  const digitA = a ? digits.indexOf(a[0]) : 0;
  const digitB = b !== null ? digits.indexOf(b[0]) : digits.length;
  if (digitB - digitA > 1) {
    return digits[Math.round(0.5 * (digitA + digitB))];
  }
  // 第一位相邻
  if (b && b.length > 1) {
    return b.slice(0, 1);
  }
  // b 为 null 或只有一位：取 a 的第一位，后面接「a 剩余部分到无上界」的中点
  return digits[digitA] + midpoint(a.slice(1), null, digits);
};

const getIntegerLength = (head: string): number => {
  if (head >= "a" && head <= "z") {
    return head.charCodeAt(0) - "a".charCodeAt(0) + 2;
  }
  if (head >= "A" && head <= "Z") {
    return "Z".charCodeAt(0) - head.charCodeAt(0) + 2;
  }
  throw new Error(`invalid order key head: ${head}`);
};

const validateInteger = (int: string): void => {
  if (int.length !== getIntegerLength(int[0])) {
    throw new Error(`invalid integer part of order key: ${int}`);
  }
};

const getIntegerPart = (key: string): string => {
  const length = getIntegerLength(key[0]);
  if (length > key.length) {
    throw new Error(`invalid order key: ${key}`);
  }
  return key.slice(0, length);
};

const validateOrderKey = (key: string, digits: string): void => {
  if (key === SMALLEST_INTEGER) {
    throw new Error(`invalid order key: ${key}`);
  }
  // getIntegerPart 在头字符非法、键太短时会抛
  const integer = getIntegerPart(key);
  const fraction = key.slice(integer.length);
  if (fraction.slice(-1) === digits[0]) {
    throw new Error(`invalid order key: ${key}`);
  }
};

/** 整数部分 +1；已经是该长度能表示的最大值时返回 null */
const incrementInteger = (x: string, digits: string): string | null => {
  validateInteger(x);
  const [head, ...digs] = x.split("");
  let carry = true;
  for (let i = digs.length - 1; carry && i >= 0; i -= 1) {
    const d = digits.indexOf(digs[i]) + 1;
    if (d === digits.length) {
      digs[i] = digits[0];
    } else {
      digs[i] = digits[d];
      carry = false;
    }
  }
  if (!carry) {
    return head + digs.join("");
  }
  if (head === "Z") {
    return `a${digits[0]}`;
  }
  if (head === "z") {
    return null;
  }
  const nextHead = String.fromCharCode(head.charCodeAt(0) + 1);
  if (nextHead > "a") {
    digs.push(digits[0]);
  } else {
    digs.pop();
  }
  return nextHead + digs.join("");
};

/** 整数部分 -1；已经是最小值时返回 null */
const decrementInteger = (x: string, digits: string): string | null => {
  validateInteger(x);
  const [head, ...digs] = x.split("");
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i -= 1) {
    const d = digits.indexOf(digs[i]) - 1;
    if (d === -1) {
      digs[i] = digits.slice(-1);
    } else {
      digs[i] = digits[d];
      borrow = false;
    }
  }
  if (!borrow) {
    return head + digs.join("");
  }
  if (head === "a") {
    return `Z${digits.slice(-1)}`;
  }
  if (head === "A") {
    return null;
  }
  const nextHead = String.fromCharCode(head.charCodeAt(0) - 1);
  if (nextHead < "Z") {
    digs.push(digits.slice(-1));
  } else {
    digs.pop();
  }
  return nextHead + digs.join("");
};

/**
 * 生成 a < key < b 的键。a / b 为 null 表示该侧无界；两者都为 null 时返回第一个键 `a0`。
 * 传入非法键、或 a >= b 时抛错。
 */
export const generateKeyBetween = (a: string | null, b: string | null, digits: string = BASE_62_DIGITS): string => {
  if (a !== null) {
    validateOrderKey(a, digits);
  }
  if (b !== null) {
    validateOrderKey(b, digits);
  }
  if (a !== null && b !== null && a >= b) {
    throw new Error(`${a} >= ${b}`);
  }

  if (a === null) {
    if (b === null) {
      return `a${digits[0]}`;
    }
    const ib = getIntegerPart(b);
    const fb = b.slice(ib.length);
    if (ib === SMALLEST_INTEGER) {
      return ib + midpoint("", fb, digits);
    }
    if (ib < b) {
      return ib;
    }
    const res = decrementInteger(ib, digits);
    if (res === null) {
      throw new Error("cannot decrement any more");
    }
    return res;
  }

  if (b === null) {
    const ia = getIntegerPart(a);
    const fa = a.slice(ia.length);
    const i = incrementInteger(ia, digits);
    return i === null ? ia + midpoint(fa, null, digits) : i;
  }

  const ia = getIntegerPart(a);
  const fa = a.slice(ia.length);
  const ib = getIntegerPart(b);
  const fb = b.slice(ib.length);
  if (ia === ib) {
    return ia + midpoint(fa, fb, digits);
  }
  const i = incrementInteger(ia, digits);
  if (i === null) {
    throw new Error("cannot increment any more");
  }
  if (i < b) {
    return i;
  }
  return ia + midpoint(fa, null, digits);
};

/** 生成严格夹在 a、b 之间、依次递增的 n 个键 */
export const generateNKeysBetween = (
  a: string | null,
  b: string | null,
  n: number,
  digits: string = BASE_62_DIGITS
): string[] => {
  if (n <= 0) {
    return [];
  }
  if (n === 1) {
    return [generateKeyBetween(a, b, digits)];
  }
  if (b === null) {
    let c = generateKeyBetween(a, b, digits);
    const result = [c];
    for (let i = 0; i < n - 1; i += 1) {
      c = generateKeyBetween(c, b, digits);
      result.push(c);
    }
    return result;
  }
  if (a === null) {
    let c = generateKeyBetween(a, b, digits);
    const result = [c];
    for (let i = 0; i < n - 1; i += 1) {
      c = generateKeyBetween(a, c, digits);
      result.push(c);
    }
    return result.reverse();
  }
  const mid = Math.floor(n / 2);
  const c = generateKeyBetween(a, b, digits);
  return [...generateNKeysBetween(a, c, mid, digits), c, ...generateNKeysBetween(c, b, n - mid - 1, digits)];
};
